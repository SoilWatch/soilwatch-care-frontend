import Link from "next/link";
import { loadBiocharData } from "./biochar/ona";
import { ACTIVE_WINDOW_DAYS, COMPLIANCE_WINDOW_DAYS, MOISTURE_ESTIMATE } from "./biochar/data";

export const dynamic = "force-dynamic";

const C = {
  title: "#1F3864",
  heading: "#2E75B6",
  border: "#e9ecef",
  subtext: "#6b7280",
  green: "#27AE60",
  lightGreen: "#D5F5E3",
  red: "#E74C3C",
  lightRed: "#FADBD8",
  orange: "#F39C12",
  bg: "#f8f7f3",
};

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function StatPill({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: "green" | "red" | "amber" }) {
  const color = accent === "green" ? C.green : accent === "red" ? C.red : accent === "amber" ? C.orange : C.title;
  const bg = accent === "green" ? C.lightGreen : accent === "red" ? C.lightRed : accent === "amber" ? "#fffbeb" : "#f8f9fa";
  return (
    <div className="rounded-lg border p-3 flex flex-col gap-1" style={{ background: bg, borderColor: C.border }}>
      <div className="text-xs font-semibold" style={{ color: C.subtext }}>{label}</div>
      <div className="text-2xl font-bold leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: C.subtext }}>{sub}</div>}
    </div>
  );
}

function ModuleCard({
  icon, title, description, href, badge, badgeColor,
}: { icon: string; title: string; description: string; href: string; badge: string; badgeColor: string }) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-lg border p-4 transition-shadow group-hover:shadow-md h-full"
        style={{ borderColor: C.border }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "#f8f9fa" }}>
            {icon}
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1"
            style={{ background: badgeColor === "green" ? C.lightGreen : "#f1f5f9",
                     color: badgeColor === "green" ? "#166534" : C.subtext }}>
            {badge}
          </span>
        </div>
        <h2 className="text-sm font-bold" style={{ color: C.title }}>{title}</h2>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: C.subtext }}>{description}</p>
        <div className="mt-3 text-xs font-medium group-hover:underline" style={{ color: C.heading }}>
          Open →
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const biocharData = await loadBiocharData();
  const batches = biocharData.batches;

  const monthCutoff = daysAgo(30);
  const weekCutoff  = daysAgo(7);
  const activeCutoff = daysAgo(ACTIVE_WINDOW_DAYS);

  const totalBiochar  = batches.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const dryBiochar    = batches.reduce((s, b) => s + b.dry_kg, 0);
  const monthBiochar  = batches.filter(b => b.production_date >= monthCutoff)
                                .reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
  const weekBatches   = batches.filter(b => b.production_date >= weekCutoff).length;
  const activeKilns   = new Set(batches.filter(b => b.production_date >= activeCutoff).map(b => b.kiln_id)).size;
  const totalKilns    = new Set(batches.map(b => b.kiln_id)).size;
  const qualityPass   = batches.length
    ? (batches.filter(b => b.c_quality_acceptable).length / batches.length) * 100
    : 0;
  const compFlags     = batches.filter(b =>
    b.production_date >= daysAgo(COMPLIANCE_WINDOW_DAYS) && b.compliance_fails > 0
  ).length;
  const safetyInc     = batches.filter(b => b.safety_incidents.toLowerCase() !== "none").length;
  const csiCompliant  = batches.filter(b => b.csi_compliant).length;
  const latestBatch   = batches[0];
  const hasData       = batches.length > 0 && !biocharData.error;

  const modules = [
    {
      icon: "🛰️",
      title: "Project Map",
      description: "Satellite-based Prosopis invasion extent mapping. GEE layers, quarterly classification, and removal planning.",
      href: "/prosopis",
      badge: "Pending GEE layer",
      badgeColor: "stone",
    },
    {
      icon: "🌿",
      title: "Harvesting Events",
      description: "GPS-recorded Prosopis removal events, area cleared, biomass estimates, and feedstock tracking IDs.",
      href: "/harvesting",
      badge: "Pending ODK sync",
      badgeColor: "stone",
    },
    {
      icon: "🔥",
      title: "Biochar Production",
      description: "Live ONA submissions — batch tracking, CSI Artisan Pro compliance, quality, maps, and carbon accounting.",
      href: "/biochar",
      badge: hasData ? `${batches.length} batches · Live ONA` : biocharData.error ? "ONA unavailable" : "No data",
      badgeColor: hasData ? "green" : "stone",
    },
    {
      icon: "📊",
      title: "Project Reports",
      description: "Monitoring, verification, and compliance reports for CARE / SoilWatch. VM0044 and CSI standards.",
      href: "/reports",
      badge: "Draft templates",
      badgeColor: "stone",
    },
  ];

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {/* Header */}
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>
          CARE Ethiopia · SoilWatch · dMRV Platform
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.title }}>
          Afar Prosopis Biochar Project
        </h1>
        <p className="text-sm mt-1" style={{ color: C.subtext }}>
          Digital MRV workspace — mapping, harvesting, biochar production, and carbon accounting
        </p>
      </header>

      {/* Biochar KPIs */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: C.title }}>Biochar Production Overview</h2>
          <Link href="/biochar" className="text-xs font-medium" style={{ color: C.heading }}>
            Open full dashboard →
          </Link>
        </div>

        {biocharData.error && (
          <div className="mb-3 rounded-lg border px-4 py-3 text-sm"
            style={{ background: C.lightRed, borderColor: C.red, color: "#922B21" }}>
            <strong>ONA connection issue:</strong> {biocharData.error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StatPill
            label="Biochar Produced"
            value={hasData ? `${totalBiochar.toFixed(0)} kg` : "—"}
            sub={hasData ? `${monthBiochar.toFixed(0)} kg in last 30 days` : "ONA not connected"}
            accent={hasData ? "green" : undefined}
          />
          <StatPill
            label="Dry Biochar (est.)"
            value={hasData ? `${dryBiochar.toFixed(0)} kg` : "—"}
            sub={`${(MOISTURE_ESTIMATE * 100).toFixed(0)}% moisture assumption`}
          />
          <StatPill label="Estimated CO₂e" value="Pending" sub="CSI factors unconfirmed" />
          <StatPill label="Prosopis Area Removed" value="Pending" sub="awaiting harvesting sync" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill
            label="Total Batches"
            value={hasData ? `${batches.length}` : "—"}
            sub={hasData ? `${weekBatches} in last 7 days` : undefined}
          />
          <StatPill
            label="Active Kilns"
            value={hasData ? `${activeKilns} / ${totalKilns}` : "—"}
            sub={`last ${ACTIVE_WINDOW_DAYS} days`}
          />
          <StatPill
            label="Quality Pass Rate"
            value={hasData ? `${qualityPass.toFixed(0)}%` : "—"}
            sub="excellent or good"
            accent={hasData && qualityPass < 50 ? "red" : hasData ? "green" : undefined}
          />
          <StatPill
            label="Compliance Flags"
            value={hasData ? `${compFlags}` : "—"}
            sub={`last ${COMPLIANCE_WINDOW_DAYS} days · incidents: ${safetyInc}`}
            accent={compFlags > 0 || safetyInc > 0 ? "red" : hasData ? "green" : undefined}
          />
        </div>
      </div>

      {/* Module cards + snapshot */}
      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map(m => (
            <ModuleCard key={m.href} {...m} />
          ))}
        </div>

        <div className="space-y-4">
          {/* Latest batch */}
          <section className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.heading }}>Latest Batch</h2>
            {!hasData ? (
              <p className="text-xs" style={{ color: C.subtext }}>
                {biocharData.error ? "ONA data unavailable. Check credentials." : "No submissions yet."}
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: "#f8f9fa" }}>
                  <p className="text-xs font-semibold" style={{ color: C.subtext }}>Batch ID</p>
                  <p className="mt-0.5 font-semibold" style={{ color: C.title }}>{latestBatch.batch_id}</p>
                  <p className="text-xs" style={{ color: C.subtext }}>
                    {latestBatch.production_date} · {latestBatch.kiln_id} · {latestBatch.operator_name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2.5" style={{ borderColor: C.border }}>
                    <p className="text-xs" style={{ color: C.subtext }}>Output</p>
                    <p className="font-semibold text-sm" style={{ color: C.title }}>{latestBatch.biochar_wet_weight_kg.toFixed(1)} kg</p>
                    <p className="text-[11px]" style={{ color: C.subtext }}>{latestBatch.biochar_visual_quality} quality</p>
                  </div>
                  <div className="rounded-lg border p-2.5" style={{ borderColor: C.border }}>
                    <p className="text-xs" style={{ color: C.subtext }}>CSI status</p>
                    <p className="font-semibold text-sm" style={{ color: latestBatch.csi_compliant ? C.green : C.red }}>
                      {latestBatch.csi_compliant ? "✓ Compliant" : `✗ ${latestBatch.compliance_fails} fail(s)`}
                    </p>
                    <p className="text-[11px]" style={{ color: C.subtext }}>{latestBatch.pyrolysis_duration_min} min pyrolysis</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Project compliance summary */}
          <section className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.heading }}>Compliance Summary</h2>
            {!hasData ? (
              <p className="text-xs" style={{ color: C.subtext }}>Connect ONA to see compliance data.</p>
            ) : (
              <div className="space-y-2">
                {[
                  { label: "CSI compliant batches", value: `${csiCompliant} / ${batches.length}`, pct: csiCompliant / batches.length },
                  { label: "Quality pass rate", value: `${qualityPass.toFixed(0)}%`, pct: qualityPass / 100 },
                  { label: "Safety OK", value: `${batches.length - safetyInc} / ${batches.length}`, pct: (batches.length - safetyInc) / batches.length },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: C.subtext }}>{item.label}</span>
                      <span className="font-semibold" style={{ color: C.title }}>{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#e9ecef" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(item.pct * 100).toFixed(0)}%`, background: item.pct >= 0.8 ? C.green : item.pct >= 0.5 ? C.orange : C.red }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ONA connection */}
          <section className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: C.heading }}>Data Connection</h2>
            <div className="space-y-1.5 text-xs">
              {[
                { label: "ONA biochar form", status: hasData ? "Connected" : "Error", ok: hasData },
                { label: "ONA harvesting form", status: "Not configured", ok: false },
                { label: "GEE satellite layers", status: "Not connected", ok: false },
                { label: "Carbon accounting", status: "CSI factors pending", ok: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span style={{ color: C.title }}>{item.label}</span>
                  <span className="font-medium" style={{ color: item.ok ? C.green : C.subtext }}>
                    {item.ok ? "●" : "○"} {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="rounded-lg border bg-white px-4 py-3" style={{ borderColor: C.border }}>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: C.subtext }}>
            <span>CARE Ethiopia · SoilWatch dMRV</span>
            <span>·</span>
            <span>Afar Prosopis Biochar Project — CP2 Pyrolysis</span>
            <span>·</span>
            <span>ONA form {biocharData.formId ?? "not configured"}</span>
            <span>·</span>
            <span>Loaded: {new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
