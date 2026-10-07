"use client";

import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { CONFIDENCE_PALETTE, PROSOPIS_VERSIONS, type ProsopisCompareMode, type ProsopisVersion } from "@/lib/prosopis";

interface Props {
  selected: ProsopisVersion;
  enabled: boolean;
  opacity: number;
  status: "idle" | "loading" | "ready" | "error";
  compareMode: ProsopisCompareMode;
  onCompareModeChange: (mode: ProsopisCompareMode) => void;
  onSelect: (layer: ProsopisVersion) => void;
  onToggle: (enabled: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onRetry: () => void;
  onZoom: () => void;
}

export default function ProsopisLayerPanel({ selected, enabled, opacity, status, compareMode, onCompareModeChange, onSelect, onToggle, onOpacityChange, onRetry, onZoom }: Props) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const comparingModels = compareMode === "model";
  const comparingKinds = compareMode === "kind";
  const comparing = comparingModels || comparingKinds;
  const models = [...new Set(PROSOPIS_VERSIONS.filter(layer => layer.coverage === selected.coverage).map(layer => layer.label))];

  function choose(coverage = selected.coverage, model = selected.label, kind = selected.kind) {
    const available = PROSOPIS_VERSIONS.filter(layer => layer.coverage === coverage && layer.kind === kind);
    const layer = available.find(layer => layer.label === model) ?? available[0];
    if (layer) onSelect(layer);
  }

  return (
    <aside aria-label={t("kilnMap.prosopis.panelTitle")}
      className={`absolute left-3 ${comparing ? "top-[4.5rem]" : "top-3"} z-10 w-72 max-w-[calc(100%-4rem)] overflow-hidden rounded-xl border border-stone-700 bg-stone-900 text-stone-100 shadow-xl lg:static lg:h-full lg:max-w-none lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:shadow-none ${collapsed ? "lg:w-14" : "lg:w-[292px]"}`}>
      <button type="button" aria-label={t("kilnMap.prosopis.panelTitle")} aria-expanded={!collapsed} aria-controls="prosopis-options" onClick={() => setCollapsed(value => !value)}
        className="flex w-full items-center gap-2.5 px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-orange-400">
        <Layers size={17} className="text-orange-400" aria-hidden="true" />
        <span className={`flex-1 text-sm font-semibold ${collapsed ? "lg:hidden" : ""}`}>{t("kilnMap.prosopis.panelTitle")}</span>
        <ChevronDown size={16} aria-hidden="true" className={`text-stone-400 transition-transform ${collapsed ? "-rotate-90 lg:hidden" : ""}`} />
      </button>
      {collapsed && <p className="px-4 pb-4 text-xs text-stone-400 lg:hidden">{t(`kilnMap.prosopis.${selected.coverage}`)} · {comparingKinds ? t("kilnMap.prosopis.bothViews") : t(`kilnMap.prosopis.view.${selected.kind}`)}</p>}
      <div id="prosopis-options" hidden={collapsed} className="max-h-[min(65dvh,640px)] overflow-y-auto px-4 pb-5 lg:max-h-[calc(100%-52px)]">
        <p className="mb-5 text-xs leading-relaxed text-stone-400">{t("kilnMap.prosopis.intro")}</p>

        <fieldset className="mb-5">
          <legend className="mb-2 text-xs font-semibold text-stone-200">{t("kilnMap.prosopis.area")}</legend>
          <div className="space-y-2">
            {(["south", "all"] as const).map(coverage => (
              <label key={coverage} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selected.coverage === coverage ? "border-orange-400/70 bg-orange-400/10" : "border-stone-700 hover:border-stone-500"}`}>
                <input type="radio" name="prosopis-area" value={coverage} checked={selected.coverage === coverage} onChange={() => choose(coverage)} className="accent-orange-400" />
                <span>
                  <span className="block text-xs font-medium">{t(`kilnMap.prosopis.${coverage}`)}</span>
                  <span className="mt-0.5 block text-[11px] text-stone-400">{t(`kilnMap.prosopis.detail.${coverage}`)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="mb-2 text-xs font-semibold text-stone-200">{t("kilnMap.prosopis.display")}</legend>
          {comparingKinds ? (
            <div className="rounded-lg border border-orange-400/30 bg-orange-400/5 p-3 text-xs">
              <p className="font-medium text-orange-200">{t("kilnMap.prosopis.comparingKinds")}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{t("kilnMap.prosopis.comparePairHint")}</p>
            </div>
          ) : <>
          <div className="flex rounded-lg border border-stone-700 bg-stone-950/40 p-1">
            {(["highConfidence", "confidence"] as const).map(kind => (
              <label key={kind} className="relative flex-1 cursor-pointer">
                <input type="radio" name="prosopis-display" value={kind} checked={selected.kind === kind} onChange={() => choose(undefined, undefined, kind)} className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
                <span className="block rounded-md px-1 py-2 text-center text-[11px] font-medium text-stone-400 peer-checked:bg-stone-700 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-orange-400">{t(`kilnMap.prosopis.view.${kind}`)}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-400">{t(`kilnMap.prosopis.explain.${selected.kind}`)}</p>
          </>}
          {!comparingModels && <button type="button" aria-pressed={comparingKinds} onClick={() => onCompareModeChange(comparingKinds ? "none" : "kind")}
            className="mt-3 w-full rounded-lg border border-orange-400/50 bg-orange-400/10 px-3 py-2.5 text-xs font-medium text-orange-200 hover:bg-orange-400/20">
            {t(comparingKinds ? "kilnMap.prosopis.singleMap" : "kilnMap.prosopis.comparePair")}
          </button>}
        </fieldset>

        <div className="mb-5">
          {comparingModels ? (
            <div className="rounded-lg border border-orange-400/30 bg-orange-400/5 p-3 text-xs">
              <p className="font-medium text-orange-200">{t("kilnMap.prosopis.comparingModels")}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{t("kilnMap.prosopis.compareHint")}</p>
            </div>
          ) : <>
          <label htmlFor="prosopis-model" className="mb-2 block text-xs font-semibold text-stone-200">{t("kilnMap.prosopis.model")}</label>
          <select id="prosopis-model" value={selected.label} onChange={event => choose(undefined, event.target.value)} disabled={models.length === 1}
            className="w-full rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-2.5 text-xs text-stone-100 focus:outline-orange-400 disabled:opacity-75">
            {models.map(model => <option key={model} value={model}>{t(`kilnMap.prosopis.model.${model}`)}</option>)}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-400">{t(selected.coverage === "all" ? "kilnMap.prosopis.regionalModel" : "kilnMap.prosopis.modelHint")}</p>
          </>}
          {selected.coverage === "south" && !comparingKinds && <button type="button" aria-pressed={comparingModels} onClick={() => onCompareModeChange(comparingModels ? "none" : "model")}
            className="mt-3 w-full rounded-lg border border-orange-400/50 bg-orange-400/10 px-3 py-2.5 text-xs font-medium text-orange-200 hover:bg-orange-400/20">
            {t(comparingModels ? "kilnMap.prosopis.singleMap" : "kilnMap.prosopis.compareModels")}
          </button>}
        </div>

        <div className="border-t border-stone-700 pt-4">
          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs font-medium">
            {t("kilnMap.prosopis.showOverlay")}
            <input type="checkbox" role="switch" checked={enabled} onChange={event => onToggle(event.target.checked)} className="h-4 w-4 accent-orange-400" />
          </label>
          {!enabled && <p className="mt-2 text-[11px] text-stone-400">{t("kilnMap.prosopis.hidden")}</p>}
          {enabled && (
            <>
              <div role="status" className="mt-3 text-[11px] text-stone-400">
                {status === "loading" || status === "idle" ? t("kilnMap.prosopis.loading") : status === "error" ? t("kilnMap.prosopis.error") : t("kilnMap.prosopis.predictionNote")}
              </div>
              {status === "error" && <button type="button" onClick={onRetry} className="mt-2 text-xs text-orange-300 underline">{t("kilnMap.prosopis.retry")}</button>}
              {status === "ready" && (
                <>
                  <div className="my-4 space-y-3 rounded-lg bg-stone-950/40 p-3">
                    {(comparingKinds || selected.kind === "highConfidence") && (
                      <div className="flex items-center gap-2 text-[11px]"><span className="h-3 w-3 shrink-0 rounded-sm bg-[#8B0000] ring-1 ring-red-300/30" /><span>{t("kilnMap.prosopis.presenceFriendly")}</span></div>
                    )}
                    {(comparingKinds || selected.kind === "confidence") && (
                      <div>
                        <div className="h-2 rounded-full" style={{ background: `linear-gradient(to right, ${CONFIDENCE_PALETTE.join(",")})` }} />
                        <div className="mt-1.5 flex justify-between text-[10px] text-stone-300"><span>0%</span><span>50%</span><span>100%</span></div>
                        <p className="mt-2 text-[10px] leading-relaxed text-stone-400">{t("kilnMap.prosopis.thresholdFriendly")}</p>
                      </div>
                    )}
                  </div>
                  <label className="block text-xs">
                    <span className="mb-2 flex justify-between text-stone-300"><span>{t("kilnMap.prosopis.opacity")}</span><span>{Math.round(opacity * 100)}%</span></span>
                    <input aria-label={t("kilnMap.prosopis.opacity")} type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={event => onOpacityChange(Number(event.target.value))} className="w-full accent-orange-400" />
                  </label>
                  <button type="button" onClick={onZoom} className="mt-3 w-full rounded-lg border border-stone-600 py-2 text-xs font-medium hover:bg-stone-800">{t("kilnMap.prosopis.zoomArea")}</button>
                </>
              )}
            </>
          )}
        </div>
        <details className="mt-5 border-t border-stone-700 pt-3 text-[10px] text-stone-500">
          <summary className="cursor-pointer text-stone-400">{t("kilnMap.prosopis.dataDetails")}</summary>
          <p className="mt-2 leading-relaxed">{t("kilnMap.prosopis.model")}: {comparingModels ? "v22 / v22_distRoads" : selected.label}<br />{comparingKinds ? `${t("kilnMap.prosopis.highConfidence")} + ${t("kilnMap.prosopis.confidence")}` : t(`kilnMap.prosopis.${selected.kind}`)} · {selected.resolution} m</p>
        </details>
      </div>
    </aside>
  );
}
