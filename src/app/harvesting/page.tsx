import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";

const columns = ["ID", "Date", "Location", "Area", "Biomass", "Outcome", "Harvester"];

export default function HarvestingPage() {
  return (
    <div className="min-h-full bg-white">
      <PageHeader
        title="Harvesting Events"
        description="Prosopis removal records will appear here once the ODK harvesting feed is connected"
      />

      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Area Cleared" value="Pending" sub="awaiting live records" />
        <StatCard label="Total Biomass" value="Pending" sub="estimated dry weight" />
        <StatCard label="Harvesting Events" value="0" sub="no connected source yet" />
        <StatCard label="To Biochar" value="Pending" sub="requires linked outcomes" />
      </div>

      <div className="px-6 py-4">
        <section className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#e9ecef" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e9ecef" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#2E75B6" }}>Recent Events</h2>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>No mock harvesting events are shown.</p>
            </div>
            <Badge label="Pending ODK sync" variant="stone" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "#e9ecef", color: "#6b7280" }}>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-2 text-xs font-semibold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-sm" style={{ color: "#6b7280" }}>
                    Connect the harvesting ODK export or API to populate this table.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
