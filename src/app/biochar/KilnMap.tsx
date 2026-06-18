"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Batch } from "./data";

const DEFAULT_CENTER: [number, number] = [40.17, 11.58];
const KILN_COLORS = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"];
const C = {
  title: "#1F3864",
  heading: "#2E75B6",
  metricBg: "#f8f9fa",
  red: "#E74C3C",
  green: "#27AE60",
  orange: "#F39C12",
  subtext: "#6b7280",
};

interface KilnMapProps {
  mapboxToken: string;
  batches: Batch[];
}

export default function KilnMap({ mapboxToken, batches }: KilnMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!mapboxToken) return;

    const validBatches = batches.filter((batch) => batch.production_lat && batch.production_lon);
    const center: [number, number] = validBatches.length
      ? [
          validBatches.reduce((sum, batch) => sum + batch.production_lon, 0) / validBatches.length,
          validBatches.reduce((sum, batch) => sum + batch.production_lat, 0) / validBatches.length,
        ]
      : DEFAULT_CENTER;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: validBatches.length ? 11 : 9,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    const kilnStats: Record<string, { totalKg: number; batches: number; latSum: number; lonSum: number }> = {};
    for (const batch of validBatches) {
      if (!kilnStats[batch.kiln_id]) {
        kilnStats[batch.kiln_id] = { totalKg: 0, batches: 0, latSum: 0, lonSum: 0 };
      }
      kilnStats[batch.kiln_id].totalKg += batch.biochar_wet_weight_kg ?? 0;
      kilnStats[batch.kiln_id].batches += 1;
      kilnStats[batch.kiln_id].latSum += batch.production_lat;
      kilnStats[batch.kiln_id].lonSum += batch.production_lon;
    }

    const kilnIds = Object.keys(kilnStats).sort();
    const maxKg = Math.max(...Object.values(kilnStats).map((s) => s.totalKg), 1);
    const colorMatch: (string | unknown[])[] = ["match", ["get", "kiln_id"]];
    kilnIds.forEach((kilnId, index) => {
      colorMatch.push(kilnId, KILN_COLORS[index % KILN_COLORS.length]);
    });
    colorMatch.push(C.heading);

    map.on("load", () => {
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: kilnIds.map((kilnId) => {
          const stats = kilnStats[kilnId];
          return {
          type: "Feature",
          properties: {
            kiln_id: kilnId,
            label: kilnId,
            location: "Production site",
            totalKg: stats.totalKg,
            batches: stats.batches,
          },
          geometry: { type: "Point", coordinates: [stats.lonSum / stats.batches, stats.latSum / stats.batches] },
        };
        }),
      };

      map.addSource("kilns", { type: "geojson", data: geojson });

      const feedstockFeatures: GeoJSON.Feature[] = validBatches
        .filter((batch) => batch.feedstock_lat && batch.feedstock_lon)
        .map((batch) => ({
          type: "Feature",
          properties: {
            batch_id: batch.batch_id,
            source: batch.feedstock_source_desc,
            condition: batch.feedstock_appearance,
            volume: batch.feedstock_volume_m3,
          },
          geometry: { type: "Point", coordinates: [batch.feedstock_lon, batch.feedstock_lat] },
        }));

      const lineFeatures: GeoJSON.Feature[] = validBatches
        .filter((batch) => batch.feedstock_lat && batch.feedstock_lon)
        .map((batch) => ({
          type: "Feature",
          properties: { batch_id: batch.batch_id },
          geometry: {
            type: "LineString",
            coordinates: [[batch.feedstock_lon, batch.feedstock_lat], [batch.production_lon, batch.production_lat]],
          },
        }));

      map.addSource("feedstock", { type: "geojson", data: { type: "FeatureCollection", features: feedstockFeatures } });
      map.addSource("feedstock-lines", { type: "geojson", data: { type: "FeatureCollection", features: lineFeatures } });

      map.addLayer({
        id: "feedstock-lines",
        type: "line",
        source: "feedstock-lines",
        paint: { "line-color": "#9ca3af", "line-width": 1.5, "line-opacity": 0.65 },
      });

      map.addLayer({
        id: "feedstock-source",
        type: "circle",
        source: "feedstock",
        paint: {
          "circle-radius": 6,
          "circle-color": C.orange,
          "circle-opacity": 0.88,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Outer glow ring (per-kiln colour)
      map.addLayer({
        id: "kiln-glow",
        type: "circle",
        source: "kilns",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"],
            ["get", "totalKg"],
            0, 18, maxKg, 44,
          ],
          "circle-color": [
            ...colorMatch,
          ] as unknown as mapboxgl.Expression,
          "circle-opacity": 0.22,
        },
      });

      // Main circle
      map.addLayer({
        id: "kiln-circle",
        type: "circle",
        source: "kilns",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"],
            ["get", "totalKg"],
            0, 10, maxKg, 26,
          ],
          "circle-color": [
            ...colorMatch,
          ] as unknown as mapboxgl.Expression,
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Labels
      map.addLayer({
        id: "kiln-label",
        type: "symbol",
        source: "kilns",
        layout: {
          "text-field": ["get", "kiln_id"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, 2.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": C.title,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      // Popup on click
      map.on("click", "kiln-circle", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties as {
          label: string; location: string; totalKg: number; batches: number;
        };
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
        new mapboxgl.Popup({ closeButton: false, offset: 12, className: "sw-popup" })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:system-ui;font-size:12px;min-width:140px">
              <p style="font-weight:700;color:#0f172a;margin:0 0 6px;font-size:13px">${p.label}</p>
              <div style="display:flex;justify-content:space-between;margin:0 0 2px">
                <span style="color:#64748b">Output</span>
                <span style="font-weight:600;color:#0f172a">${p.totalKg.toLocaleString()} kg</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">Batches</span>
                <span style="font-weight:600;color:#0f172a">${p.batches}</span>
              </div>
            </div>`
          )
          .addTo(map);
      });

      map.on("click", "feedstock-source", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties as {
          batch_id: string; source: string; condition: string; volume: number;
        };
        const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
        new mapboxgl.Popup({ closeButton: false, offset: 12, className: "sw-popup" })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:system-ui;font-size:12px;min-width:140px">
              <p style="font-weight:700;color:#0f172a;margin:0 0 6px;font-size:13px">Feedstock Source</p>
              <p style="color:#64748b;margin:0 0 2px">Batch: ${p.batch_id}</p>
              <p style="color:#0f172a;margin:0 0 2px">${p.source || "No source description"}</p>
              <p style="color:#64748b;margin:0">${p.condition} · ${p.volume} m³</p>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseenter", "kiln-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "kiln-circle", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "feedstock-source", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "feedstock-source", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, batches]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f8f9fa] text-sm text-[#6b7280]">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the production site map.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
