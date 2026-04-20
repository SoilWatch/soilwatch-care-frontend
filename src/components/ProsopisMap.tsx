"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

// Afar region, Ethiopia bounding box centre
const AFAR_CENTER: [number, number] = [40.17, 11.56];

// Mock prosopis invasion polygons around Gewane / Awash area
const MOCK_INVASION_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { label: "Block A — Gewane", area_ha: 14200 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [40.08, 11.62], [40.14, 11.65], [40.19, 11.63],
          [40.20, 11.58], [40.15, 11.55], [40.09, 11.57], [40.08, 11.62],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { label: "Block B — Awash", area_ha: 9800 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [40.22, 11.52], [40.28, 11.55], [40.31, 11.51],
          [40.29, 11.46], [40.23, 11.44], [40.20, 11.48], [40.22, 11.52],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { label: "Block C — Southern", area_ha: 6100 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [40.10, 11.44], [40.17, 11.47], [40.21, 11.43],
          [40.18, 11.38], [40.11, 11.37], [40.08, 11.41], [40.10, 11.44],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { label: "Block D — North Corridor", area_ha: 18130 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [40.03, 11.68], [40.12, 11.72], [40.20, 11.70],
          [40.22, 11.64], [40.14, 11.61], [40.05, 11.63], [40.03, 11.68],
        ]],
      },
    },
  ],
};

// Cleared / harvested area polygons
const MOCK_CLEARED_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { label: "HE-001", area_ha: 12.4 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [40.09, 11.59], [40.11, 11.60], [40.12, 11.59],
          [40.11, 11.58], [40.09, 11.58], [40.09, 11.59],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { label: "HE-003", area_ha: 15.7 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [40.13, 11.57], [40.15, 11.58], [40.16, 11.57],
          [40.15, 11.56], [40.13, 11.56], [40.13, 11.57],
        ]],
      },
    },
  ],
};

interface ProsopisMapProps {
  mapboxToken: string;
}

export default function ProsopisMap({ mapboxToken }: ProsopisMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: AFAR_CENTER,
      zoom: 9,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      // ── Invasion extent fill ──────────────────────────────────────────────
      map.addSource("invasion", { type: "geojson", data: MOCK_INVASION_GEOJSON });

      map.addLayer({
        id: "invasion-fill",
        type: "fill",
        source: "invasion",
        paint: {
          "fill-color": "#ffb100",
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "invasion-outline",
        type: "line",
        source: "invasion",
        paint: {
          "line-color": "#f9c349",
          "line-width": 1.5,
          "line-opacity": 0.8,
        },
      });

      // ── Cleared area fill ─────────────────────────────────────────────────
      map.addSource("cleared", { type: "geojson", data: MOCK_CLEARED_GEOJSON });

      map.addLayer({
        id: "cleared-fill",
        type: "fill",
        source: "cleared",
        paint: {
          "fill-color": "#22c55e",
          "fill-opacity": 0.4,
        },
      });

      map.addLayer({
        id: "cleared-outline",
        type: "line",
        source: "cleared",
        paint: {
          "line-color": "#16a34a",
          "line-width": 1.5,
        },
      });

      // ── Popup on invasion click ───────────────────────────────────────────
      map.on("click", "invasion-fill", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const props = feat.properties as { label: string; area_ha: number };
        new mapboxgl.Popup({ closeButton: false, offset: 8 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui;font-size:12px;padding:4px 2px">
              <p style="font-weight:600;color:#1e1810;margin:0 0 2px">${props.label}</p>
              <p style="color:#62615c;margin:0">${props.area_ha.toLocaleString()} ha mapped</p>
             </div>`
          )
          .addTo(map);
      });

      map.on("mouseenter", "invasion-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "invasion-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      // ── Popup on cleared click ────────────────────────────────────────────
      map.on("click", "cleared-fill", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const props = feat.properties as { label: string; area_ha: number };
        new mapboxgl.Popup({ closeButton: false, offset: 8 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui;font-size:12px;padding:4px 2px">
              <p style="font-weight:600;color:#1e1810;margin:0 0 2px">Harvesting ${props.label}</p>
              <p style="color:#62615c;margin:0">${props.area_ha} ha cleared</p>
             </div>`
          )
          .addTo(map);
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken]);

  return <div ref={containerRef} className="w-full h-full" />;
}
