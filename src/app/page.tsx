import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";

const modules = [
  { name: "Prosopis Mapping", status: "Pending live data", route: "/prosopis" },
  { name: "Harvesting Events", status: "Pending ODK sync", route: "/harvesting" },
  { name: "Biochar Production", status: "CSV loaded", route: "/biochar" },
  { name: "Reports", status: "Draft templates", route: "/reports" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-white">
      <PageHeader title="Overview" description="CARE dMRV operational workspace" />

      <div className="px-6 pt-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Prosopis Area Mapped" value="Pending" sub="awaiting GEE layer import" />
        <StatCard label="Area Cleared" value="Pending" sub="awaiting harvesting sync" />
        <StatCard label="Biochar Produced" value="CSV" sub="available in Biochar module" />
        <StatCard label="Estimated CO2e" value="Pending" sub="conversion factors unconfirmed" />
      </div>

      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white rounded-lg border p-4" style={{ borderColor: "#e9ecef" }}>
          <h2 className="text-base font-semibold" style={{ color: "#2E75B6" }}>Module Status</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "#e9ecef", color: "#6b7280" }}>
                  <th className="py-2 pr-3">Module</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Route</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.name} className="border-t" style={{ borderColor: "#e9ecef" }}>
                    <td className="py-2 pr-3 font-medium" style={{ color: "#1F3864" }}>{module.name}</td>
                    <td className="py-2 pr-3"><Badge label={module.status} variant={module.status === "CSV loaded" ? "green" : "stone"} /></td>
                    <td className="py-2" style={{ color: "#6b7280" }}>{module.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg border p-4" style={{ borderColor: "#e9ecef" }}>
          <h2 className="text-base font-semibold" style={{ color: "#2E75B6" }}>Data Readiness</h2>
          <div className="mt-3 rounded-lg border p-3 text-sm" style={{ background: "#fffbeb", borderColor: "#F39C12", color: "#92400e" }}>
            Live integrations are not required for this view. Modules without connected sources show pending states instead of fabricated production totals.
          </div>
        </section>
      </div>
    </div>
  );
}
