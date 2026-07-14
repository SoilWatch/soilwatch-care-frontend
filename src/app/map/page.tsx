import { loadBiocharData } from "../biochar/ona";
import KilnMapClient from "@/components/KilnMapClient";

export const dynamic = "force-dynamic";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const C = {
  border: "#1e293b", text: "#1c1917", muted: "#78716c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
  brand: "#c2410c",
};

export default async function MapPage() {
  const dataSource = await loadBiocharData();
  const batches = dataSource.batches;

  const kilnSet = new Map<string, { lat: number; lon: number; batches: number; totalKg: number; lastDate: string }>();
  batches.forEach(b => {
    const k = kilnSet.get(b.kiln_id) ?? { lat: b.production_lat, lon: b.production_lon, batches: 0, totalKg: 0, lastDate: "" };
    k.batches++;
    k.totalKg += b.biochar_wet_weight_kg;
    if (b.production_date > k.lastDate) k.lastDate = b.production_date;
    kilnSet.set(b.kiln_id, k);
  });

  const stats = {
    kilns: kilnSet.size,
    batches: batches.length,
    operators: new Set(batches.map(b => b.operator_name)).size,
    csiOk: batches.filter(b => b.csi_compliant).length,
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#0f172a" }}>
      {/* Top bar */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center justify-between gap-4 border-b flex-wrap"
        style={{ background: "#0f172a", borderColor: "#1e293b" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>
            Afar Prosopis Biochar · Field Map
          </p>
          <h1 className="text-white text-lg font-bold leading-tight">Kiln Locations &amp; Production Status</h1>
        </div>
        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: "Kilns",     value: stats.kilns },
            { label: "Batches",   value: stats.batches },
            { label: "Operators", value: stats.operators },
            { label: "CSI OK",    value: stats.csiOk },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-white font-bold text-lg leading-tight">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Active",     color: C.success },
            { label: "Idle",       color: C.warning },
            { label: "Compliance", color: C.brand },
            { label: "Safety",     color: C.danger },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: l.color }} />
              <span className="text-[11px]" style={{ color: "#94a3b8" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      {!MAPBOX_TOKEN ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white font-semibold">Mapbox token not configured</p>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <KilnMapClient
            batches={batches}
            mapboxToken={MAPBOX_TOKEN}
            showFeedstockLines
            showFeedstockMarkers
          />
        </div>
      )}

      {/* Error banner */}
      {dataSource.error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="rounded-xl border px-4 py-2 text-sm" style={{ background: "#7f1d1d", borderColor: C.danger, color: "#fecaca" }}>
            ONA issue: {dataSource.error}
          </div>
        </div>
      )}
    </div>
  );
}
