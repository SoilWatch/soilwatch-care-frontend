import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import ProsopisMapClient from "@/components/ProsopisMapClient";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const layerColumns = ["Quarter", "Capture date", "Area", "Accuracy", "Model", "Assets"];

export default function ProsopisPage() {
  return (
    <div className="min-h-full bg-white">
      <PageHeader
        title="Prosopis Mapping"
        description="Quarterly GEE-derived land-cover classification workspace"
      />

      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Current Extent" value="Pending" sub="awaiting layer import" />
        <StatCard label="Quarter-on-Quarter" value="Pending" sub="requires two layers" />
        <StatCard label="Classification Accuracy" value="Pending" sub="model metadata" />
        <StatCard label="Layers Available" value="0" sub="no live source connected" />
      </div>

      <div className="px-6 py-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#e9ecef" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e9ecef" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#2E75B6" }}>Invasion Extent Map</h2>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Map shell ready for imported Prosopis layers</p>
            </div>
            <Badge label="Pending layer" variant="stone" />
          </div>
          <div className="h-[480px]">
            <ProsopisMapClient mapboxToken={MAPBOX_TOKEN} />
          </div>
        </section>

        <section className="bg-white rounded-lg border overflow-hidden self-start" style={{ borderColor: "#e9ecef" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#e9ecef" }}>
            <h2 className="text-base font-semibold" style={{ color: "#2E75B6" }}>Layer Register</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>No mock layer records are shown.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "#e9ecef", color: "#6b7280" }}>
                  {layerColumns.map((column) => (
                    <th key={column} className="px-4 py-2 text-xs font-semibold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={layerColumns.length} className="px-4 py-8 text-center text-sm" style={{ color: "#6b7280" }}>
                    Import a GEE layer or connect the layer registry to populate this table.
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
