import Link from "next/link";
import { loadBiocharData } from "./biochar/ona";
import { ACTIVE_WINDOW_DAYS, COMPLIANCE_WINDOW_DAYS, MOISTURE_ESTIMATE } from "./biochar/data";
import { getT } from "@/lib/i18n/server";
import { qualityLabel } from "@/lib/i18n/enumLabels";


const C = {
  brand: "#c2410c", brandDark: "#9a3412", brandBg: "#fff7ed",
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  success: "#15803d", successBg: "#f0fdf4",
  danger: "#b91c1c", dangerBg: "#fef2f2",
  warning: "#b45309", warningBg: "#fffbeb",
  bg: "#fafaf8",
};

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "green" | "red" | "amber" | "brand" }) {
  const fg = accent === "green" ? C.success : accent === "red" ? C.danger : accent === "amber" ? C.warning : accent === "brand" ? C.brand : C.text;
  const bg = accent === "green" ? C.successBg : accent === "red" ? C.dangerBg : accent === "amber" ? C.warningBg : accent === "brand" ? C.brandBg : "#fff";
  return (
    <div className="rounded-xl border p-4 flex flex-col" style={{ background: bg, borderColor: C.border }}>
      <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
      <p className="text-2xl font-bold mt-0.5 leading-tight" style={{ color: fg }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: C.muted }}>{sub}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const [data, t] = await Promise.all([loadBiocharData(), getT()]);
  const batches = data.batches;
  const hasData = batches.length > 0 && !data.error;

  const monthCutoff   = daysAgo(30);
  const weekCutoff    = daysAgo(7);
  const activeCutoff  = daysAgo(ACTIVE_WINDOW_DAYS);

  const bKg = (b: (typeof batches)[0]) =>
    b.data_source === "regain_kiln_operator" ? b.dry_kg : b.biochar_wet_weight_kg;
  const totalBiochar  = batches.reduce((s, b) => s + bKg(b), 0);
  const dryBiochar    = batches.reduce((s, b) => s + b.dry_kg, 0);
  const monthBatches  = batches.filter(b => b.production_date >= monthCutoff).length;
  const weekBatches   = batches.filter(b => b.production_date >= weekCutoff).length;
  const activeKilns   = new Set(batches.filter(b => b.production_date >= activeCutoff).map(b => b.kiln_id)).size;
  const totalKilns    = new Set(batches.map(b => b.kiln_id)).size;
  const qualPct       = batches.length ? batches.filter(b => b.c_quality_acceptable).length / batches.length * 100 : 0;
  const csiOk         = batches.filter(b => b.csi_compliant).length;
  const compFlags     = batches.filter(b => b.production_date >= daysAgo(COMPLIANCE_WINDOW_DAYS) && b.compliance_fails > 0).length;
  const safetyInc     = batches.filter(b => b.safety_incidents.toLowerCase() !== "none").length;
  const latest        = batches[0];

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {/* Header */}
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          {t("overview.eyebrow")}
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>
          {t("overview.title")}
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          {t("overview.subtitle")}
        </p>
      </header>

      {/* Error */}
      {data.error && (
        <div className="mx-6 mt-4 rounded-xl border px-4 py-3 text-sm"
          style={{ background: C.dangerBg, borderColor: C.danger, color: "#991b1b" }}>
          {t("overview.onaError", { error: data.error })}
        </div>
      )}

      {/* KPIs */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: C.text }}>{t("overview.productionHeading")}</h2>
          <Link href="/biochar" className="text-xs font-medium hover:underline" style={{ color: C.brand }}>{t("overview.fullDashboard")}</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <Stat label={t("overview.stat.totalProduced")} value={hasData ? `${totalBiochar.toFixed(0)} kg` : "—"}
            sub={hasData ? t("overview.stat.totalProduced.sub", { date: (data.batches[0]?.production_date ?? "").slice(5) }) : t("overview.stat.notConnected")}
            accent={hasData ? "brand" : undefined} />
          <Stat label={t("overview.stat.dryBiochar")} value={hasData ? `${dryBiochar.toFixed(0)} kg` : "—"}
            sub={t("overview.stat.dryBiochar.sub", { pct: (MOISTURE_ESTIMATE * 100).toFixed(0) })} />
          <Stat label={t("overview.stat.carbon")} value={t("overview.stat.pending")} sub={t("overview.stat.carbon.sub")} />
          <Stat label={t("overview.stat.prosopisRemoved")} value={t("overview.stat.pending")} sub={t("overview.stat.prosopisRemoved.sub")} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label={t("overview.stat.batches")} value={hasData ? String(batches.length) : "—"}
            sub={hasData ? t("overview.stat.batches.sub", { month: monthBatches, week: weekBatches }) : undefined} />
          <Stat label={t("overview.stat.activeKilns")} value={hasData ? `${activeKilns} / ${totalKilns}` : "—"}
            sub={t("overview.stat.lastNDays", { n: ACTIVE_WINDOW_DAYS })} />
          <Stat label={t("overview.stat.qualityPass")} value={hasData ? `${qualPct.toFixed(0)}%` : "—"}
            sub={t("overview.stat.qualityPass.sub")}
            accent={hasData ? (qualPct >= 70 ? "green" : qualPct >= 40 ? "amber" : "red") : undefined} />
          <Stat label={t("overview.stat.complianceFlags")} value={hasData ? String(compFlags) : "—"}
            sub={t("overview.stat.complianceFlags.sub", { n: COMPLIANCE_WINDOW_DAYS, incidents: safetyInc })}
            accent={compFlags > 0 || safetyInc > 0 ? "red" : hasData ? "green" : undefined} />
        </div>
      </div>

      {/* Module grid + latest batch */}
      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              href: "/map",
              title: t("overview.module.map.title"),
              desc: t("overview.module.map.desc"),
              badge: hasData ? t("overview.module.map.badge", { n: totalKilns }) : t("overview.module.map.badge.waiting"),
              ok: hasData,
            },
            {
              href: "/biochar",
              title: t("overview.module.biochar.title"),
              desc: t("overview.module.biochar.desc"),
              badge: hasData ? t("overview.module.biochar.badge", { n: batches.length }) : data.error ? t("overview.module.biochar.badge.unavailable") : t("overview.module.biochar.badge.noData"),
              ok: hasData,
            },
            {
              href: "/prosopis",
              title: t("overview.module.prosopis.title"),
              desc: t("overview.module.prosopis.desc"),
              badge: t("overview.module.prosopis.badge"),
              ok: false,
            },
            {
              href: "/reports",
              title: t("overview.module.reports.title"),
              desc: t("overview.module.reports.desc"),
              badge: t("overview.module.reports.badge"),
              ok: false,
            },
          ].map(m => (
            <Link key={m.href} href={m.href}
              className="group block bg-white rounded-xl border p-4 transition-shadow hover:shadow-md"
              style={{ borderColor: C.border }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-sm font-bold" style={{ color: C.text }}>{m.title}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: m.ok ? C.successBg : "#f4f4f3", color: m.ok ? "#166534" : C.muted }}>
                  {m.badge}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{m.desc}</p>
              <div className="mt-3 text-xs font-semibold group-hover:underline" style={{ color: C.brand }}>{t("overview.module.open")}</div>
            </Link>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Latest batch */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("overview.latestBatch.title")}</h2>
            {!hasData ? (
              <p className="text-xs" style={{ color: C.muted }}>
                {data.error ? t("overview.latestBatch.unavailable") : t("overview.latestBatch.none")}
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: "#f9f8f7" }}>
                  <p className="text-xs" style={{ color: C.muted }}>{t("overview.latestBatch.batchId")}</p>
                  <p className="font-semibold mt-0.5" style={{ color: C.text }}>{latest.batch_id}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {latest.production_date} · {latest.kiln_id} · {latest.operator_name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2.5" style={{ borderColor: C.border }}>
                    <p className="text-xs" style={{ color: C.muted }}>{t("overview.latestBatch.output")}</p>
                    <p className="font-semibold" style={{ color: C.text }}>{bKg(latest).toFixed(1)} kg</p>
                    <p className="text-xs" style={{ color: C.muted }}>{qualityLabel(t, latest.biochar_visual_quality)}</p>
                  </div>
                  <div className="rounded-lg border p-2.5" style={{ borderColor: C.border }}>
                    <p className="text-xs" style={{ color: C.muted }}>{t("overview.latestBatch.csiStatus")}</p>
                    <p className="font-semibold" style={{ color: latest.csi_compliant ? C.success : C.danger }}>
                      {latest.csi_compliant ? t("overview.latestBatch.compliant") : t("overview.latestBatch.fails", { n: latest.compliance_fails })}
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>{latest.pyrolysis_duration_min} min</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compliance summary */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("overview.compliance.title")}</h2>
            {!hasData ? (
              <p className="text-xs" style={{ color: C.muted }}>{t("overview.compliance.connect")}</p>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: t("overview.compliance.csi"), value: `${csiOk}/${batches.length}`, pct: csiOk / batches.length },
                  { label: t("overview.compliance.quality"),  value: `${qualPct.toFixed(0)}%`,     pct: qualPct / 100 },
                  { label: t("overview.compliance.safety"),     value: `${batches.length - safetyInc}/${batches.length}`, pct: (batches.length - safetyInc) / batches.length },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: C.muted }}>{item.label}</span>
                      <span className="font-semibold" style={{ color: C.text }}>{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#e7e5e4" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${Math.min(100, item.pct * 100).toFixed(0)}%`,
                          background: item.pct >= 0.8 ? C.success : item.pct >= 0.5 ? C.warning : C.danger }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data connections */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("overview.connections.title")}</h2>
            <div className="space-y-1.5 text-xs">
              {[
                { label: t("overview.connections.biocharForm"),    ok: hasData,  status: hasData ? t("overview.connections.connected") : t("overview.connections.error") },
                { label: t("overview.connections.harvestingForm"), ok: false, status: t("overview.connections.notConfigured") },
                { label: t("overview.connections.gee"),       ok: false, status: t("overview.connections.notConnected") },
                { label: t("overview.connections.carbon"),   ok: false, status: t("overview.connections.pending") },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span style={{ color: C.text }}>{item.label}</span>
                  <span className="font-medium" style={{ color: item.ok ? C.success : C.muted }}>
                    {item.ok ? "●" : "○"} {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-6">
        <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: C.border }}>
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.muted }}>
            <span>{t("common.footerBrand")}</span>
            <span>·</span>
            <span>{t("overview.footer.form", { id: data.formId ?? t("overview.footer.notConfigured") })}</span>
            <span>·</span>
            <span>{t("overview.footer.loaded", { when: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) })}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
