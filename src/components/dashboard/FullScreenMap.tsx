import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Navigation, ZoomIn, ZoomOut, Locate, MapPin, Satellite, Plane, Square, Factory } from "lucide-react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useDelhiWards, WardFeature } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToBorderColor, getAQICategory } from "@/lib/wardAqi";
import { DELHI_LANDMARKS } from "@/lib/delhiLandmarks";
import { DELHI_SPECIAL_ZONES } from "@/lib/delhiSpecialZones";
import { DELHI_POLLUTION_SOURCES, getSourceTypeColor } from "@/lib/delhiPollutionSources";

interface FullScreenMapProps {
  stations: StationData[];
  cityAqi: number;
  onEnterDashboard: (ward?: WardFeature["properties"]) => void;
}

const DELHI_CENTER: [number, number] = [77.209, 28.6139];
const DELHI_BOUNDS: maplibregl.LngLatBoundsLike = [[76.5, 28.15], [77.7, 29.05]];
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri",
      maxzoom: 18,
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "esri-satellite" }],
};

function aqiToColor(aqi: number): string {
  if (!aqi || aqi === 0) return "#282D37";
  if (aqi <= 50) return "#00E5A0";
  if (aqi <= 100) return "#FFD600";
  if (aqi <= 150) return "#FF8C00";
  if (aqi <= 200) return "#FF3D3D";
  if (aqi <= 300) return "#C62BFF";
  return "#FF0033";
}

export function FullScreenMap({ stations, cityAqi, onEnterDashboard }: FullScreenMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardFeature["properties"] | null>(null);
  const [wardSearch, setWardSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);
  const [placeResults, setPlaceResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const placeSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(-1);
  const tourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const top5Polluted = useMemo(() => {
    return [...wardList]
      .filter((w) => (w.interpolated_aqi ?? 0) > 0)
      .sort((a, b) => (b.interpolated_aqi ?? 0) - (a.interpolated_aqi ?? 0))
      .slice(0, 5);
  }, [wardList]);

  // Flying tour logic
  const startTour = useCallback(() => {
    if (top5Polluted.length === 0) return;
    setTourActive(true);
    setTourIndex(0);
  }, [top5Polluted]);

  const stopTour = useCallback(() => {
    setTourActive(false);
    setTourIndex(-1);
    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    tourTimerRef.current = null;
    mapRef.current?.flyTo({ center: DELHI_CENTER, zoom: 11, pitch: 50, bearing: -10, duration: 1500 });
  }, []);

  useEffect(() => {
    if (!tourActive || tourIndex < 0 || tourIndex >= top5Polluted.length) {
      if (tourActive && tourIndex >= top5Polluted.length) stopTour();
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    const ward = top5Polluted[tourIndex];
    const [cLon, cLat] = ward.centroid;
    setSelectedWard(ward);
    map.flyTo({
      center: [cLon, cLat],
      zoom: 14.5,
      pitch: 60,
      bearing: -20 + tourIndex * 15,
      duration: 2500,
      essential: true,
    });
    tourTimerRef.current = setTimeout(() => {
      setTourIndex((i) => i + 1);
    }, 5000);
    return () => { if (tourTimerRef.current) clearTimeout(tourTimerRef.current); };
  }, [tourActive, tourIndex, top5Polluted, stopTour]);

  const filteredWards = useMemo(() => {
    if (!wardSearch.trim()) return wardList.slice(0, 10);
    const q = wardSearch.toLowerCase();
    return wardList.filter(
      (w) => w.ward_name.toLowerCase().includes(q) || String(w.ward_no).includes(q) || w.ac_name.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [wardList, wardSearch]);

  useEffect(() => {
    const t = setTimeout(() => setShowUI(true), 600);
    return () => clearTimeout(t);
  }, []);

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
    if (!map) return;
    const [cLon, cLat] = wardProps.centroid;
    map.flyTo({ center: [cLon, cLat], zoom: 14, duration: 1500, essential: true });
    setSelectedWard(wardProps);
    setSearchOpen(false);
    setWardSearch("");
    setPlaceResults([]);
  }, []);

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
    if (map) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">
        <div style="background:hsl(180,100%,45%);color:#000;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;white-space:nowrap;">${place.name.split(",")[0]}</div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid hsl(180,100%,45%);"></div>
      </div>`;
      const marker = new maplibregl.Marker({ element: el }).setLngLat([place.lon, place.lat]).addTo(map);
      map.flyTo({ center: [place.lon, place.lat], zoom: 14, duration: 1200 });
      setTimeout(() => marker.remove(), 10000);
    }

    const nearest = findNearestWard(place.lat, place.lon);
    if (nearest) setSelectedWard(nearest);
    setSearchOpen(false);
    setWardSearch("");
    setPlaceResults([]);
  }, [findNearestWard]);

  // Initialize map with cinematic flyTo
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: DELHI_CENTER,
      zoom: 10,
      minZoom: 8,
      maxZoom: 16,
      maxBounds: DELHI_BOUNDS,
      attributionControl: false,
      pitch: 55,
      bearing: -15,
      antialias: true,
    });

    map.on("load", () => {
      setMapLoaded(true);
      // Cinematic entrance zoom - show full Delhi first
      map.flyTo({
        center: DELHI_CENTER,
        zoom: 10.5,
        pitch: 45,
        bearing: -10,
        duration: 3000,
        essential: true,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Switch style (satellite / dark) - robust reload
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setMapLoaded(false);
    map.setStyle(isSatellite ? SATELLITE_STYLE : DARK_STYLE);
    const onStyleLoad = () => {
      // Small delay to ensure style is fully ready
      setTimeout(() => setMapLoaded(true), 100);
    };
    map.once("style.load", onStyleLoad);
    return () => { map.off("style.load", onStyleLoad); };
  }, [isSatellite]);


  // Add 3D buildings layer (dark mode only)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || isSatellite) return;
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
  }, [mapLoaded, isSatellite]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !enrichedWards) return;

    if (map.getLayer("wards-fill")) map.removeLayer("wards-fill");
    if (map.getLayer("wards-border")) map.removeLayer("wards-border");
    if (map.getSource("wards")) map.removeSource("wards");

    const colorExpr: any[] = ["match", ["get", "ward_no"]];
    enrichedWards.features.forEach((f) => {
      colorExpr.push(f.properties.ward_no, aqiToColor(f.properties.interpolated_aqi ?? 0));
    });
    colorExpr.push("#282D37");

    map.addSource("wards", { type: "geojson", data: enrichedWards as any });

    map.addLayer({
      id: "wards-fill",
      type: "fill",
      source: "wards",
      paint: {
        "fill-color": colorExpr as any,
        "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.9, 0.78],
        "fill-antialias": true,
      },
    });

    map.addLayer({
      id: "wards-border",
      type: "line",
      source: "wards",
      paint: {
        "line-color": colorExpr as any,
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.5, 1.2],
        "line-opacity": 0.9,
      },
    });

    let hoveredId: number | null = null;

    map.on("mousemove", "wards-fill", (e) => {
      map.getCanvas().style.cursor = "pointer";
      if (e.features && e.features.length > 0) {
        if (hoveredId !== null) map.setFeatureState({ source: "wards", id: hoveredId }, { hover: false });
        hoveredId = e.features[0].properties.ward_no;
        map.setFeatureState({ source: "wards", id: hoveredId! }, { hover: true });
        setHoveredWard(e.features[0].properties.ward_name);

        const p = e.features[0].properties;
        const aqi = p.interpolated_aqi ?? 0;
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "ward-popup", maxWidth: "240px" })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background:rgba(4,8,16,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px 16px;font-family:'JetBrains Mono',monospace;backdrop-filter:blur(12px);">
              <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:2px;font-family:'Rajdhani',sans-serif;letter-spacing:0.5px">${p.ward_name}</div>
              <div style="color:rgba(255,255,255,0.45);font-size:10px;margin-bottom:10px;letter-spacing:1px">WARD ${p.ward_no} · ${p.ac_name}</div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px">
                <span style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px">AQI</span>
                <span style="color:${aqiToColor(aqi)};font-size:22px;font-weight:900;font-family:'Orbitron',monospace">${aqi || "—"}</span>
              </div>
              <div style="color:rgba(255,255,255,0.35);font-size:9px;margin-top:4px">POP: ${p.total_pop?.toLocaleString?.() || "—"}</div>
              <div style="color:rgba(0,229,160,0.6);font-size:9px;margin-top:4px;letter-spacing:1.5px">CLICK TO EXPLORE →</div>
            </div>
          `)
          .addTo(map);
      }
    });

    map.on("mouseleave", "wards-fill", () => {
      map.getCanvas().style.cursor = "";
      if (hoveredId !== null) map.setFeatureState({ source: "wards", id: hoveredId }, { hover: false });
      hoveredId = null;
      setHoveredWard(null);
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    });

    map.on("click", "wards-fill", (e) => {
      if (e.features && e.features.length > 0) {
        const p = e.features[0].properties;
        const centroid = typeof p.centroid === "string" ? JSON.parse(p.centroid) : p.centroid;
        onEnterDashboard({ ...p, centroid } as WardFeature["properties"]);
      }
    });
  }, [enrichedWards, mapLoaded, isSatellite]);

  // Special zones
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer("szones-fill")) map.removeLayer("szones-fill");
    if (map.getLayer("szones-border")) map.removeLayer("szones-border");
    if (map.getSource("szones")) map.removeSource("szones");

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
        geometry: { type: "Polygon" as const, coordinates: [zone.polygon.map(([lat, lon]) => [lon, lat])] },
      };
    });

    map.addSource("szones", { type: "geojson", data: { type: "FeatureCollection", features } });

    map.addLayer({
      id: "szones-fill", type: "fill", source: "szones",
      paint: {
        "fill-color": ["match", ["get", "id"],
          ...features.flatMap((f) => [f.properties.id, aqiToColor(f.properties.interpolated_aqi)]),
          "#282D37"] as any,
        "fill-opacity": 0.5,
      },
    });

    map.addLayer({
      id: "szones-border", type: "line", source: "szones",
      paint: {
        "line-color": ["match", ["get", "id"],
          ...features.flatMap((f) => [f.properties.id, aqiToColor(f.properties.interpolated_aqi)]),
          "#555"] as any,
        "line-width": 1.5, "line-dasharray": [4, 4],
      },
    });

    map.on("click", "szones-fill", (e) => {
      if (e.features && e.features.length > 0) {
        const p = e.features[0].properties;
        const centroid = typeof p.centroid === "string" ? JSON.parse(p.centroid) : p.centroid;
        onEnterDashboard({
          ward_no: -1, ward_name: p.name, ac_name: p.description,
          ac_no: 0, total_pop: 0, sc_pop: 0, nw2022: "", centroid,
          interpolated_aqi: p.interpolated_aqi,
        });
      }
    });
  }, [mapLoaded, stationsWithCoords, onEnterDashboard]);

  // Landmark markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const markers: maplibregl.Marker[] = [];
    DELHI_LANDMARKS.forEach((lm) => {
      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;font-size:18px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));";
      el.textContent = lm.emoji;
      el.addEventListener("click", () => {
        const nearest = findNearestWard(lm.lat, lm.lon);
        if (nearest) onEnterDashboard(nearest);
      });
      const m = new maplibregl.Marker({ element: el }).setLngLat([lm.lon, lm.lat]).addTo(map);
      markers.push(m);
    });
    return () => markers.forEach((m) => m.remove());
  }, [mapLoaded, findNearestWard, onEnterDashboard]);

  // Pollution source markers
  const pollSourceMarkersRef = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    const map = mapRef.current;
    pollSourceMarkersRef.current.forEach((m) => m.remove());
    pollSourceMarkersRef.current = [];
    if (!map || !mapLoaded || !showSources) return;

    DELHI_POLLUTION_SOURCES.forEach((src) => {
      const color = getSourceTypeColor(src.type);
      const el = document.createElement("div");
      el.style.cssText = `cursor:pointer;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${color}25;border:2px solid ${color};font-size:14px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));transition:transform 0.2s;`;
      el.textContent = src.emoji;
      el.title = `${src.name} - ${src.description}`;
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.3)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      el.addEventListener("click", () => {
        const nearest = findNearestWard(src.lat, src.lon);
        if (nearest) {
          setSelectedWard(nearest);
          map.flyTo({ center: [src.lon, src.lat], zoom: 14, duration: 1200 });
        }
      });
      const m = new maplibregl.Marker({ element: el }).setLngLat([src.lon, src.lat]).addTo(map);
      pollSourceMarkersRef.current.push(m);
    });

    return () => {
      pollSourceMarkersRef.current.forEach((m) => m.remove());
      pollSourceMarkersRef.current = [];
    };
  }, [mapLoaded, showSources, findNearestWard]);

  const resetView = () => {
    mapRef.current?.flyTo({ center: DELHI_CENTER, zoom: 11, pitch: 50, bearing: -10, duration: 1500 });
    setSelectedWard(null);
  };

  const aqiLevel = getAqiLevel(cityAqi);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[90] bg-background"
    >
      <style>{`
        .ward-popup .maplibregl-popup-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .ward-popup .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>

      <div ref={containerRef} className="absolute inset-0" />

      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 z-10 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }} />
      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />

      {/* Header */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="font-display text-lg font-bold tracking-[0.15em] text-foreground">
                DELHI <span className="text-primary">AIR QUALITY</span>
              </h1>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mt-0.5">251 WARDS · REAL-TIME MONITORING</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-md px-4 py-2 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">CITY AQI</span>
              <span className="font-display text-2xl font-black" style={{ color: aqiLevel.color }}>{cityAqi || "—"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="absolute left-4 top-20 z-20">
            {searchOpen ? (
              <div className="w-72 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
                  <Search className="h-4 w-4 text-primary" />
                  <input autoFocus value={wardSearch} onChange={(e) => { setWardSearch(e.target.value); searchPlaces(e.target.value); }} placeholder="Ward or place..." className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  <button onClick={() => { setSearchOpen(false); setWardSearch(""); setPlaceResults([]); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="max-h-64 overflow-y-auto p-1.5">
                  {filteredWards.length > 0 && (
                    <>
                      <p className="px-3 py-1 font-mono text-[9px] tracking-widest text-muted-foreground">WARDS</p>
                      {filteredWards.map((w) => (
                        <button key={w.ward_no} onClick={() => zoomToWard(w)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all hover:bg-primary/10">
                          <div>
                            <span className="block font-mono text-[11px] font-semibold text-foreground">{w.ward_name}</span>
                            <span className="font-mono text-[9px] text-muted-foreground">Ward {w.ward_no} · {w.ac_name}</span>
                          </div>
                          <span className="font-display text-sm font-bold" style={{ color: aqiToColor(w.interpolated_aqi ?? 0) }}>{w.interpolated_aqi ?? "—"}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {placeResults.length > 0 && (
                    <>
                      <p className="px-3 py-1 font-mono text-[9px] tracking-widest text-muted-foreground mt-1 border-t border-border/30 pt-1.5">PLACES</p>
                      {placeResults.map((p, i) => (
                        <button key={i} onClick={() => handlePlaceSelect(p)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-all hover:bg-primary/10">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="font-mono text-[11px] text-foreground truncate">{p.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {searchingPlaces && <p className="px-3 py-3 text-center font-mono text-[10px] text-muted-foreground">Searching places...</p>}
                  {filteredWards.length === 0 && placeResults.length === 0 && !searchingPlaces && wardSearch.trim() && (
                    <p className="px-3 py-4 text-center font-mono text-[10px] text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-4 py-2 font-mono text-[11px] text-muted-foreground backdrop-blur-md transition-all hover:text-foreground hover:border-primary/50">
                <Search className="h-3.5 w-3.5" /> FIND WARD / PLACE
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map controls */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            {[
              { icon: ZoomIn, action: () => mapRef.current?.zoomIn(), label: "Zoom in" },
              { icon: ZoomOut, action: () => mapRef.current?.zoomOut(), label: "Zoom out" },
              { icon: Locate, action: resetView, label: "Reset view" },
            ].map(({ icon: Icon, action, label }) => (
              <button key={label} onClick={action} title={label} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card/80 text-muted-foreground backdrop-blur-md transition-all hover:text-foreground hover:border-primary/50">
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <button
              onClick={() => setIsSatellite((v) => !v)}
              title={isSatellite ? "Dark mode" : "Satellite"}
              className="flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-md transition-all"
              style={{
                background: isSatellite ? "rgba(0,150,255,0.15)" : "rgba(4,8,16,0.8)",
                borderColor: isSatellite ? "rgba(0,150,255,0.5)" : "rgba(255,255,255,0.1)",
                color: isSatellite ? "#0096FF" : "rgba(255,255,255,0.5)",
              }}
            >
              <Satellite className="h-4 w-4" />
            </button>
            <button
              onClick={tourActive ? stopTour : startTour}
              title={tourActive ? "Stop tour" : "Fly tour: Top 5 polluted"}
              className="flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-md transition-all"
              style={{
                background: tourActive ? "rgba(255,61,61,0.15)" : "rgba(4,8,16,0.8)",
                borderColor: tourActive ? "rgba(255,61,61,0.5)" : "rgba(255,255,255,0.1)",
                color: tourActive ? "#FF3D3D" : "rgba(255,255,255,0.5)",
              }}
            >
              {tourActive ? <Square className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Tour HUD */}
      <AnimatePresence>
        {tourActive && tourIndex >= 0 && tourIndex < top5Polluted.length && (
          <motion.div
            key={`tour-${tourIndex}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5 }}
            className="absolute top-20 right-4 z-30 w-64"
          >
            <div className="rounded-xl border border-destructive/30 bg-card/95 backdrop-blur-xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="h-3.5 w-3.5 text-destructive animate-pulse" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-destructive font-bold">
                  FLYING TOUR · {tourIndex + 1}/{top5Polluted.length}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full font-display text-xs font-black" style={{ background: "rgba(255,61,61,0.15)", color: "#FF3D3D" }}>
                  #{tourIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm font-bold text-foreground truncate">{top5Polluted[tourIndex].ward_name}</h4>
                  <p className="font-mono text-[9px] text-muted-foreground">Ward {top5Polluted[tourIndex].ward_no} · {top5Polluted[tourIndex].ac_name}</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/30 pt-2 mt-2">
                <div>
                  <span className="font-mono text-[9px] tracking-widest text-muted-foreground">AQI</span>
                  <span className="ml-2 font-mono text-[9px] text-muted-foreground">{getAQICategory(top5Polluted[tourIndex].interpolated_aqi ?? 0)}</span>
                </div>
                <span className="font-display text-2xl font-black" style={{ color: aqiToColor(top5Polluted[tourIndex].interpolated_aqi ?? 0) }}>
                  {top5Polluted[tourIndex].interpolated_aqi ?? "—"}
                </span>
              </div>
              <div className="mt-2 font-mono text-[9px] text-muted-foreground">
                Pop: {top5Polluted[tourIndex].total_pop?.toLocaleString() || "—"}
              </div>
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {top5Polluted.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === tourIndex ? 16 : 6,
                      background: i === tourIndex ? "#FF3D3D" : i < tourIndex ? "rgba(255,61,61,0.4)" : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected ward card */}
      <AnimatePresence>
        {selectedWard && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute bottom-28 left-4 z-20 w-72">
            <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-md p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{selectedWard.ward_name}</h3>
                  <p className="font-mono text-[10px] tracking-wider text-muted-foreground">WARD {selectedWard.ward_no} · {selectedWard.ac_name}</p>
                </div>
                <button onClick={() => setSelectedWard(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/30 pt-3">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">AQI</span>
                <span className="font-display text-3xl font-black" style={{ color: aqiToColor(selectedWard.interpolated_aqi ?? 0) }}>{selectedWard.interpolated_aqi ?? "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-[9px] tracking-wider">POP: {selectedWard.total_pop?.toLocaleString() || "—"}</span>
              </div>
              <button onClick={() => onEnterDashboard(selectedWard)} className="mt-3 w-full rounded-lg border border-primary/40 bg-primary/10 py-2 font-mono text-[11px] tracking-[0.15em] text-primary transition-all hover:bg-primary/20 hover:border-primary/70">
                EXPLORE THIS WARD →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AQI Legend */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="absolute bottom-6 left-4 z-20">
            <div className="flex items-center gap-1 rounded-full border border-border/50 bg-card/80 px-3 py-1.5 backdrop-blur-md">
              {[
                { color: "#00E5A0", label: "Good" },
                { color: "#FFD600", label: "Mod" },
                { color: "#FF8C00", label: "Sens" },
                { color: "#FF3D3D", label: "Unhl" },
                { color: "#C62BFF", label: "V.Unhl" },
                { color: "#FF0033", label: "Haz" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1 px-1" title={item.label}>
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ background: item.color }} />
                  <span className="font-mono text-[8px] text-muted-foreground hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enter Dashboard */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button onClick={() => onEnterDashboard(selectedWard ?? undefined)} className="group flex items-center gap-3 rounded-full border border-primary/40 bg-card/90 px-8 py-3 font-mono text-xs tracking-[0.2em] text-primary backdrop-blur-md transition-all hover:bg-primary/15 hover:border-primary/70 hover:shadow-[0_0_30px_rgba(0,229,160,0.2)]">
              <span className="animate-pulse-live">▶</span>
              ENTER DASHBOARD
              <Navigation className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hovered ward name */}
      <AnimatePresence>
        {showUI && hoveredWard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-6 right-4 z-20">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground bg-card/80 backdrop-blur-md border border-border/50 rounded-full px-3 py-1.5">
              {hoveredWard}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
