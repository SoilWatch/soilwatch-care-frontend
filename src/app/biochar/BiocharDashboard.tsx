"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Line, ReferenceLine, ReferenceArea,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ResponsiveContainer, ComposedChart, Area,
} from "recharts";
import {
  MOCK_BATCHES,
  PYRO_MIN, PYRO_MAX, ACTIVE_WINDOW_DAYS, COMPLIANCE_WINDOW_DAYS, MOISTURE_ESTIMATE,
  type Batch, type FeedstockAppearance,
} from "./data";

const KilnMapClient = dynamic(() => import("./KilnMapClient"), { ssr: false });

// ── Colour palette ─────────────────────────────────────────────────────────
const C = {
  title:       "#1F3864",
  heading:     "#2E75B6",
  metricBg:    "#f8f9fa",
  metricBorder:"#e9ecef",
  photoBorder: "#e5e7eb",
  red:         "#E74C3C",
  lightRed:    "#FADBD8",
  green:       "#27AE60",
  lightGreen:  "#D5F5E3",
  midGreen:    "#52BE80",
  orange:      "#F39C12",
  blue:        "#2E75B6",
  subtext:     "#6b7280",
};
const SET2_COLORS = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"];
const OP_COLORS = SET2_COLORS.slice(2);
const QUALITY_COLORS: Record<string, string> = {
  excellent: C.green, good: C.midGreen, fair: C.orange, poor: C.red,
};
const FEED_COLORS: Record<FeedstockAppearance, string> = {
  dry: C.green, mostly_dry: "#82E0AA", partially_wet: C.orange, wet: C.red,
};
const SMOKE_COLORS: Record<string, string> = {
  none: C.green, minimal: "#82E0AA", moderate: C.orange, heavy: C.red, very_heavy: "#922B21",
};

// ── UI primitives ───────────────────────────────────────────────────────────
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`} style={{ borderColor: C.metricBorder }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold mb-1 mt-4 text-base" style={{ color: C.heading }}>{children}</h3>;
}

function MetricCard({
  label, value, sub, flag,
}: { label: string; value: string | number; sub?: string; flag?: boolean }) {
  return (
    <div className="rounded-lg border p-3 flex flex-col gap-1"
      style={{ background: C.metricBg, borderColor: C.metricBorder }}>
      <div className="text-xs font-semibold" style={{ color: C.subtext }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: flag ? C.red : C.title }}>
        {flag && "⚠️ "}{value}
      </div>
      {sub && <div className="text-xs" style={{ color: C.subtext }}>{sub}</div>}
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
      style={{
        borderBottomColor: active ? C.blue : "transparent",
        color: active ? C.blue : C.subtext,
        background: "none",
      }}
    >
      {children}
    </button>
  );
}

// ── Date helpers ────────────────────────────────────────────────────────────
const TODAY = "2026-04-29";
function daysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function daysBetween(dateStr: string): number {
  return Math.floor((new Date(TODAY).getTime() - new Date(dateStr).getTime()) / 86400000);
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function maxVal(arr: number[]): number { return arr.length ? Math.max(...arr) : 0; }
function seriesColor(id: string): string {
  const chars = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SET2_COLORS[chars % SET2_COLORS.length];
}

// ── Main component ──────────────────────────────────────────────────────────
export default function BiocharDashboard({ mapboxToken, batches }: { mapboxToken: string; batches?: Batch[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const sourceBatches = batches?.length ? batches : MOCK_BATCHES;

  const allDates = sourceBatches.map(b => b.production_date).sort();
  const [dateFrom, setDateFrom] = useState(allDates[0]);
  const [dateTo,   setDateTo]   = useState(allDates[allDates.length - 1]);
  const allKilns = [...new Set(sourceBatches.map(b => b.kiln_id))].sort();
  const allOps   = [...new Set(sourceBatches.map(b => b.operator_name))].sort();
  const [selKilns, setSelKilns] = useState<string[]>(allKilns);
  const [selOps,   setSelOps]   = useState<string[]>(allOps);

  const df = useMemo(() => sourceBatches.filter(b =>
    b.production_date >= dateFrom && b.production_date <= dateTo &&
    selKilns.includes(b.kiln_id) && selOps.includes(b.operator_name)
  ), [dateFrom, dateTo, selKilns, selOps, sourceBatches]);

  // Headline numbers
  const totalBatches = df.length;
  const monthBatches = df.filter(b => b.production_date >= daysAgo(30)).length;
  const weekBatches  = df.filter(b => b.production_date >= daysAgo(7)).length;
  const totalBiochar = df.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const monthBiochar = df.filter(b => b.production_date >= daysAgo(30)).reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const activeCutoff = daysAgo(ACTIVE_WINDOW_DAYS);
  const activeKilns  = new Set(df.filter(b => b.production_date >= activeCutoff).map(b => b.kiln_id)).size;
  const totalKilns   = new Set(df.map(b => b.kiln_id)).size;
  const activeOps    = new Set(df.filter(b => b.production_date >= activeCutoff).map(b => b.operator_name)).size;
  const totalOps     = new Set(df.map(b => b.operator_name)).size;
  const qualPassRate = df.length ? (df.filter(b => b.c_quality_acceptable).length / df.length) * 100 : 0;
  const compFlagsN   = df.filter(b => b.production_date >= daysAgo(COMPLIANCE_WINDOW_DAYS) && b.compliance_fails > 0).length;
  const csiCompliant = df.filter(b => b.csi_compliant).length;
  const nonCompliant = totalBatches - csiCompliant;
  const avgDuration  = df.length ? df.reduce((s, b) => s + b.pyrolysis_duration_min, 0) / df.length : 0;
  const minDuration  = df.length ? Math.min(...df.map(b => b.pyrolysis_duration_min)) : 0;
  const maxDuration  = df.length ? Math.max(...df.map(b => b.pyrolysis_duration_min)) : 0;
  const safetyInc    = df.filter(b => b.safety_incidents.toLowerCase() !== "none").length;
  const samplesCol   = df.filter(b => b.c_sample_collected).length;
  const durationFlag = avgDuration > 0 && (avgDuration < PYRO_MIN || avgDuration > PYRO_MAX);

  const TABS = [
    "📈 Production Overview",
    "✅ Quality & Compliance",
    "⚠️ Operational Issues",
    "🗺️ Map",
    "🌍 Carbon & Climate",
    "📋 Batch Records",
    "🔍 Data Quality",
  ];

  return (
    <div className="flex min-h-full flex-col bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="bg-white px-6 pt-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: C.title }}>Biochar Production Dashboard</h1>
            </div>
          </div>
        </div>

        <div className="bg-white border-b px-6 py-3 flex flex-wrap gap-4 items-end" style={{ borderColor: C.metricBorder }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: C.subtext }}>Date from</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 text-sm" style={{ borderColor: C.metricBorder }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: C.subtext }}>Date to</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 text-sm" style={{ borderColor: C.metricBorder }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: C.subtext }}>Kiln</label>
            <div className="flex gap-3">
              {allKilns.map(k => (
                <label key={k} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={selKilns.includes(k)}
                    onChange={e => setSelKilns(prev => e.target.checked ? [...prev, k] : prev.filter(x => x !== k))} />
                  {k}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: C.subtext }}>Operator</label>
            <div className="flex flex-wrap gap-3">
              {allOps.map(op => (
                <label key={op} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={selOps.includes(op)}
                    onChange={e => setSelOps(prev => e.target.checked ? [...prev, op] : prev.filter(x => x !== op))} />
                  {op}
                </label>
              ))}
            </div>
          </div>
          <span className="text-xs ml-auto self-center" style={{ color: C.subtext }}>
            Showing <strong>{totalBatches}</strong> batch(es)
          </span>
        </div>

        {totalBatches === 0 ? (
          <div className="mx-6 mt-4 rounded-lg border p-3 text-sm" style={{ background: "#fffbeb", borderColor: C.orange, color: "#92400e" }}>
            No batches match the current filters.
          </div>
        ) : (
          <>
            <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Total Batches" value={totalBatches}
                sub={`This month: ${monthBatches} · This week: ${weekBatches}`} />
              <MetricCard label="Biochar Produced" value={`${totalBiochar.toFixed(0)} kg`}
                sub={`This month: ${monthBiochar.toFixed(0)} kg`} />
              <MetricCard label="Active Kilns" value={`${activeKilns} / ${totalKilns}`}
                sub={totalKilns - activeKilns === 0 ? "All active" : `${totalKilns - activeKilns} idle`} />
              <MetricCard label="Active Operators" value={`${activeOps} / ${totalOps}`}
                sub={`Last ${ACTIVE_WINDOW_DAYS}-day window`} />
              <MetricCard label="Quality Pass Rate" value={`${qualPassRate.toFixed(0)}%`}
                sub="Excellent or Good rating" />
              <MetricCard label="Compliance Flags" value={compFlagsN}
                sub={`Last ${COMPLIANCE_WINDOW_DAYS} days · failing ≥1 CSI req.`} />
              <MetricCard label="Avg Pyrolysis Duration" value={`${avgDuration.toFixed(0)} min`}
                sub={`Range: ${minDuration}–${maxDuration} min`} flag={durationFlag} />
              <MetricCard label="Safety Incidents" value={safetyInc}
                sub={`Samples collected: ${samplesCol} / ${totalBatches}`} />
            </div>

            <div className="px-6 pt-3 space-y-2">
              {nonCompliant > 0 && (
                <div className="rounded-lg border p-3 text-sm font-medium"
                  style={{ background: C.lightRed, borderColor: C.red, color: C.red }}>
                  ⚠️ {nonCompliant} of {totalBatches} batches do not meet CSI Artisan Pro requirements.
                  See the Quality &amp; Compliance tab for details.
                </div>
              )}
              <div className="rounded-lg border p-3 text-sm"
                style={{ background: "#fffbeb", borderColor: C.orange, color: "#92400e" }}>
                <strong>Systematic data gaps — all batches missing:</strong>{" "}
                feedstock weight (no scales) · moisture readings (no meters) · temperature data (no sensors).
                These prevent full CSI Artisan Pro compliance.
              </div>
            </div>

            <div className="px-6 mt-4 border-b overflow-x-auto" style={{ borderColor: C.metricBorder }}>
              <div className="flex">
                {TABS.map((t, i) => (
                  <TabButton key={i} active={activeTab === i} onClick={() => setActiveTab(i)}>{t}</TabButton>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {activeTab === 0 && <Tab1 df={df} />}
              {activeTab === 1 && <Tab2 df={df} />}
              {activeTab === 2 && <Tab3 df={df} />}
              {activeTab === 3 && <Tab4 df={df} mapboxToken={mapboxToken} />}
              {activeTab === 4 && <Tab5 df={df} />}
              {activeTab === 5 && <Tab6 df={df} />}
              {activeTab === 6 && <Tab7 df={df} />}
            </div>
          </>
        )}

        <div className="px-6 py-3 text-xs border-t" style={{ color: C.subtext, borderColor: C.metricBorder }}>
          SoilWatch dMRV — CP2 Pyrolysis Production module.
        </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — Production Overview
// ═══════════════════════════════════════════════════════════════════════════
function Tab1({ df }: { df: Batch[] }) {
  const kilnIds = [...new Set(df.map(b => b.kiln_id))].sort();

  // Daily timeline
  const dailyMap: Record<string, Record<string, number>> = {};
  df.forEach(b => {
    if (!dailyMap[b.production_date]) dailyMap[b.production_date] = {};
    dailyMap[b.production_date][b.kiln_id] = (dailyMap[b.production_date][b.kiln_id] ?? 0) + b.biochar_wet_weight_kg;
  });
  const dailyData = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
    date: date.slice(5), ...v,
  }));

  // Kiln summary
  const kilnSummary = kilnIds.map(k => {
    const rows = df.filter(b => b.kiln_id === k);
    const last = rows.reduce((m, b) => b.production_date > m ? b.production_date : m, "");
    return { kiln_id: k, batches: rows.length, totalKg: rows.reduce((s, b) => s + b.biochar_wet_weight_kg, 0), days_idle: last ? daysBetween(last) : 999 };
  }).sort((a, b) => a.totalKg - b.totalKg);

  // Operator summary
  const opMap: Record<string, { batches: number; totalKg: number; passCount: number; last: string }> = {};
  df.forEach(b => {
    if (!opMap[b.operator_name]) opMap[b.operator_name] = { batches: 0, totalKg: 0, passCount: 0, last: "" };
    opMap[b.operator_name].batches++;
    opMap[b.operator_name].totalKg += b.biochar_wet_weight_kg;
    if (b.c_quality_acceptable) opMap[b.operator_name].passCount++;
    if (b.production_date > opMap[b.operator_name].last) opMap[b.operator_name].last = b.production_date;
  });
  const opSummary = Object.entries(opMap).map(([op, v], i) => ({
    operator: op.split(" ")[0], full_name: op, ...v,
    pass_rate: v.batches ? v.passCount / v.batches : 0, color: OP_COLORS[i % OP_COLORS.length],
  })).sort((a, b) => a.totalKg - b.totalKg);

  // Feedstock condition pie
  const fcMap: Record<string, number> = {};
  df.forEach(b => { fcMap[b.feedstock_appearance] = (fcMap[b.feedstock_appearance] ?? 0) + 1; });
  const fcData = Object.entries(fcMap).map(([k, v]) => ({ name: k, value: v }));

  // Smoke observation bar
  const smMap: Record<string, number> = {};
  df.forEach(b => { smMap[b.smoke_observation] = (smMap[b.smoke_observation] ?? 0) + 1; });
  const smOrder = ["none", "minimal", "moderate", "heavy", "very_heavy"];
  const smData = Object.entries(smMap).sort((a, b) => smOrder.indexOf(a[0]) - smOrder.indexOf(b[0]))
    .map(([k, v]) => ({ name: k, count: v }));

  // Feeding duration per batch
  const feedingData = [...df].sort((a, b) => a.batch_id.localeCompare(b.batch_id))
    .map(b => ({ batch: b.batch_id.slice(-3), min: b.feeding_duration_min, kiln: b.kiln_id }));

  // Pyrolysis duration per batch
  const pyroData = [...df].sort((a, b) => a.production_date.localeCompare(b.production_date))
    .map(b => ({ batch: b.batch_id.slice(-3), min: b.pyrolysis_duration_min, kiln: b.kiln_id, inRange: b.c_duration_in_range }));
  const pyroMax = Math.max(maxVal(pyroData.map(d => d.min)) * 1.1, PYRO_MAX + 40);

  return (
    <div className="space-y-4">
      <SectionTitle>Production Over Time</SectionTitle>
      <Panel>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dailyData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: unknown) => `${v as number} kg`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: unknown, n: unknown) => [`${(v as number).toFixed(0)} kg`, n as string]} />
            <Legend />
            {kilnIds.map(k => (
              <Bar key={k} dataKey={k} stackId="a" fill={seriesColor(k)} name={k} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <SectionTitle>Production by Kiln</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={kilnSummary} layout="vertical" margin={{ top: 4, right: 72, left: 40, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="kiln_id" tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)} kg`, "Output"]} />
              <Bar dataKey="totalKg" radius={[0, 3, 3, 0]}
                label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)} kg` }}>
                {kilnSummary.map((r, i) => <Cell key={i} fill={seriesColor(r.kiln_id)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-xs mt-2 border-t" style={{ borderColor: C.metricBorder }}>
            <thead><tr style={{ color: C.subtext }}>
              <th className="text-left py-1">Kiln</th><th className="text-right py-1">Batches</th>
              <th className="text-right py-1">Total kg</th><th className="text-right py-1">Days idle</th>
            </tr></thead>
            <tbody>{kilnSummary.map(r => (
              <tr key={r.kiln_id} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 font-medium">{r.kiln_id}</td>
                <td className="text-right">{r.batches}</td>
                <td className="text-right">{r.totalKg.toFixed(0)} kg</td>
                <td className="text-right">{r.days_idle}d</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>

        <Panel>
          <SectionTitle>Production by Operator</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={opSummary} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="operator" tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)} kg`, "Output"]} />
              <Bar dataKey="totalKg" radius={[0, 3, 3, 0]}
                label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)} kg` }}>
                {opSummary.map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-xs mt-2 border-t" style={{ borderColor: C.metricBorder }}>
            <thead><tr style={{ color: C.subtext }}>
              <th className="text-left py-1">Operator</th><th className="text-right py-1">Batches</th>
              <th className="text-right py-1">Total kg</th><th className="text-right py-1">Pass rate</th>
            </tr></thead>
            <tbody>{opSummary.map(r => (
              <tr key={r.full_name} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 font-medium">{r.full_name}</td>
                <td className="text-right">{r.batches}</td>
                <td className="text-right">{r.totalKg.toFixed(0)} kg</td>
                <td className="text-right">{(r.pass_rate * 100).toFixed(0)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>

      <SectionTitle>Feedstock &amp; Pyrolysis Detail</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel>
          <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>Feedstock Condition Mix</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={fcData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={70} innerRadius={28}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {fcData.map((e, i) => <Cell key={i} fill={FEED_COLORS[e.name as FeedstockAppearance] ?? "#ccc"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>Smoke Observation Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={smData} margin={{ top: 4, right: 16, bottom: 24, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {smData.map((e, i) => <Cell key={i} fill={SMOKE_COLORS[e.name] ?? "#ccc"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>Feeding Duration per Batch</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={feedingData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="batch" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => [`${v as number} min`, "Feeding"]} />
              <Bar dataKey="min" radius={[3, 3, 0, 0]}>
                {feedingData.map((e, i) => <Cell key={i} fill={seriesColor(e.kiln)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>Pyrolysis Duration per Batch</div>
        <ResponsiveContainer width="100%" height={Math.max(240, pyroData.length * 38 + 60)}>
          <BarChart data={pyroData} layout="vertical" margin={{ top: 8, right: 80, bottom: 8, left: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, pyroMax]}
              tickFormatter={(v: unknown) => `${v as number}`} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="batch" tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: unknown) => [`${v as number} min`, "Duration"]} />
            <ReferenceLine x={PYRO_MIN} stroke={C.red} strokeDasharray="4 2"
              label={{ value: `Min ${PYRO_MIN}`, position: "insideTopRight", fill: C.red, fontSize: 10 }} />
            <ReferenceLine x={PYRO_MAX} stroke={C.red} strokeDasharray="4 2"
              label={{ value: `Max ${PYRO_MAX}`, position: "insideTopLeft", fill: C.red, fontSize: 10 }} />
            <ReferenceArea x1={PYRO_MIN} x2={PYRO_MAX} fill={C.green} fillOpacity={0.07} />
            <Bar dataKey="min" radius={[0, 3, 3, 0]}
              label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${v as number} min` }}>
              {pyroData.map((e, i) => (
                <Cell key={i} fill={e.inRange ? seriesColor(e.kiln) : C.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — Quality & Compliance
// ═══════════════════════════════════════════════════════════════════════════
const COMPLIANCE_DEFS: [keyof Batch, string, boolean][] = [
  ["c_feedstock_weight",    "Feedstock weight (kg) recorded", true],
  ["c_feedstock_moisture",  "Feedstock moisture (%) recorded", true],
  ["c_biochar_weight",      "Biochar output weighed", true],
  ["c_visual_quality",      "Visual quality assessed", true],
  ["c_sample_collected",    "Composite sample collected", true],
  ["c_no_safety_incidents", "No safety incidents", true],
  ["c_duration_in_range",   "Pyrolysis duration in range (60–240 min)", true],
  ["c_operator_certified",  "Operator certified (certified producer registry)", true],
  ["c_photo_feedstock",     "Feedstock photo captured", true],
  ["c_photo_biochar",       "Biochar output photo captured", true],
  ["c_photo_sample_bag",    "Sample bag photo captured", true],
  ["c_temp_data",           "Temperature data (premium tier, not CSI required)", false],
];

function Tab2({ df }: { df: Batch[] }) {
  const recent = df.slice(0, 12);

  const compRate = COMPLIANCE_DEFS.map(([col, label, csi]) => ({
    label: label.length > 40 ? label.slice(0, 40) + "…" : label,
    fullLabel: label,
    pct: df.length ? (df.filter(b => b[col] as unknown as boolean).length / df.length) * 100 : 0,
    csi,
  })).sort((a, b) => a.pct - b.pct);

  const monthMap: Record<string, { total: number; compliant: number }> = {};
  df.forEach(b => {
    const m = b.production_date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = { total: 0, compliant: 0 };
    monthMap[m].total++;
    if (b.csi_compliant) monthMap[m].compliant++;
  });
  const monthData = Object.entries(monthMap).sort().map(([m, v]) => ({
    month: m, compliant: v.compliant, non_compliant: v.total - v.compliant,
  }));

  const weekMap: Record<string, { scores: number[]; durations: number[] }> = {};
  df.forEach(b => {
    const d = new Date(b.production_date);
    const wk = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()).toISOString().slice(0, 10);
    if (!weekMap[wk]) weekMap[wk] = { scores: [], durations: [] };
    weekMap[wk].scores.push(b.quality_score);
    weekMap[wk].durations.push(b.pyrolysis_duration_min);
  });
  const trendData = Object.entries(weekMap).sort().map(([wk, v]) => ({
    week: wk.slice(5),
    avgQuality: +(v.scores.reduce((s, x) => s + x, 0) / v.scores.length).toFixed(2),
    avgDuration: +(v.durations.reduce((s, x) => s + x, 0) / v.durations.length).toFixed(0),
  }));

  const qMap: Record<string, number> = {};
  df.forEach(b => { qMap[b.biochar_visual_quality] = (qMap[b.biochar_visual_quality] ?? 0) + 1; });
  const qData = Object.entries(qMap).map(([k, v]) => ({ name: k, value: v }));

  const devBatches = df.filter(b => !b.c_duration_in_range || !b.c_quality_acceptable || b.compliance_fails > 0);

  return (
    <div className="space-y-4">
      <SectionTitle>CSI Artisan Pro Compliance Scorecard</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>
        Each row = one CSI requirement · Each column = one batch (last {recent.length}) · 🟢 met · 🔴 not met
      </p>
      <Panel>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead><tr>
              <th className="text-left pr-4 py-1 font-semibold" style={{ color: C.subtext, minWidth: 280 }}>Requirement</th>
              {recent.map(b => (
                <th key={b.batch_id} className="text-center px-1 py-1 font-normal"
                  style={{ color: C.subtext, minWidth: 32, fontSize: 10 }}>
                  {b.batch_id.slice(-3)}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {COMPLIANCE_DEFS.map(([col, label, csi]) => (
                <tr key={col} className="border-t" style={{ borderColor: C.metricBorder }}>
                  <td className="pr-4 py-1 whitespace-nowrap text-xs" style={{ color: csi ? C.title : C.subtext }}>
                    {!csi && <span style={{ color: "#9ca3af" }}>[premium] </span>}{label}
                  </td>
                  {recent.map(b => {
                    const pass = b[col] as unknown as boolean;
                    return (
                      <td key={b.batch_id} className="text-center px-1 py-0.5"
                        style={{ background: pass ? C.lightGreen : C.lightRed, color: pass ? "#166534" : "#991b1b" }}>
                        {pass ? "✓" : "✗"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <SectionTitle>Compliance Rate by Requirement</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>Temperature data row is premium-tier only.</p>
      <Panel>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={compRate} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v: unknown) => `${v as number}%`} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={260} />
            <Tooltip formatter={(v: unknown, _n: unknown, props: { payload?: { fullLabel?: string } }) =>
              [`${(v as number).toFixed(0)}%`, props.payload?.fullLabel ?? ""]
            } />
            <Bar dataKey="pct" radius={[0, 3, 3, 0]}
              label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)}%` }}>
              {compRate.map((e, i) => (
                <Cell key={i} fill={e.pct >= 80 ? C.green : e.pct >= 50 ? C.orange : C.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionTitle>CSI-Compliant Batches per Month</SectionTitle>
      <Panel>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="compliant"     name="CSI Compliant" fill={C.green} stackId="a" />
            <Bar dataKey="non_compliant" name="Non-compliant"  fill={C.red}   stackId="a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionTitle>Quality Metrics Over Time</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>Weekly averages of quality score and pyrolysis duration.</p>
      <Panel>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trendData} margin={{ top: 8, right: 48, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="q" domain={[0, 4.5]} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="d" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <ReferenceLine yAxisId="q" y={3.0} stroke={C.orange} strokeDasharray="4 2" />
            <ReferenceArea yAxisId="d" y1={PYRO_MIN} y2={PYRO_MAX} fill={C.green} fillOpacity={0.05} />
            <Line yAxisId="q" dataKey="avgQuality"  name="Avg quality score (1–4)"   stroke={C.green} strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="d" dataKey="avgDuration" name="Avg duration (min)"         stroke={C.blue}  strokeWidth={2} strokeDasharray="4 2" dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <SectionTitle>Visual Quality Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={qData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={80} innerRadius={32}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {qData.map((e, i) => <Cell key={i} fill={QUALITY_COLORS[e.name] ?? "#ccc"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <SectionTitle>Pyrolysis Duration vs. Quality</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="x" name="Duration (min)" type="number" tick={{ fontSize: 10 }}
                label={{ value: "Duration (min)", position: "insideBottom", offset: -8, fontSize: 10 }} />
              <YAxis dataKey="y" name="Quality" type="category"
                ticks={["poor", "fair", "good", "excellent"]} tick={{ fontSize: 10 }} width={60} />
              <Tooltip formatter={(v: unknown, n: unknown) => [v as string, n as string]} />
              <ReferenceArea x1={PYRO_MIN} x2={PYRO_MAX} fill={C.green} fillOpacity={0.07} />
              <Scatter data={df.map(b => ({ x: b.pyrolysis_duration_min, y: b.biochar_visual_quality }))}>
                {df.map((b, i) => <Cell key={i} fill={QUALITY_COLORS[b.biochar_visual_quality] ?? C.blue} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <SectionTitle>Deviation Batch Tracker</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>
        Batches flagged as deviations — duration out of range, quality below good/excellent, or failing ≥1 CSI requirement.
      </p>
      {devBatches.length === 0 ? (
        <div className="text-sm p-3 rounded" style={{ background: C.lightGreen, color: "#166534" }}>
          ✓ No deviation batches in current filter.
        </div>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: C.subtext, borderColor: C.metricBorder }} className="border-b">
                {["Batch","Date","Kiln","Operator","Deviation Reason","CSI Fails"].map(h => (
                  <th key={h} className={`py-1 pr-3 ${h === "CSI Fails" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{devBatches.map(b => {
                const reason = !b.c_duration_in_range
                  ? "Pyrolysis duration outside 60–240 min target range"
                  : !b.c_quality_acceptable ? "Visual quality below good/excellent"
                  : "One or more CSI requirements failed";
                return (
                  <tr key={b.batch_id} className="border-t" style={{ borderColor: C.metricBorder }}>
                    <td className="py-1 pr-3 font-medium">{b.batch_id}</td>
                    <td className="py-1 pr-3">{fmtDate(b.production_date)}</td>
                    <td className="py-1 pr-3">{b.kiln_id}</td>
                    <td className="py-1 pr-3">{b.operator_name}</td>
                    <td className="py-1 pr-3" style={{ color: C.red }}>{reason}</td>
                    <td className="py-1 text-right font-bold" style={{ color: C.red }}>{b.compliance_fails}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </Panel>
      )}

      <SectionTitle>Temperature Data</SectionTitle>
      <div className="text-sm p-3 rounded border" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
        No temperature sensor installed for any batch. Once sensors are deployed, this section will display
        peak temperature (°C), average temperature, and time above 500°C. Fields already in the form —
        values will populate automatically when sensors arrive.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — Operational Issues
// ═══════════════════════════════════════════════════════════════════════════
function Tab3({ df }: { df: Batch[] }) {
  const skip = new Set(["", "none", "no problem", "no problem.", "no problem observed.", "no problem occurred.", "nan", "n/a"]);

  const alerts: { severity: string; type: string; detail: string }[] = [];

  const kilnLast: Record<string, string> = {};
  df.forEach(b => { if (!kilnLast[b.kiln_id] || b.production_date > kilnLast[b.kiln_id]) kilnLast[b.kiln_id] = b.production_date; });
  Object.entries(kilnLast).forEach(([k, last]) => {
    const idle = daysBetween(last);
    if (idle > ACTIVE_WINDOW_DAYS)
      alerts.push({ severity: "🟡 Warning", type: "Idle kiln", detail: `${k} — no production for ${idle} days. Possible breakdown or absent operator.` });
  });

  const opBatches: Record<string, Batch[]> = {};
  df.forEach(b => { if (!opBatches[b.operator_name]) opBatches[b.operator_name] = []; opBatches[b.operator_name].push(b); });
  Object.entries(opBatches).forEach(([op, batches]) => {
    if (batches.length >= 4) {
      const sorted = [...batches].sort((a, b) => a.production_date.localeCompare(b.production_date));
      const half = Math.floor(sorted.length / 2);
      const earlyPass  = sorted.slice(0, half).filter(b => b.c_quality_acceptable).length / half;
      const recentPass = sorted.slice(half).filter(b => b.c_quality_acceptable).length / (sorted.length - half);
      if (earlyPass - recentPass >= 0.25)
        alerts.push({ severity: "🟡 Warning", type: "Declining quality",
          detail: `${op} — quality pass rate dropped from ${(earlyPass * 100).toFixed(0)}% to ${(recentPass * 100).toFixed(0)}%. May need additional training.` });
    }
  });

  df.forEach(b => {
    const note = b.operational_issues?.trim().toLowerCase();
    if (note && !skip.has(note))
      alerts.push({ severity: "🟠 Info", type: "Operational issue in notes",
        detail: `Batch ${b.batch_id} (${b.operator_name}) — ${b.operational_issues.slice(0, 120)}` });
  });

  df.filter(b => b.pyrolysis_duration_min < PYRO_MIN || b.pyrolysis_duration_min > PYRO_MAX).forEach(b => {
    alerts.push({ severity: "🟡 Warning", type: "Duration out of range",
      detail: `Batch ${b.batch_id} — ${b.pyrolysis_duration_min} min (target ${PYRO_MIN}–${PYRO_MAX} min)` });
  });

  const missingLabels = [
    "Feedstock weight (kg) — scales not yet deployed",
    "Feedstock moisture (%) — moisture meters not deployed",
    "Pyrolysis temperature — sensors not installed",
  ];
  missingLabels.forEach(label => {
    alerts.push({ severity: "🟠 Info", type: "Missing data field",
      detail: `${label} — missing for all ${df.length} batches in current view` });
  });

  const kilnIdle = Object.entries(kilnLast).map(([k, last]) => {
    const d = daysBetween(last);
    return { name: k, last: fmtDate(last), daysIdle: d, status: d <= 7 ? "🟢 Active" : d <= 14 ? "🟡 Slow" : "🔴 Idle" };
  });
  const opIdle = Object.entries(opBatches).map(([op, batches]) => {
    const last = batches.reduce((m, b) => b.production_date > m ? b.production_date : m, "");
    const d = daysBetween(last);
    return { name: op, last: fmtDate(last), daysIdle: d, status: d <= 7 ? "🟢 Active" : d <= 14 ? "🟡 Slow" : "🔴 Idle" };
  });

  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const photoTypes: [keyof Batch, string][] = [
    ["photo_feedstock_pile", "Feedstock Pile"],
    ["photo_active_pyrolysis", "Active Pyrolysis"],
    ["photo_biochar_output", "Biochar Output"],
    ["photo_sample_bag", "Sample Bag"],
  ];

  return (
    <div className="space-y-4">
      <SectionTitle>Active Alerts</SectionTitle>
      {alerts.length === 0 ? (
        <div className="text-sm p-3 rounded" style={{ background: C.lightGreen, color: "#166534" }}>
          ✓ No active alerts.
        </div>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: C.subtext }} className="border-b">
                <th className="text-left py-1 pr-3" style={{ minWidth: 96 }}>Severity</th>
                <th className="text-left py-1 pr-3" style={{ minWidth: 160 }}>Type</th>
                <th className="text-left py-1">Detail</th>
              </tr></thead>
              <tbody>{alerts.map((a, i) => (
                <tr key={i} className="border-t" style={{ borderColor: C.metricBorder }}>
                  <td className="py-1 pr-3 whitespace-nowrap">{a.severity}</td>
                  <td className="py-1 pr-3 whitespace-nowrap font-medium">{a.type}</td>
                  <td className="py-1">{a.detail}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
      )}

      <SectionTitle>Days Since Last Production</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>By Kiln</div>
          <table className="w-full text-xs">
            <thead><tr style={{ color: C.subtext }}>
              <th className="text-left py-1">Kiln</th><th className="text-left py-1">Last Batch</th>
              <th className="text-right py-1">Days Idle</th><th className="text-right py-1">Status</th>
            </tr></thead>
            <tbody>{kilnIdle.map(r => (
              <tr key={r.name} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 font-medium">{r.name}</td><td>{r.last}</td>
                <td className="text-right">{r.daysIdle}</td><td className="text-right">{r.status}</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
        <Panel>
          <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>By Operator</div>
          <table className="w-full text-xs">
            <thead><tr style={{ color: C.subtext }}>
              <th className="text-left py-1">Operator</th><th className="text-left py-1">Last Batch</th>
              <th className="text-right py-1">Days Idle</th><th className="text-right py-1">Status</th>
            </tr></thead>
            <tbody>{opIdle.map(r => (
              <tr key={r.name} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 font-medium">{r.name}</td><td>{r.last}</td>
                <td className="text-right">{r.daysIdle}</td><td className="text-right">{r.status}</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>

      <SectionTitle>Operational Notes from Recent Batches</SectionTitle>
      {df.filter(b => {
        const fields = [b.operational_issues, b.batch_notes, b.safety_details];
        return fields.some(f => f && !skip.has(f.trim().toLowerCase()));
      }).map(b => (
        <div key={b.batch_id} className="mb-1">
          <button className="w-full text-left text-sm font-medium py-2 px-3 rounded border"
            style={{ background: C.metricBg, borderColor: C.metricBorder, color: C.title }}
            onClick={() => setExpandedBatch(expandedBatch === b.batch_id ? null : b.batch_id)}>
            <strong>{b.batch_id}</strong> — {fmtDate(b.production_date)} — {b.operator_name}
            {" "}{expandedBatch === b.batch_id ? "▲" : "▼"}
          </button>
          {expandedBatch === b.batch_id && (
            <div className="text-sm p-3 border-x border-b rounded-b" style={{ borderColor: C.metricBorder }}>
              {([["Operational Issues", b.operational_issues], ["Batch Notes", b.batch_notes], ["Safety Details", b.safety_details]] as [string, string][])
                .filter(([, v]) => v && !skip.has(v.trim().toLowerCase()))
                .map(([l, v]) => (
                  <div key={l} className="mb-2">
                    <div className="font-semibold text-xs mb-0.5" style={{ color: C.subtext }}>{l}</div>
                    <div>{v}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}

      <SectionTitle>Photo Grid</SectionTitle>
      <div className="text-xs mb-2 p-2 rounded border" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
        Photos are hosted on ONA and require authentication to view inline. Click a link to open in your browser.
      </div>
      {df.map(b => (
        <Panel key={b.batch_id} className="mb-2">
          <div className="text-xs font-semibold mb-2" style={{ color: C.title }}>
            {b.batch_id} — {fmtDate(b.production_date)} · {b.kiln_id} · {b.operator_name}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {photoTypes.map(([col, label]) => {
              const url = b[col] as string | null;
              return (
                <div key={col as string} className="rounded border p-2 text-center text-xs"
                  style={{ background: "#f9fafb", borderColor: C.photoBorder, opacity: url ? 1 : 0.5 }}>
                  <div className="mb-1">📷 {label}</div>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="font-semibold" style={{ color: "#2563eb" }}>Open ↗</a>
                  ) : (
                    <span style={{ color: C.subtext }}>Not captured</span>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — Map
// ═══════════════════════════════════════════════════════════════════════════
function Tab4({ df, mapboxToken }: { df: Batch[]; mapboxToken: string }) {
  const kilnIds = [...new Set(df.map(b => b.kiln_id))].sort();
  const [selectedKiln, setSelectedKiln] = useState(kilnIds[0] ?? "K-01");

  const kilnAgg = kilnIds.map(k => {
    const rows = df.filter(b => b.kiln_id === k);
    const last = rows.reduce((m, b) => b.production_date > m ? b.production_date : m, "");
    const validCoords = rows.filter(b => b.production_lat && b.production_lon);
    return {
      kiln_id: k, batches: rows.length,
      totalKg: rows.reduce((s, b) => s + b.biochar_wet_weight_kg, 0),
      passRate: rows.length ? rows.filter(b => b.c_quality_acceptable).length / rows.length : 0,
      avgDuration: rows.length ? rows.reduce((s, b) => s + b.pyrolysis_duration_min, 0) / rows.length : 0,
      daysIdle: last ? daysBetween(last) : 999,
      lat: validCoords.length ? validCoords.reduce((s, b) => s + b.production_lat, 0) / validCoords.length : 0,
      lon: validCoords.length ? validCoords.reduce((s, b) => s + b.production_lon, 0) / validCoords.length : 0,
    };
  });

  const selData  = kilnAgg.find(k => k.kiln_id === selectedKiln);
  const selBatches = df.filter(b => b.kiln_id === selectedKiln)
    .sort((a, b) => b.production_date.localeCompare(a.production_date));
  const opsAtKiln = Object.entries(
    selBatches.reduce((m: Record<string, number>, b) => {
      m[b.operator_name] = (m[b.operator_name] ?? 0) + 1; return m;
    }, {})
  );

  return (
    <div className="space-y-4">
      <SectionTitle>Production Site Map</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>
        🟢 Active (produced in last {ACTIVE_WINDOW_DAYS} days) · 🔴 Idle · 🟡 Feedstock source
      </p>
      <Panel>
        <div style={{ height: 480 }}>
          <KilnMapClient mapboxToken={mapboxToken} batches={df} />
        </div>
      </Panel>

      <SectionTitle>Kiln Detail</SectionTitle>
      <div className="flex gap-2 mb-3">
        {kilnIds.map(k => (
          <button key={k} onClick={() => setSelectedKiln(k)}
            className="px-3 py-1.5 rounded text-sm font-medium border transition-colors"
            style={{
              background: selectedKiln === k ? C.blue : "white",
              color: selectedKiln === k ? "white" : C.subtext,
              borderColor: selectedKiln === k ? C.blue : C.metricBorder,
            }}>
            {k}
          </button>
        ))}
      </div>

      {selData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <MetricCard label="Total Output" value={`${selData.totalKg.toFixed(0)} kg`} />
            <MetricCard label="Batches" value={selData.batches} />
            <MetricCard label="Quality Pass Rate" value={`${(selData.passRate * 100).toFixed(0)}%`} />
            <MetricCard label="Avg Pyrolysis" value={`${selData.avgDuration.toFixed(0)} min`} />
            <MetricCard label="Days Since Last Batch" value={selData.daysIdle} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <Panel>
              <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>Operators at this kiln</div>
              <table className="w-full text-xs">
                <thead><tr style={{ color: C.subtext }}><th className="text-left py-1">Operator</th><th className="text-right py-1">Batches</th></tr></thead>
                <tbody>{opsAtKiln.map(([op, n]) => (
                  <tr key={op} className="border-t" style={{ borderColor: C.metricBorder }}>
                    <td className="py-1">{op}</td><td className="text-right">{n}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Panel>
            <Panel>
              <div className="text-xs font-semibold mb-2" style={{ color: C.subtext }}>Output per batch</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[...selBatches].reverse().map(b => ({
                  batch: b.batch_id.slice(-3), kg: b.biochar_wet_weight_kg, quality: b.biochar_visual_quality,
                }))} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
                  <XAxis dataKey="batch" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)} kg`, "Output"]} />
                  <Bar dataKey="kg" radius={[3, 3, 0, 0]}
                    label={{ position: "top", fontSize: 9, formatter: (v: unknown) => `${(v as number).toFixed(0)}` }}>
                    {[...selBatches].reverse().map((b, i) => (
                      <Cell key={i} fill={QUALITY_COLORS[b.biochar_visual_quality] ?? C.blue} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — Carbon & Climate
// ═══════════════════════════════════════════════════════════════════════════
function Tab5({ df }: { df: Batch[] }) {
  const totalWet = df.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const totalDry = df.reduce((s, b) => s + b.dry_kg, 0);

  const cumData = [...df]
    .sort((a, b) => a.production_date.localeCompare(b.production_date))
    .reduce<{ date: string; cumWet: number; cumDry: number }[]>((rows, b) => {
      const prev = rows[rows.length - 1];
      const cumWet = (prev?.cumWet ?? 0) + b.biochar_wet_weight_kg;
      const cumDry = (prev?.cumDry ?? 0) + b.dry_kg;
      rows.push({ date: b.production_date.slice(5), cumWet: +cumWet.toFixed(1), cumDry: +cumDry.toFixed(1) });
      return rows;
    }, []);

  const fcMap: Record<string, number> = {};
  df.forEach(b => { fcMap[b.feedstock_appearance] = (fcMap[b.feedstock_appearance] ?? 0) + 1; });
  const fcData = ["dry", "mostly_dry", "partially_wet", "wet"].map(k => ({
    name: k, pct: df.length ? ((fcMap[k] ?? 0) / df.length) * 100 : 0,
  }));

  return (
    <div className="space-y-4">
      <SectionTitle>Carbon &amp; Climate</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Wet Biochar (kg)" value={`${totalWet.toFixed(1)} kg`}
          sub="Directly from form — measured, no assumptions" />
        <MetricCard label="Dry Biochar — estimate (kg)" value={`${totalDry.toFixed(1)} kg`}
          sub={`wet kg × (1 − ${(MOISTURE_ESTIMATE * 100).toFixed(0)}% moisture est.)`} />
        <MetricCard label="Estimated tCO₂e" value="Pending"
          sub="Awaiting confirmed CSI conversion factors" />
        <MetricCard label="Yield Ratio" value="Pending"
          sub="Awaiting scales at kiln sites" />
      </div>

      <SectionTitle>Cumulative Biochar in Current C-Sink Unit</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>
        Running total of wet and dry biochar produced to date.
      </p>
      <Panel>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={cumData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v: unknown) => `${v as number} kg`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: unknown, n: unknown) => [`${(v as number).toFixed(1)} kg`, n as string]} />
            <Legend />
            <Area type="monotone" dataKey="cumWet" name="Cumulative wet biochar (kg)"
              stroke={C.green} fill={C.lightGreen} fillOpacity={0.4} strokeWidth={2} />
            <Line type="monotone" dataKey="cumDry" name="Cumulative dry biochar — est. (kg)"
              stroke={C.blue} strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      <SectionTitle>Feedstock Quality Distribution</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fcData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v: unknown) => `${(v as number).toFixed(0)}%`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, "% of batches"]} />
              <Bar dataKey="pct" radius={[3, 3, 0, 0]}
                label={{ position: "top", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)}%` }}>
                {fcData.map((e, i) => <Cell key={i} fill={FEED_COLORS[e.name as FeedstockAppearance] ?? "#ccc"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <table className="w-full text-sm">
            <thead><tr style={{ color: C.subtext }}><th className="text-left py-1">Feedstock condition</th><th className="text-right py-1">% of batches</th></tr></thead>
            <tbody>{fcData.map(r => (
              <tr key={r.name} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1">{r.name}</td><td className="text-right">{r.pct.toFixed(1)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>

      <SectionTitle>Batch-Level Production Volume</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>Feedstock weight and yield ratio are null until scales are deployed.</p>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 700 }}>
            <thead><tr style={{ color: C.subtext }} className="border-b">
              {["Batch","Date","Kiln","Operator","Feedstock","Feed vol (m³)","Feed wt (kg)","Wet (kg)","Dry est. (kg)","Yield ratio","tCO₂e"].map(h => (
                <th key={h} className="py-1 pr-2 text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody>{df.map(b => (
              <tr key={b.batch_id} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 pr-2 font-medium">{b.batch_id}</td>
                <td className="py-1 pr-2">{fmtDate(b.production_date)}</td>
                <td className="py-1 pr-2">{b.kiln_id}</td>
                <td className="py-1 pr-2">{b.operator_name}</td>
                <td className="py-1 pr-2">{b.feedstock_appearance}</td>
                <td className="py-1 pr-2">{b.feedstock_volume_m3.toFixed(2)}</td>
                <td className="py-1 pr-2" style={{ color: C.subtext }}>missing</td>
                <td className="py-1 pr-2">{b.biochar_wet_weight_kg.toFixed(1)}</td>
                <td className="py-1 pr-2">{b.dry_kg.toFixed(1)}</td>
                <td className="py-1 pr-2" style={{ color: C.subtext }}>pending</td>
                <td className="py-1" style={{ color: C.subtext }}>pending</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 6 — Batch Records
// ═══════════════════════════════════════════════════════════════════════════
function Tab6({ df }: { df: Batch[] }) {
  return (
    <div className="space-y-4">
      <SectionTitle>All Batch Records</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>All submissions in current filter · most recent first</p>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 900 }}>
            <thead><tr style={{ color: C.subtext }} className="border-b">
              <th className="text-left py-1 pr-2">Batch ID</th>
              <th className="text-left py-1 pr-2">Date</th>
              <th className="text-left py-1 pr-2">Kiln</th>
              <th className="text-left py-1 pr-2">Operator</th>
              <th className="text-left py-1 pr-2">Feedstock</th>
              <th className="text-right py-1 pr-2">Feed (m³)</th>
              <th className="text-right py-1 pr-2">Feed (kg)</th>
              <th className="text-right py-1 pr-2">Duration (min)</th>
              <th className="text-right py-1 pr-2">Biochar (kg)</th>
              <th className="text-left py-1 pr-2">Quality</th>
              <th className="text-center py-1 pr-2">Sample?</th>
              <th className="text-right py-1 pr-2">CSI Fails</th>
              <th className="text-center py-1">CSI ✓</th>
            </tr></thead>
            <tbody>{df.map(b => (
              <tr key={b.batch_id} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 pr-2 font-medium">{b.batch_id}</td>
                <td className="py-1 pr-2">{b.production_date}</td>
                <td className="py-1 pr-2">{b.kiln_id}</td>
                <td className="py-1 pr-2">{b.operator_name}</td>
                <td className="py-1 pr-2">{b.feedstock_appearance}</td>
                <td className="py-1 pr-2 text-right">{b.feedstock_volume_m3.toFixed(2)}</td>
                <td className="py-1 pr-2 text-right" style={{ color: C.subtext }}>—</td>
                <td className="py-1 pr-2 text-right font-medium"
                  style={{ color: b.c_duration_in_range ? C.title : C.red }}>
                  {b.pyrolysis_duration_min}
                </td>
                <td className="py-1 pr-2 text-right">{b.biochar_wet_weight_kg.toFixed(0)}</td>
                <td className="py-1 pr-2" style={{ color: QUALITY_COLORS[b.biochar_visual_quality] }}>{b.biochar_visual_quality}</td>
                <td className="py-1 pr-2 text-center">{b.sample_collected ? "✓" : "✗"}</td>
                <td className="py-1 pr-2 text-right font-bold"
                  style={{ color: b.compliance_fails > 2 ? C.red : C.orange }}>{b.compliance_fails}</td>
                <td className="py-1 text-center">{b.csi_compliant ? "✅" : "✗"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 7 — Data Quality
// ═══════════════════════════════════════════════════════════════════════════
function Tab7({ df }: { df: Batch[] }) {
  const heatFields: [string, (b: Batch) => boolean][] = [
    ["Feedstock weight",  () => false],
    ["Moisture reading",  () => false],
    ["Temp sensor",       b => b.c_temp_data],
    ["Sample collected",  b => b.c_sample_collected],
    ["Photo: feedstock",  b => b.photo_feedstock_pile_ok],
    ["Photo: pyrolysis",  b => b.photo_active_pyrolysis_ok],
    ["Photo: biochar",    b => b.photo_biochar_output_ok],
    ["Photo: sample bag", b => b.photo_sample_bag_ok],
    ["Safety OK",         b => b.c_no_safety_incidents],
    ["Duration in range", b => b.c_duration_in_range],
    ["Quality pass",      b => b.c_quality_acceptable],
    ["Feedstock volume",  b => b.feedstock_volume_m3 > 0],
  ];

  const missingData = (
    [
      ["feedstock_weight_kg" as keyof Batch, "Feedstock weight (kg)"],
      ["feedstock_volume_m3" as keyof Batch, "Feedstock volume (m³)"],
      ["biochar_wet_weight_kg" as keyof Batch, "Biochar wet weight (kg)"],
      ["biochar_volume_l" as keyof Batch, "Biochar volume (L)"],
      ["temp_peak_c" as keyof Batch, "Peak temperature (°C)"],
      ["pyrolysis_duration_min" as keyof Batch, "Pyrolysis duration (min)"],
      ["photo_feedstock_pile" as keyof Batch, "Feedstock photo URL"],
      ["photo_biochar_output" as keyof Batch, "Biochar photo URL"],
      ["photo_sample_bag" as keyof Batch, "Sample bag photo URL"],
    ] as [keyof Batch, string][]
  ).map(([col, label]) => {
    const missing = df.filter(b => b[col] === null || b[col] === undefined).length;
    return { label, missing, pct: df.length ? (missing / df.length) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);

  const verMap: Record<string, number> = {};
  df.forEach(b => { verMap[b.form_version] = (verMap[b.form_version] ?? 0) + 1; });
  const verData = Object.entries(verMap).map(([v, n]) => ({ version: v, count: n }));

  const avgLag = df.length ? df.reduce((s, b) => s + b.submission_lag_days, 0) / df.length : 0;
  const maxLag = df.length ? Math.max(...df.map(b => b.submission_lag_days)) : 0;
  const lagData = [...df].sort((a, b) => a.production_date.localeCompare(b.production_date))
    .map(b => ({ batch: b.batch_id.slice(-3), lag: b.submission_lag_days }));

  return (
    <div className="space-y-4">
      <SectionTitle>Missing Data Heatmap</SectionTitle>
      <p className="text-xs" style={{ color: C.subtext }}>🟢 = present · 🔴 = missing or not captured</p>
      <Panel>
        <div className="overflow-x-auto">
          <table className="text-xs w-full" style={{ minWidth: "max-content" }}>
            <thead><tr>
              <th className="text-left pr-4 py-1 font-semibold" style={{ color: C.subtext, minWidth: 160 }}>Field</th>
              {df.map(b => (
                <th key={b.batch_id} className="text-center px-1 py-1 font-normal"
                  style={{ color: C.subtext, minWidth: 30, fontSize: 10 }}>
                  {b.batch_id.slice(-3)}
                </th>
              ))}
            </tr></thead>
            <tbody>{heatFields.map(([name, fn]) => (
              <tr key={name} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="pr-4 py-1 font-medium whitespace-nowrap">{name}</td>
                {df.map(b => {
                  const ok = fn(b);
                  return (
                    <td key={b.batch_id} className="text-center px-1 py-0.5 text-xs"
                      style={{ background: ok ? C.lightGreen : C.lightRed, color: ok ? "#166534" : "#991b1b" }}>
                      {ok ? "✓" : "✗"}
                    </td>
                  );
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      <SectionTitle>Missing Data by Field</SectionTitle>
      <Panel>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={missingData} layout="vertical" margin={{ top: 4, right: 64, left: 8, bottom: 4 }}>
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v: unknown) => `${v as number}%`} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={200} />
            <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)}%`, "Missing"]} />
            <Bar dataKey="pct" radius={[0, 3, 3, 0]}
              label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)}%` }}>
              {missingData.map((e, i) => (
                <Cell key={i} fill={e.pct >= 80 ? C.red : e.pct >= 40 ? C.orange : C.green} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionTitle>Known Systematic Data Gaps</SectionTitle>
      <Panel>
        <ul className="text-sm space-y-3">
          <li><strong>Feedstock weight (kg)</strong> — requires hanging scales at each kiln site. Currently volume estimate only. Needed for yield ratio and CSI mass accounting.</li>
          <li><strong>Feedstock moisture (%)</strong> — requires handheld digital moisture meters. Currently qualitative dryness category only. <em>CSI Artisan Pro requires quantitative readings for producers &gt;100 m³/year.</em></li>
          <li><strong>Pyrolysis temperature</strong> — requires thermocouple data loggers. Not required by CSI Artisan Pro but valuable for premium-tier certification (Puro, Verra, Isometric). Fields already in the form — ready when sensors arrive.</li>
        </ul>
      </Panel>

      <SectionTitle>Form Version Compliance</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <table className="w-full text-sm">
            <thead><tr style={{ color: C.subtext }}><th className="text-left py-1">Form Version</th><th className="text-right py-1">Batch Count</th></tr></thead>
            <tbody>{verData.map(r => (
              <tr key={r.version} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1">{r.version}</td><td className="text-right">{r.count}</td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
        <Panel>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={verData} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
              <XAxis dataKey="version" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill={C.blue} radius={[3, 3, 0, 0]}
                label={{ position: "top", fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <SectionTitle>Submission Lag</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <MetricCard label="Average lag" value={`${avgLag.toFixed(1)} days`} />
        <MetricCard label="Maximum lag" value={`${maxLag} days`} />
      </div>
      <p className="text-xs mb-2" style={{ color: C.subtext }}>
        Long lags suggest data reconstructed from memory rather than recorded in real time.
      </p>
      <Panel>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={lagData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <XAxis dataKey="batch" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: unknown) => [`${v as number} days`, "Lag"]} />
            <ReferenceLine y={1} stroke={C.orange} strokeDasharray="4 2"
              label={{ value: "Same-day target", position: "insideTopRight", fill: C.orange, fontSize: 10 }} />
            <Bar dataKey="lag" fill={C.blue} radius={[3, 3, 0, 0]}
              label={{ position: "top", fontSize: 9, formatter: (v: unknown) => `${v as number}d` }} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionTitle>Photo Completeness per Batch</SectionTitle>
      <p className="text-xs mb-2" style={{ color: C.subtext }}>
        CSI required: feedstock pile · biochar output · sample bag. Operational: + active pyrolysis.
      </p>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: C.subtext }} className="border-b">
              <th className="text-left py-1 pr-2">Batch</th>
              <th className="text-left py-1 pr-2">Date</th>
              <th className="text-left py-1 pr-2">Kiln</th>
              <th className="text-center py-1 pr-2">Feedstock</th>
              <th className="text-center py-1 pr-2">Pyrolysis</th>
              <th className="text-center py-1 pr-2">Biochar</th>
              <th className="text-center py-1 pr-2">Sample Bag</th>
              <th className="text-center py-1 pr-2">All (/ 4)</th>
              <th className="text-center py-1">CSI (/ 3)</th>
            </tr></thead>
            <tbody>{df.map(b => (
              <tr key={b.batch_id} className="border-t" style={{ borderColor: C.metricBorder }}>
                <td className="py-1 pr-2 font-medium">{b.batch_id}</td>
                <td className="py-1 pr-2">{fmtDate(b.production_date)}</td>
                <td className="py-1 pr-2">{b.kiln_id}</td>
                <td className="py-1 pr-2 text-center">{b.photo_feedstock_pile_ok ? "✅" : "❌"}</td>
                <td className="py-1 pr-2 text-center">{b.photo_active_pyrolysis_ok ? "✅" : "❌"}</td>
                <td className="py-1 pr-2 text-center">{b.photo_biochar_output_ok ? "✅" : "❌"}</td>
                <td className="py-1 pr-2 text-center">{b.photo_sample_bag_ok ? "✅" : "❌"}</td>
                <td className="py-1 pr-2 text-center">{b.photos_captured} / 4</td>
                <td className="py-1 text-center"
                  style={{ color: b.csi_photos_captured >= 3 ? C.green : C.red }}>
                  {b.csi_photos_captured} / 3
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
