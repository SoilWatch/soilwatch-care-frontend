const C = {
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  bg: "#fafaf8", brand: "#c2410c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
};

const blocks = [
  { id: "Block A", name: "Gewane",      area: "14,200 ha" },
  { id: "Block B", name: "Awash",       area: "9,800 ha" },
  { id: "Block C", name: "Southern",    area: "6,100 ha" },
  { id: "Block D", name: "N. Corridor", area: "18,130 ha" },
];

const phases = [
  { label: "Baseline mapping",   status: "Pending GEE layer",  ok: false },
  { label: "Harvesting events",  status: "Pending ODK sync",   ok: false },
  { label: "Biochar production", status: "Live via ONA",        ok: true  },
  { label: "Carbon accounting",  status: "CSI factors pending",ok: false },
];

export default function ProsopisPage() {
  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          Afar Prosopis Project · Satellite View
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>Invasion Extent &amp; Removal Mapping</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Satellite-based Prosopis extent classification. GEE layer pending.
        </p>
      </header>

      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Placeholder map */}
        <div className="lg:col-span-2 rounded-xl border flex flex-col items-center justify-center"
          style={{ borderColor: C.border, background: "#f1f0ee", minHeight: 320 }}>
          <p className="text-sm font-semibold" style={{ color: C.muted }}>Satellite layer not yet connected</p>
          <p className="text-xs mt-1" style={{ color: C.muted }}>Import a GEE-exported layer or connect the registry API to populate.</p>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* dMRV chain */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>dMRV chain</h2>
            <div className="space-y-1">
              {phases.map((p, i) => (
                <div key={p.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: p.ok ? C.success : "#e7e5e4", color: p.ok ? "#fff" : C.muted }}>
                      {i + 1}
                    </div>
                    {i < phases.length - 1 && <div className="w-px flex-1 my-1 min-h-3" style={{ background: C.border }} />}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-semibold" style={{ color: C.text }}>{p.label}</p>
                    <p className="text-xs" style={{ color: p.ok ? C.success : C.muted }}>{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invasion blocks */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Invasion blocks</h2>
            <table className="w-full text-xs">
              <thead><tr style={{ color: C.muted }}>
                <th className="text-left py-1">Block</th>
                <th className="text-left py-1">Area</th>
                <th className="text-right py-1">Status</th>
              </tr></thead>
              <tbody>
                {blocks.map(b => (
                  <tr key={b.id} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-1.5 font-medium" style={{ color: C.text }}>{b.id} · {b.name}</td>
                    <td className="py-1.5" style={{ color: C.muted }}>{b.area}</td>
                    <td className="py-1.5 text-right" style={{ color: C.muted }}>Pending</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
