import { getT } from "@/lib/i18n/server";

const C = {
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  bg: "#fafaf8", brand: "#c2410c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
};

const BLOCKS = [
  { id: "Block A", name: "Gewane",      area: "14,200 ha" },
  { id: "Block B", name: "Awash",       area: "9,800 ha" },
  { id: "Block C", name: "Southern",    area: "6,100 ha" },
  { id: "Block D", name: "N. Corridor", area: "18,130 ha" },
];

export default async function ProsopisPage() {
  const t = await getT();

  const phases = [
    { label: t("prosopis.phase.baseline"),   status: t("prosopis.phase.baseline.status"),   ok: false },
    { label: t("prosopis.phase.harvesting"), status: t("prosopis.phase.harvesting.status"), ok: false },
    { label: t("prosopis.phase.biochar"),    status: t("prosopis.phase.biochar.status"),    ok: true  },
    { label: t("prosopis.phase.carbon"),     status: t("prosopis.phase.carbon.status"),     ok: false },
  ];

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          {t("prosopis.eyebrow")}
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>{t("prosopis.title")}</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          {t("prosopis.subtitle")}
        </p>
      </header>

      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Placeholder map */}
        <div className="lg:col-span-2 rounded-xl border flex flex-col items-center justify-center"
          style={{ borderColor: C.border, background: "#f1f0ee", minHeight: 320 }}>
          <p className="text-sm font-semibold" style={{ color: C.muted }}>{t("prosopis.mapPlaceholder.title")}</p>
          <p className="text-xs mt-1" style={{ color: C.muted }}>{t("prosopis.mapPlaceholder.desc")}</p>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* dMRV chain */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("prosopis.chain.title")}</h2>
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
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("prosopis.blocks.title")}</h2>
            <table className="w-full text-xs">
              <thead><tr style={{ color: C.muted }}>
                <th className="text-left py-1">{t("prosopis.blocks.block")}</th>
                <th className="text-left py-1">{t("prosopis.blocks.area")}</th>
                <th className="text-right py-1">{t("prosopis.blocks.status")}</th>
              </tr></thead>
              <tbody>
                {BLOCKS.map(b => (
                  <tr key={b.id} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-1.5 font-medium" style={{ color: C.text }}>{b.id} · {b.name}</td>
                    <td className="py-1.5" style={{ color: C.muted }}>{b.area}</td>
                    <td className="py-1.5 text-right" style={{ color: C.muted }}>{t("prosopis.blocks.pending")}</td>
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
