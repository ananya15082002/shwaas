import type { WardsGeoJSON } from "@/hooks/useDelhiWards";

interface StationWithCoords {
  lat: number;
  lon: number;
  aqi: number;
}

export function assignAQIToWards(
  wardsGeoJSON: WardsGeoJSON | null,
  stationsData: StationWithCoords[]
): WardsGeoJSON | null {
  if (!wardsGeoJSON || !stationsData.length) return wardsGeoJSON;

  return {
    ...wardsGeoJSON,
    features: wardsGeoJSON.features.map((ward) => {
      const [cLon, cLat] = ward.properties.centroid;

      const nearby = stationsData
        .map((s) => ({
          ...s,
          dist: Math.sqrt(Math.pow(s.lat - cLat, 2) + Math.pow(s.lon - cLon, 2)),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

      let wardAQI = nearby[0]?.aqi ?? 0;
      if (nearby.length > 1) {
        const weights = nearby.map((s) => 1 / (s.dist + 0.001));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        wardAQI = nearby.reduce((sum, s, i) => sum + s.aqi * weights[i], 0) / totalWeight;
      }

      return {
        ...ward,
        properties: {
          ...ward.properties,
          interpolated_aqi: Math.round(wardAQI),
          nearest_station_dist: Math.round((nearby[0]?.dist ?? 0) * 111000),
        },
      };
    }),
  };
}

export function aqiToFillColor(aqi: number): string {
  if (!aqi || aqi === 0) return "rgba(40,45,55,0.8)";
  if (aqi <= 50) return "rgba(0,229,160,0.55)";
  if (aqi <= 100) return "rgba(255,214,0,0.55)";
  if (aqi <= 150) return "rgba(255,140,0,0.55)";
  if (aqi <= 200) return "rgba(255,61,61,0.6)";
  if (aqi <= 300) return "rgba(198,43,255,0.6)";
  return "rgba(255,0,51,0.65)";
}

export function aqiToBorderColor(aqi: number): string {
  if (!aqi || aqi === 0) return "rgba(150,150,150,0.4)";
  if (aqi <= 50) return "rgba(0,229,160,0.7)";
  if (aqi <= 100) return "rgba(255,214,0,0.7)";
  if (aqi <= 150) return "rgba(255,140,0,0.7)";
  if (aqi <= 200) return "rgba(255,61,61,0.75)";
  if (aqi <= 300) return "rgba(198,43,255,0.8)";
  return "rgba(255,0,51,0.85)";
}

export function getAQICategory(aqi: number): string {
  if (!aqi || aqi === 0) return "N/A";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
