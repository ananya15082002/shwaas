import { useState, useEffect, useCallback } from "react";
import { fetchAllStations, StationData } from "@/lib/aqi";

export function useAqiData() {
  const [stations, setStations] = useState<(StationData | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllStations();
      setStations(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError("Failed to fetch air quality data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const validStations = stations.filter((s): s is StationData => s !== null);
  const cityAqi = validStations.length > 0
    ? Math.round(validStations.reduce((sum, s) => sum + s.aqi, 0) / validStations.length)
    : 0;

  return { stations: validStations, loading, error, lastUpdated, cityAqi, refresh };
}
