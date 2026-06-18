import ProsopisMapClient from "@/components/ProsopisMapClient";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const blocks = [
  { id: "Block A", name: "Gewane",      area: "14,200 ha", status: "Mapped" },
  { id: "Block B", name: "Awash",       area: "9,800 ha",  status: "Mapped" },
  { id: "Block C", name: "Southern",    area: "6,100 ha",  status: "Mapped" },
  { id: "Block D", name: "N. Corridor", area: "18,130 ha", status: "Mapped" },
];

const phases = [
  { label: "Baseline mapping",   icon: "🛰️", status: "Pending GEE layer",     ok: false },
  { label: "Harvesting events",  icon: "🌿", status: "Pending ODK sync",       ok: false },
  { label: "Biochar production", icon: "🔥", status: "Live — ONA",             ok: true  },
  { label: "Carbon accounting",  icon: "📊", status: "CSI factors pending",    ok: false },
];

export default function ProsopisPage() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0f172a" }}>
      {/* Top bar */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b"
        style={{ background: "#0f172a", borderColor: "#1e293b" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Afar Prosopis Project · Satellite View
          </p>
          <h1 className="text-white text-lg font-bold leading-tight">Invasion Extent &amp; Removal Map</h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />
            Prosopis invasion
          </span>
          <span className="flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
            Cleared zones
          </span>
          <span className="px-2 py-1 rounded text-[11px] font-semibold"
            style={{ background: "#1e293b", color: "#64748b" }}>
            Pending GEE layer
          </span>
        </div>
      </div>

      {/* Body: map + right panel */}
      <div className="flex-1 flex min-h-0">
        {/* Full-height map */}
        <div className="flex-1 relative">
          <ProsopisMapClient mapboxToken={MAPBOX_TOKEN} />

          {/* Floating KPI overlay */}
          <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
            {[
              { label: "Total invasion area",   value: "~48,230 ha",  sub: "4 blocks · mock outlines" },
              { label: "Area cleared",           value: "28.1 ha",     sub: "2 events · mock data" },
              { label: "Feedstock potential",    value: "~140 t",      sub: "pending allometric model" },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg px-3 py-2.5"
                style={{
                  background: "rgba(15,23,42,0.85)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#475569" }}>{kpi.label}</p>
                <p className="text-white font-bold text-base leading-tight">{kpi.value}</p>
                <p className="text-[10px]" style={{ color: "#475569" }}>{kpi.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto border-l"
          style={{ background: "#0f172a", borderColor: "#1e293b" }}>

          {/* dMRV Chain */}
          <div className="p-4 border-b" style={{ borderColor: "#1e293b" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              dMRV Chain
            </p>
            <div className="space-y-1">
              {phases.map((p, i) => (
                <div key={p.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: p.ok ? "#10b981" : "#1e293b", color: p.ok ? "#fff" : "#334155" }}>
                      {i + 1}
                    </div>
                    {i < phases.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ background: "#1e293b", minHeight: 12 }} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-semibold text-white">{p.icon} {p.label}</p>
                    <p className="text-[10px]" style={{ color: p.ok ? "#10b981" : "#334155" }}>{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invasion Blocks */}
          <div className="p-4 border-b" style={{ borderColor: "#1e293b" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              Invasion Blocks
            </p>
            <div className="space-y-2.5">
              {blocks.map(b => (
                <div key={b.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{b.id} — {b.name}</p>
                    <p className="text-[10px]" style={{ color: "#475569" }}>{b.area}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 mt-0.5"
                    style={{ background: "#1e293b", color: "#475569" }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Layer Register */}
          <div className="p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              Layer Register
            </p>
            <div className="space-y-0">
              {[
                { quarter: "Q1 2026", captured: "—", area: "—", status: "Pending" },
                { quarter: "Q4 2025", captured: "—", area: "—", status: "Pending" },
              ].map(row => (
                <div key={row.quarter} className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "#1e293b" }}>
                  <div>
                    <p className="text-xs font-semibold text-white">{row.quarter}</p>
                    <p className="text-[10px]" style={{ color: "#334155" }}>{row.captured} · {row.area}</p>
                  </div>
                  <span className="text-[9px]" style={{ color: "#334155" }}>{row.status}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: "#334155" }}>
              Import a GEE-exported layer or connect the registry API to populate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
