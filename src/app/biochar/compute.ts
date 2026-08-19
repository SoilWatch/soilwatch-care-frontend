import type { Batch } from "./data";
import { PYRO_MIN, PYRO_MAX, ACTIVE_WINDOW_DAYS, COMPLIANCE_WINDOW_DAYS, SUBMISSION_LAG_SLA_DAYS } from "./data";

const TODAY = new Date().toISOString().slice(0, 10);

export function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(dateStr: string): number {
  return Math.max(0, Math.floor((new Date(TODAY).getTime() - new Date(dateStr).getTime()) / 86400000));
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── KPI summary ───────────────────────────────────────────────────────────

export interface DashboardKpis {
  totalBatches: number;
  monthBatches: number;
  weekBatches: number;
  totalBiochar: number;
  dryBiochar: number;
  monthBiochar: number;
  activeKilns: number;
  totalKilns: number;
  activeOps: number;
  totalOps: number;
  qualPassRate: number;
  compFlagsN: number;
  csiCompliant: number;
  nonCompliant: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  safetyInc: number;
  samplesCol: number;
  durationFlag: boolean;
}

export function computeKpis(df: Batch[]): DashboardKpis {
  const activeCutoff = daysAgo(ACTIVE_WINDOW_DAYS);
  const totalBiochar = df.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const avgDuration = df.length ? df.reduce((s, b) => s + b.pyrolysis_duration_min, 0) / df.length : 0;
  return {
    totalBatches: df.length,
    monthBatches: df.filter(b => b.production_date >= daysAgo(30)).length,
    weekBatches:  df.filter(b => b.production_date >= daysAgo(7)).length,
    totalBiochar,
    dryBiochar:   df.reduce((s, b) => s + b.dry_kg, 0),
    monthBiochar: df.filter(b => b.production_date >= daysAgo(30)).reduce((s, b) => s + b.biochar_wet_weight_kg, 0),
    activeKilns:  new Set(df.filter(b => b.production_date >= activeCutoff).map(b => b.kiln_id)).size,
    totalKilns:   new Set(df.map(b => b.kiln_id)).size,
    activeOps:    new Set(df.filter(b => b.production_date >= activeCutoff).map(b => b.operator_name)).size,
    totalOps:     new Set(df.map(b => b.operator_name)).size,
    qualPassRate: df.length ? (df.filter(b => b.c_quality_acceptable).length / df.length) * 100 : 0,
    compFlagsN:   df.filter(b => b.production_date >= daysAgo(COMPLIANCE_WINDOW_DAYS) && b.compliance_fails > 0).length,
    csiCompliant: df.filter(b => b.csi_compliant).length,
    nonCompliant: df.filter(b => !b.csi_compliant).length,
    avgDuration,
    minDuration:  df.length ? Math.min(...df.map(b => b.pyrolysis_duration_min)) : 0,
    maxDuration:  df.length ? Math.max(...df.map(b => b.pyrolysis_duration_min)) : 0,
    safetyInc:    df.filter(b => b.safety_incidents.toLowerCase() !== "none").length,
    samplesCol:   df.filter(b => b.c_sample_collected).length,
    durationFlag: avgDuration > 0 && (avgDuration < PYRO_MIN || avgDuration > PYRO_MAX),
  };
}

// ── Site / operator performance ───────────────────────────────────────────

export interface SiteTrend {
  site: string;
  batches: number;
  qualityRate: number;
  csiRate: number;
  durationRate: number;
  daysIdle: number;
  score: number;
  trend: "Improving" | "Stable" | "Declining";
  arrow: "↑" | "→" | "↓";
  rag: "Green" | "Amber" | "Red";
  rank: number;
}

export interface OperatorScore {
  operator: string;
  batches: number;
  qualityRate: number;
  csiRate: number;
  durationRate: number;
  daysIdle: number;
  score: number;
  trend: "Improving" | "Stable" | "Declining";
  arrow: "↑" | "→" | "↓";
  rag: "Green" | "Amber" | "Red";
}

function scoreGroup(sorted: Batch[]): { qualityRate: number; csiRate: number; durationRate: number; daysIdle: number; score: number; trend: "Improving" | "Stable" | "Declining"; arrow: "↑" | "→" | "↓"; rag: "Green" | "Amber" | "Red" } {
  const n = sorted.length;
  const qualityRate = n ? sorted.filter(b => b.c_quality_acceptable).length / n : 0.5;
  const csiRate     = n ? sorted.filter(b => b.csi_compliant).length / n : 0.5;
  const durationRate = n ? sorted.filter(b => b.c_duration_in_range).length / n : 0.5;
  const lastDate   = sorted[n - 1]?.production_date ?? "";
  const daysIdle   = lastDate ? daysBetween(lastDate) : 30;
  const activity   = Math.max(0, 1 - daysIdle / 30);
  const score      = Math.round(qualityRate * 30 + csiRate * 30 + durationRate * 20 + activity * 20);

  let trend: "Improving" | "Stable" | "Declining" = "Stable";
  let arrow: "↑" | "→" | "↓" = "→";
  if (n >= 4) {
    const half   = Math.floor(n / 2);
    const earlyQ = sorted.slice(0, half).filter(b => b.c_quality_acceptable).length / half;
    const earlyC = sorted.slice(0, half).filter(b => b.csi_compliant).length / half;
    const recentQ = sorted.slice(half).filter(b => b.c_quality_acceptable).length / (n - half);
    const recentC = sorted.slice(half).filter(b => b.csi_compliant).length / (n - half);
    const delta = ((recentQ + recentC) - (earlyQ + earlyC)) / 2;
    if (delta >= 0.1)  { trend = "Improving"; arrow = "↑"; }
    else if (delta <= -0.1) { trend = "Declining"; arrow = "↓"; }
  }
  const rag: "Green" | "Amber" | "Red" = score >= 70 ? "Green" : score >= 40 ? "Amber" : "Red";
  return { qualityRate, csiRate, durationRate, daysIdle, score, trend, arrow, rag };
}

export function computeSiteTrends(df: Batch[]): SiteTrend[] {
  const byKiln = new Map<string, Batch[]>();
  df.forEach(b => byKiln.set(b.kiln_id, [...(byKiln.get(b.kiln_id) ?? []), b]));
  const rows: Omit<SiteTrend, "rank">[] = [];
  byKiln.forEach((batches, site) => {
    const sorted = [...batches].sort((a, b) => a.production_date.localeCompare(b.production_date));
    rows.push({ site, batches: sorted.length, ...scoreGroup(sorted) });
  });
  return rows.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function computeOperatorScores(df: Batch[]): OperatorScore[] {
  const byOp = new Map<string, Batch[]>();
  df.forEach(b => byOp.set(b.operator_name, [...(byOp.get(b.operator_name) ?? []), b]));
  const rows: OperatorScore[] = [];
  byOp.forEach((batches, operator) => {
    const sorted = [...batches].sort((a, b) => a.production_date.localeCompare(b.production_date));
    rows.push({ operator, batches: sorted.length, ...scoreGroup(sorted) });
  });
  return rows.sort((a, b) => b.score - a.score);
}

// ── Decision snapshot ─────────────────────────────────────────────────────

export interface SnapshotItem {
  severity: "Critical" | "Warning";
  type: string;
  site: string;
  detail: string;
}

export interface DecisionSnapshot {
  critical: SnapshotItem[];
  warnings: SnapshotItem[];
}

export function computeDecisionSnapshot(df: Batch[]): DecisionSnapshot {
  const critical: SnapshotItem[] = [];
  const warnings: SnapshotItem[] = [];

  df.forEach(b => {
    if (b.safety_incidents.toLowerCase() !== "none") {
      critical.push({ severity: "Critical", type: "Safety incident", site: b.kiln_id, detail: `Batch ${b.batch_id}: ${b.safety_incidents}` });
    }
    if (b.compliance_fails > 0 && daysBetween(b.production_date) <= COMPLIANCE_WINDOW_DAYS) {
      critical.push({ severity: "Critical", type: "CSI failure", site: b.kiln_id, detail: `Batch ${b.batch_id}: ${b.compliance_fails} requirement(s) failed` });
    }
    if (b.pyrolysis_duration_min < PYRO_MIN || b.pyrolysis_duration_min > PYRO_MAX) {
      warnings.push({ severity: "Warning", type: "Duration out of range", site: b.kiln_id, detail: `Batch ${b.batch_id}: ${b.pyrolysis_duration_min} min` });
    }
    if (b.submission_lag_days > SUBMISSION_LAG_SLA_DAYS) {
      warnings.push({ severity: "Warning", type: "Late submission", site: b.kiln_id, detail: `Batch ${b.batch_id}: ${b.submission_lag_days}d lag (SLA: ${SUBMISSION_LAG_SLA_DAYS}d)` });
    }
  });

  const byKiln = new Map<string, Batch[]>();
  df.forEach(b => byKiln.set(b.kiln_id, [...(byKiln.get(b.kiln_id) ?? []), b]));
  byKiln.forEach((batches, kilnId) => {
    const sorted = [...batches].sort((a, b) => b.production_date.localeCompare(a.production_date));
    const idle = daysBetween(sorted[0].production_date);
    if (idle > ACTIVE_WINDOW_DAYS) {
      warnings.push({ severity: "Warning", type: "Idle kiln", site: kilnId, detail: `No production for ${idle} days` });
    }
  });

  return { critical: critical.slice(0, 10), warnings: warnings.slice(0, 10) };
}
