export const WAQI_TOKEN = "9fc975c6d3b1d5c5376f3b846bf4d8495c4f8758";
export const WAQI_BASE = "https://api.waqi.info/feed";

export const STATIONS = [
  { id: "delhi/ito", name: "ITO", area: "Central Delhi" },
  { id: "delhi/anand-vihar", name: "Anand Vihar", area: "East Delhi" },
  { id: "delhi/rk-puram", name: "RK Puram", area: "South Delhi" },
  { id: "delhi/punjabi-bagh", name: "Punjabi Bagh", area: "West Delhi" },
  { id: "delhi/dwarka-sector-8", name: "Dwarka Sec-8", area: "South-West Delhi" },
  { id: "delhi/chandni-chowk", name: "Chandni Chowk", area: "Old Delhi" },
  { id: "delhi/rohini", name: "Rohini", area: "North Delhi" },
  { id: "delhi/shadipur", name: "Shadipur", area: "Central-West Delhi" },
] as const;

export interface StationData {
  stationId: string;
  name: string;
  area: string;
  aqi: number;
  dominantPollutant: string;
  iaqi: Record<string, { v: number }>;
  forecast?: {
    daily?: {
      pm25?: Array<{ day: string; avg: number; min: number; max: number }>;
      pm10?: Array<{ day: string; avg: number; min: number; max: number }>;
    };
  };
  time: { s: string; iso: string };
}

export interface AqiLevel {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  description: string;
}

export function getAqiLevel(aqi: number): AqiLevel {
  if (aqi <= 50) return { label: "Good", color: "#00e676", bgClass: "bg-aqi-good", textClass: "text-aqi-good", description: "Air quality is satisfactory" };
  if (aqi <= 100) return { label: "Moderate", color: "#ffeb3b", bgClass: "bg-aqi-moderate", textClass: "text-aqi-moderate", description: "Acceptable air quality" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "#ff9800", bgClass: "bg-aqi-sensitive", textClass: "text-aqi-sensitive", description: "Sensitive groups may experience effects" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#f44336", bgClass: "bg-aqi-unhealthy", textClass: "text-aqi-unhealthy", description: "Everyone may experience health effects" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#9c27b0", bgClass: "bg-aqi-very-unhealthy", textClass: "text-aqi-very-unhealthy", description: "Health alert: serious health effects" };
  return { label: "Hazardous", color: "#7e0023", bgClass: "bg-aqi-hazardous", textClass: "text-aqi-hazardous", description: "Emergency conditions" };
}

export function getHealthAdvisory(aqi: number): string {
  if (aqi <= 50) return "Air quality is excellent. Enjoy outdoor activities freely. No precautions needed.";
  if (aqi <= 100) return "Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.";
  if (aqi <= 150) return "Members of sensitive groups (children, elderly, those with respiratory conditions) should reduce prolonged outdoor exertion. Others can be active outdoors.";
  if (aqi <= 200) return "Everyone should reduce prolonged outdoor exertion. Use N95 masks if outdoors. Keep windows closed. Run air purifiers indoors.";
  if (aqi <= 300) return "HEALTH WARNING: Avoid all outdoor physical activities. Wear N95/N99 masks if going outside is necessary. Keep all windows and doors sealed. Use air purifiers on maximum setting.";
  return "EMERGENCY: Stay indoors. Do not venture outside under any circumstances. Seal all windows and doors. Use air purifiers. Seek medical attention if experiencing breathing difficulties.";
}

export function getPollutionSources(aqi: number, dominant: string): string[] {
  const sources: string[] = [];
  if (aqi > 100) sources.push("🚗 Vehicular emissions from heavy traffic corridors");
  if (aqi > 150) sources.push("🏗️ Construction dust from ongoing development projects");
  if (aqi > 200) sources.push("🔥 Crop residue burning in neighboring states");
  if (aqi > 150) sources.push("🏭 Industrial emissions from surrounding areas");
  if (aqi > 250) sources.push("🌫️ Temperature inversion trapping pollutants near ground level");
  if (dominant === "pm25" || dominant === "pm10") sources.push("💨 Particulate matter from road dust and open burning");
  if (sources.length === 0) sources.push("✅ Minimal pollution sources detected");
  return sources;
}

export function getPolicyRecommendations(aqi: number): string[] {
  const recs: string[] = [];
  if (aqi > 100) recs.push("Enforce Bharat Stage VI emission standards strictly");
  if (aqi > 150) recs.push("Implement odd-even vehicle rationing scheme");
  if (aqi > 200) recs.push("Halt all construction activities within city limits");
  if (aqi > 200) recs.push("Deploy water sprinklers on major roads and construction sites");
  if (aqi > 250) recs.push("Close schools and shift to online learning");
  if (aqi > 300) recs.push("Declare public health emergency under GRAP Stage IV");
  if (aqi > 300) recs.push("Ban entry of non-essential trucks into Delhi");
  if (recs.length === 0) recs.push("Continue monitoring and maintain current green initiatives");
  return recs;
}

export async function fetchStationData(stationId: string): Promise<StationData | null> {
  try {
    const res = await fetch(`${WAQI_BASE}/${stationId}/?token=${WAQI_TOKEN}`);
    const json = await res.json();
    if (json.status !== "ok") return null;
    const d = json.data;
    const station = STATIONS.find(s => s.id === stationId);
    return {
      stationId,
      name: station?.name ?? stationId,
      area: station?.area ?? "",
      aqi: d.aqi,
      dominantPollutant: d.dominentpol ?? "pm25",
      iaqi: d.iaqi ?? {},
      forecast: d.forecast,
      time: d.time,
    };
  } catch {
    return null;
  }
}

export async function fetchAllStations(): Promise<(StationData | null)[]> {
  return Promise.all(STATIONS.map(s => fetchStationData(s.id)));
}
