const C = {
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  bg: "#fafaf8", brand: "#c2410c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
};

const fieldRequirements = [
  { field: "Event ID",            source: "ODK auto-generated",              ready: true  },
  { field: "GPS coordinates",     source: "ODK location widget",             ready: true  },
  { field: "Area cleared (ha)",   source: "GPS polygon or estimate",         ready: true  },
  { field: "Biomass removed (t)", source: "Allometric estimate",             ready: false },
  { field: "Feedstock outcome",   source: "Dropdown: biochar/compost/waste", ready: true  },
  { field: "Harvester ID",        source: "Operator registry",               ready: true  },
  { field: "Photos",              source: "ODK camera widget",               ready: true  },
  { field: "Verification flag",   source: "Field supervisor sign-off",       ready: false },
];

const integrations = [
  { label: "ODK Central API",       status: "Not connected",    ok: false },
  { label: "ONA harvesting form",   status: "Not configured",   ok: false },
  { label: "Biochar batch linkage", status: "Pending ODK feed", ok: false },
  { label: "GEE polygon import",    status: "Pending",          ok: false },
];

export default function HarvestingPage() {
  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          Afar Prosopis Project · Field Operations
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>Harvesting Events</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          GPS-recorded Prosopis removal events. ODK sync pending.
        </p>
      </header>

      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info + placeholder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map placeholder */}
          <div className="rounded-xl border flex flex-col items-center justify-center"
            style={{ borderColor: C.border, background: "#f1f0ee", minHeight: 240 }}>
            <p className="text-sm font-semibold" style={{ color: C.muted }}>Event map not yet connected</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Connect ODK or ONA harvesting form to display event locations.</p>
          </div>

          {/* Field requirements */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Field data requirements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldRequirements.map(req => (
                <div key={req.field} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: req.ready ? C.success : C.warning }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.text }}>{req.field}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{req.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Integration status */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Integration status</h2>
            <div className="space-y-2">
              {integrations.map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span style={{ color: C.text }}>{item.label}</span>
                  <span style={{ color: item.ok ? C.success : C.muted }}>
                    {item.ok ? "●" : "○"} {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Traceability chain */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Traceability chain</h2>
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
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: i === arr.length - 1 ? C.success : "#e7e5e4", color: i === arr.length - 1 ? "#fff" : C.muted }}>
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="w-px h-3" style={{ background: C.border }} />}
                  </div>
                  <p className="text-xs pt-0.5" style={{ color: i === arr.length - 1 ? C.success : C.muted }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
