import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import ProsopisMapClient from "@/components/ProsopisMapClient";
import { Download, Plus, Info } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const layers = [
  {
    id: "a1b2c3d4-0001",
    quarter: "2026-Q1",
    captureDate: "2026-03-31",
    areaHa: 48230.5,
    accuracyPct: 91.2,
    imagerySource: "Sentinel-2 + Landsat 9",
    modelVersion: "prosopis-clf-v2.1",
    hasCog: true,
    hasChangeCog: true,
  },
  {
    id: "a1b2c3d4-0002",
    quarter: "2025-Q4",
    captureDate: "2025-12-31",
    areaHa: 49844.1,
    accuracyPct: 89.7,
    imagerySource: "Sentinel-2 + Landsat 9",
    modelVersion: "prosopis-clf-v2.0",
    hasCog: true,
    hasChangeCog: false,
  },
  {
    id: "a1b2c3d4-0003",
    quarter: "2025-Q3",
    captureDate: "2025-09-30",
    areaHa: 51023.8,
    accuracyPct: 88.4,
    imagerySource: "Sentinel-2",
    modelVersion: "prosopis-clf-v1.9",
    hasCog: true,
    hasChangeCog: true,
  },
  {
    id: "a1b2c3d4-0004",
    quarter: "2025-Q2",
    captureDate: "2025-06-30",
    areaHa: 52410.2,
    accuracyPct: 87.1,
    imagerySource: "Sentinel-2",
    modelVersion: "prosopis-clf-v1.8",
    hasCog: true,
    hasChangeCog: true,
  },
];

function formatHa(ha: number) {
  return ha.toLocaleString("en-US", { maximumFractionDigits: 1 }) + " ha";
}

function deltaHa(a: number, b: number) {
  const diff = a - b;
  return `${diff > 0 ? "+" : ""}${diff.toLocaleString("en-US", { maximumFractionDigits: 1 })} ha`;
}

export default function ProsopisPage() {
  const latest = layers[0];
  const previous = layers[1];
  const maxHa = 53000;

  return (
    <div className="p-8 bg-[#f8f7f3] min-h-full">
      <PageHeader
        title="Prosopis Mapping"
        description="Quarterly GEE-derived land-cover classification — Prosopis juliflora invasion extent"
        action={
          <button
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#ffb100" }}
          >
            <Plus size={15} />
            Ingest Layer
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Current Extent"
          value={formatHa(latest.areaHa)}
          sub={`as of ${latest.quarter}`}
          accent="earth"
        />
        <StatCard
          label="Quarter-on-Quarter"
          value={deltaHa(latest.areaHa, previous.areaHa)}
          sub="vs 2025-Q4"
          trend="down"
          trendLabel="reduction"
          accent="soil"
        />
        <StatCard
          label="Classification Accuracy"
          value={`${latest.accuracyPct}%`}
          sub={latest.modelVersion}
          accent="carbon"
        />
        <StatCard
          label="Layers Available"
          value={`${layers.length}`}
          sub="quarterly snapshots"
          accent="stone"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Map + trend — col span 2 */}
        <div className="col-span-2 space-y-4">
          {/* Mapbox map */}
          <div className="bg-white rounded-xl border border-[#efede6] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#efede6] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#1e1810]">Invasion Extent Map</h2>
                <p className="text-xs text-[#97928f] mt-0.5">Latest layer — {latest.quarter} · Afar Region, Ethiopia</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={latest.quarter} variant="earth" />
                <button className="flex items-center gap-1.5 text-xs text-[#62615c] hover:text-[#1e1810] border border-[#efede6] px-2.5 py-1.5 rounded-lg transition-colors">
                  <Download size={13} />
                  COG
                </button>
              </div>
            </div>

            {/* Map */}
            <div className="h-[420px] relative">
              <ProsopisMapClient mapboxToken={MAPBOX_TOKEN} />

              {/* Legend overlay */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2.5 text-xs space-y-1.5 shadow-sm pointer-events-none z-10">
                <p className="font-semibold text-[#1e1810] mb-1.5">Legend</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: "rgba(255,177,0,0.5)", border: "1.5px solid #f9c349" }} />
                  <span className="text-[#62615c]">Prosopis juliflora</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: "rgba(34,197,94,0.5)", border: "1.5px solid #16a34a" }} />
                  <span className="text-[#62615c]">Cleared area</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-[#efede6] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#efede6] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1e1810]">Invasion Area Trend</h2>
              <div className="flex items-center gap-1 text-xs text-[#97928f]">
                <Info size={13} />
                Quarterly GEE snapshots
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-end gap-4 h-28">
                {[...layers].reverse().map((layer) => {
                  const pct = (layer.areaHa / maxHa) * 100;
                  const isLatest = layer.id === latest.id;
                  return (
                    <div key={layer.id} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] text-[#62615c]">
                        {(layer.areaHa / 1000).toFixed(1)}k ha
                      </span>
                      <div className="w-full flex items-end" style={{ height: "80px" }}>
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${pct}%`,
                            background: isLatest ? "#ffb100" : "#f9c349",
                            opacity: isLatest ? 1 : 0.5,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-[#97928f]">{layer.quarter}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Layer list */}
        <div className="bg-white rounded-xl border border-[#efede6] overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-[#efede6]">
            <h2 className="text-sm font-semibold text-[#1e1810]">All Layers</h2>
            <p className="text-xs text-[#97928f] mt-0.5">Most recent first</p>
          </div>
          <ul className="divide-y divide-[#f8f7f3]">
            {layers.map((layer, i) => (
              <li
                key={layer.id}
                className="px-5 py-4 hover:bg-[#fffdf8] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge label={layer.quarter} variant={i === 0 ? "earth" : "stone"} />
                    {i === 0 && <Badge label="Latest" variant="green" />}
                  </div>
                  <span className="text-[10px] text-[#97928f]">{layer.captureDate}</span>
                </div>
                <p className="text-sm font-semibold text-[#1e1810]">{formatHa(layer.areaHa)}</p>
                <p className="text-[11px] text-[#97928f] mt-0.5">
                  {layer.imagerySource} · {layer.accuracyPct}% acc.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {layer.hasCog && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#fff4cc", color: "#8d5908" }}>
                      COG
                    </span>
                  )}
                  {layer.hasChangeCog && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f8f7f3] text-[#62615c]">
                      Change
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
