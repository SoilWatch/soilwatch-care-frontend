"use client";

import { useCallback, useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import KilnMap, { type KilnMapProps } from "./KilnMap";
import ProsopisLayerPanel from "./ProsopisLayerPanel";
import { PROSOPIS_VERSIONS, type ProsopisCompareMode, type ProsopisVersion } from "@/lib/prosopis";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LayerStatus = "idle" | "loading" | "ready" | "error";
const BOUNDS: Record<ProsopisVersion["coverage"], [[number, number], [number, number]]> = {
  south: [[39.799679, 8.830170], [41.208956, 11.167227]],
  all: [[39.649840, 8.840321], [42.404973, 14.561691]],
};

export default function ProsopisMapExplorer(props: KilnMapProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(PROSOPIS_VERSIONS[0]);
  const [enabled, setEnabled] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [compareMode, setCompareMode] = useState<ProsopisCompareMode>("none");
  const [retryToken, setRetryToken] = useState(0);
  const [leftStatuses, setLeftStatuses] = useState<Record<string, LayerStatus>>({});
  const [rightStatuses, setRightStatuses] = useState<Record<string, LayerStatus>>({});
  const [leftMap, setLeftMap] = useState<mapboxgl.Map | null>(null);
  const [rightMap, setRightMap] = useState<mapboxgl.Map | null>(null);
  const comparingModels = compareMode === "model" && selected.coverage === "south";
  const comparingKinds = compareMode === "kind";
  const comparing = comparingModels || comparingKinds;
  const leftLayer = comparingModels
    ? PROSOPIS_VERSIONS.find(layer => layer.coverage === "south" && layer.label === "v22" && layer.kind === selected.kind)!
    : comparingKinds
    ? PROSOPIS_VERSIONS.find(layer => layer.coverage === selected.coverage && layer.label === selected.label && layer.kind === "highConfidence")!
    : selected;
  const rightLayer = comparingKinds
    ? PROSOPIS_VERSIONS.find(layer => layer.coverage === selected.coverage && layer.label === selected.label && layer.kind === "confidence")!
    : PROSOPIS_VERSIONS.find(layer => layer.coverage === "south" && layer.label === "v22_distRoads" && layer.kind === selected.kind)!;
  const leftStatus = leftStatuses[leftLayer.id] ?? "idle";
  const rightStatus = rightMap ? rightStatuses[rightLayer.id] ?? "idle" : "idle";
  const status = comparing
    ? [leftStatus, rightStatus].includes("error") ? "error" : leftStatus === "ready" && rightStatus === "ready" ? "ready" : "loading"
    : leftStatus;

  const reportLeftStatus = useCallback((id: string, next: LayerStatus) => {
    setLeftStatuses(current => current[id] === next ? current : { ...current, [id]: next });
  }, []);
  const reportRightStatus = useCallback((id: string, next: LayerStatus) => {
    setRightStatuses(current => current[id] === next ? current : { ...current, [id]: next });
  }, []);

  // Both panes share a camera; moving either one updates the other. The guard
  // prevents jumpTo's synchronous move event from bouncing between maps.
  useEffect(() => {
    if (!comparing || !leftMap || !rightMap) return;
    let syncing = false;
    const sync = (source: mapboxgl.Map, target: mapboxgl.Map) => {
      if (syncing) return;
      syncing = true;
      try {
        target.jumpTo({ center: source.getCenter(), zoom: source.getZoom(), bearing: source.getBearing(), pitch: source.getPitch() });
      } finally {
        syncing = false;
      }
    };
    leftMap.stop();
    rightMap.stop();
    sync(leftMap, rightMap);
    const fromLeft = () => sync(leftMap, rightMap);
    const fromRight = () => sync(rightMap, leftMap);
    leftMap.on("move", fromLeft);
    rightMap.on("move", fromRight);
    return () => {
      leftMap.off("move", fromLeft);
      rightMap.off("move", fromRight);
    };
  }, [comparing, leftMap, rightMap]);

  // Fit after React has resized the panes when leaving comparison, so the
  // selected area's bounds are calculated against the current map width.
  useEffect(() => {
    if (!leftMap) return;
    leftMap.resize();
    leftMap.fitBounds(BOUNDS[selected.coverage], { padding: 50, maxZoom: 13 });
  }, [leftMap, selected.coverage]);

  function selectLayer(layer: ProsopisVersion) {
    if (compareMode === "model" && layer.coverage !== "south") {
      setCompareMode("none");
    }
    setSelected(layer);
  }

  const leftHeading = comparingKinds ? t("kilnMap.prosopis.view.highConfidence") : t("kilnMap.prosopis.model.v22");
  const rightHeading = comparingKinds ? t("kilnMap.prosopis.view.confidence") : t("kilnMap.prosopis.model.v22_distRoads");
  const paneSubtitle = comparingKinds ? t(`kilnMap.prosopis.model.${selected.label}`) : t(`kilnMap.prosopis.view.${selected.kind}`);

  return (
    <div className="relative flex h-full w-full min-w-0">
      <ProsopisLayerPanel
        selected={selected} enabled={enabled} opacity={opacity} status={status}
        compareMode={compareMode} onCompareModeChange={setCompareMode}
        onSelect={selectLayer} onToggle={setEnabled} onOpacityChange={setOpacity}
        onRetry={() => setRetryToken(current => current + 1)}
        onZoom={() => leftMap?.fitBounds(BOUNDS[selected.coverage], { padding: 50, maxZoom: 13 })}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {comparing && <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-700 bg-stone-900 px-4 py-2 text-[11px] text-stone-300">
          <span>{t("kilnMap.prosopis.linkedViews")}</span>
          <button type="button" onClick={() => setCompareMode("none")} className="shrink-0 text-orange-300 hover:underline">{t("kilnMap.prosopis.singleMap")}</button>
        </div>}
        <div className={`grid min-h-0 flex-1 ${comparing ? "grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1" : "grid-cols-1"}`}>
          <section aria-label={comparing ? leftHeading : t(`kilnMap.prosopis.model.${leftLayer.label}`)} className="relative flex min-h-0 min-w-0 flex-col">
            {comparing && <div className="shrink-0 border-b border-stone-700 bg-stone-800 px-3 py-2 text-xs text-white">
              <span className="font-semibold">{leftHeading}</span>
              <span className="ml-2 text-stone-400">{paneSubtitle} · {leftLayer.resolution} m</span>
              {enabled && leftStatus !== "ready" && <span role="status" className="ml-2 text-orange-300">{t(leftStatus === "error" ? "kilnMap.prosopis.error" : "kilnMap.prosopis.loading")}</span>}
            </div>}
            <div className="min-h-0 flex-1">
              <KilnMap {...props} prosopisLayer={leftLayer} prosopisEnabled={enabled} overlayOpacity={opacity} retryToken={retryToken} onMapReady={setLeftMap} onLayerStatus={reportLeftStatus} />
            </div>
          </section>
          {comparing && <section aria-label={rightHeading} className="relative flex min-h-0 min-w-0 flex-col border-t border-stone-600 md:border-l md:border-t-0">
            <div className="shrink-0 border-b border-stone-700 bg-stone-800 px-3 py-2 text-xs text-white">
              <span className="font-semibold">{rightHeading}</span>
              <span className="ml-2 text-stone-400">{paneSubtitle} · {rightLayer.resolution} m</span>
              {enabled && rightStatus !== "ready" && <span role="status" className="ml-2 text-orange-300">{t(rightStatus === "error" ? "kilnMap.prosopis.error" : "kilnMap.prosopis.loading")}</span>}
            </div>
            <div className="min-h-0 flex-1">
              <KilnMap {...props} prosopisLayer={rightLayer} prosopisEnabled={enabled} overlayOpacity={opacity} retryToken={retryToken} onMapReady={setRightMap} onLayerStatus={reportRightStatus} showLegend={false} />
            </div>
          </section>}
        </div>
      </div>
    </div>
  );
}
