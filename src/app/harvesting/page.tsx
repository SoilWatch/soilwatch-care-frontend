import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";

const C = {
  title: "#1F3864",
  heading: "#2E75B6",
  border: "#e9ecef",
  subtext: "#6b7280",
  green: "#27AE60",
  lightGreen: "#D5F5E3",
};

const columns = ["ID", "Date", "GPS Location", "Area Cleared (ha)", "Biomass Est. (t)", "Outcome", "Harvester", "Status"];

const fieldRequirements = [
  { field: "Event ID", source: "ODK auto-generated", status: "ready", note: "UUID per submission" },
  { field: "GPS coordinates", source: "ODK location widget", status: "ready", note: "centroid of cleared patch" },
  { field: "Area cleared (ha)", source: "GPS polygon or estimate", status: "ready", note: "boundary drawn in field" },
  { field: "Biomass removed (t)", source: "Allometric estimate", status: "pending", note: "requires species lookup table" },
  { field: "Feedstock outcome", source: "Dropdown: biochar / compost / waste", status: "ready", note: "links to ONA batch" },
  { field: "Harvester ID", source: "Operator registry", status: "ready", note: "matches ONA operator names" },
  { field: "Photos", source: "ODK camera widget", status: "ready", note: "before / after clearance" },
  { field: "Verification flag", source: "Field supervisor sign-off", status: "pending", note: "second-party check" },
];

export default function HarvestingPage() {
  return (
    <div className="min-h-full" style={{ background: "#f8f7f3" }}>
      {/* Header */}
      <header className="border-b bg-white px-6 py-4" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.subtext }}>
          Digital MRV · Afar Prosopis Project
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.title }}>Harvesting Events</h1>
        <p className="text-sm mt-1" style={{ color: C.subtext }}>
          Prosopis removal records — GPS location, area cleared, biomass estimated, and feedstock outcome
        </p>
      </header>

      {/* KPI row */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Area Cleared" value="Pending" sub="awaiting ODK submissions" />
        <StatCard label="Biomass Removed" value="Pending" sub="estimated dry weight" />
        <StatCard label="Harvesting Events" value="0" sub="ODK feed not yet connected" />
        <StatCard label="To Biochar Feedstock" value="Pending" sub="requires linked ONA outcomes" />
      </div>

      {/* Main content */}
      <div className="px-6 py-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Events table */}
        <section className="xl:col-span-2 bg-white rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: C.heading }}>Recent Harvesting Events</h2>
              <p className="text-xs mt-0.5" style={{ color: C.subtext }}>
                ODK form submissions will populate this table in real time once the feed is connected.
              </p>
            </div>
            <Badge label="Pending ODK sync" variant="stone" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: C.border, color: C.subtext }}>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-2 text-xs font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-sm" style={{ color: C.subtext }}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🌿</span>
                      <span className="font-medium" style={{ color: C.title }}>No harvesting events yet</span>
                      <span>Connect the ODK harvesting form export or API endpoint to populate this table.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Connection guide */}
        <div className="space-y-4">
          <section className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
              <h2 className="text-base font-semibold" style={{ color: C.heading }}>Integration Status</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "ODK Central API", status: "Not connected", color: C.subtext },
                { label: "ONA harvesting form", status: "Not configured", color: C.subtext },
                { label: "Biochar linkage", status: "Pending ODK feed", color: C.subtext },
                { label: "GEE polygon import", status: "Pending", color: C.subtext },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span style={{ color: C.title }}>{item.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f8f9fa", color: item.color }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
              <h2 className="text-base font-semibold" style={{ color: C.heading }}>What gets recorded</h2>
            </div>
            <div className="divide-y" style={{ borderColor: C.border }}>
              {fieldRequirements.map(req => (
                <div key={req.field} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold" style={{ color: C.title }}>{req.field}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: req.status === "ready" ? C.lightGreen : "#fffbeb",
                        color: req.status === "ready" ? "#166534" : "#92400e",
                      }}>
                      {req.status === "ready" ? "✓ ready" : "⏳ pending"}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: C.subtext }}>{req.source} · {req.note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Traceability chain */}
      <div className="px-6 pb-6">
        <section className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: C.heading }}>
            Harvesting → Biochar Feedstock Traceability
          </h2>
          <p className="text-xs mb-3" style={{ color: C.subtext }}>
            Each harvesting event will carry a unique tracking ID. When biomass is loaded into a kiln,
            the operator records the same tracking ID in the ONA biochar form — creating an unbroken
            chain from field removal to carbon sink verification.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {[
              "ODK: removal event + GPS",
              "Tracking ID generated",
              "Biomass transported to kiln",
              "ONA: feedstock tracking ID recorded",
              "Biochar batch linked",
              "dMRV chain complete",
            ].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-md px-3 py-1.5 border text-center" style={{ borderColor: C.border }}>
                  <span style={{ color: C.title }}>{step}</span>
                </div>
                {i < arr.length - 1 && <span style={{ color: "#d1d5db" }}>→</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
