import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Area, Line } from "recharts";
import type { Batch } from "../data";
import { MOISTURE_ESTIMATE, SUBMISSION_LAG_SLA_DAYS } from "../data";
import type { DashboardKpis } from "../compute";
import { daysAgo } from "../compute";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { qualityLabel } from "@/lib/i18n/enumLabels";

const C = {
  brand: "#c2410c", border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
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

function csvEscape(v: unknown) {
  const t = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
}

function download(filename: string, mime: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

interface Props {
  df: Batch[];
  kpis: DashboardKpis;
  dateFrom: string;
  dateTo: string;
}

export default function TabRecords({ df, kpis, dateFrom, dateTo }: Props) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = search
    ? df.filter(b =>
        b.batch_id.toLowerCase().includes(search.toLowerCase()) ||
        b.kiln_id.toLowerCase().includes(search.toLowerCase()) ||
        b.operator_name.toLowerCase().includes(search.toLowerCase())
      )
    : df;

  // Carbon KPIs — dry_kg for regain rows is a bucket-count guess, not
  // wet-derived, so it's excluded here to keep dry from exceeding wet.
  const totalWet = df.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const totalDry = df.filter(b => b.data_source !== "regain_kiln_operator")
    .reduce((s, b) => s + b.dry_kg, 0);

  // Cumulative chart
  const cumData: { date: string; wet: number; dry: number }[] = [];
  let cumWet = 0, cumDry = 0;
  [...df].sort((a, b) => a.production_date.localeCompare(b.production_date)).forEach(b => {
    cumWet += b.biochar_wet_weight_kg;
    if (b.data_source !== "regain_kiln_operator") cumDry += b.dry_kg;
    cumData.push({ date: b.production_date.slice(5), wet: +cumWet.toFixed(1), dry: +cumDry.toFixed(1) });
  });

  // Missing data
  const FIELDS: [keyof Batch, string][] = [
    ["feedstock_weight_kg", t("tabRecords.field.feedstockWeight")],
    ["feedstock_volume_m3", t("tabRecords.field.feedstockVolume")],
    ["biochar_wet_weight_kg", t("tabRecords.field.biocharWeight")],
    ["temp_peak_c", t("tabRecords.field.peakTemp")],
    ["photo_feedstock_pile", t("tabRecords.field.feedstockPhoto")],
    ["photo_biochar_output", t("tabRecords.field.outputPhoto")],
    ["photo_sample_bag", t("tabRecords.field.sampleBagPhoto")],
  ];
  const missingData = FIELDS.map(([field, label]) => ({
    label,
    missing: df.filter(b => !b[field]).length,
    pct: df.length ? (df.filter(b => !b[field]).length / df.length) * 100 : 0,
  })).filter(r => r.missing > 0);

  // Submission lag
  const lags = df.map(b => b.submission_lag_days).filter(n => Number.isFinite(n));
  const avgLag = lags.length ? lags.reduce((s, n) => s + n, 0) / lags.length : 0;
  const maxLag = lags.length ? Math.max(...lags) : 0;
  const lateBatches = lags.filter(n => n > SUBMISSION_LAG_SLA_DAYS).length;

  function exportCsv() {
    const fields: (keyof Batch)[] = [
      "data_source", "batch_id", "production_date", "kiln_id", "operator_name",
      "feedstock_appearance", "feedstock_volume_m3", "feedstock_weight_kg",
      "pyrolysis_duration_min", "biochar_wet_weight_kg", "dry_kg",
      "biochar_visual_quality", "sample_collected", "compliance_fails",
      "csi_compliant", "submission_lag_days",
    ];
    download(`biochar-records-${dateFrom}-${dateTo}.csv`, "text/csv",
      [fields.join(","), ...df.map(b => fields.map(f => csvEscape(b[f])).join(","))].join("\n"));
  }

  function exportReport() {
    const rows = [
      [t("tabRecords.report.totalBatches"), kpis.totalBatches], [t("tabRecords.report.thisMonth"), kpis.monthBatches],
      [t("tabRecords.report.biocharProducedWet"), `${kpis.totalBiochar.toFixed(1)} kg`],
      [t("tabRecords.dryBiochar"), `${kpis.dryBiochar.toFixed(1)} kg`],
      [t("biochar.kpi.activeKilns"), `${kpis.activeKilns} / ${kpis.totalKilns}`],
      [t("biochar.kpi.qualityPassRate"), `${kpis.qualPassRate.toFixed(1)}%`],
      [t("biochar.kpi.csiCompliance"), `${kpis.csiCompliant} / ${kpis.totalBatches}`],
      [t("biochar.kpi.safetyIncidents"), kpis.safetyInc],
    ];
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${t("tabRecords.report.title")}</title>
<style>body{font-family:Arial,sans-serif;color:#1c1917;margin:32px}table{border-collapse:collapse;width:100%;margin:12px 0}
td,th{border:1px solid #e7e5e4;padding:8px;text-align:left}th{background:#9a3412;color:white}.muted{color:#78716c}</style></head>
<body><h1>${t("tabRecords.report.title")}</h1><p class="muted">${t("common.footerBrand")}</p>
<p>${t("biochar.period")}: ${dateFrom} – ${dateTo}</p>
<h2>${t("tabRecords.report.summary")}</h2><table><tbody>${rows.map(([l, v]) => `<tr><th>${l}</th><td>${v}</td></tr>`).join("")}</tbody></table>
<h2>${t("tabRecords.report.batchRecords")}</h2><table><thead><tr><th>${t("tabRecords.col.type")}</th><th>${t("tabRecords.col.batch")}</th><th>${t("tabRecords.col.date")}</th><th>${t("tabRecords.col.kiln")}</th><th>${t("tabRecords.col.operator")}</th><th>${t("tabRecords.col.wetKg")}</th><th>${t("tabRecords.col.quality")}</th><th>${t("tabRecords.col.csiFails")}</th></tr></thead>
<tbody>${df.map(b => `<tr><td>${b.data_source === "regain_kiln_operator" ? t("tabRecords.type.simplified") : t("tabRecords.type.full")}</td><td>${b.batch_id}</td><td>${b.production_date}</td><td>${b.kiln_id}</td><td>${b.operator_name}</td><td>${b.biochar_wet_weight_kg.toFixed(1)}</td><td>${qualityLabel(t, b.biochar_visual_quality)}</td><td>${b.compliance_fails}</td></tr>`).join("")}</tbody></table>
<p class="muted">${t("tabRecords.report.dryNote", { pct: (MOISTURE_ESTIMATE * 100).toFixed(0) })}</p>
</body></html>`;
    download(`biochar-report-${dateFrom}.html`, "text/html", html);
  }

  return (
    <div className="space-y-4">
      {/* Carbon summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("tabRecords.wetBiochar"), value: `${totalWet.toFixed(0)} kg`, sub: t("tabRecords.wetBiochar.sub") },
          { label: t("tabRecords.dryBiochar"), value: `${totalDry.toFixed(0)} kg`, sub: t("tabRecords.dryBiochar.sub", { pct: (MOISTURE_ESTIMATE * 100).toFixed(0) }) },
          { label: t("tabRecords.co2e"), value: t("tabRecords.pending"), sub: t("tabRecords.co2e.sub") },
          { label: t("tabRecords.samplesCollected"), value: `${kpis.samplesCol}/${kpis.totalBatches}`, sub: t("tabRecords.samplesCollected.sub") },
        ].map(item => (
          <div key={item.label} className="bg-white border rounded-xl p-3" style={{ borderColor: C.border }}>
            <p className="text-xs font-medium" style={{ color: C.muted }}>{item.label}</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: C.text }}>{item.value}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>{item.sub}</p>
          </div>
        ))}
      </div>

      <Panel>
        <SectionLabel>{t("tabRecords.cumulativeOutput")}</SectionLabel>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={cumData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={v => `${v} kg`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: unknown) => [`${v} kg`]} />
            <Area type="monotone" dataKey="wet" fill={C.brand} fillOpacity={0.1} stroke={C.brand} name={t("tabRecords.legend.wetKg")} />
            <Line type="monotone" dataKey="dry" stroke={C.warning} dot={false} name={t("tabRecords.legend.dryKgEst")} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      {/* Submission lag */}
      {lags.length > 0 && (
        <Panel>
          <SectionLabel>{t("tabRecords.submissionLag")}</SectionLabel>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: t("tabRecords.lag.average"), value: `${avgLag.toFixed(1)}d` },
              { label: t("tabRecords.lag.maximum"), value: `${maxLag}d` },
              { label: t("tabRecords.lag.late", { n: SUBMISSION_LAG_SLA_DAYS }), value: String(lateBatches), flag: lateBatches > 0 },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs" style={{ color: C.muted }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: item.flag ? C.danger : C.text }}>{item.value}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={df.slice().sort((a, b) => a.production_date.localeCompare(b.production_date)).map(b => ({ batch: b.batch_id.slice(-3), lag: b.submission_lag_days }))}>
              <XAxis dataKey="batch" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => [`${v}d`, t("tabRecords.lag.tooltip")]} />
              <Bar dataKey="lag" radius={[2, 2, 0, 0]}>
                {df.map((b, i) => <Cell key={i} fill={b.submission_lag_days > SUBMISSION_LAG_SLA_DAYS ? C.danger : C.brand} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {/* Missing data */}
      {missingData.length > 0 && (
        <Panel>
          <SectionLabel>{t("tabRecords.completenessGaps")}</SectionLabel>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={missingData} layout="vertical" margin={{ top: 0, right: 52, left: 8, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)}%`, t("tabRecords.missing")]} />
              <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
                {missingData.map((r, i) => <Cell key={i} fill={r.pct > 80 ? C.danger : r.pct > 40 ? C.warning : C.brand} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {/* Batch records table */}
      <Panel>
        <div className="flex items-center justify-between mb-3">
          <div>
            <SectionLabel>{t("tabRecords.batchRecords", { n: filtered.length })}</SectionLabel>
            {df.some(b => b.data_source) && (
              <p className="text-xs -mt-2" style={{ color: C.muted }}>
                {t("tabRecords.recordsSummary", {
                  full: df.filter(b => b.data_source !== "regain_kiln_operator").length,
                  simplified: df.filter(b => b.data_source === "regain_kiln_operator").length,
                  total: df.length,
                })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50"
              style={{ borderColor: C.border, color: C.text }}>
              {t("tabRecords.exportCsv")}
            </button>
            <button onClick={exportReport}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: C.brand }}>
              {t("tabRecords.exportReport")}
            </button>
          </div>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("tabRecords.searchPlaceholder")}
          className="w-full rounded-lg border px-3 py-2 text-sm mb-3 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30"
          style={{ borderColor: C.border }}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b" style={{ borderColor: C.border, color: C.muted }}>
              {[
                t("tabRecords.col.type"), t("tabRecords.col.batch"), t("tabRecords.col.date"), t("tabRecords.col.kiln"),
                t("tabRecords.col.operator"), t("tabRecords.col.wetKg"), t("tabRecords.col.dryKg"), t("tabRecords.col.quality"),
                t("tabRecords.col.csiFails"), t("tabRecords.col.sample"), t("tabRecords.col.lag"),
              ].map((h, i) => (
                <th key={h} className={`py-1.5 pr-3 font-medium ${[5, 6, 8, 10].includes(i) ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.slice(0, 100).map(b => (
                <tr key={`${b.data_source ?? "biochar_batch"}-${b.batch_id}`} className="border-t hover:bg-stone-50 transition-colors" style={{ borderColor: C.border }}>
                  <td className="py-1.5 pr-3" style={{ color: C.muted }}>
                    {b.data_source === "regain_kiln_operator" ? t("tabRecords.type.simplified") : t("tabRecords.type.full")}
                  </td>
                  <td className="py-1.5 pr-3 font-medium">{b.batch_id}</td>
                  <td className="py-1.5 pr-3">{b.production_date}</td>
                  <td className="py-1.5 pr-3">{b.kiln_id}</td>
                  <td className="py-1.5 pr-3">{b.operator_name}</td>
                  <td className="py-1.5 pr-3 text-right">{b.biochar_wet_weight_kg.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 text-right">{b.dry_kg.toFixed(1)}</td>
                  <td className="py-1.5 pr-3" style={{ color: b.c_quality_acceptable ? C.success : C.danger }}>{qualityLabel(t, b.biochar_visual_quality)}</td>
                  <td className="py-1.5 pr-3 text-right" style={{ color: b.compliance_fails > 0 ? C.danger : C.muted }}>{b.compliance_fails}</td>
                  <td className="py-1.5 pr-3" style={{ color: b.c_sample_collected ? C.success : C.muted }}>{b.c_sample_collected ? "✓" : "—"}</td>
                  <td className="py-1.5 text-right" style={{ color: b.submission_lag_days > SUBMISSION_LAG_SLA_DAYS ? C.danger : C.muted }}>{b.submission_lag_days}d</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="text-xs text-center mt-2" style={{ color: C.muted }}>{t("tabRecords.showingOf", { n: filtered.length })}</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
