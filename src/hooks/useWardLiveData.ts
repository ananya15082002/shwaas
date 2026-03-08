import { useState, useEffect } from "react";
import { WAQI_TOKEN } from "@/lib/aqi";

interface WaqiGeoData {
  aqi: number;
  station: string;
  iaqi: Record<string, { v: number }>;
  time?: { s: string };
  dominentpol?: string;
}

export function useWardLiveData(centroid: [number, number] | null) {
  const [data, setData] = useState<WaqiGeoData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!centroid) return;
    const [lon, lat] = centroid;
    setLoading(true);
    setData(null);

    fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "ok") {
          setData({
            aqi: json.data.aqi,
            station: json.data.city?.name ?? "Unknown",
            iaqi: json.data.iaqi ?? {},
            time: json.data.time,
            dominentpol: json.data.dominentpol,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [centroid?.[0], centroid?.[1]]);

  return { data, loading };
}
