import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Search, X, Flame, MapPin } from "lucide-react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useDelhiWards, WardFeature } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToFillColor, aqiToBorderColor } from "@/lib/wardAqi";
import { DELHI_LANDMARKS } from "@/lib/delhiLandmarks";
import { DELHI_SPECIAL_ZONES } from "@/lib/delhiSpecialZones";

interface MapViewProps {
  stations: StationData[];
  selectedStation: StationData | null;
  onSelectStation: (station: StationData) => void;
  onBoundsChange?: (bounds: { lat1: number; lng1: number; lat2: number; lng2: number }) => void;
  onWardSelect?: (ward: WardFeature["properties"]) => void;
  activeWard?: WardFeature["properties"] | null;
}

const DELHI_CENTER: [number, number] = [77.209, 28.6139]; // [lng, lat] for maplibre
const DELHI_BOUNDS: maplibregl.LngLatBoundsLike = [[76.7, 28.30], [77.5, 28.95]];

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function aqiToColor(aqi: number): string {
  if (!aqi || aqi === 0) return "#282D37";
  if (aqi <= 50) return "#00E5A0";
  if (aqi <= 100) return "#FFD600";
  if (aqi <= 150) return "#FF8C00";
  if (aqi <= 200) return "#FF3D3D";
  if (aqi <= 300) return "#C62BFF";
  return "#FF0033";
}

export function MapView({ stations, selectedStation, onSelectStation, onBoundsChange, onWardSelect, activeWard }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const placeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const landmarkMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [showWards, setShowWards] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
const [wardSearch, setWardSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [placeResults, setPlaceResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const placeSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const wardList = useMemo(() => {
    if (!enrichedWards) return [];
    return enrichedWards.features.map((f) => f.properties);
  }, [enrichedWards]);

  const filteredWards = useMemo(() => {
    if (!wardSearch.trim()) return wardList.slice(0, 8);
    const q = wardSearch.toLowerCase();
    return wardList.filter(
      (w) => w.ward_name.toLowerCase().includes(q) || String(w.ward_no).includes(q) || w.ac_name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [wardList, wardSearch]);

  const findNearestWard = useCallback((lat: number, lon: number) => {
    if (!wardList.length) return null;
    let nearest = wardList[0];
    let minDist = Infinity;
    for (const w of wardList) {
      if (!w.centroid) continue;
      const [cLon, cLat] = w.centroid;
      const d = Math.pow(lat - cLat, 2) + Math.pow(lon - cLon, 2);
      if (d < minDist) { minDist = d; nearest = w; }
    }
    return nearest;
  }, [wardList]);

  const zoomToWard = useCallback((wardProps: typeof wardList[0]) => {
    const map = mapRef.current;
    if (!map || !enrichedWards) return;
    const [cLon, cLat] = wardProps.centroid;
    map.flyTo({ center: [cLon, cLat], zoom: 14, duration: 1200, essential: true });
    onWardSelect?.(wardProps);
    setSearchOpen(false);
    setWardSearch("");
  }, [enrichedWards, onWardSelect]);

  const searchPlaces = useCallback((query: string) => {
    if (placeSearchTimeout.current) clearTimeout(placeSearchTimeout.current);
    if (query.trim().length < 2) { setPlaceResults([]); return; }
    placeSearchTimeout.current = setTimeout(async () => {
      setSearchingPlaces(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " Delhi India")}&bounded=1&viewbox=76.84,28.40,77.35,28.88&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setPlaceResults(data.map((d: any) => ({ name: d.display_name.split(",").slice(0, 2).join(","), lat: parseFloat(d.lat), lon: parseFloat(d.lon) })));
      } catch { setPlaceResults([]); }
      setSearchingPlaces(false);
    }, 400);
  }, []);

  const handlePlaceSelect = useCallback((place: { lat: number; lon: number; name: string }) => {
    const map = mapRef.current;
    if (placeMarkerRef.current) { placeMarkerRef.current.remove(); placeMarkerRef.current = null; }

    const nearest = findNearestWard(place.lat, place.lon);
    if (nearest) onWardSelect?.(nearest);

    if (map) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">
        <div style="background:hsl(180,100%,45%);color:#000;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${place.name.split(",")[0]}</div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid hsl(180,100%,45%);"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:hsl(180,100%,45%);box-shadow:0 0 8px hsl(180,100%,45%);margin-top:-1px;"></div>
      </div>`;
      const marker = new maplibregl.Marker({ element: el }).setLngLat([place.lon, place.lat]).addTo(map);
      placeMarkerRef.current = marker;
      map.flyTo({ center: [place.lon, place.lat], zoom: 14, duration: 1200 });
      setTimeout(() => { if (placeMarkerRef.current === marker) { marker.remove(); placeMarkerRef.current = null; } }, 10000);
    }

    setSearchOpen(false);
    setWardSearch("");
    setPlaceResults([]);
  }, [findNearestWard, onWardSelect]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: DELHI_CENTER,
      zoom: 10.5,
      minZoom: 9,
      maxBounds: DELHI_BOUNDS,
      attributionControl: false,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

    map.on("load", () => setMapLoaded(true));

    map.on("moveend", () => {
      const b = map.getBounds();
      onBoundsChange?.({ lat1: b.getSouth(), lng1: b.getWest(), lat2: b.getNorth(), lng2: b.getEast() });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Add 3D buildings layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (!map.isStyleLoaded()) return;

    if (map.getLayer("3d-buildings")) map.removeLayer("3d-buildings");
    if (!map.getSource("openmaptiles")) return;

    const layers = map.getStyle().layers || [];
    const labelLayer = layers.find((l: any) => l.type === "symbol" && l.layout?.["text-field"]);

    map.addLayer({
      id: "3d-buildings",
      source: "openmaptiles",
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": "hsl(220, 15%, 18%)",
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 16, ["get", "render_height"]],
        "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 13, 0, 16, ["get", "render_min_height"]],
        "fill-extrusion-opacity": 0.6,
      },
    }, labelLayer?.id);

    return () => {
      if (map.getLayer("3d-buildings")) map.removeLayer("3d-buildings");
    };
  }, [mapLoaded]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !enrichedWards) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      // Remove old layers/source
      if (map.getLayer("wards-fill")) map.removeLayer("wards-fill");
      if (map.getLayer("wards-border")) map.removeLayer("wards-border");
      if (map.getLayer("wards-highlight")) map.removeLayer("wards-highlight");
      if (map.getSource("wards")) map.removeSource("wards");

      if (!showWards) return;

      // Build color expression
      const colorExpr: any[] = ["match", ["get", "ward_no"]];
      const borderExpr: any[] = ["match", ["get", "ward_no"]];
      enrichedWards.features.forEach((f) => {
        const aqi = f.properties.interpolated_aqi ?? 0;
        colorExpr.push(f.properties.ward_no, aqiToColor(aqi));
        borderExpr.push(f.properties.ward_no, aqiToColor(aqi));
      });
      colorExpr.push("#282D37");
      borderExpr.push("#555");

      map.addSource("wards", { type: "geojson", data: enrichedWards as any });

      map.addLayer({
        id: "wards-fill",
        type: "fill",
        source: "wards",
        paint: {
          "fill-color": colorExpr as any,
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false], 0.9,
            0.78
          ],
          "fill-antialias": true,
        },
      });

      map.addLayer({
        id: "wards-border",
        type: "line",
        source: "wards",
        paint: {
          "line-color": borderExpr as any,
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false], 2.5,
            1.2
          ],
          "line-opacity": 0.9,
        },
      });

      // Hover interactions
      let hoveredId: number | null = null;

      map.on("mousemove", "wards-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features && e.features.length > 0) {
          if (hoveredId !== null) {
            map.setFeatureState({ source: "wards", id: hoveredId }, { hover: false });
          }
          hoveredId = e.features[0].properties.ward_no;
          map.setFeatureState({ source: "wards", id: hoveredId! }, { hover: true });

          const p = e.features[0].properties;
          const aqi = p.interpolated_aqi ?? 0;
          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "ward-popup", maxWidth: "220px" })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="background:rgba(4,8,16,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;font-family:'JetBrains Mono',monospace;">
                <div style="color:#fff;font-weight:700;font-size:13px;margin-bottom:2px;font-family:'DM Sans',sans-serif">${p.ward_name}</div>
                <div style="color:rgba(255,255,255,0.45);font-size:10px;margin-bottom:8px">Ward ${p.ward_no} · ${p.ac_name}</div>
                <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px">
                  <span style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px">AQI</span>
                  <span style="color:${aqiToColor(aqi)};font-size:20px;font-weight:900;font-family:'Orbitron',monospace">${aqi || "—"}</span>
                </div>
                <div style="color:rgba(255,255,255,0.35);font-size:9px;margin-top:4px">Pop: ${p.total_pop?.toLocaleString?.() || "—"}</div>
              </div>
            `)
            .addTo(map);
        }
      });

      map.on("mouseleave", "wards-fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredId !== null) {
          map.setFeatureState({ source: "wards", id: hoveredId }, { hover: false });
        }
        hoveredId = null;
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      });

      map.on("click", "wards-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          const centroid = typeof p.centroid === "string" ? JSON.parse(p.centroid) : p.centroid;
          onWardSelect?.({ ...p, centroid } as WardFeature["properties"]);
        }
      });
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("style.load", apply);
    }
  }, [enrichedWards, showWards, mapLoaded, onWardSelect]);

  // Special zones
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !showWards) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      if (map.getLayer("special-zones-fill")) map.removeLayer("special-zones-fill");
      if (map.getLayer("special-zones-border")) map.removeLayer("special-zones-border");
      if (map.getSource("special-zones")) map.removeSource("special-zones");

      const features = DELHI_SPECIAL_ZONES.map((zone) => {
        const [cLon, cLat] = zone.centroid;
        let zoneAqi = 0;
        if (stationsWithCoords.length > 0) {
          const nearby = stationsWithCoords
            .map((s) => ({ ...s, dist: Math.sqrt(Math.pow(s.lat - cLat, 2) + Math.pow(s.lon - cLon, 2)) }))
            .sort((a, b) => a.dist - b.dist).slice(0, 3);
          if (nearby.length === 1) zoneAqi = nearby[0].aqi;
          else {
            const weights = nearby.map((s) => 1 / (s.dist + 0.001));
            const tw = weights.reduce((a, b) => a + b, 0);
            zoneAqi = Math.round(nearby.reduce((sum, s, i) => sum + s.aqi * weights[i], 0) / tw);
          }
        }
        return {
          type: "Feature" as const,
          properties: { ...zone, interpolated_aqi: zoneAqi },
          geometry: {
            type: "Polygon" as const,
            coordinates: [zone.polygon.map(([lat, lon]) => [lon, lat])],
          },
        };
      });

      map.addSource("special-zones", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.addLayer({
        id: "special-zones-fill",
        type: "fill",
        source: "special-zones",
        paint: {
          "fill-color": ["match", ["get", "id"],
            ...features.flatMap((f) => [f.properties.id, aqiToColor(f.properties.interpolated_aqi)]),
            "#282D37"
          ] as any,
          "fill-opacity": 0.5,
        },
      });

      map.addLayer({
        id: "special-zones-border",
        type: "line",
        source: "special-zones",
        paint: {
          "line-color": ["match", ["get", "id"],
            ...features.flatMap((f) => [f.properties.id, aqiToColor(f.properties.interpolated_aqi)]),
            "#555"
          ] as any,
          "line-width": 1.5,
          "line-dasharray": [4, 4],
        },
      });

      map.on("click", "special-zones-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          const centroid = typeof p.centroid === "string" ? JSON.parse(p.centroid) : p.centroid;
          const fakeWard: WardFeature["properties"] = {
            ward_no: -1, ward_name: p.name, ac_name: p.description,
            ac_no: 0, total_pop: 0, sc_pop: 0, nw2022: "", centroid,
            interpolated_aqi: p.interpolated_aqi,
          };
          onWardSelect?.(fakeWard);
        }
      });
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("style.load", apply);
    }
  }, [showWards, mapLoaded, stationsWithCoords, onWardSelect]);

  // Heatmap layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer("aqi-heatmap")) map.removeLayer("aqi-heatmap");
    if (map.getSource("heatmap-data")) map.removeSource("heatmap-data");

    if (!showHeatmap || !enrichedWards) return;

    const heatFeatures = enrichedWards.features.map((f) => ({
      type: "Feature" as const,
      properties: { intensity: Math.min((f.properties.interpolated_aqi ?? 0) / 500, 1) },
      geometry: { type: "Point" as const, coordinates: [f.properties.centroid[0], f.properties.centroid[1]] },
    }));

    map.addSource("heatmap-data", {
      type: "geojson",
      data: { type: "FeatureCollection", features: heatFeatures },
    });

    map.addLayer({
      id: "aqi-heatmap",
      type: "heatmap",
      source: "heatmap-data",
      paint: {
        "heatmap-weight": ["get", "intensity"],
        "heatmap-intensity": 1.5,
        "heatmap-radius": 35,
        "heatmap-opacity": 0.7,
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.2, "#00E5A0",
          0.4, "#FFD600",
          0.6, "#FF8C00",
          0.8, "#FF3D3D",
          0.9, "#C62BFF",
          1.0, "#FF0033",
        ],
      },
    });
  }, [enrichedWards, showHeatmap, mapLoaded]);

  // Landmark markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    landmarkMarkersRef.current.forEach((m) => m.remove());
    landmarkMarkersRef.current = [];

    DELHI_LANDMARKS.forEach((lm) => {
      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;font-size:16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));";
      el.textContent = lm.emoji;
      el.addEventListener("click", () => {
        const nearest = findNearestWard(lm.lat, lm.lon);
        if (nearest) onWardSelect?.(nearest);
      });
      const m = new maplibregl.Marker({ element: el }).setLngLat([lm.lon, lm.lat]).addTo(map);
      landmarkMarkersRef.current.push(m);
    });

    return () => {
      landmarkMarkersRef.current.forEach((m) => m.remove());
      landmarkMarkersRef.current = [];
    };
  }, [mapLoaded, findNearestWard, onWardSelect]);

  // Active ward pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (activeMarkerRef.current) { activeMarkerRef.current.remove(); activeMarkerRef.current = null; }
    if (!activeWard?.centroid) return;

    const [cLon, cLat] = activeWard.centroid;
    const aqi = activeWard.interpolated_aqi ?? 0;
    const level = getAqiLevel(aqi);

    const el = document.createElement("div");
    el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6));animation:wardPinBounce 0.5s ease-out;pointer-events:none;">
      <div style="background:rgba(4,8,16,0.92);border:1px solid ${level.color}80;border-radius:8px;padding:4px 10px;margin-bottom:4px;backdrop-filter:blur(8px);">
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;color:#fff;text-align:center;">${activeWard.ward_name || "Ward"}</div>
        <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:900;color:${level.color};text-align:center;text-shadow:0 0 12px ${level.color}60;">${aqi || "—"}</div>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid rgba(4,8,16,0.92);margin-bottom:-1px;"></div>
      <div style="width:4px;height:4px;border-radius:50%;background:${level.color};box-shadow:0 0 8px ${level.color},0 0 20px ${level.color}40;animation:wardPinPulse 2s ease-in-out infinite;"></div>
    </div>`;

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([cLon, cLat]).addTo(map);
    activeMarkerRef.current = marker;
  }, [activeWard, mapLoaded]);

  return (
    <>
      <style>{`
        .ward-popup .maplibregl-popup-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .ward-popup .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-group { background: hsl(220,18%,10%) !important; border: 1px solid hsl(220,15%,18%) !important; }
        .maplibregl-ctrl-group button { color: hsl(180,100%,45%) !important; }
        .maplibregl-ctrl-group button + button { border-top: 1px solid hsl(220,15%,18%) !important; }
        .maplibregl-ctrl-group button:hover { background: hsl(220,18%,15%) !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full" />

        {/* Ward toggle */}
        <button
          onClick={() => setShowWards((v) => !v)}
          className="absolute right-3 top-3 z-[1000] rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wider backdrop-blur-sm transition-all"
          style={{
            background: showWards ? "rgba(0,229,160,0.15)" : "rgba(255,255,255,0.05)",
            borderColor: showWards ? "rgba(0,229,160,0.5)" : "rgba(255,255,255,0.1)",
            color: showWards ? "#00E5A0" : "rgba(255,255,255,0.5)",
          }}
        >
          {showWards ? "◼ WARDS ON" : "◻ SHOW WARDS"}
        </button>

        {/* Heatmap toggle */}
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className="absolute right-3 top-14 z-[1000] flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wider backdrop-blur-sm transition-all"
          style={{
            background: showHeatmap ? "rgba(255,61,61,0.15)" : "rgba(255,255,255,0.05)",
            borderColor: showHeatmap ? "rgba(255,61,61,0.5)" : "rgba(255,255,255,0.1)",
            color: showHeatmap ? "#FF3D3D" : "rgba(255,255,255,0.5)",
          }}
        >
          <Flame className="h-3 w-3" />
          {showHeatmap ? "◼ HEATMAP" : "◻ HEATMAP"}
        </button>


{showWards && (
          <div className="absolute left-3 top-3 z-[1000]">
            {searchOpen ? (
              <div className="w-[min(256px,calc(100vw-80px))] rounded-lg border border-border bg-card/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    value={wardSearch}
                    onChange={(e) => { setWardSearch(e.target.value); searchPlaces(e.target.value); }}
                    placeholder="Search ward or place..."
                    className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button onClick={() => { setSearchOpen(false); setWardSearch(""); setPlaceResults([]); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {filteredWards.length > 0 && (
                    <>
                      <p className="px-2 py-1 font-mono text-[9px] tracking-widest text-muted-foreground">WARDS</p>
                      {filteredWards.map((w) => (
                        <button key={w.ward_no} onClick={() => zoomToWard(w)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50">
                          <div>
                            <span className="block font-mono text-[10px] font-semibold text-foreground">{w.ward_name}</span>
                            <span className="font-mono text-[9px] text-muted-foreground">Ward {w.ward_no} · {w.ac_name}</span>
                          </div>
                          <span className="font-display text-xs font-bold" style={{ color: aqiToColor(w.interpolated_aqi ?? 0) }}>{w.interpolated_aqi ?? "—"}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {placeResults.length > 0 && (
                    <>
                      <p className="px-2 py-1 font-mono text-[9px] tracking-widest text-muted-foreground mt-1 border-t border-border pt-1.5">PLACES</p>
                      {placeResults.map((p, i) => (
                        <button key={i} onClick={() => handlePlaceSelect(p)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50">
                          <MapPin className="h-3 w-3 shrink-0 text-primary" />
                          <span className="font-mono text-[10px] text-foreground truncate">{p.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {searchingPlaces && <p className="px-2 py-2 text-center font-mono text-[10px] text-muted-foreground">Searching places...</p>}
                  {filteredWards.length === 0 && placeResults.length === 0 && !searchingPlaces && wardSearch.trim() && (
                    <p className="px-2 py-3 text-center font-mono text-[10px] text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground">
                <Search className="h-3 w-3" /> FIND WARD / PLACE
              </button>
            )}
          </div>
        )}

        {/* AQI Legend */}
        {showWards && (
          <div className="absolute bottom-6 left-3 z-[1000]">
            {showLegend ? (
              <div className="rounded-lg border border-border bg-card/95 p-2.5 backdrop-blur-sm">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">AQI Scale</p>
                  <button onClick={() => setShowLegend(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Good", range: "0–50", color: "#00E5A0" },
                    { label: "Moderate", range: "51–100", color: "#FFD600" },
                    { label: "Sensitive", range: "101–150", color: "#FF8C00" },
                    { label: "Unhealthy", range: "151–200", color: "#FF3D3D" },
                    { label: "Very Unhealthy", range: "201–300", color: "#C62BFF" },
                    { label: "Hazardous", range: "300+", color: "#FF0033" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: item.color }} />
                      <span className="font-mono text-[9px] text-foreground">{item.range}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={() => setShowLegend(true)} className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground">
                <div className="flex gap-0.5">
                  {["#00E5A0", "#FFD600", "#FF8C00", "#FF3D3D", "#C62BFF"].map((c) => (
                    <span key={c} className="inline-block h-2.5 w-1.5 rounded-sm" style={{ background: c }} />
                  ))}
                </div>
                AQI SCALE
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
