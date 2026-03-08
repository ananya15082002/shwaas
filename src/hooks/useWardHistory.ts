import { useState, useEffect } from "react";
import { WAQI_TOKEN } from "@/lib/aqi";

export interface DailyAqi {
  day: string;
  avg: number;
  min: number;
  max: number;
}

export interface WardHistory {
  pm25: DailyAqi[];
  pm10: DailyAqi[];
}

export function useWardHistory(centroid: [number, number] | null) {
  const [history, setHistory] = useState<WardHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!centroid) return;
    const [lon, lat] = centroid;
    setLoading(true);
    setHistory(null);

    fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "ok") {
          const forecast = json.data.forecast?.daily;
          if (forecast) {
            setHistory({
              pm25: forecast.pm25 ?? [],
              pm10: forecast.pm10 ?? [],
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [centroid?.[0], centroid?.[1]]);

  return { history, loading };
}
