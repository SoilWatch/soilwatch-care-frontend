import { getT } from "@/lib/i18n/server";

const C = {
  border: "#e7e5e4", text: "#1c1917", muted: "#78716c",
  bg: "#fafaf8", brand: "#c2410c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
};

export default async function HarvestingPage() {
  const t = await getT();

  const fieldRequirements = [
    { field: t("harvesting.field.eventId"),      source: t("harvesting.field.eventId.source"),      ready: true  },
    { field: t("harvesting.field.gps"),          source: t("harvesting.field.gps.source"),          ready: true  },
    { field: t("harvesting.field.area"),         source: t("harvesting.field.area.source"),         ready: true  },
    { field: t("harvesting.field.biomass"),      source: t("harvesting.field.biomass.source"),      ready: false },
    { field: t("harvesting.field.outcome"),      source: t("harvesting.field.outcome.source"),      ready: true  },
    { field: t("harvesting.field.harvesterId"),  source: t("harvesting.field.harvesterId.source"),  ready: true  },
    { field: t("harvesting.field.photos"),       source: t("harvesting.field.photos.source"),       ready: true  },
    { field: t("harvesting.field.verification"), source: t("harvesting.field.verification.source"), ready: false },
  ];

  const integrations = [
    { label: t("harvesting.integration.odk"),     status: t("harvesting.status.notConnected"),  ok: false },
    { label: t("harvesting.integration.ona"),     status: t("harvesting.status.notConfigured"), ok: false },
    { label: t("harvesting.integration.linkage"), status: t("harvesting.status.pendingOdk"),     ok: false },
    { label: t("harvesting.integration.gee"),     status: t("harvesting.status.pending"),        ok: false },
  ];

  const traceSteps = [
    t("harvesting.trace.1"),
    t("harvesting.trace.2"),
    t("harvesting.trace.3"),
    t("harvesting.trace.4"),
    t("harvesting.trace.5"),
    t("harvesting.trace.6"),
  ];

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      <header className="border-b bg-white px-6 py-5" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          {t("harvesting.eyebrow")}
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>{t("harvesting.title")}</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          {t("harvesting.subtitle")}
        </p>
      </header>

      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info + placeholder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map placeholder */}
          <div className="rounded-xl border flex flex-col items-center justify-center"
            style={{ borderColor: C.border, background: "#f1f0ee", minHeight: 240 }}>
            <p className="text-sm font-semibold" style={{ color: C.muted }}>{t("harvesting.mapPlaceholder.title")}</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>{t("harvesting.mapPlaceholder.desc")}</p>
          </div>

          {/* Field requirements */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.border }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("harvesting.fieldRequirements.title")}</h2>
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
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("harvesting.integrations.title")}</h2>
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
            <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t("harvesting.traceability.title")}</h2>
            <div className="space-y-1">
              {traceSteps.map((step, i, arr) => (
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
