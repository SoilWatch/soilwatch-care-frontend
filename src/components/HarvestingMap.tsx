"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

const AFAR_CENTER: [number, number] = [40.17, 11.56];

const CLEARED_ZONES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "HE-001", operator: "Amina H.", area_ha: 12.4, date: "2025-11-03", outcome: "Biochar" },
      geometry: {
        type: "Polygon",
        coordinates: [[[40.09, 11.59], [40.11, 11.60], [40.12, 11.59], [40.11, 11.58], [40.09, 11.58], [40.09, 11.59]]],
      },
    },
    {
      type: "Feature",
      properties: { id: "HE-003", operator: "Mulugeta T.", area_ha: 15.7, date: "2025-11-10", outcome: "Biochar" },
      geometry: {
        type: "Polygon",
        coordinates: [[[40.13, 11.57], [40.15, 11.58], [40.16, 11.57], [40.15, 11.56], [40.13, 11.56], [40.13, 11.57]]],
      },
    },
    {
      type: "Feature",
      properties: { id: "HE-007", operator: "Fatuma A.", area_ha: 8.2, date: "2025-12-01", outcome: "Compost" },
      geometry: {
        type: "Polygon",
        coordinates: [[[40.22, 11.52], [40.24, 11.53], [40.25, 11.52], [40.24, 11.51], [40.22, 11.51], [40.22, 11.52]]],
      },
    },
  ],
};

const INVASION_AREAS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { label: "Block A — Gewane", area_ha: 14200 },
      geometry: {
        type: "Polygon",
        coordinates: [[[40.08, 11.62], [40.14, 11.65], [40.19, 11.63], [40.20, 11.58], [40.15, 11.55], [40.09, 11.57], [40.08, 11.62]]],
      },
    },
    {
      type: "Feature",
      properties: { label: "Block D — North Corridor", area_ha: 18130 },
      geometry: {
        type: "Polygon",
        coordinates: [[[40.03, 11.68], [40.12, 11.72], [40.20, 11.70], [40.22, 11.64], [40.14, 11.61], [40.05, 11.63], [40.03, 11.68]]],
      },
    },
  ],
};

interface HarvestingMapProps {
  mapboxToken: string;
}

export default function HarvestingMap({ mapboxToken }: HarvestingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: AFAR_CENTER,
      zoom: 9.5,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // Invasion background fill
      map.addSource("invasion-bg", { type: "geojson", data: INVASION_AREAS });
      map.addLayer({
        id: "invasion-bg-fill",
        type: "fill",
        source: "invasion-bg",
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "invasion-bg-outline",
        type: "line",
        source: "invasion-bg",
        paint: { "line-color": "#f59e0b", "line-width": 1.5, "line-opacity": 0.5, "line-dasharray": [3, 2] },
      });

      // Cleared zones
      map.addSource("cleared", { type: "geojson", data: CLEARED_ZONES });
      map.addLayer({
        id: "cleared-fill",
        type: "fill",
        source: "cleared",
        paint: { "fill-color": "#22c55e", "fill-opacity": 0.5 },
      });
      map.addLayer({
        id: "cleared-outline",
        type: "line",
        source: "cleared",
        paint: { "line-color": "#16a34a", "line-width": 2 },
      });

      // Cleared zone labels
      map.addLayer({
        id: "cleared-label",
        type: "symbol",
        source: "cleared",
        layout: {
          "text-field": ["get", "id"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#16a34a",
          "text-halo-width": 1.5,
        },
      });

      // Popups
      map.on("click", "cleared-fill", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties as { id: string; operator: string; area_ha: number; date: string; outcome: string };
        new mapboxgl.Popup({ closeButton: false, offset: 8, className: "sw-popup" })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui;font-size:12px;min-width:150px">
              <p style="font-weight:700;color:#0f172a;margin:0 0 6px;font-size:13px">Event ${p.id}</p>
              <div style="display:flex;justify-content:space-between;margin:0 0 2px">
                <span style="color:#64748b">Area cleared</span>
                <span style="font-weight:600;color:#10b981">${p.area_ha} ha</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin:0 0 2px">
                <span style="color:#64748b">Operator</span>
                <span style="font-weight:600;color:#0f172a">${p.operator}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin:0 0 2px">
                <span style="color:#64748b">Date</span>
                <span style="color:#0f172a">${p.date}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">Outcome</span>
                <span style="color:#3b82f6;font-weight:600">${p.outcome}</span>
              </div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseenter", "cleared-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "cleared-fill", () => { map.getCanvas().style.cursor = ""; });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm"
        style={{ background: "#0f172a", color: "#475569" }}>
        Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the harvesting map.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
