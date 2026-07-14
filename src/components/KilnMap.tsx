"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Batch } from "@/app/biochar/data";
import { ACTIVE_WINDOW_DAYS } from "@/app/biochar/data";

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
    const lat = last.production_lat || 0;
    const lng = last.production_lon || 0;
    const daysIdle = daysBetween(last.production_date);
    const totalKg = bs.reduce((s, b) => s + b.biochar_wet_weight_kg, 0);
    const recent = bs.filter(b => daysBetween(b.production_date) <= 30);
    const safetyBatches = recent.filter(b => b.safety_incidents.toLowerCase() !== "none").length;
    const complianceFails = recent.filter(b => b.compliance_fails > 0).length;

    let status: KilnStatus = "active";
    if (safetyBatches > 0) status = "safety";
    else if (complianceFails > 0) status = "compliance";
    else if (daysIdle > ACTIVE_WINDOW_DAYS) status = "idle";

    return { id, lat, lng, totalKg, batchCount: bs.length, lastDate: last.production_date, daysIdle, status, complianceFails, safetyBatches };
  }).filter(k => k.lat !== 0 && k.lng !== 0);
}

interface Props {
  batches: Batch[];
  mapboxToken: string;
  selectedKiln?: string | null;
  onKilnSelect?: (id: string | null) => void;
  showFeedstockLines?: boolean;
  showFeedstockMarkers?: boolean;
  style?: "satellite" | "streets";
}

const STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets:   "mapbox://styles/mapbox/streets-v12",
};

export default function KilnMap({
  batches, mapboxToken, selectedKiln, onKilnSelect,
  showFeedstockLines = true, showFeedstockMarkers = true,
  style = "satellite",
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [ready, setReady] = useState(false);

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
      // Fit to show all kilns if there are multiple with valid coords
      if (kilns.length > 1) {
        const lngs = kilns.map(k => k.lng);
        const lats = kilns.map(k => k.lat);
        const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
        const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
        // Only fit if bounds span more than a few meters
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
    ["kilns-glow", "kilns-circle", "kilns-label",
     "feedstock-lines", "feedstock-markers"].forEach(id => {
      if (m.getLayer(id)) m.removeLayer(id);
    });
    ["kilns", "feedstock"].forEach(id => {
      if (m.getSource(id)) m.removeSource(id);
    });

    // Build feedstock source data (unique source locations per kiln)
    const feedstockFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
    const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];

    if (showFeedstockLines || showFeedstockMarkers) {
      kilns.forEach(kiln => {
        const kb = batches.filter(b => b.kiln_id === kiln.id && b.feedstock_lat !== 0 && b.feedstock_lon !== 0);
        const seen = new Set<string>();
        kb.forEach(b => {
          const key = `${b.feedstock_lat.toFixed(4)},${b.feedstock_lon.toFixed(4)}`;
          if (seen.has(key)) return;
          seen.add(key);
          feedstockFeatures.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [b.feedstock_lon, b.feedstock_lat] },
            properties: { kiln: kiln.id },
          });
          lineFeatures.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[b.feedstock_lon, b.feedstock_lat], [kiln.lng, kiln.lat]] },
            properties: {},
          });
        });
      });
    }

    m.addSource("feedstock", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [...feedstockFeatures, ...lineFeatures] },
    });

    if (showFeedstockLines) {
      m.addLayer({
        id: "feedstock-lines",
        type: "line",
        source: "feedstock",
        filter: ["==", "$type", "LineString"],
        paint: { "line-color": "#a8a29e", "line-width": 1, "line-dasharray": [3, 2], "line-opacity": 0.5 },
      });
    }

    if (showFeedstockMarkers) {
      m.addLayer({
        id: "feedstock-markers",
        type: "circle",
        source: "feedstock",
        filter: ["==", "$type", "Point"],
        paint: { "circle-radius": 5, "circle-color": "#fb923c", "circle-opacity": 0.7, "circle-stroke-width": 1, "circle-stroke-color": "#fff" },
      });
    }

    // Kiln source
    m.addSource("kilns", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: kilns.map(k => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [k.lng, k.lat] },
          properties: { ...k, color: STATUS_COLOR[k.status], radius: 8 + (k.totalKg / maxKg) * 18 },
        })),
      },
    });

    // Glow ring
    m.addLayer({
      id: "kilns-glow",
      type: "circle",
      source: "kilns",
      paint: {
        "circle-radius": ["get", "radius"],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.15,
        "circle-radius-transition": { duration: 300 },
      },
    });

    // Main circle
    m.addLayer({
      id: "kilns-circle",
      type: "circle",
      source: "kilns",
      paint: {
        "circle-radius": ["+", ["get", "radius"], -6],
        "circle-color": ["get", "color"],
        "circle-stroke-width": selectedKiln ? ["case", ["==", ["get", "id"], selectedKiln], 3, 1.5] : 1.5,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.9,
      },
    });

    // Labels
    m.addLayer({
      id: "kilns-label",
      type: "symbol",
      source: "kilns",
      layout: {
        "text-field": ["get", "id"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": 11,
        "text-offset": [0, 1.8],
        "text-anchor": "top",
      },
      paint: { "text-color": "#fff", "text-halo-color": "#1c1917", "text-halo-width": 1 },
    });

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
          <div style="color:#78716c">${props.batchCount} batch(es) · ${Number(props.totalKg).toFixed(0)} kg</div>
          <div style="color:#78716c">Last: ${props.lastDate} · ${props.daysIdle}d idle</div>
        </div>
      `).addTo(m);
    });

    m.on("mouseenter", "kilns-circle", () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "kilns-circle", () => { m.getCanvas().style.cursor = ""; });
    m.on("click", e => {
      const features = m.queryRenderedFeatures(e.point, { layers: ["kilns-circle"] });
      if (!features.length) { popup.current?.remove(); onKilnSelect?.(null); }
    });
  }

  useEffect(() => {
    if (ready) renderLayers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, batches, showFeedstockLines, showFeedstockMarkers]);

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

  return (
    <div className="relative w-full h-full">
      <div ref={container} className="w-full h-full" />
      {kilns.length > 0 && (
        <button
          onClick={fitToKilns}
          className="absolute bottom-8 left-3 z-10 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow transition-opacity hover:opacity-90"
          style={{ background: "#1c1917", color: "#fff", opacity: 0.85 }}>
          Fit to kilns
        </button>
      )}
    </div>
  );
}
