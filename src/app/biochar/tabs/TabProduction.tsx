import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, ReferenceArea,
  PieChart, Pie,
} from "recharts";
import type { Batch, FeedstockAppearance } from "../data";
import { PYRO_MIN, PYRO_MAX } from "../data";
import type { SiteTrend, OperatorScore } from "../compute";
import { daysBetween } from "../compute";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { feedstockLabel, smokeLabel } from "@/lib/i18n/enumLabels";

const TREND_KEYS: Record<string, string> = {
  Improving: "biochar.trend.improving",
  Stable: "biochar.trend.stable",
  Declining: "biochar.trend.declining",
};

const C = {
  brand: "#c2410c", brandDark: "#9a3412", brandLight: "#fff7ed",
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
};
const SERIES = ["#c2410c","#b45309","#15803d","#1d4ed8","#7c3aed","#0e7490","#be185d","#374151"];
const FEED_COLOR: Record<FeedstockAppearance, string> = {
  dry: "#15803d", mostly_dry: "#65a30d", partially_wet: "#b45309", wet: "#b91c1c",
};
const SMOKE_COLOR: Record<string, string> = {
  none: "#15803d", minimal: "#65a30d", moderate: "#b45309", heavy: "#b91c1c", very_heavy: "#7f1d1d",
};

function seriesColor(id: string) {
  const n = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return SERIES[n % SERIES.length];
}

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

interface Props {
  df: Batch[];
  siteTrends: SiteTrend[];
  operatorScores: OperatorScore[];
}

export default function TabProduction({ df, siteTrends, operatorScores }: Props) {
  const { t } = useLanguage();
  const kilnIds = [...new Set(df.map(b => b.kiln_id))].sort();

  // Daily timeline
  const dailyMap: Record<string, Record<string, number>> = {};
  df.forEach(b => {
    if (!dailyMap[b.production_date]) dailyMap[b.production_date] = {};
    dailyMap[b.production_date][b.kiln_id] = (dailyMap[b.production_date][b.kiln_id] ?? 0) + b.biochar_wet_weight_kg;
  });
  const dailyData = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date: date.slice(5), ...v }));

  // Kiln summary
  const kilnSummary = kilnIds.map(k => {
    const rows = df.filter(b => b.kiln_id === k);
    const last = rows.reduce((m, b) => b.production_date > m ? b.production_date : m, "");
    return { kiln_id: k, batches: rows.length, totalKg: rows.reduce((s, b) => s + b.biochar_wet_weight_kg, 0), days_idle: last ? daysBetween(last) : 999 };
  }).sort((a, b) => a.totalKg - b.totalKg);

  // Operator summary
  const opMap: Record<string, { batches: number; totalKg: number; passCount: number }> = {};
  df.forEach(b => {
    if (!opMap[b.operator_name]) opMap[b.operator_name] = { batches: 0, totalKg: 0, passCount: 0 };
    opMap[b.operator_name].batches++;
    opMap[b.operator_name].totalKg += b.biochar_wet_weight_kg;
    if (b.c_quality_acceptable) opMap[b.operator_name].passCount++;
  });
  const opSummary = Object.entries(opMap).map(([op, v], i) => ({
    operator: op.split(" ")[0], full_name: op, ...v,
    pass_rate: v.batches ? v.passCount / v.batches : 0, color: SERIES[i % SERIES.length],
  })).sort((a, b) => a.totalKg - b.totalKg);

  // Feedstock / smoke / pyrolysis
  const fcMap: Record<string, number> = {};
  df.forEach(b => { fcMap[b.feedstock_appearance] = (fcMap[b.feedstock_appearance] ?? 0) + 1; });
  const fcData = Object.entries(fcMap).map(([k, v]) => ({ key: k, name: feedstockLabel(t, k), value: v }));

  const smMap: Record<string, number> = {};
  df.forEach(b => { smMap[b.smoke_observation] = (smMap[b.smoke_observation] ?? 0) + 1; });
  const smOrder = ["none", "minimal", "moderate", "heavy", "very_heavy"];
  const smData = Object.entries(smMap).sort((a, b) => smOrder.indexOf(a[0]) - smOrder.indexOf(b[0])).map(([k, v]) => ({ key: k, name: smokeLabel(t, k), count: v }));

  const pyroData = [...df].sort((a, b) => a.production_date.localeCompare(b.production_date))
    .map(b => ({ batch: b.batch_id.slice(-3), min: b.pyrolysis_duration_min, kiln: b.kiln_id, inRange: b.c_duration_in_range }));
  const pyroMax = Math.max(Math.max(...pyroData.map(d => d.min)) * 1.1, PYRO_MAX + 40);

  const ragColor = (rag: "Green" | "Amber" | "Red") =>
    rag === "Green" ? C.success : rag === "Amber" ? C.warning : C.danger;

  return (
    <div className="space-y-4">
      <Panel>
        <SectionLabel>{t("tabProduction.outputOverTime")}</SectionLabel>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={v => `${v} kg`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: unknown, n: unknown) => [`${(v as number).toFixed(0)} kg`, n as string]} />
            <Legend />
            {kilnIds.map(k => <Bar key={k} dataKey={k} stackId="a" fill={seriesColor(k)} name={k} radius={[2, 2, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <SectionLabel>{t("tabProduction.byKiln")}</SectionLabel>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={kilnSummary} layout="vertical" margin={{ top: 0, right: 64, left: 32, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="kiln_id" tick={{ fontSize: 11 }} width={36} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)} kg`]} />
              <Bar dataKey="totalKg" radius={[0, 4, 4, 0]}
                label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)} kg` }}>
                {kilnSummary.map((r, i) => <Cell key={i} fill={seriesColor(r.kiln_id)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-xs mt-3 border-t" style={{ borderColor: C.border }}>
            <thead><tr style={{ color: C.muted }}>
              <th className="text-left py-1">{t("tabProduction.col.kiln")}</th>
              <th className="text-right py-1">{t("tabProduction.col.score")}</th>
              <th className="text-left py-1 pl-2">{t("tabProduction.col.trend")}</th>
              <th className="text-right py-1">{t("tabProduction.col.batches")}</th>
              <th className="text-right py-1">kg</th>
              <th className="text-right py-1">{t("tabProduction.col.idle")}</th>
            </tr></thead>
            <tbody>{kilnSummary.map(r => {
              const st = siteTrends.find(st2 => st2.site === r.kiln_id);
              return (
                <tr key={r.kiln_id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-1 font-medium">{r.kiln_id}</td>
                  <td className="text-right font-bold" style={{ color: st ? ragColor(st.rag) : C.muted }}>{st?.score ?? "—"}</td>
                  <td className="py-1 pl-2">{st ? `${st.arrow} ${t(TREND_KEYS[st.trend] ?? st.trend)}` : "—"}</td>
                  <td className="text-right">{r.batches}</td>
                  <td className="text-right">{r.totalKg.toFixed(0)}</td>
                  <td className="text-right">{r.days_idle}d</td>
                </tr>
              );
            })}</tbody>
          </table>
        </Panel>

        <Panel>
          <SectionLabel>{t("tabProduction.byOperator")}</SectionLabel>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={opSummary} layout="vertical" margin={{ top: 0, right: 64, left: 8, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="operator" tick={{ fontSize: 11 }} width={52} />
              <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(0)} kg`]} />
              <Bar dataKey="totalKg" radius={[0, 4, 4, 0]}
                label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${(v as number).toFixed(0)} kg` }}>
                {opSummary.map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-xs mt-3 border-t" style={{ borderColor: C.border }}>
            <thead><tr style={{ color: C.muted }}>
              <th className="text-left py-1">{t("tabProduction.col.operator")}</th>
              <th className="text-right py-1">{t("tabProduction.col.score")}</th>
              <th className="text-left py-1 pl-2">{t("tabProduction.col.trend")}</th>
              <th className="text-right py-1">{t("tabProduction.col.batches")}</th>
              <th className="text-right py-1">kg</th>
              <th className="text-right py-1">{t("tabProduction.col.passPct")}</th>
            </tr></thead>
            <tbody>{opSummary.map(r => {
              const os = operatorScores.find(o => o.operator === r.full_name);
              return (
                <tr key={r.full_name} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-1 font-medium">{r.full_name}</td>
                  <td className="text-right font-bold" style={{ color: os ? ragColor(os.rag) : C.muted }}>{os?.score ?? "—"}</td>
                  <td className="py-1 pl-2">{os ? `${os.arrow} ${t(TREND_KEYS[os.trend] ?? os.trend)}` : "—"}</td>
                  <td className="text-right">{r.batches}</td>
                  <td className="text-right">{r.totalKg.toFixed(0)}</td>
                  <td className="text-right">{(r.pass_rate * 100).toFixed(0)}%</td>
                </tr>
              );
            })}</tbody>
          </table>
        </Panel>
      </div>

      {siteTrends.length > 0 && (
        <Panel>
          <SectionLabel>{t("tabProduction.sitePerformance")}</SectionLabel>
          <p className="text-xs mb-3" style={{ color: C.muted }}>
            {t("tabProduction.sitePerformance.desc")}
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            {siteTrends.map(r => (
              <div key={r.site} className="rounded-xl border p-3 flex flex-col min-w-28 flex-1"
                style={{ borderColor: C.border, borderTop: `3px solid ${ragColor(r.rag)}` }}>
                <div className="text-[10px]" style={{ color: C.muted }}>#{r.rank}</div>
                <div className="text-sm font-semibold mt-0.5 truncate" style={{ color: C.text }}>{r.site}</div>
                <div className="text-3xl font-bold mt-1" style={{ color: ragColor(r.rag) }}>{r.score}</div>
                <div className="text-sm">{r.arrow} {t(TREND_KEYS[r.trend] ?? r.trend)}</div>
                <div className="text-[10px] mt-1" style={{ color: C.muted }}>{t("tabProduction.batchesIdle", { n: r.batches, days: r.daysIdle })}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel>
          <SectionLabel>{t("tabProduction.feedstockCondition")}</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={fcData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={65} innerRadius={28}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {fcData.map((e, i) => <Cell key={i} fill={FEED_COLOR[e.key as FeedstockAppearance] ?? "#a8a29e"} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <SectionLabel>{t("tabProduction.smokeObservation")}</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={smData} margin={{ top: 4, right: 8, bottom: 20, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {smData.map((e, i) => <Cell key={i} fill={SMOKE_COLOR[e.key] ?? "#a8a29e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <SectionLabel>{t("tabProduction.pyrolysisDuration")}</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pyroData} layout="vertical" margin={{ top: 0, right: 52, bottom: 0, left: 24 }}>
              <XAxis type="number" domain={[0, pyroMax]} tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="batch" tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v: unknown) => [`${v as number} min`]} />
              <ReferenceLine x={PYRO_MIN} stroke={C.danger} strokeDasharray="3 2" />
              <ReferenceLine x={PYRO_MAX} stroke={C.danger} strokeDasharray="3 2" />
              <ReferenceArea x1={PYRO_MIN} x2={PYRO_MAX} fill={C.success} fillOpacity={0.06} />
              <Bar dataKey="min" radius={[0, 3, 3, 0]}
                label={{ position: "right", fontSize: 9, formatter: (v: unknown) => `${v as number}m` }}>
                {pyroData.map((e, i) => <Cell key={i} fill={e.inRange ? seriesColor(e.kiln) : C.danger} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
