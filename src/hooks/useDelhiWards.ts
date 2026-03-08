import { useState, useEffect } from "react";

export interface WardFeature {
  type: "Feature";
  properties: {
    ward_no: number;
    ward_name: string;
    ac_name: string;
    ac_no: number;
    total_pop: number;
    sc_pop: number;
    nw2022: string;
    centroid: [number, number];
    interpolated_aqi?: number;
    nearest_station_dist?: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface WardsGeoJSON {
  type: "FeatureCollection";
  features: WardFeature[];
}

export function useDelhiWards() {
  const [wardsGeoJSON, setWardsGeoJSON] = useState<WardsGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/delhi_wards.geojson")
      .then((res) => res.json())
      .then((data: WardsGeoJSON) => {
        setWardsGeoJSON(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load ward boundaries:", err);
        setLoading(false);
      });
  }, []);

  return { wardsGeoJSON, loading };
}
