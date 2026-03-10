import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Layers, Navigation, ZoomIn, ZoomOut, Locate, MapPin } from "lucide-react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useDelhiWards, WardFeature } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToFillColor, aqiToBorderColor } from "@/lib/wardAqi";

interface FullScreenMapProps {
  stations: StationData[];
  cityAqi: number;
  onEnterDashboard: (ward?: WardFeature["properties"]) => void;
}

const DELHI_CENTER: [number, number] = [28.6139, 77.209];
const DELHI_BOUNDS: L.LatLngBoundsExpression = [[28.40, 76.84], [28.88, 77.35]];

const DELHI_BOUNDARY_COORDS: [number, number][] = [
  [28.8833, 77.0983], [28.8790, 77.1180], [28.8700, 77.1420], [28.8550, 77.1620],
  [28.8400, 77.1750], [28.8300, 77.2000], [28.8100, 77.2200], [28.7950, 77.2400],
  [28.7700, 77.2500], [28.7500, 77.2700], [28.7300, 77.2950], [28.7150, 77.3100],
  [28.6950, 77.3250], [28.6700, 77.3400], [28.6500, 77.3500], [28.6300, 77.3450],
  [28.6100, 77.3350], [28.5900, 77.3250], [28.5700, 77.3100], [28.5500, 77.2900],
  [28.5350, 77.2700], [28.5200, 77.2500], [28.5050, 77.2350], [28.4950, 77.2150],
  [28.4850, 77.1950], [28.4800, 77.1750], [28.4780, 77.1500], [28.4800, 77.1250],
  [28.4900, 77.1000], [28.5000, 77.0800], [28.5100, 77.0600], [28.5250, 77.0450],
  [28.5400, 77.0300], [28.5600, 77.0150], [28.5800, 77.0050], [28.6000, 76.9950],
  [28.6200, 76.9900], [28.6400, 76.9850], [28.6600, 76.9850], [28.6800, 76.9900],
  [28.7000, 76.9950], [28.7200, 77.0000], [28.7400, 77.0100], [28.7600, 77.0200],
  [28.7800, 77.0300], [28.8000, 77.0400], [28.8200, 77.0550], [28.8400, 77.0700],
  [28.8600, 77.0850], [28.8833, 77.0983],
];

const STATION_COORDS: Record<string, [number, number]> = {
  "delhi/ito": [28.6289, 77.2414],
  "delhi/anand-vihar": [28.6468, 77.316],
  "delhi/rk-puram": [28.5633, 77.1725],
  "delhi/punjabi-bagh": [28.6682, 77.1313],
  "delhi/dwarka-sector-8": [28.5708, 77.0711],
  "delhi/chandni-chowk": [28.6506, 77.2302],
  "delhi/rohini": [28.7329, 77.1166],
  "delhi/shadipur": [28.6514, 77.1594],
};

export function FullScreenMap({ stations, cityAqi, onEnterDashboard }: FullScreenMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const wardLayerRef = useRef<L.GeoJSON | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const selectedWardRef = useRef<L.Layer | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardFeature["properties"] | null>(null);
  const [wardSearch, setWardSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);
  const [placeResults, setPlaceResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const placeSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { wardsGeoJSON } = useDelhiWards();

  const stationsWithCoords = useMemo(
    () => stations
      .map((s) => {
        const c = STATION_COORDS[s.stationId];
        return c ? { lat: c[0], lon: c[1], aqi: s.aqi } : null;
      })
      .filter(Boolean) as { lat: number; lon: number; aqi: number }[],
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
    if (!wardSearch.trim()) return wardList.slice(0, 10);
    const q = wardSearch.toLowerCase();
    return wardList.filter(
      (w) => w.ward_name.toLowerCase().includes(q) || String(w.ward_no).includes(q) || w.ac_name.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [wardList, wardSearch]);

  // Show UI elements with delay for cinematic entrance
  useEffect(() => {
    const t = setTimeout(() => setShowUI(true), 600);
    return () => clearTimeout(t);
  }, []);

  const zoomToWard = useCallback((wardProps: typeof wardList[0]) => {
    const map = mapRef.current;
    if (!map || !enrichedWards) return;
    const feature = enrichedWards.features.find((f) => f.properties.ward_no === wardProps.ward_no);
    if (feature) {
      const layer = L.geoJSON(feature as any);
      map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 14 });
    }
    setSelectedWard(wardProps);
    setSearchOpen(false);
    setWardSearch("");
    setPlaceResults([]);
  }, [enrichedWards]);

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
    const nearest = findNearestWard(place.lat, place.lon);
    if (nearest) {
      setSelectedWard(nearest);
      mapRef.current?.setView([place.lat, place.lon], 14);
    }
    setSearchOpen(false);
    setWardSearch("");
    setPlaceResults([]);
  }, [findNearestWard]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DELHI_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 16,
      maxBounds: DELHI_BOUNDS,
      maxBoundsViscosity: 0.8,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.fitBounds(DELHI_BOUNDS, { padding: [30, 30] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Boundary layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (boundaryLayerRef.current) { boundaryLayerRef.current.remove(); boundaryLayerRef.current = null; }

    const boundary = L.polygon(DELHI_BOUNDARY_COORDS, {
      fillColor: "rgba(25,30,40,0.95)",
      fillOpacity: 1,
      color: "rgba(0,229,160,0.25)",
      weight: 1.5,
      dashArray: "6,4",
      interactive: false,
    });
    boundary.addTo(map);
    boundaryLayerRef.current = boundary;
  }, []);

  // Ward layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enrichedWards) return;
    if (wardLayerRef.current) { wardLayerRef.current.remove(); wardLayerRef.current = null; }

    const wardLayer = L.geoJSON(enrichedWards as any, {
      style: (feature) => {
        const aqi = feature?.properties?.interpolated_aqi ?? 0;
        return {
          fillColor: aqiToFillColor(aqi),
          fillOpacity: 1,
          color: aqiToBorderColor(aqi),
          weight: 1,
          opacity: 0.9,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        const aqi = p.interpolated_aqi ?? 0;

        layer.bindTooltip(
          `<div style="
            background:rgba(4,8,16,0.95);
            border:1px solid rgba(255,255,255,0.12);
            border-radius:10px;
            padding:12px 16px;
            font-family:'JetBrains Mono',monospace;
            min-width:180px;
            backdrop-filter:blur(12px);
          ">
            <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:2px;font-family:'Rajdhani',sans-serif;letter-spacing:0.5px">${p.ward_name}</div>
            <div style="color:rgba(255,255,255,0.45);font-size:10px;margin-bottom:10px;letter-spacing:1px">
              WARD ${p.ward_no} · ${p.ac_name}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px">
              <span style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px">AQI</span>
              <span style="color:${aqiToBorderColor(aqi).replace("0.7", "1")};font-size:22px;font-weight:900;font-family:'Orbitron',monospace">${aqi || "—"}</span>
            </div>
            <div style="color:rgba(255,255,255,0.35);font-size:9px;margin-top:6px;letter-spacing:1px">POP: ${p.total_pop?.toLocaleString() || "—"}</div>
            <div style="color:rgba(0,229,160,0.6);font-size:9px;margin-top:4px;letter-spacing:1.5px">CLICK TO EXPLORE →</div>
          </div>`,
          { permanent: false, sticky: true, className: "ward-tooltip" }
        );

        layer.on("click", () => {
          onEnterDashboard(p);
        });
        layer.on("mouseover", () => {
          if (selectedWardRef.current !== layer) {
            (layer as any).setStyle({ weight: 2, fillOpacity: 0.85 });
          }
          setHoveredWard(p.ward_name);
        });
        layer.on("mouseout", () => {
          if (selectedWardRef.current !== layer) {
            (layer as any).setStyle({ weight: 1, fillOpacity: 1, color: aqiToBorderColor(aqi) });
          }
          setHoveredWard(null);
        });
      },
    });

    wardLayer.addTo(map);
    wardLayerRef.current = wardLayer;
  }, [enrichedWards]);

  const resetView = () => {
    mapRef.current?.fitBounds(DELHI_BOUNDS, { padding: [30, 30] });
    setSelectedWard(null);
    if (selectedWardRef.current) {
      const prevAqi = (selectedWardRef.current as any).feature?.properties?.interpolated_aqi ?? 0;
      (selectedWardRef.current as any).setStyle({
        weight: 1, fillOpacity: 1, color: aqiToBorderColor(prevAqi),
      });
      selectedWardRef.current = null;
    }
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
      {/* Map styles */}
      <style>{`
        .fullmap-tooltip, .ward-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-control-zoom { display: none !important; }
      `}</style>

      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top gradient overlay */}
      <div className="absolute inset-x-0 top-0 z-10 h-32 pointer-events-none" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)"
      }} />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-40 pointer-events-none" style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)"
      }} />

      {/* Header */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-display text-lg font-bold tracking-[0.15em] text-foreground">
                  DELHI <span className="text-primary">AIR QUALITY</span>
                </h1>
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mt-0.5">
                  251 WARDS · REAL-TIME MONITORING
                </p>
              </div>
            </div>

            {/* City AQI badge */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-md px-4 py-2 flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">CITY AQI</span>
                <span className="font-display text-2xl font-black" style={{ color: aqiLevel.color }}>
                  {cityAqi || "—"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute left-4 top-20 z-20"
          >
            {searchOpen ? (
              <div className="w-64 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
                  <Search className="h-4 w-4 text-primary" />
                  <input
                    autoFocus
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    placeholder="Search ward name, number..."
                    className="flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button onClick={() => { setSearchOpen(false); setWardSearch(""); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-1.5">
                  {filteredWards.length === 0 ? (
                    <p className="px-3 py-4 text-center font-mono text-[10px] text-muted-foreground">No wards found</p>
                  ) : (
                    filteredWards.map((w) => (
                      <button
                        key={w.ward_no}
                        onClick={() => zoomToWard(w)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all hover:bg-primary/10"
                      >
                        <div>
                          <span className="block font-mono text-[11px] font-semibold text-foreground">{w.ward_name}</span>
                          <span className="font-mono text-[9px] text-muted-foreground">Ward {w.ward_no} · {w.ac_name}</span>
                        </div>
                        <span className="font-display text-sm font-bold" style={{ color: aqiToBorderColor(w.interpolated_aqi ?? 0).replace("0.7", "1") }}>
                          {w.interpolated_aqi ?? "—"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-4 py-2 font-mono text-[11px] text-muted-foreground backdrop-blur-md transition-all hover:text-foreground hover:border-primary/50 hover:bg-card/95"
              >
                <Search className="h-3.5 w-3.5" /> FIND WARD
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map controls - right side */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2"
          >
            {[
              { icon: ZoomIn, action: () => mapRef.current?.zoomIn(), label: "Zoom in" },
              { icon: ZoomOut, action: () => mapRef.current?.zoomOut(), label: "Zoom out" },
              { icon: Locate, action: resetView, label: "Reset view" },
            ].map(({ icon: Icon, action, label }) => (
              <button
                key={label}
                onClick={action}
                title={label}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card/80 text-muted-foreground backdrop-blur-md transition-all hover:text-foreground hover:border-primary/50 hover:bg-card/95"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected ward info card */}
      <AnimatePresence>
        {selectedWard && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-28 left-4 z-20 w-72"
          >
            <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-md p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{selectedWard.ward_name}</h3>
                  <p className="font-mono text-[10px] tracking-wider text-muted-foreground">
                    WARD {selectedWard.ward_no} · {selectedWard.ac_name}
                  </p>
                </div>
                <button onClick={() => setSelectedWard(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/30 pt-3">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">AQI</span>
                <span className="font-display text-3xl font-black" style={{
                  color: aqiToBorderColor(selectedWard.interpolated_aqi ?? 0).replace("0.7", "1")
                }}>
                  {selectedWard.interpolated_aqi ?? "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-muted-foreground">
                <span className="font-mono text-[9px] tracking-wider">POP: {selectedWard.total_pop?.toLocaleString() || "—"}</span>
              </div>
              <button
                onClick={() => onEnterDashboard(selectedWard)}
                className="mt-3 w-full rounded-lg border border-primary/40 bg-primary/10 py-2 font-mono text-[11px] tracking-[0.15em] text-primary transition-all hover:bg-primary/20 hover:border-primary/70"
              >
                EXPLORE THIS WARD →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AQI Legend - bottom left */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute bottom-6 left-4 z-20"
          >
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

      {/* Enter Dashboard Button - bottom center */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              onClick={() => onEnterDashboard(selectedWard ?? undefined)}
              className="group flex items-center gap-3 rounded-full border border-primary/40 bg-card/90 px-8 py-3 font-mono text-xs tracking-[0.2em] text-primary backdrop-blur-md transition-all hover:bg-primary/15 hover:border-primary/70 hover:shadow-[0_0_30px_rgba(0,229,160,0.2)]"
            >
              <span className="animate-pulse-live">▶</span>
              ENTER DASHBOARD
              <Navigation className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ward count indicator */}
      <AnimatePresence>
        {showUI && hoveredWard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 right-4 z-20"
          >
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground bg-card/80 backdrop-blur-md border border-border/50 rounded-full px-3 py-1.5">
              {hoveredWard}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
