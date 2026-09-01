"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import parseGeoraster from "georaster";
import type { Batch } from "@/app/biochar/data";
import { ACTIVE_WINDOW_DAYS } from "@/app/biochar/data";
import type { ClearanceSite } from "@/app/biochar/clearance";
import type { FieldTrialSite } from "@/app/biochar/fieldtrials";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface ProsopisVersion {
  id: string;
  label: string;
  url: string;
  color: [number, number, number];
}

const PROSOPIS_VERSIONS: ProsopisVersion[] = [
  { id: "v17", label: "Prosopis v17", url: "https://storage.googleapis.com/soilwatch-gee/Afar_Prosopis_v17_highConfidence.tif", color: [185, 28, 28] },
  { id: "v19", label: "Prosopis v19", url: "https://storage.googleapis.com/soilwatch-gee/Afar_Prosopis_v19_highConfidence.tif", color: [234, 88, 12] },
];
const PROSOPIS_DEFAULT_OPACITY = 1;
const MAX_CANVAS_DIMENSION = 2048;

type ImageCoords = [[number, number], [number, number], [number, number], [number, number]];

async function rasterToImageSource(url: string, color: [number, number, number]): Promise<{ dataUrl: string; coordinates: ImageCoords }> {
  const response = await fetch(url);
  const raster = await parseGeoraster(await response.arrayBuffer());
  const { width: srcWidth, height: srcHeight, values, noDataValue, xmin, xmax, ymin, ymax } = raster;
  const band = values[0];

  const scale = Math.min(1, MAX_CANVAS_DIMENSION / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);

  for (let row = 0; row < height; row++) {
    const srcRow = Math.min(srcHeight - 1, Math.floor(row / scale));
    for (let col = 0; col < width; col++) {
      const srcCol = Math.min(srcWidth - 1, Math.floor(col / scale));
      const value = band[srcRow][srcCol];
      const i = (row * width + col) * 4;
      const detected = value !== noDataValue && value !== 0 && !Number.isNaN(value);
      image.data[i] = color[0];
      image.data[i + 1] = color[1];
      image.data[i + 2] = color[2];
      image.data[i + 3] = detected ? 255 : 0;
    }
  }
  ctx.putImageData(image, 0, 0);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    coordinates: [[xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]],
  };
}

const TODAY = new Date().toISOString().slice(0, 10);
function daysBetween(d: string) {
  return Math.max(0, Math.floor((new Date(TODAY).getTime() - new Date(d).getTime()) / 86400000));
}

const STATUS_COLOR = {
  active:     "#15803d",
  compliance: "#c2410c",
  safety:     "#b91c1c",
  idle:       "#b45309",
} as const;

type KilnStatus = keyof typeof STATUS_COLOR;

interface KilnSummary {
  id: string;
  lat: number;
  lng: number;
  totalKg: number;
  batchCount: number;
  lastDate: string;
  daysIdle: number;
  status: KilnStatus;
  complianceFails: number;
  safetyBatches: number;
  regainOnly: boolean;
}

function aggregateKilns(batches: Batch[]): KilnSummary[] {
  const map = new Map<string, Batch[]>();
  batches.forEach(b => {
    if (!map.has(b.kiln_id)) map.set(b.kiln_id, []);
    map.get(b.kiln_id)!.push(b);
  });

  return Array.from(map.entries()).map(([id, bs]) => {
    const sorted = [...bs].sort((a, b) => b.production_date.localeCompare(a.production_date));
    const last = sorted[0];
    // Fall back to the most recent batch that actually has GPS — a regain
    // log with no coordinates shouldn't knock an otherwise well-located
    // kiln off the map just because it's the latest record.
    const withGps = sorted.find(b => b.production_lat !== 0 && b.production_lon !== 0);
    const lat = withGps?.production_lat || 0;
    const lng = withGps?.production_lon || 0;
    const daysIdle = daysBetween(last.production_date);
    const totalKg = bs.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
    const recent = bs.filter(b => daysBetween(b.production_date) <= 30);
    const safetyBatches = recent.filter(b => b.safety_incidents.toLowerCase() !== "none").length;
    const complianceFails = recent.filter(b => b.compliance_fails > 0).length;
    // regain_kiln_operator doesn't capture output weight, so a kiln with
    // only regain records always renders at the minimum marker size — not
    // a data bug, just nothing to size the marker by. Flagged so the
    // legend/popup can explain it instead of leaving it a mystery.
    const regainOnly = bs.every(b => b.data_source === "regain_kiln_operator");

    let status: KilnStatus = "active";
    if (safetyBatches > 0) status = "safety";
    else if (complianceFails > 0) status = "compliance";
    else if (daysIdle > ACTIVE_WINDOW_DAYS) status = "idle";

    return { id, lat, lng, totalKg, batchCount: bs.length, lastDate: last.production_date, daysIdle, status, complianceFails, safetyBatches, regainOnly };
  }).filter(k => k.lat !== 0 && k.lng !== 0);
}

interface Props {
  batches: Batch[];
  clearanceSites?: ClearanceSite[];
  fieldTrialSites?: FieldTrialSite[];
  mapboxToken: string;
  selectedKiln?: string | null;
  onKilnSelect?: (id: string | null) => void;
  style?: "satellite" | "streets";
}

const STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets:   "mapbox://styles/mapbox/streets-v12",
};

export default function KilnMap({
  batches, clearanceSites = [], fieldTrialSites = [], mapboxToken, selectedKiln, onKilnSelect,
  style = "satellite",
}: Props) {
  const { t } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [ready, setReady] = useState(false);

  const prosopisCache = useRef<Record<string, { dataUrl: string; coordinates: ImageCoords }>>({});
  const prosopisLoading = useRef<Record<string, boolean>>({});
  const [prosopisVisible, setProsopisVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PROSOPIS_VERSIONS.map(v => [v.id, v.id === PROSOPIS_VERSIONS[0].id])),
  );
  const [prosopisOpacity, setProsopisOpacity] = useState<Record<string, number>>(
    () => Object.fromEntries(PROSOPIS_VERSIONS.map(v => [v.id, PROSOPIS_DEFAULT_OPACITY])),
  );
  const [prosopisStatus, setProsopisStatus] = useState<Record<string, "idle" | "loading" | "ready" | "error">>(
    () => Object.fromEntries(PROSOPIS_VERSIONS.map(v => [v.id, v.id === PROSOPIS_VERSIONS[0].id ? "loading" : "idle"])),
  );

  function loadProsopisVersion(version: ProsopisVersion) {
    const m = map.current;
    if (!m) return;

    const sourceId = `prosopis-raster-${version.id}`;
    const layerId = `prosopis-raster-layer-${version.id}`;

    const addToMap = (cached: { dataUrl: string; coordinates: ImageCoords }) => {
      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, { type: "image", url: cached.dataUrl, coordinates: cached.coordinates });
      }
      if (!m.getLayer(layerId)) {
        m.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          layout: { visibility: prosopisVisible[version.id] ? "visible" : "none" },
          paint: { "raster-opacity": prosopisOpacity[version.id] ?? PROSOPIS_DEFAULT_OPACITY },
        });
      }
    };

    if (prosopisCache.current[version.id]) {
      addToMap(prosopisCache.current[version.id]);
      return;
    }
    if (prosopisLoading.current[version.id]) return;
    prosopisLoading.current[version.id] = true;
    setProsopisStatus(s => ({ ...s, [version.id]: "loading" }));

    rasterToImageSource(version.url, version.color)
      .then(result => {
        prosopisCache.current[version.id] = result;
        setProsopisStatus(s => ({ ...s, [version.id]: "ready" }));
        addToMap(result);
      })
      .catch(() => setProsopisStatus(s => ({ ...s, [version.id]: "error" })))
      .finally(() => { prosopisLoading.current[version.id] = false; });
  }

  function ensureProsopisLayers() {
    PROSOPIS_VERSIONS.filter(version => prosopisVisible[version.id]).forEach(loadProsopisVersion);
  }

  const kilns = aggregateKilns(batches);
  const maxKg = Math.max(...kilns.map(k => k.totalKg), 1);

  useEffect(() => {
    if (!container.current || map.current) return;
    mapboxgl.accessToken = mapboxToken;

    const center = kilns.length
      ? [kilns.reduce((s, k) => s + k.lng, 0) / kilns.length, kilns.reduce((s, k) => s + k.lat, 0) / kilns.length] as [number, number]
      : [40.5, 11.5] as [number, number];

    map.current = new mapboxgl.Map({
      container: container.current,
      style: STYLES[style],
      center,
      zoom: 9,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    popup.current = new mapboxgl.Popup({ closeButton: false, maxWidth: "260px" });

    map.current.on("load", () => {
      // Gather all coordinates: kiln locations + clearance polygon vertices
      const allLngs: number[] = kilns.map(k => k.lng);
      const allLats: number[] = kilns.map(k => k.lat);
      clearanceSites.forEach(s => {
        s.polygon.coordinates[0].forEach(([lon, lat]) => {
          allLngs.push(lon);
          allLats.push(lat);
        });
      });

      const validLngs = allLngs.filter(isFinite);
      const validLats = allLats.filter(isFinite);

      if (validLngs.length > 1) {
        const sw: [number, number] = [Math.min(...validLngs), Math.min(...validLats)];
        const ne: [number, number] = [Math.max(...validLngs), Math.max(...validLats)];
        if (ne[0] - sw[0] > 0.001 || ne[1] - sw[1] > 0.001) {
          map.current?.fitBounds([sw, ne], { padding: 80, maxZoom: 13 });
        }
      }
      setReady(true);
    });

    return () => { map.current?.remove(); map.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Update style
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.setStyle(STYLES[style]);
    map.current.once("styledata", () => setReady(r => { if (r) renderLayers(); return r; }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  function renderLayers() {
    const m = map.current;
    if (!m) return;

    // Remove existing layers/sources
    ["kilns-cluster", "kilns-cluster-count", "kilns-glow", "kilns-circle", "kilns-label",
     "clearance-fill", "clearance-outline", "clearance-label",
     "field-trial-fill", "field-trial-outline", "field-trial-label"].forEach(id => {
      if (m.getLayer(id)) m.removeLayer(id);
    });
    ["kilns", "clearance", "field-trials"].forEach(id => {
      if (m.getSource(id)) m.removeSource(id);
    });

    // Clearance site polygons
    m.addSource("clearance", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: clearanceSites.map(s => ({
          type: "Feature" as const,
          geometry: s.polygon,
          properties: { site_id: s.site_id, submission_time: s.submission_time },
        })),
      },
    });

    m.addLayer({
      id: "clearance-fill",
      type: "fill",
      source: "clearance",
      paint: { "fill-color": "#22c55e", "fill-opacity": 0.32 },
    });

    m.addLayer({
      id: "clearance-outline",
      type: "line",
      source: "clearance",
      paint: { "line-color": "#4ade80", "line-width": 3, "line-opacity": 1 },
    });

    m.addLayer({
      id: "clearance-label",
      type: "symbol",
      source: "clearance",
      layout: {
        "text-field": ["get", "site_id"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": 12,
        "text-anchor": "center",
      },
      paint: { "text-color": "#fff", "text-halo-color": "#14532d", "text-halo-width": 2 },
    });

    m.on("click", "clearance-fill", e => {
      const props = e.features?.[0]?.properties;
      if (!props) return;
      const date = props.submission_time ? new Date(props.submission_time).toLocaleDateString() : "—";
      popup.current?.setLngLat(e.lngLat).setHTML(`
        <div style="font-family:system-ui;font-size:12px;color:#1c1917;padding:2px">
          <div style="font-weight:600;margin-bottom:4px">Clearance Site</div>
          <div style="color:#78716c">ID: ${props.site_id}</div>
          <div style="color:#78716c">Submitted: ${date}</div>
        </div>
      `).addTo(m);
    });

    m.on("mouseenter", "clearance-fill", () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "clearance-fill", () => { m.getCanvas().style.cursor = ""; });

    m.addSource("field-trials", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: fieldTrialSites.map(s => ({
          type: "Feature" as const,
          geometry: s.polygon,
          properties: { site_id: s.site_id, submission_id: s.submission_id, submission_time: s.submission_time },
        })),
      },
    });

    m.addLayer({
      id: "field-trial-fill",
      type: "fill",
      source: "field-trials",
      paint: { "fill-color": "#ef4444", "fill-opacity": 0.15 },
    });

    m.addLayer({
      id: "field-trial-outline",
      type: "line",
      source: "field-trials",
      paint: { "line-color": "#ef4444", "line-width": 2, "line-opacity": 0.9 },
    });

    m.addLayer({
      id: "field-trial-label",
      type: "symbol",
      source: "field-trials",
      layout: {
        "text-field": ["get", "site_id"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": 11,
        "text-anchor": "center",
      },
      paint: { "text-color": "#fff", "text-halo-color": "#7f1d1d", "text-halo-width": 1.5 },
    });

    m.on("click", "field-trial-fill", e => {
      const props = e.features?.[0]?.properties;
      if (!props) return;
      const date = props.submission_time ? new Date(props.submission_time).toLocaleDateString() : "—";
      popup.current?.setLngLat(e.lngLat).setHTML(`
        <div style="font-family:system-ui;font-size:12px;color:#1c1917;padding:2px">
          <div style="font-weight:600;margin-bottom:4px">${props.site_id}</div>
          <div style="color:#78716c">ONA ID: ${props.submission_id}</div>
          <div style="color:#78716c">Submitted: ${date}</div>
        </div>
      `).addTo(m);
    });

    m.on("mouseenter", "field-trial-fill", () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "field-trial-fill", () => { m.getCanvas().style.cursor = ""; });

    // Kiln source — clustered, since some kilns sit meters apart (same
    // site) while others are tens of km away. Without clustering, close-by
    // kilns draw exactly on top of each other and only the last-drawn one
    // is visible — not a missing-data bug, a rendering one.
    m.addSource("kilns", {
      type: "geojson",
      cluster: true,
      clusterRadius: 45,
      clusterMaxZoom: 13,
      data: {
        type: "FeatureCollection",
        features: kilns.map(k => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [k.lng, k.lat] },
          properties: { ...k, color: STATUS_COLOR[k.status], radius: 14 + (k.totalKg / maxKg) * 14 },
        })),
      },
    });

    // Cluster circles (2+ kilns too close together to draw separately at the current zoom)
    m.addLayer({
      id: "kilns-cluster",
      type: "circle",
      source: "kilns",
      filter: ["has", "point_count"],
      paint: {
        "circle-radius": ["+", 16, ["*", 2, ["min", ["get", "point_count"], 8]]],
        "circle-color": "#1c1917",
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#fb923c",
        "circle-opacity": 0.92,
      },
    });

    m.addLayer({
      id: "kilns-cluster-count",
      type: "symbol",
      source: "kilns",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": 13,
      },
      paint: { "text-color": "#fff" },
    });

    // Glow ring (unclustered kilns only)
    m.addLayer({
      id: "kilns-glow",
      type: "circle",
      source: "kilns",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": ["+", ["get", "radius"], 8],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.3,
        "circle-radius-transition": { duration: 300 },
      },
    });

    // Main circle (unclustered kilns only)
    m.addLayer({
      id: "kilns-circle",
      type: "circle",
      source: "kilns",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": ["get", "radius"],
        "circle-color": ["get", "color"],
        "circle-stroke-width": selectedKiln ? ["case", ["==", ["get", "id"], selectedKiln], 4, 2.5] : 2.5,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.95,
      },
    });

    // Labels (unclustered kilns only)
    m.addLayer({
      id: "kilns-label",
      type: "symbol",
      source: "kilns",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "text-field": ["get", "id"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": 13,
        "text-offset": [0, 2],
        "text-anchor": "top",
      },
      paint: { "text-color": "#fff", "text-halo-color": "#1c1917", "text-halo-width": 1.5 },
    });

    // Click a cluster to zoom in until it splits apart
    m.on("click", "kilns-cluster", e => {
      const feature = e.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      if (clusterId === undefined) return;
      const source = m.getSource("kilns") as mapboxgl.GeoJSONSource;
      const [lng, lat] = (feature!.geometry as GeoJSON.Point).coordinates;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        m.easeTo({ center: [lng, lat], zoom });
      });
    });
    m.on("mouseenter", "kilns-cluster", () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "kilns-cluster", () => { m.getCanvas().style.cursor = ""; });

    // Click interaction
    m.on("click", "kilns-circle", e => {
      const props = e.features?.[0]?.properties;
      if (!props) return;
      onKilnSelect?.(props.id);
      popup.current?.setLngLat(e.lngLat).setHTML(`
        <div style="font-family:system-ui;font-size:12px;color:#1c1917;padding:2px">
          <div style="font-weight:600;margin-bottom:4px">${props.id}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${props.color}"></span>
            <span style="text-transform:capitalize">${props.status}</span>
          </div>
          <div style="color:#78716c">${props.batchCount} ${t("kilnMap.popup.batches")} · ${Number(props.totalKg).toFixed(0)} kg</div>
          <div style="color:#78716c">${t("kilnMap.popup.last", { date: props.lastDate, days: props.daysIdle })}</div>
          ${props.regainOnly ? `
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e7e5e4;color:#b45309;font-size:11px">
            ${t("kilnMap.popup.regainOnly")}
          </div>` : ""}
        </div>
      `).addTo(m);
    });

    m.on("mouseenter", "kilns-circle", () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "kilns-circle", () => { m.getCanvas().style.cursor = ""; });
    m.on("click", e => {
      const features = m.queryRenderedFeatures(e.point, { layers: ["kilns-circle"] });
      if (!features.length) { popup.current?.remove(); onKilnSelect?.(null); }
    });

    ensureProsopisLayers();
  }

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    PROSOPIS_VERSIONS.forEach(version => {
      const layerId = `prosopis-raster-layer-${version.id}`;
      if (!m.getLayer(layerId)) return;
      m.setLayoutProperty(layerId, "visibility", prosopisVisible[version.id] ? "visible" : "none");
    });
  }, [prosopisVisible]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    PROSOPIS_VERSIONS.forEach(version => {
      const layerId = `prosopis-raster-layer-${version.id}`;
      if (!m.getLayer(layerId)) return;
      m.setPaintProperty(layerId, "raster-opacity", prosopisOpacity[version.id] ?? PROSOPIS_DEFAULT_OPACITY);
    });
  }, [prosopisOpacity]);

  useEffect(() => {
    if (ready) renderLayers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, batches, clearanceSites, fieldTrialSites]);

  function fitToKilns() {
    if (!map.current || kilns.length === 0) return;
    if (kilns.length === 1) {
      map.current.flyTo({ center: [kilns[0].lng, kilns[0].lat], zoom: 12 });
      return;
    }
    const lngs = kilns.map(k => k.lng);
    const lats = kilns.map(k => k.lat);
    map.current.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, maxZoom: 13 },
    );
  }

  const hasZeroWeightKiln = kilns.some(k => k.totalKg === 0);

  return (
    <div className="relative w-full h-full">
      <div ref={container} className="w-full h-full" />

      {/* Prosopis layer control */}
      <div
        className="absolute top-3 left-3 z-10 rounded-xl shadow-lg px-3.5 py-3 text-xs"
        style={{ background: "rgba(28,25,23,0.9)", color: "#fff", backdropFilter: "blur(4px)", minWidth: 200 }}
      >
        <p className="font-semibold text-[10px] uppercase tracking-wider mb-2" style={{ color: "#a8a29e" }}>
          {t("kilnMap.prosopis.title")}
        </p>
        {PROSOPIS_VERSIONS.map((version, i) => {
          const status = prosopisStatus[version.id];
          const visible = prosopisVisible[version.id];
          const opacity = prosopisOpacity[version.id] ?? PROSOPIS_DEFAULT_OPACITY;
          return (
            <div key={version.id} className={i > 0 ? "mt-2 pt-2 border-t" : ""} style={i > 0 ? { borderColor: "#44403c" } : undefined}>
              <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={e => {
                    const checked = e.target.checked;
                    setProsopisVisible(v => ({ ...v, [version.id]: checked }));
                    if (checked) loadProsopisVersion(version);
                  }}
                  disabled={status === "loading"}
                  style={{ width: 14, height: 14 }}
                />
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: `rgb(${version.color.join(",")})` }} />
                <span>
                  {version.label} — {status === "loading" ? t("kilnMap.prosopis.loading")
                    : status === "error" ? t("kilnMap.prosopis.error")
                    : t("kilnMap.prosopis.show")}
                </span>
              </label>
              {status === "ready" && (
                <div className={visible ? "" : "opacity-40 pointer-events-none"}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: "#a8a29e" }}>{t("kilnMap.prosopis.opacity")}</span>
                    <span>{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={e => setProsopisOpacity(o => ({ ...o, [version.id]: Number(e.target.value) }))}
                    className="w-full"
                    style={{ height: 4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {kilns.length > 0 && (
        <button
          onClick={fitToKilns}
          className="absolute bottom-8 left-3 z-10 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow transition-opacity hover:opacity-90"
          style={{ background: "#1c1917", color: "#fff", opacity: 0.85 }}>
          {t("kilnMap.fitToKilns")}
        </button>
      )}

      {/* Legend */}
      <div
        className="absolute bottom-8 right-3 z-10 rounded-xl shadow-lg px-3.5 py-3 text-xs"
        style={{ background: "rgba(28,25,23,0.9)", color: "#fff", backdropFilter: "blur(4px)", minWidth: 168 }}
      >
        <p className="font-semibold text-[10px] uppercase tracking-wider mb-2" style={{ color: "#a8a29e" }}>
          {t("kilnMap.legend.kilnStatus")}
        </p>
        <div className="space-y-1.5">
          {([
            ["active", t("kilnMap.legend.active")],
            ["idle", t("kilnMap.legend.idle", { n: ACTIVE_WINDOW_DAYS })],
            ["compliance", t("kilnMap.legend.compliance")],
            ["safety", t("kilnMap.legend.safety")],
          ] as [KilnStatus, string][]).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLOR[status] }}
              />
              <span style={{ color: "#e7e5e4" }}>{label}</span>
            </div>
          ))}
        </div>

        <p className="font-semibold text-[10px] uppercase tracking-wider mt-3 mb-2 pt-2.5 border-t" style={{ color: "#a8a29e", borderColor: "#44403c" }}>
          {t("kilnMap.legend.mapMarkers")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: "#22c55e", opacity: 0.6 }} />
            <span style={{ color: "#e7e5e4" }}>{t("kilnMap.legend.clearanceSite")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: "#ef4444", opacity: 0.6 }} />
            <span style={{ color: "#e7e5e4" }}>{t("kilnMap.legend.fieldTrial")}</span>
          </div>
          {PROSOPIS_VERSIONS.map(version => (
            <div key={version.id} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: `rgb(${version.color.join(",")})` }} />
              <span style={{ color: "#e7e5e4" }}>{version.label} (GEE)</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: "#1c1917", border: "1.5px solid #fb923c" }}
            />
            <span style={{ color: "#e7e5e4" }}>{t("kilnMap.legend.cluster")}</span>
          </div>
        </div>
        <p className="text-[10px] mt-2.5 pt-2.5 border-t" style={{ color: "#a8a29e", borderColor: "#44403c" }}>
          {t("kilnMap.legend.markerSize")}
        </p>
        {hasZeroWeightKiln && (
          <p className="text-[10px] mt-1" style={{ color: "#fb923c" }}>
            {t("kilnMap.legend.zeroWeight")}
          </p>
        )}
      </div>
    </div>
  );
}
