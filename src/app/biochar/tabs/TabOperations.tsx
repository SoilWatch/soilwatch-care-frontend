import { useState } from "react";
import type { Batch } from "../data";
import { ACTIVE_WINDOW_DAYS, SUBMISSION_LAG_SLA_DAYS } from "../data";
import { daysBetween, daysAgo } from "../compute";

const C = {
  brand: "#c2410c", border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", successBg: "#f0fdf4", danger: "#b91c1c", dangerBg: "#fef2f2",
  warning: "#b45309", warningBg: "#fffbeb",
};

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${className}`} style={{ borderColor: C.border }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>{children}</p>;
}

interface Alert {
  type: "danger" | "warning";
  site: string;
  message: string;
}

function buildAlerts(df: Batch[], drillFilter: string | null): Alert[] {
  const alerts: Alert[] = [];
  const recent = df.filter(b => b.production_date >= daysAgo(30));

  recent.forEach(b => {
    if (b.safety_incidents.toLowerCase() !== "none") {
      alerts.push({ type: "danger", site: b.kiln_id, message: `Batch ${b.batch_id}: ${b.safety_incidents}` });
    }
    if (b.compliance_fails > 0) {
      alerts.push({ type: "danger", site: b.kiln_id, message: `Batch ${b.batch_id}: ${b.compliance_fails} CSI requirement(s) failed` });
    }
    if (!b.c_duration_in_range) {
      alerts.push({ type: "warning", site: b.kiln_id, message: `Batch ${b.batch_id}: pyrolysis ${b.pyrolysis_duration_min} min out of range` });
    }
    if (b.submission_lag_days > SUBMISSION_LAG_SLA_DAYS) {
      alerts.push({ type: "warning", site: b.kiln_id, message: `Batch ${b.batch_id}: submitted ${b.submission_lag_days}d after production (SLA: ${SUBMISSION_LAG_SLA_DAYS}d)` });
    }
  });

  const byKiln = new Map<string, Batch[]>();
  df.forEach(b => byKiln.set(b.kiln_id, [...(byKiln.get(b.kiln_id) ?? []), b]));
  byKiln.forEach((batches, kilnId) => {
    const sorted = [...batches].sort((a, b) => b.production_date.localeCompare(a.production_date));
    const idle = daysBetween(sorted[0].production_date);
    if (idle > ACTIVE_WINDOW_DAYS) {
      alerts.push({ type: "warning", site: kilnId, message: `Idle for ${idle} days, last batch ${sorted[0].production_date}` });
    }
  });

  if (drillFilter === "idle_kilns") return alerts.filter(a => a.message.startsWith("Idle"));
  if (drillFilter === "safety_incidents") return alerts.filter(a => a.type === "danger" && a.message.toLowerCase().includes("batch"));
  return alerts;
}

export default function TabOperations({
  df, drillFilter, onClearDrill,
}: { df: Batch[]; drillFilter: string | null; onClearDrill: () => void }) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const alerts = buildAlerts(df, drillFilter);

  const byKiln = new Map<string, Batch[]>();
  df.forEach(b => byKiln.set(b.kiln_id, [...(byKiln.get(b.kiln_id) ?? []), b]));
  const kilnIdle = Array.from(byKiln.entries()).map(([kiln, batches]) => {
    const sorted = [...batches].sort((a, b) => b.production_date.localeCompare(a.production_date));
    return { kiln, lastDate: sorted[0].production_date, daysIdle: daysBetween(sorted[0].production_date), batches: batches.length };
  }).sort((a, b) => b.daysIdle - a.daysIdle);

  const byOp = new Map<string, Batch[]>();
  df.forEach(b => byOp.set(b.operator_name, [...(byOp.get(b.operator_name) ?? []), b]));
  const opIdle = Array.from(byOp.entries()).map(([op, batches]) => {
    const sorted = [...batches].sort((a, b) => b.production_date.localeCompare(a.production_date));
    return { op, lastDate: sorted[0].production_date, daysIdle: daysBetween(sorted[0].production_date), batches: batches.length };
  }).sort((a, b) => b.daysIdle - a.daysIdle);

  const notes = df.filter(b =>
    !["", "none", "n/a", "nan"].includes(b.operational_issues.trim().toLowerCase()) ||
    b.batch_notes.trim()
  );

  const photos = df.filter(b =>
    b.photo_feedstock_pile || b.photo_active_pyrolysis || b.photo_biochar_output || b.photo_sample_bag
  ).slice(0, 20);

  return (
    <div className="space-y-4">
      {drillFilter && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: C.warningBg, border: `1px solid ${C.warning}`, color: C.warning }}>
          Showing: {drillFilter.replace("_", " ")}
          <button onClick={onClearDrill} className="ml-auto underline">Clear filter</button>
        </div>
      )}

      <Panel>
        <SectionLabel>Active alerts in last 30 days ({alerts.length})</SectionLabel>
        {alerts.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>No alerts in the current period.</p>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: a.type === "danger" ? C.dangerBg : C.warningBg, borderLeft: `3px solid ${a.type === "danger" ? C.danger : C.warning}` }}>
                <span className="font-semibold flex-shrink-0" style={{ color: a.type === "danger" ? C.danger : C.warning }}>{a.site}</span>
                <span style={{ color: C.text }}>{a.message}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <SectionLabel>Days since last production by kiln</SectionLabel>
          <table className="w-full text-xs">
            <thead><tr style={{ color: C.muted }}>
              <th className="text-left py-1">Kiln</th>
              <th className="text-right py-1">Batches</th>
              <th className="text-right py-1">Last batch</th>
              <th className="text-right py-1">Days idle</th>
            </tr></thead>
            <tbody>{kilnIdle.map(r => (
              <tr key={r.kiln} className="border-t" style={{ borderColor: C.border }}>
                <td className="py-1.5 font-medium">{r.kiln}</td>
                <td className="text-right">{r.batches}</td>
                <td className="text-right">{r.lastDate}</td>
                <td className="text-right font-semibold"
                  style={{ color: r.daysIdle > ACTIVE_WINDOW_DAYS ? C.danger : r.daysIdle > 7 ? C.warning : C.success }}>
                  {r.daysIdle}d
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>

        <Panel>
          <SectionLabel>Days since last production by operator</SectionLabel>
          <table className="w-full text-xs">
            <thead><tr style={{ color: C.muted }}>
              <th className="text-left py-1">Operator</th>
              <th className="text-right py-1">Batches</th>
              <th className="text-right py-1">Last batch</th>
              <th className="text-right py-1">Days idle</th>
            </tr></thead>
            <tbody>{opIdle.map(r => (
              <tr key={r.op} className="border-t" style={{ borderColor: C.border }}>
                <td className="py-1.5 font-medium">{r.op}</td>
                <td className="text-right">{r.batches}</td>
                <td className="text-right">{r.lastDate}</td>
                <td className="text-right font-semibold"
                  style={{ color: r.daysIdle > ACTIVE_WINDOW_DAYS ? C.danger : r.daysIdle > 7 ? C.warning : C.success }}>
                  {r.daysIdle}d
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>

      {notes.length > 0 && (
        <Panel>
          <SectionLabel>Operational notes ({notes.length})</SectionLabel>
          <div className="space-y-1">
            {notes.map(b => (
              <div key={b.batch_id}>
                <button
                  className="w-full text-left flex items-center justify-between py-2 text-sm transition-colors hover:bg-stone-50 rounded px-2"
                  onClick={() => setExpandedNote(expandedNote === b.batch_id ? null : b.batch_id)}
                >
                  <span className="font-medium" style={{ color: C.text }}>{b.batch_id}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{b.production_date} · {b.kiln_id} · {expandedNote === b.batch_id ? "▲" : "▼"}</span>
                </button>
                {expandedNote === b.batch_id && (
                  <div className="px-2 pb-2 text-xs rounded-b" style={{ color: C.muted, background: "#fafaf8" }}>
                    {b.operational_issues || b.batch_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {photos.length > 0 && (
        <Panel>
          <SectionLabel>Photo log</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.flatMap(b =>
              ([
                [b.photo_feedstock_pile, "Feedstock"],
                [b.photo_active_pyrolysis, "Pyrolysis"],
                [b.photo_biochar_output, "Output"],
                [b.photo_sample_bag, "Sample"],
              ] as [string | null, string][]).filter(([url]) => url).map(([url, label]) => (
                <div key={`${b.batch_id}-${label}`} className="rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
                  <a href={url!} target="_blank" rel="noopener noreferrer">
                    <div className="h-24 bg-stone-100 flex items-center justify-center text-xs" style={{ color: C.muted }}>
                      {label}
                    </div>
                  </a>
                  <div className="px-2 py-1 text-[10px]" style={{ color: C.muted }}>
                    {b.batch_id.slice(-5)} · {label}
                  </div>
                </div>
              ))
            ).slice(0, 16)}
          </div>
        </Panel>
      )}
    </div>
  );
}
