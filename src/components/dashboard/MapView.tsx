import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet.heat";
import { Search, X, Flame } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useDelhiWards, WardFeature } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToFillColor, aqiToBorderColor } from "@/lib/wardAqi";

interface MapViewProps {
  stations: StationData[];
  selectedStation: StationData | null;
  onSelectStation: (station: StationData) => void;
  onBoundsChange?: (bounds: { lat1: number; lng1: number; lat2: number; lng2: number }) => void;
  onWardSelect?: (ward: WardFeature["properties"]) => void;
}

const DELHI_CENTER: [number, number] = [28.6139, 77.209];

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

function createMarkerIcon(aqi: number, isSelected: boolean) {
  const level = getAqiLevel(aqi);
  const size = isSelected ? 40 : 30;
  return L.divIcon({
    className: "custom-aqi-marker",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${level.color};
      border:2px solid ${isSelected ? "#fff" : level.color + "80"};
      box-shadow:0 0 ${isSelected ? 20 : 10}px ${level.color}80;
      display:flex;align-items:center;justify-content:center;
      font-family:'Orbitron',monospace;font-size:${isSelected ? 11 : 9}px;
      font-weight:700;color:#000;
      transition:all 0.3s;
      position:relative;z-index:10;
    ">${aqi}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapView({ stations, selectedStation, onSelectStation, onBoundsChange, onWardSelect }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const wardLayerRef = useRef<L.GeoJSON | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWards, setShowWards] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { wardsGeoJSON } = useDelhiWards();

  const stationsWithCoords = useMemo(
    () =>
      stations
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
    if (!wardSearch.trim()) return wardList.slice(0, 8);
    const q = wardSearch.toLowerCase();
    return wardList.filter(
      (w) => w.ward_name.toLowerCase().includes(q) || String(w.ward_no).includes(q) || w.ac_name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [wardList, wardSearch]);

  const zoomToWard = useCallback((wardProps: typeof wardList[0]) => {
    const map = mapRef.current;
    if (!map || !enrichedWards) return;
    const feature = enrichedWards.features.find((f) => f.properties.ward_no === wardProps.ward_no);
    if (feature) {
      const layer = L.geoJSON(feature as any);
      map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 14 });
    }
    onWardSelect?.(wardProps);
    setSearchOpen(false);
    setWardSearch("");
  }, [enrichedWards, onWardSelect]);


  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DELHI_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("moveend", () => {
      const b = map.getBounds();
      onBoundsChange?.({
        lat1: b.getSouth(),
        lng1: b.getWest(),
        lat2: b.getNorth(),
        lng2: b.getEast(),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Ward layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old ward layer
    if (wardLayerRef.current) {
      wardLayerRef.current.remove();
      wardLayerRef.current = null;
    }

    if (!showWards || !enrichedWards) return;

    const wardLayer = L.geoJSON(enrichedWards as any, {
      style: (feature) => {
        const aqi = feature?.properties?.interpolated_aqi ?? 0;
        return {
          fillColor: aqiToFillColor(aqi),
          fillOpacity: 1,
          color: aqiToBorderColor(aqi),
          weight: 0.8,
          opacity: 0.9,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        const aqi = p.interpolated_aqi ?? 0;

        layer.bindTooltip(
          `<div style="
            background:rgba(4,8,16,0.92);
            border:1px solid rgba(255,255,255,0.15);
            border-radius:8px;
            padding:10px 14px;
            font-family:'JetBrains Mono',monospace;
            min-width:160px;
          ">
            <div style="color:#fff;font-weight:700;font-size:13px;margin-bottom:4px">${p.ward_name}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:10px;margin-bottom:8px">
              Ward ${p.ward_no} · ${p.ac_name}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:rgba(255,255,255,0.6);font-size:11px">AQI</span>
              <span style="color:${aqiToBorderColor(aqi).replace("0.7", "1")};font-size:18px;font-weight:800;font-family:'Orbitron',monospace">${aqi || "—"}</span>
            </div>
            <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:4px">Pop: ${p.total_pop?.toLocaleString()}</div>
          </div>`,
          { permanent: false, sticky: true, className: "ward-tooltip" }
        );

        layer.on("click", () => onWardSelect?.(p));
        layer.on("mouseover", () => (layer as any).setStyle({ weight: 2, fillOpacity: 0.95 }));
        layer.on("mouseout", () =>
          (layer as any).setStyle({
            weight: 0.8,
            fillOpacity: 1,
            fillColor: aqiToFillColor(aqi),
          })
        );
      },
    });

    wardLayer.addTo(map);
    wardLayerRef.current = wardLayer;
  }, [enrichedWards, showWards, onWardSelect]);

  // Station markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const coords = STATION_COORDS[station.stationId];
      if (!coords) return;

      const isSelected = selectedStation?.stationId === station.stationId;
      const marker = L.marker(coords, {
        icon: createMarkerIcon(station.aqi, isSelected),
        zIndexOffset: isSelected ? 1000 : 100,
      })
        .addTo(map)
        .bindTooltip(
          `<div style="font-family:'Orbitron',monospace;font-size:10px;font-weight:600;">${station.name}</div>
           <div style="font-family:'JetBrains Mono',monospace;font-size:9px;">AQI: ${station.aqi} • ${station.area}</div>`,
          { className: "custom-tooltip", direction: "top", offset: [0, -15] }
        );

      marker.on("click", () => onSelectStation(station));
      markersRef.current.push(marker);
    });
  }, [stations, selectedStation, onSelectStation]);

  return (
    <>
      <style>{`
        .custom-aqi-marker { background: none !important; border: none !important; }
        .custom-tooltip, .ward-tooltip .leaflet-tooltip {
          background: hsl(220, 18%, 10%) !important;
          border: 1px solid hsl(220, 15%, 18%) !important;
          border-radius: 8px !important;
          color: hsl(210, 20%, 92%) !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .ward-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-tooltip::before { border-top-color: hsl(220, 15%, 18%) !important; }
        .leaflet-control-zoom a {
          background: hsl(220, 18%, 10%) !important;
          color: hsl(180, 100%, 45%) !important;
          border-color: hsl(220, 15%, 18%) !important;
        }
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
        {/* Ward Search */}
        {showWards && (
          <div className="absolute left-3 top-3 z-[1000]">
            {searchOpen ? (
              <div className="w-56 rounded-lg border border-border bg-card/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    placeholder="Search wards..."
                    className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button onClick={() => { setSearchOpen(false); setWardSearch(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {filteredWards.length === 0 ? (
                    <p className="px-2 py-3 text-center font-mono text-[10px] text-muted-foreground">No wards found</p>
                  ) : (
                    filteredWards.map((w) => (
                      <button
                        key={w.ward_no}
                        onClick={() => zoomToWard(w)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
                      >
                        <div>
                          <span className="block font-mono text-[10px] font-semibold text-foreground">{w.ward_name}</span>
                          <span className="font-mono text-[9px] text-muted-foreground">Ward {w.ward_no} · {w.ac_name}</span>
                        </div>
                        <span className="font-display text-xs font-bold" style={{ color: aqiToBorderColor(w.interpolated_aqi ?? 0).replace("0.7", "1") }}>
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
                className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <Search className="h-3 w-3" /> FIND WARD
              </button>
            )}
          </div>
        )}
        {/* AQI Legend */}
        {showWards && (
          <div className="absolute bottom-6 left-3 z-[1000] rounded-lg border border-border bg-card/90 p-2.5 backdrop-blur-sm">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">AQI Scale</p>
            <div className="flex flex-col gap-1">
              {[
                { label: "Good", range: "0–50", color: "rgba(0,229,160,0.7)" },
                { label: "Moderate", range: "51–100", color: "rgba(255,214,0,0.7)" },
                { label: "Sensitive", range: "101–150", color: "rgba(255,140,0,0.7)" },
                { label: "Unhealthy", range: "151–200", color: "rgba(255,61,61,0.75)" },
                { label: "Very Unhealthy", range: "201–300", color: "rgba(198,43,255,0.8)" },
                { label: "Hazardous", range: "300+", color: "rgba(255,0,51,0.85)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: item.color }} />
                  <span className="font-mono text-[9px] text-foreground">{item.range}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
