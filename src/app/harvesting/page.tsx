import HarvestingMapClient from "@/components/HarvestingMapClient";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const fieldRequirements = [
  { field: "Event ID",            source: "ODK auto-generated",             ready: true  },
  { field: "GPS coordinates",     source: "ODK location widget",            ready: true  },
  { field: "Area cleared (ha)",   source: "GPS polygon or estimate",        ready: true  },
  { field: "Biomass removed (t)", source: "Allometric estimate",            ready: false },
  { field: "Feedstock outcome",   source: "Dropdown: biochar/compost/waste",ready: true  },
  { field: "Harvester ID",        source: "Operator registry",              ready: true  },
  { field: "Photos",              source: "ODK camera widget",              ready: true  },
  { field: "Verification flag",   source: "Field supervisor sign-off",      ready: false },
];

const integrations = [
  { label: "ODK Central API",      status: "Not connected",   ok: false },
  { label: "ONA harvesting form",  status: "Not configured",  ok: false },
  { label: "Biochar batch linkage",status: "Pending ODK feed",ok: false },
  { label: "GEE polygon import",   status: "Pending",         ok: false },
];

const mockEvents = [
  { id: "HE-001", date: "2025-11-03", area: "12.4 ha", biomass: "~62 t", outcome: "Biochar", operator: "Amina H." },
  { id: "HE-003", date: "2025-11-10", area: "15.7 ha", biomass: "~79 t", outcome: "Biochar", operator: "Mulugeta T." },
  { id: "HE-007", date: "2025-12-01", area: "8.2 ha",  biomass: "~41 t", outcome: "Compost", operator: "Fatuma A." },
];

export default function HarvestingPage() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0f172a" }}>
      {/* Top bar */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b"
        style={{ background: "#0f172a", borderColor: "#1e293b" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Afar Prosopis Project · Field Operations
          </p>
          <h1 className="text-white text-lg font-bold leading-tight">Harvesting Events</h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
            Cleared zones (mock)
          </span>
          <span className="flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
            <span className="h-2 w-2 rounded-full border border-amber-500/50" style={{ background: "rgba(245,158,11,0.2)" }} />
            Invasion extent
          </span>
          <span className="px-2 py-1 rounded text-[11px] font-semibold"
            style={{ background: "#1e293b", color: "#64748b" }}>
            Pending ODK sync
          </span>
        </div>
      </div>

      {/* Body: map + right panel */}
      <div className="flex-1 flex min-h-0">
        {/* Full-height map */}
        <div className="flex-1 relative">
          <HarvestingMapClient mapboxToken={MAPBOX_TOKEN} />

          {/* Floating KPI overlay */}
          <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
            {[
              { label: "Total area cleared", value: "36.3 ha",  sub: "3 events · mock data" },
              { label: "Biomass removed",    value: "~182 t",   sub: "estimated dry weight" },
              { label: "To biochar",         value: "2 events", sub: "pending ONA linkage" },
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

          {/* Recent events */}
          <div className="p-4 border-b" style={{ borderColor: "#1e293b" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              Recent Events (Mock)
            </p>
            <div className="space-y-2">
              {mockEvents.map(ev => (
                <div key={ev.id} className="rounded-lg p-2.5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{ev.id}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: ev.outcome === "Biochar" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                               color: ev.outcome === "Biochar" ? "#10b981" : "#f59e0b" }}>
                      {ev.outcome}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "#64748b" }}>{ev.date} · {ev.operator}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-white">{ev.area}</span>
                    <span className="text-[10px]" style={{ color: "#475569" }}>{ev.biomass}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] mt-2" style={{ color: "#334155" }}>
              Connect ODK feed to replace mock data with live records.
            </p>
          </div>

          {/* Integration status */}
          <div className="p-4 border-b" style={{ borderColor: "#1e293b" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              Integration Status
            </p>
            <div className="space-y-2">
              {integrations.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ background: item.ok ? "#10b981" : "#334155" }} />
                    <span className="text-xs text-white">{item.label}</span>
                  </div>
                  <span className="text-[9px]" style={{ color: "#334155" }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Field requirements */}
          <div className="p-4 border-b" style={{ borderColor: "#1e293b" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              Field Data Requirements
            </p>
            <div className="space-y-2">
              {fieldRequirements.map(req => (
                <div key={req.field} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0"
                    style={{ background: req.ready ? "#10b981" : "#f59e0b" }} />
                  <div>
                    <p className="text-[10px] font-semibold text-white">{req.field}</p>
                    <p className="text-[9px]" style={{ color: "#334155" }}>{req.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traceability chain */}
          <div className="p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>
              Traceability Chain
            </p>
            <div className="space-y-1">
              {[
                "ODK: removal event + GPS",
                "Tracking ID generated",
                "Biomass transported",
                "ONA: feedstock ID recorded",
                "Biochar batch linked",
                "dMRV chain complete",
              ].map((step, i, arr) => (
                <div key={step} className="flex items-start gap-2">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                      style={{ background: i === arr.length - 1 ? "#10b981" : "#1e293b", color: i === arr.length - 1 ? "#fff" : "#334155" }}>
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="w-px h-3" style={{ background: "#1e293b" }} />}
                  </div>
                  <p className="text-[10px] pt-0.5" style={{ color: i === arr.length - 1 ? "#10b981" : "#475569" }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
