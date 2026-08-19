import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ComposedChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  ResponsiveContainer,
} from "recharts";
import type { Batch } from "../data";
import { PYRO_MIN, PYRO_MAX, COMPLIANCE_WINDOW_DAYS } from "../data";
import { daysAgo } from "../compute";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { qualityLabel } from "@/lib/i18n/enumLabels";

const C = {
  brand: "#c2410c", border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", successBg: "#f0fdf4", danger: "#b91c1c", dangerBg: "#fef2f2",
  warning: "#b45309",
};

const COMPLIANCE_DEFS: [keyof Batch, string, boolean][] = [
  ["c_feedstock_weight",   "tabQuality.req.feedstockWeight",    true],
  ["c_feedstock_moisture", "tabQuality.req.feedstockMoisture",  true],
  ["c_biochar_weight",     "tabQuality.req.biocharWeight",      true],
  ["c_visual_quality",     "tabQuality.req.visualQuality",      true],
  ["c_sample_collected",   "tabQuality.req.sampleCollected",    true],
  ["c_no_safety_incidents","tabQuality.req.noSafetyIncidents",  true],
  ["c_duration_in_range",  "tabQuality.req.durationInRange",    true],
  ["c_operator_certified", "tabQuality.req.operatorCertified",  true],
  ["c_photo_feedstock",    "tabQuality.req.photoFeedstock",     true],
  ["c_photo_biochar",      "tabQuality.req.photoBiochar",       true],
  ["c_photo_sample_bag",   "tabQuality.req.photoSampleBag",     true],
  ["c_temp_data",          "tabQuality.req.tempData",           false],
];

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

export default function TabQuality({ df }: { df: Batch[] }) {
  const { t } = useLanguage();
  const recent = df.slice(0, 12);

  const compRate = COMPLIANCE_DEFS.map(([col, labelKey, csi]) => {
    const label = t(labelKey);
    return {
      label: label.length > 36 ? label.slice(0, 36) + "…" : label,
      fullLabel: label,
      pct: df.length ? (df.filter(b => b[col] as unknown as boolean).length / df.length) * 100 : 0,
      csi,
    };
  }).sort((a, b) => a.pct - b.pct);

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
  const qData = Object.entries(qMap).map(([k, v]) => ({ key: k, name: qualityLabel(t, k), value: v }));
  const qColors: Record<string, string> = { excellent: C.success, good: "#65a30d", fair: C.warning, poor: C.danger };

  const scatterData = df.map(b => ({ x: b.pyrolysis_duration_min, y: b.quality_score, id: b.batch_id }));

  const devBatches = df.filter(b =>
    b.production_date >= daysAgo(COMPLIANCE_WINDOW_DAYS) &&
    (!b.c_duration_in_range || !b.c_quality_acceptable || b.compliance_fails > 0)
  );

  return (
    <div className="space-y-4">
      <Panel>
        <SectionLabel>{t("tabQuality.heatmap", { n: recent.length })}</SectionLabel>
        <p className="text-xs mb-3" style={{ color: C.muted }}>{t("tabQuality.heatmap.desc")}</p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead><tr>
              <th className="text-left pr-4 py-1 font-medium" style={{ color: C.muted, minWidth: 240 }}>{t("tabQuality.col.requirement")}</th>
              {recent.map(b => (
                <th key={b.batch_id} className="text-center px-0.5 py-1 font-normal"
                  style={{ color: C.muted, minWidth: 28, fontSize: 10 }}>
                  {b.batch_id.slice(-3)}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {COMPLIANCE_DEFS.map(([col, labelKey, csi]) => (
                <tr key={col} className="border-t" style={{ borderColor: C.border }}>
                  <td className="pr-4 py-1 whitespace-nowrap" style={{ color: csi ? C.text : C.muted }}>
                    {!csi && <span style={{ color: "#a8a29e" }}>[p] </span>}{t(labelKey)}
                  </td>
                  {recent.map(b => {
                    const pass = b[col] as unknown as boolean;
                    return (
                      <td key={b.batch_id} className="text-center px-0.5 py-0.5"
                        style={{ background: pass ? C.successBg : C.dangerBg, color: pass ? "#166534" : "#991b1b" }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <SectionLabel>{t("tabQuality.complianceByRequirement")}</SectionLabel>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compRate} layout="vertical" margin={{ top: 0, right: 52, left: 8, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 9 }} width={160} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)}%`]} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {compRate.map((r, i) => <Cell key={i} fill={r.pct >= 80 ? C.success : r.pct >= 50 ? C.warning : C.danger} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionLabel>{t("tabQuality.complianceByMonth")}</SectionLabel>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="compliant" stackId="a" fill={C.success} name={t("tabQuality.legend.compliant")} radius={[0, 0, 0, 0]} />
              <Bar dataKey="non_compliant" stackId="a" fill={C.danger} name={t("tabQuality.legend.nonCompliant")} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <SectionLabel>{t("tabQuality.qualityTrend")}</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={trendData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="q" domain={[0, 4]} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="d" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area yAxisId="q" type="monotone" dataKey="avgQuality" fill={C.brand} fillOpacity={0.1} stroke={C.brand} name={t("tabQuality.legend.avgQuality")} />
              <Line yAxisId="d" type="monotone" dataKey="avgDuration" stroke={C.warning} dot={false} name={t("tabQuality.legend.avgDuration")} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionLabel>{t("tabQuality.qualityDistribution")}</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={qData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={70} innerRadius={30}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {qData.map((e, i) => <Cell key={i} fill={qColors[e.key] ?? "#a8a29e"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <SectionLabel>{t("tabQuality.scatter")}</SectionLabel>
        <ResponsiveContainer width="100%" height={180}>
          <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis type="number" dataKey="x" name={t("tabQuality.scatter.duration")} tick={{ fontSize: 10 }}
              label={{ value: t("tabQuality.scatter.duration"), position: "insideBottom", offset: -2, fontSize: 10 }} />
            <YAxis type="number" dataKey="y" name={t("tabQuality.scatter.quality")} domain={[0, 5]} tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [v, n === "x" ? t("tabQuality.scatter.duration") : t("tabQuality.scatter.quality")]} />
            <Scatter data={scatterData} fill={C.brand} fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>

      {devBatches.length > 0 && (
        <Panel>
          <SectionLabel>{t("tabQuality.deviations", { n: COMPLIANCE_WINDOW_DAYS })}</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: C.muted }}>
                {[
                  t("tabQuality.col.batch"), t("tabQuality.col.date"), t("tabQuality.col.kiln"),
                  t("tabQuality.col.operator"), t("tabQuality.col.csiFails"), t("tabQuality.col.duration"),
                  t("tabQuality.col.quality"),
                ].map(h => (
                  <th key={h} className="text-left py-1 pr-3 font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {devBatches.slice(0, 20).map(b => (
                  <tr key={b.batch_id} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-1.5 pr-3 font-medium">{b.batch_id}</td>
                    <td className="py-1.5 pr-3">{b.production_date}</td>
                    <td className="py-1.5 pr-3">{b.kiln_id}</td>
                    <td className="py-1.5 pr-3">{b.operator_name}</td>
                    <td className="py-1.5 pr-3" style={{ color: b.compliance_fails > 0 ? C.danger : C.success }}>{b.compliance_fails}</td>
                    <td className="py-1.5 pr-3" style={{ color: b.c_duration_in_range ? C.success : C.danger }}>
                      {b.pyrolysis_duration_min} min
                    </td>
                    <td className="py-1.5" style={{ color: b.c_quality_acceptable ? C.success : C.danger }}>
                      {qualityLabel(t, b.biochar_visual_quality)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
