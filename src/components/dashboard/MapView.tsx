import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { StationData, getAqiLevel } from "@/lib/aqi";

interface MapViewProps {
  stations: StationData[];
  selectedStation: StationData | null;
  onSelectStation: (station: StationData) => void;
  onBoundsChange?: (bounds: { lat1: number; lng1: number; lat2: number; lng2: number }) => void;
}

const DELHI_CENTER: [number, number] = [28.6139, 77.209];

function createMarkerIcon(aqi: number, isSelected: boolean) {
  const level = getAqiLevel(aqi);
  const size = isSelected ? 40 : 30;
  return L.divIcon({
    className: "custom-aqi-marker",
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${level.color};
      border:2px solid ${isSelected ? '#fff' : level.color + '80'};
      box-shadow:0 0 ${isSelected ? 20 : 10}px ${level.color}80;
      display:flex;align-items:center;justify-content:center;
      font-family:'Orbitron',monospace;font-size:${isSelected ? 11 : 9}px;
      font-weight:700;color:#000;
      transition:all 0.3s;
    ">${aqi}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapView({ stations, selectedStation, onSelectStation, onBoundsChange }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Update markers when stations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      // Approximate coords from station IDs for known stations
      const coords = getStationCoords(station.stationId);
      if (!coords) return;

      const isSelected = selectedStation?.stationId === station.stationId;
      const marker = L.marker(coords, {
        icon: createMarkerIcon(station.aqi, isSelected),
      })
        .addTo(map)
        .bindTooltip(
          `<div style="font-family:'Orbitron',monospace;font-size:10px;font-weight:600;">${station.name}</div>
           <div style="font-family:'JetBrains Mono',monospace;font-size:9px;">AQI: ${station.aqi} • ${station.area}</div>`,
          {
            className: "custom-tooltip",
            direction: "top",
            offset: [0, -15],
          }
        );

      marker.on("click", () => onSelectStation(station));
      markersRef.current.push(marker);
    });
  }, [stations, selectedStation, onSelectStation]);

  return (
    <>
      <style>{`
        .custom-aqi-marker { background: none !important; border: none !important; }
        .custom-tooltip {
          background: hsl(220, 18%, 10%) !important;
          border: 1px solid hsl(220, 15%, 18%) !important;
          border-radius: 8px !important;
          color: hsl(210, 20%, 92%) !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .custom-tooltip::before { border-top-color: hsl(220, 15%, 18%) !important; }
        .leaflet-control-zoom a {
          background: hsl(220, 18%, 10%) !important;
          color: hsl(180, 100%, 45%) !important;
          border-color: hsl(220, 15%, 18%) !important;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}

function getStationCoords(stationId: string): [number, number] | null {
  const coords: Record<string, [number, number]> = {
    "delhi/ito": [28.6289, 77.2414],
    "delhi/anand-vihar": [28.6468, 77.3160],
    "delhi/rk-puram": [28.5633, 77.1725],
    "delhi/punjabi-bagh": [28.6682, 77.1313],
    "delhi/dwarka-sector-8": [28.5708, 77.0711],
    "delhi/chandni-chowk": [28.6506, 77.2302],
    "delhi/rohini": [28.7329, 77.1166],
    "delhi/shadipur": [28.6514, 77.1594],
  };
  return coords[stationId] || null;
}
