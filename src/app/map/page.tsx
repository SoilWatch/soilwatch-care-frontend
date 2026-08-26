import { loadBiocharData } from "../biochar/ona";
import { loadClearanceData } from "../biochar/clearance";
import { loadFieldTrialData } from "../biochar/fieldtrials";
import KilnMapClient from "@/components/KilnMapClient";
import { getT } from "@/lib/i18n/server";


const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const C = {
  border: "#1e293b", text: "#1c1917", muted: "#78716c",
  success: "#15803d", danger: "#b91c1c", warning: "#b45309",
  brand: "#c2410c",
};

export default async function MapPage() {
  const [dataSource, clearanceData, fieldTrialData, t] = await Promise.all([loadBiocharData(), loadClearanceData(), loadFieldTrialData(), getT()]);
  const batches = dataSource.batches;
  const clearanceSites = clearanceData.sites;
  const fieldTrialSites = fieldTrialData.sites;

  const kilnSet = new Map<string, { lat: number; lon: number; batches: number; totalKg: number; lastDate: string }>();
  batches.forEach(b => {
    const k = kilnSet.get(b.kiln_id) ?? { lat: b.production_lat, lon: b.production_lon, batches: 0, totalKg: 0, lastDate: "" };
    k.batches++;
    k.totalKg += b.data_source === "regain_kiln_operator" ? b.dry_kg : b.biochar_wet_weight_kg;
    if (b.production_date > k.lastDate) k.lastDate = b.production_date;
    kilnSet.set(b.kiln_id, k);
  });

  const stats = {
    kilns: kilnSet.size,
    batches: batches.length,
    operators: new Set(batches.map(b => b.operator_name)).size,
    csiOk: batches.filter(b => b.csi_compliant).length,
    clearanceSites: clearanceSites.length,
    fieldTrials: fieldTrialSites.length,
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#0f172a" }}>
      {/* Top bar */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center justify-between gap-4 border-b flex-wrap"
        style={{ background: "#0f172a", borderColor: "#1e293b" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>
            {t("map.eyebrow")}
          </p>
          <h1 className="text-white text-lg font-bold leading-tight">{t("map.title")}</h1>
        </div>
        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: t("map.stat.kilns"),     value: stats.kilns },
            { label: t("map.stat.batches"),   value: stats.batches },
            { label: t("map.stat.operators"), value: stats.operators },
            { label: t("map.stat.csiOk"),    value: stats.csiOk },
            { label: t("map.stat.sites"),       value: stats.clearanceSites },
            { label: t("map.stat.fieldTrials"), value: stats.fieldTrials },
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
            { label: t("map.legend.active"),          color: C.success },
            { label: t("map.legend.idle"),            color: C.warning },
            { label: t("map.legend.compliance"),      color: C.brand },
            { label: t("map.legend.safety"),          color: C.danger },
            { label: t("map.legend.clearanceSite"),  color: "#22c55e" },
            { label: t("map.legend.fieldTrial"),     color: "#ef4444" },
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
            <p className="text-white font-semibold">{t("map.tokenMissing.title")}</p>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              {t("map.tokenMissing.desc")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <KilnMapClient
            batches={batches}
            clearanceSites={clearanceSites}
            fieldTrialSites={fieldTrialSites}
            mapboxToken={MAPBOX_TOKEN}
          />
        </div>
      )}

      {/* Error banners */}
      {(dataSource.error || clearanceData.error || fieldTrialData.error) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 space-y-2">
          {dataSource.error && (
            <div className="rounded-xl border px-4 py-2 text-sm" style={{ background: "#7f1d1d", borderColor: C.danger, color: "#fecaca" }}>
              {t("map.error.ona", { error: dataSource.error })}
            </div>
          )}
          {clearanceData.error && (
            <div className="rounded-xl border px-4 py-2 text-sm" style={{ background: "#7f1d1d", borderColor: C.danger, color: "#fecaca" }}>
              {t("map.error.clearance", { error: clearanceData.error })}
            </div>
          )}
          {fieldTrialData.error && (
            <div className="rounded-xl border px-4 py-2 text-sm" style={{ background: "#7f1d1d", borderColor: C.danger, color: "#fecaca" }}>
              {t("map.error.fieldTrial", { error: fieldTrialData.error })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
