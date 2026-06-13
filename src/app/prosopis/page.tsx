import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import ProsopisMapClient from "@/components/ProsopisMapClient";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const C = {
  title: "#1F3864",
  heading: "#2E75B6",
  border: "#e9ecef",
  subtext: "#6b7280",
  lightGreen: "#D5F5E3",
  green: "#27AE60",
  amber: "#F39C12",
  lightAmber: "#fffbeb",
};

const dmrvPhases = [
  {
    phase: "1 · Baseline Mapping",
    description: "Satellite-based classification of Prosopis invasion extent across Afar watershed. GEE model produces quarterly rasters at 10 m resolution.",
    status: "Pending GEE layer",
    statusVariant: "stone" as const,
    metrics: [
      { label: "Target area", value: "~50,000 ha", note: "Afar watershed" },
      { label: "Update frequency", value: "Quarterly", note: "per GEE schedule" },
      { label: "Resolution", value: "10 m", note: "Sentinel-2 based" },
    ],
  },
  {
    phase: "2 · Harvesting Events",
    description: "Field-recorded Prosopis removal events linked to GPS coordinates, area cleared, and biomass estimated. Feeds directly into biochar feedstock accounting.",
    status: "Pending ODK sync",
    statusVariant: "stone" as const,
    metrics: [
      { label: "Area cleared", value: "Pending", note: "awaiting live records" },
      { label: "Biomass removed", value: "Pending", note: "estimated dry weight" },
      { label: "Events recorded", value: "0", note: "ODK not yet connected" },
    ],
  },
  {
    phase: "3 · Biochar Production",
    description: "Harvested Prosopis is converted to biochar in CP2 kilns. ONA submissions track every batch — feedstock, output, quality, and compliance.",
    status: "Live ONA data",
    statusVariant: "green" as const,
    metrics: [
      { label: "ONA form", value: "Connected", note: "biochar submissions" },
      { label: "Data lag", value: "Real-time", note: "on each submission" },
      { label: "CSI standard", value: "Artisan Pro", note: "monitoring active" },
    ],
  },
  {
    phase: "4 · Carbon Accounting",
    description: "Biochar tonnes converted to tCO₂e using CSI Artisan Pro factors. Permanence and additionality documented per VM0044 methodology.",
    status: "Pending CSI factors",
    statusVariant: "stone" as const,
    metrics: [
      { label: "Methodology", value: "VM0044", note: "Verra standard" },
      { label: "Estimated tCO₂e", value: "Pending", note: "factors unconfirmed" },
      { label: "C-Sink unit", value: "In progress", note: "accumulating" },
    ],
  },
];

const layerRegister = [
  { quarter: "Q1 2026", captured: "—", area: "—", accuracy: "—", model: "—", assets: "—", status: "pending" },
  { quarter: "Q4 2025", captured: "—", area: "—", accuracy: "—", model: "—", assets: "—", status: "pending" },
];

export default function ProsopisPage() {
  return (
    <div className="min-h-full" style={{ background: "#f8f7f3" }}>
      {/* Header */}
      <header className="border-b bg-white px-6 py-4" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>
          Digital MRV · Afar Prosopis Project
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.title }}>
          Prosopis Invasion &amp; Removal
        </h1>
        <p className="text-sm mt-1" style={{ color: C.subtext }}>
          Satellite mapping of invasion extent · harvesting event tracking · feedstock-to-biochar chain
        </p>
      </header>

      {/* KPI row */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Current Extent" value="Pending" sub="awaiting GEE Q1 2026 layer" />
        <StatCard label="Quarter-on-Quarter Change" value="Pending" sub="requires two classified layers" />
        <StatCard label="Classification Accuracy" value="Pending" sub="model metadata not yet imported" />
        <StatCard label="Layers Available" value="0" sub="no live source connected" />
      </div>

      {/* Map + Layer register */}
      <div className="px-6 py-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Map */}
        <section className="xl:col-span-2 bg-white rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: C.heading }}>
                Project Invasion Extent Map
              </h2>
              <p className="text-xs mt-0.5" style={{ color: C.subtext }}>
                Map shell ready · Prosopis classification layers will render here once imported
              </p>
            </div>
            <Badge label="Pending layer" variant="stone" />
          </div>
          <div className="h-[480px]">
            <ProsopisMapClient mapboxToken={MAPBOX_TOKEN} />
          </div>
          <div className="px-4 py-2 border-t flex items-center gap-4 text-xs" style={{ borderColor: C.border, color: C.subtext }}>
            <span>🟢 Active removal zones</span>
            <span>🟡 High invasion density</span>
            <span>🔴 Uninspected</span>
            <span style={{ marginLeft: "auto" }}>Connect GEE export to populate legend</span>
          </div>
        </section>

        {/* Layer register */}
        <section className="bg-white rounded-lg border overflow-hidden self-start" style={{ borderColor: C.border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
            <h2 className="text-base font-semibold" style={{ color: C.heading }}>Layer Register</h2>
            <p className="text-xs mt-0.5" style={{ color: C.subtext }}>
              Quarterly classification outputs imported from Google Earth Engine
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: C.border, color: C.subtext }}>
                  {["Quarter", "Captured", "Area (ha)", "Accuracy", "Model", "Status"].map(col => (
                    <th key={col} className="px-4 py-2 font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layerRegister.map(row => (
                  <tr key={row.quarter} className="border-t" style={{ borderColor: C.border }}>
                    <td className="px-4 py-2 font-medium" style={{ color: C.title }}>{row.quarter}</td>
                    <td className="px-4 py-2" style={{ color: C.subtext }}>{row.captured}</td>
                    <td className="px-4 py-2" style={{ color: C.subtext }}>{row.area}</td>
                    <td className="px-4 py-2" style={{ color: C.subtext }}>{row.accuracy}</td>
                    <td className="px-4 py-2" style={{ color: C.subtext }}>{row.model}</td>
                    <td className="px-4 py-2">
                      <Badge label="Pending" variant="stone" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs" style={{ borderColor: C.border, color: C.subtext }}>
            Import a GEE-exported layer or connect the layer registry API to populate this table.
          </div>
        </section>
      </div>

      {/* dMRV Phase Cards */}
      <div className="px-6 pb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: C.title }}>
          Digital MRV Chain — Four-Phase Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {dmrvPhases.map((phase, i) => (
            <div key={phase.phase} className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
              <div className="px-4 pt-4 pb-2 border-b" style={{ borderColor: C.border }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: phase.statusVariant === "green" ? C.green : "#9ca3af" }}>
                    {i + 1}
                  </div>
                  <Badge label={phase.status} variant={phase.statusVariant} />
                </div>
                <h3 className="mt-2 text-sm font-semibold" style={{ color: C.title }}>{phase.phase.split(" · ")[1]}</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: C.subtext }}>{phase.description}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {phase.metrics.map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.subtext }}>{m.label}</span>
                    <span className="text-xs font-semibold" style={{ color: C.title }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* dMRV Flow arrows */}
        <div className="mt-4 bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.heading }}>Data Flow &amp; Traceability</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: C.subtext }}>
            {[
              { label: "GEE Satellite", desc: "Invasion extent" },
              { label: "GPS + ODK", desc: "Harvesting GPS + area" },
              { label: "ONA Submissions", desc: "Biochar batches" },
              { label: "CSI / VM0044", desc: "Carbon accounting" },
              { label: "Verified tCO₂e", desc: "Carbon credits" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="rounded-lg border px-3 py-2 flex flex-col items-center" style={{ borderColor: C.border, minWidth: 100 }}>
                  <span className="font-semibold" style={{ color: C.title }}>{step.label}</span>
                  <span style={{ color: C.subtext }}>{step.desc}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-lg" style={{ color: "#d1d5db" }}>→</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs" style={{ color: C.subtext }}>
            Each step is digitally recorded and traceable. Phases 1 (GEE) and 2 (ODK) are pending connection.
            Phase 3 (ONA biochar production) is live. Phase 4 (carbon accounting) awaits confirmed CSI conversion factors.
          </p>
        </div>
      </div>
    </div>
  );
}
