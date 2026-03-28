import { useEffect, useRef, useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useDelhiWards } from "@/hooks/useDelhiWards";
import { assignAQIToWards } from "@/lib/wardAqi";
import { StationData } from "@/lib/aqi";

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const DELHI_CENTER: [number, number] = [77.209, 28.6139];
const DELHI_BOUNDS: maplibregl.LngLatBoundsLike = [[76.7, 28.30], [77.5, 28.95]];

function aqiToColor(aqi: number): string {
  if (!aqi || aqi === 0) return "#282D37";
  if (aqi <= 50) return "#00E5A0";
  if (aqi <= 100) return "#FFD600";
  if (aqi <= 150) return "#FF8C00";
  if (aqi <= 200) return "#FF3D3D";
  if (aqi <= 300) return "#8B3A8F";
  return "#7E0023";
}

export interface HighlightedWard {
  ward_no: number;
  rank?: number;
  borderColor?: string;
  label?: string;
}

interface TabMiniMapProps {
  stations: StationData[];
  highlightedWards?: HighlightedWard[];
  className?: string;
}

export function TabMiniMap({ stations, highlightedWards = [], className = "" }: TabMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { wardsGeoJSON } = useDelhiWards();

  const stationsWithCoords = useMemo(
    () => stations.filter((s) => s.lat != null && s.lon != null).map((s) => ({ lat: s.lat!, lon: s.lon!, aqi: s.aqi })),
    [stations]
  );

  const enrichedWards = useMemo(
    () => assignAQIToWards(wardsGeoJSON, stationsWithCoords),
    [wardsGeoJSON, stationsWithCoords]
  );

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: DELHI_CENTER,
      zoom: 10,
      minZoom: 9,
      maxZoom: 14,
      maxBounds: DELHI_BOUNDS,
      attributionControl: false,
      interactive: true,
      pitch: 0,
      bearing: 0,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), "bottom-right");
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Ward polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !enrichedWards) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      if (map.getLayer("tab-wards-fill")) map.removeLayer("tab-wards-fill");
      if (map.getLayer("tab-wards-border")) map.removeLayer("tab-wards-border");
      if (map.getSource("tab-wards")) map.removeSource("tab-wards");

      const colorExpr: any[] = ["match", ["get", "ward_no"]];
      enrichedWards.features.forEach((f) => {
        colorExpr.push(f.properties.ward_no, aqiToColor(f.properties.interpolated_aqi ?? 0));
      });
      colorExpr.push("#282D37");

      map.addSource("tab-wards", { type: "geojson", data: enrichedWards as any });

      map.addLayer({
        id: "tab-wards-fill",
        type: "fill",
        source: "tab-wards",
        paint: {
          "fill-color": colorExpr as any,
          "fill-opacity": 0.7,
          "fill-antialias": true,
        },
      });

      map.addLayer({
        id: "tab-wards-border",
        type: "line",
        source: "tab-wards",
        paint: {
          "line-color": colorExpr as any,
          "line-width": 0.8,
          "line-opacity": 0.6,
        },
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);
  }, [enrichedWards, mapLoaded]);

  // Highlighted wards borders + numbered markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !enrichedWards) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      if (map.getLayer("tab-highlight-border")) map.removeLayer("tab-highlight-border");
      if (map.getLayer("tab-highlight-glow")) map.removeLayer("tab-highlight-glow");
      if (map.getSource("tab-highlight")) map.removeSource("tab-highlight");

      if (highlightedWards.length === 0) return;

      const highlightNos = new Set(highlightedWards.map((h) => h.ward_no));
      const features = enrichedWards.features.filter((f) => highlightNos.has(f.properties.ward_no));

      if (features.length === 0) return;

      // Fit map to highlighted wards bounds
      const bounds = new maplibregl.LngLatBounds();
      features.forEach((f) => {
        const geom = f.geometry as any;
        const processCoords = (coords: number[][]) => coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        if (geom.type === "Polygon") geom.coordinates.forEach(processCoords);
        else if (geom.type === "MultiPolygon") geom.coordinates.forEach((poly: number[][][]) => poly.forEach(processCoords));
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 800 });
      }

      map.addSource("tab-highlight", {
        type: "geojson",
        data: { type: "FeatureCollection", features } as any,
      });

      // Glow
      map.addLayer({
        id: "tab-highlight-glow",
        type: "line",
        source: "tab-highlight",
        paint: {
          "line-color": highlightedWards[0]?.borderColor || "#FFFFFF",
          "line-width": 5,
          "line-opacity": 0.35,
          "line-blur": 3,
        },
      });

      // Border
      map.addLayer({
        id: "tab-highlight-border",
        type: "line",
        source: "tab-highlight",
        paint: {
          "line-color": highlightedWards[0]?.borderColor || "#FFFFFF",
          "line-width": 2.5,
          "line-opacity": 0.95,
        },
      });

      // Numbered markers
      highlightedWards.forEach((hw) => {
        const feature = enrichedWards.features.find((f) => f.properties.ward_no === hw.ward_no);
        if (!feature?.properties.centroid) return;
        const [lon, lat] = feature.properties.centroid;
        const aqi = feature.properties.interpolated_aqi ?? 0;
        const color = aqiToColor(aqi);
        const borderCol = hw.borderColor || "#C0C0C0";

        const el = document.createElement("div");
        el.style.cssText = "pointer-events:none;";

        if (hw.rank !== undefined) {
          el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
              <div style="
                width:24px;height:24px;border-radius:50%;
                background:rgba(4,8,16,0.9);
                border:2px solid ${borderCol};
                display:flex;align-items:center;justify-content:center;
                font-family:'Orbitron',monospace;font-size:10px;font-weight:900;
                color:${borderCol};
                box-shadow:0 0 8px ${borderCol}40;
              ">${hw.rank}</div>
            </div>
          `;
        } else if (hw.label) {
          el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
              <div style="
                background:rgba(4,8,16,0.9);
                border:2px solid ${borderCol};border-radius:6px;
                padding:2px 6px;
                font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;
                color:${borderCol};white-space:nowrap;
                box-shadow:0 0 8px ${borderCol}40;
              ">${hw.label}</div>
            </div>
          `;
        }

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([lon, lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);

    return () => {
      try {
        const m = mapRef.current;
        if (m && m.getStyle()) {
          if (m.getLayer("tab-highlight-border")) m.removeLayer("tab-highlight-border");
          if (m.getLayer("tab-highlight-glow")) m.removeLayer("tab-highlight-glow");
          if (m.getSource("tab-highlight")) m.removeSource("tab-highlight");
        }
      } catch {}
    };
  }, [highlightedWards, enrichedWards, mapLoaded]);

  return (
    <>
      <style>{`
        .maplibregl-ctrl-group { background: hsl(220,18%,10%) !important; border: 1px solid hsl(220,15%,18%) !important; }
        .maplibregl-ctrl-group button { color: hsl(180,100%,45%) !important; }
        .maplibregl-ctrl-group button + button { border-top: 1px solid hsl(220,15%,18%) !important; }
        .maplibregl-ctrl-group button:hover { background: hsl(220,18%,15%) !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
      <div className={`relative w-full rounded-xl overflow-hidden border border-border ${className}`}>
        <div ref={containerRef} className="h-full w-full" style={{ minHeight: "200px" }} />
        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 backdrop-blur-sm border border-border/50">
          {[
            { color: "#00E5A0", label: "Good" },
            { color: "#FFD600", label: "Mod" },
            { color: "#FF8C00", label: "USG" },
            { color: "#FF3D3D", label: "Bad" },
            { color: "#8B3A8F", label: "V.Bad" },
            { color: "#7E0023", label: "Haz" },
          ].map((l) => (
            <span key={l.color} className="h-2 w-3 rounded-sm" style={{ background: l.color }} title={l.label} />
          ))}
        </div>
      </div>
    </>
  );
}
