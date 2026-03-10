import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet.heat";
import { Search, X, Flame, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
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

const DELHI_CENTER: [number, number] = [28.6139, 77.209];
const DELHI_BOUNDS: L.LatLngBoundsExpression = [[28.40, 76.84], [28.88, 77.35]];

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

// Approximate Delhi NCT boundary outline to fill gaps (rivers, airport, cantonment, etc.)
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

export function MapView({ stations, selectedStation, onSelectStation, onBoundsChange, onWardSelect, activeWard }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const wardLayerRef = useRef<L.GeoJSON | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const specialZoneLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedWardRef = useRef<L.Layer | null>(null);
  const activeWardMarkerRef = useRef<L.Marker | null>(null);
  const placeMarkerRef = useRef<L.Marker | null>(null);
  const [showWards, setShowWards] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [wardSearch, setWardSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [placeResults, setPlaceResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const placeSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const map = mapRef.current;
    // Remove old place marker
    if (placeMarkerRef.current) { placeMarkerRef.current.remove(); placeMarkerRef.current = null; }

    const nearest = findNearestWard(place.lat, place.lon);
    if (nearest) {
      onWardSelect?.(nearest);
    }

    // Add pin marker at searched place
    if (map) {
      const pinIcon = L.divIcon({
        className: "place-pin-marker",
        html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">
          <div style="background:hsl(var(--primary));color:#000;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${place.name.split(",")[0]}</div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid hsl(var(--primary));"></div>
          <div style="width:6px;height:6px;border-radius:50%;background:hsl(var(--primary));box-shadow:0 0 8px hsl(var(--primary)),0 0 20px hsl(var(--primary)/0.4);margin-top:-1px;"></div>
        </div>`,
        iconSize: [120, 50],
        iconAnchor: [60, 50],
      });
      const marker = L.marker([place.lat, place.lon], { icon: pinIcon, zIndexOffset: 2000 });
      marker.addTo(map);
      placeMarkerRef.current = marker;
      map.setView([place.lat, place.lon], 14);
      // Auto-remove after 10s
      setTimeout(() => { if (placeMarkerRef.current === marker) { marker.remove(); placeMarkerRef.current = null; } }, 10000);
    }

    setSearchOpen(false);
    setWardSearch("");
    setPlaceResults([]);
  }, [findNearestWard, onWardSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DELHI_CENTER,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxBounds: DELHI_BOUNDS,
      maxBoundsViscosity: 0.8,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Fit to show all of Delhi
    map.fitBounds(DELHI_BOUNDS, { padding: [10, 10] });

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

  // Landmark markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: L.Marker[] = [];
    DELHI_LANDMARKS.forEach((lm) => {
      const icon = L.divIcon({
        className: "landmark-marker",
        html: `<div class="lm-wrap" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <span style="font-size:16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));line-height:1;">${lm.emoji}</span>
          <span class="lm-label" style="font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,0.8);white-space:nowrap;margin-top:2px;text-shadow:0 1px 3px rgba(0,0,0,0.8);background:rgba(4,8,16,0.85);padding:1px 5px;border-radius:4px;display:none;">${lm.name}</span>
        </div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });
      const m = L.marker([lm.lat, lm.lon], { icon, interactive: true, zIndexOffset: 500 });
      m.on("click", () => {
        const el = m.getElement()?.querySelector(".lm-label") as HTMLElement;
        if (el) el.style.display = el.style.display === "none" ? "block" : "none";
      });
      m.addTo(map);
      markers.push(m);
    });
    return () => markers.forEach((m) => m.remove());
  }, []);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.remove();
      boundaryLayerRef.current = null;
    }

    if (!showWards) return;

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
  }, [showWards]);

  // Ward layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
          weight: 1,
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

        layer.on("click", () => {
          // Reset previously selected ward
          if (selectedWardRef.current) {
            const prevAqi = (selectedWardRef.current as any).feature?.properties?.interpolated_aqi ?? 0;
            (selectedWardRef.current as any).setStyle({
              weight: 1,
              fillOpacity: 1,
              color: aqiToBorderColor(prevAqi),
            });
          }
          // Highlight selected ward
          (layer as any).setStyle({ weight: 3, color: "#fff", fillOpacity: 0.9 });
          selectedWardRef.current = layer;
          onWardSelect?.(p);
        });
        layer.on("mouseover", () => {
          if (selectedWardRef.current !== layer) {
            (layer as any).setStyle({ weight: 2, fillOpacity: 0.85 });
          }
        });
        layer.on("mouseout", () => {
          if (selectedWardRef.current !== layer) {
            (layer as any).setStyle({
              weight: 1,
              fillOpacity: 1,
              color: aqiToBorderColor(aqi),
            });
          }
        });
      },
    });

    wardLayer.addTo(map);
    wardLayerRef.current = wardLayer;
  }, [enrichedWards, showWards, onWardSelect]);

  // Special zones layer (Airport, Cantonment, Yamuna, etc.) — AQI color-coded
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (specialZoneLayerRef.current) {
      specialZoneLayerRef.current.remove();
      specialZoneLayerRef.current = null;
    }

    if (!showWards) return;

    const group = L.layerGroup();

    DELHI_SPECIAL_ZONES.forEach((zone) => {
      // IDW interpolation for zone centroid using station data
      const [cLon, cLat] = zone.centroid;
      let zoneAqi = 0;
      if (stationsWithCoords.length > 0) {
        const nearby = stationsWithCoords
          .map((s) => ({ ...s, dist: Math.sqrt(Math.pow(s.lat - cLat, 2) + Math.pow(s.lon - cLon, 2)) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3);
        if (nearby.length === 1) {
          zoneAqi = nearby[0].aqi;
        } else {
          const weights = nearby.map((s) => 1 / (s.dist + 0.001));
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          zoneAqi = Math.round(nearby.reduce((sum, s, i) => sum + s.aqi * weights[i], 0) / totalWeight);
        }
      }

      const poly = L.polygon(zone.polygon, {
        fillColor: aqiToFillColor(zoneAqi),
        fillOpacity: 1,
        color: aqiToBorderColor(zoneAqi),
        weight: 1.5,
        dashArray: "4,4",
        interactive: true,
      });

      poly.bindTooltip(
        `<div style="
          background:rgba(4,8,16,0.92);
          border:1px solid rgba(255,255,255,0.15);
          border-radius:8px;
          padding:10px 14px;
          font-family:'JetBrains Mono',monospace;
          min-width:160px;
        ">
          <div style="color:#fff;font-weight:700;font-size:13px;margin-bottom:4px">${zone.emoji} ${zone.name}</div>
          <div style="color:rgba(255,255,255,0.45);font-size:9px;margin-bottom:8px">${zone.description}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:rgba(255,255,255,0.6);font-size:11px">AQI</span>
            <span style="color:${aqiToBorderColor(zoneAqi).replace("0.7", "1")};font-size:18px;font-weight:800;font-family:'Orbitron',monospace">${zoneAqi || "—"}</span>
          </div>
          <div style="color:rgba(0,229,160,0.7);font-size:9px;margin-top:6px">CLICK TO EXPLORE →</div>
        </div>`,
        { permanent: false, sticky: true, className: "ward-tooltip" }
      );

      poly.on("click", () => {
        const fakeWard: WardFeature["properties"] = {
          ward_no: -1,
          ward_name: zone.name,
          ac_name: zone.description,
          ac_no: 0,
          total_pop: 0,
          sc_pop: 0,
          nw2022: "",
          centroid: zone.centroid,
          interpolated_aqi: zoneAqi,
        };
        onWardSelect?.(fakeWard);
      });

      poly.on("mouseover", () => {
        (poly as any).setStyle({ weight: 2, fillOpacity: 0.85 });
      });
      poly.on("mouseout", () => {
        (poly as any).setStyle({ weight: 1.5, fillOpacity: 1, color: aqiToBorderColor(zoneAqi) });
      });

      poly.addTo(group);
    });

    group.addTo(map);
    specialZoneLayerRef.current = group;
  }, [showWards, onWardSelect, stationsWithCoords]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!showHeatmap || !enrichedWards) return;

    const heatPoints: [number, number, number][] = enrichedWards.features.map((f) => {
      const [cLon, cLat] = f.properties.centroid;
      const intensity = Math.min((f.properties.interpolated_aqi ?? 0) / 500, 1);
      return [cLat, cLon, intensity];
    });

    const heat = (L as any).heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 1,
      minOpacity: 0.4,
      gradient: {
        0.0: "#00E5A0",
        0.2: "#FFD600",
        0.4: "#FF8C00",
        0.6: "#FF3D3D",
        0.8: "#C62BFF",
        1.0: "#FF0033",
      },
    });

    heat.addTo(map);
    heatLayerRef.current = heat;
  }, [enrichedWards, showHeatmap]);

  // Active ward pin marker with label
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeWardMarkerRef.current) {
      activeWardMarkerRef.current.remove();
      activeWardMarkerRef.current = null;
    }

    if (!activeWard?.centroid) return;

    const [cLon, cLat] = activeWard.centroid;
    const aqi = activeWard.interpolated_aqi ?? 0;
    const level = getAqiLevel(aqi);
    const wardName = activeWard.ward_name || "Ward";

    const pinIcon = L.divIcon({
      className: "active-ward-pin",
      html: `<div style="
        display:flex;flex-direction:column;align-items:center;
        filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6));
        animation:wardPinBounce 0.5s ease-out;
        pointer-events:none;
      ">
        <div style="
          background:rgba(4,8,16,0.92);
          border:1px solid ${level.color}80;
          border-radius:8px;
          padding:4px 10px;
          margin-bottom:4px;
          white-space:nowrap;
          backdrop-filter:blur(8px);
        ">
          <div style="
            font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;
            color:#fff;text-align:center;letter-spacing:0.5px;
          ">${wardName}</div>
          <div style="
            font-family:'Orbitron',monospace;font-size:16px;font-weight:900;
            color:${level.color};text-align:center;
            text-shadow:0 0 12px ${level.color}60;
            line-height:1.1;
          ">${aqi || "—"}</div>
        </div>
        <div style="
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:8px solid rgba(4,8,16,0.92);
          margin-bottom:-1px;
        "></div>
        <div style="
          width:4px;height:4px;border-radius:50%;
          background:${level.color};
          box-shadow:0 0 8px ${level.color}, 0 0 20px ${level.color}40;
          animation:wardPinPulse 2s ease-in-out infinite;
        "></div>
      </div>`,
      iconSize: [120, 80],
      iconAnchor: [60, 80],
    });

    const marker = L.marker([cLat, cLon], { icon: pinIcon, zIndexOffset: 1000 });
    marker.addTo(map);
    activeWardMarkerRef.current = marker;
  }, [activeWard]);


  return (
    <>
      <style>{`
        .custom-aqi-marker { background: none !important; border: none !important; }
        .active-ward-pin { background: none !important; border: none !important; }
        .place-pin-marker { background: none !important; border: none !important; }
        .landmark-marker { background: none !important; border: none !important; }
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
        .leaflet-control-zoom a:hover {
          background: hsl(220, 18%, 15%) !important;
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
        {/* Ward Search */}
        {showWards && (
          <div className="absolute left-3 top-3 z-[1000]">
            {searchOpen ? (
              <div className="w-64 rounded-lg border border-border bg-card/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    value={wardSearch}
                    onChange={(e) => { setWardSearch(e.target.value); searchPlaces(e.target.value); }}
                    placeholder="Search ward or place (India Gate...)"
                    className="flex-1 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button onClick={() => { setSearchOpen(false); setWardSearch(""); setPlaceResults([]); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {/* Ward results */}
                  {filteredWards.length > 0 && (
                    <>
                      <p className="px-2 py-1 font-mono text-[9px] tracking-widest text-muted-foreground">WARDS</p>
                      {filteredWards.map((w) => (
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
                      ))}
                    </>
                  )}
                  {/* Place results */}
                  {placeResults.length > 0 && (
                    <>
                      <p className="px-2 py-1 font-mono text-[9px] tracking-widest text-muted-foreground mt-1 border-t border-border pt-1.5">PLACES</p>
                      {placeResults.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handlePlaceSelect(p)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
                        >
                          <MapPin className="h-3 w-3 shrink-0 text-primary" />
                          <span className="font-mono text-[10px] text-foreground truncate">{p.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {searchingPlaces && (
                    <p className="px-2 py-2 text-center font-mono text-[10px] text-muted-foreground">Searching places...</p>
                  )}
                  {filteredWards.length === 0 && placeResults.length === 0 && !searchingPlaces && wardSearch.trim() && (
                    <p className="px-2 py-3 text-center font-mono text-[10px] text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <Search className="h-3 w-3" /> FIND WARD / PLACE
              </button>
            )}
          </div>
        )}
        {/* AQI Legend Toggle */}
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
              <button
                onClick={() => setShowLegend(true)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <div className="flex gap-0.5">
                  <span className="inline-block h-2.5 w-1.5 rounded-sm" style={{ background: "#00E5A0" }} />
                  <span className="inline-block h-2.5 w-1.5 rounded-sm" style={{ background: "#FFD600" }} />
                  <span className="inline-block h-2.5 w-1.5 rounded-sm" style={{ background: "#FF8C00" }} />
                  <span className="inline-block h-2.5 w-1.5 rounded-sm" style={{ background: "#FF3D3D" }} />
                  <span className="inline-block h-2.5 w-1.5 rounded-sm" style={{ background: "#C62BFF" }} />
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
