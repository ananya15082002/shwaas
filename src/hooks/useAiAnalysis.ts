import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StationData } from "@/lib/aqi";
import { WardFeature } from "@/hooks/useDelhiWards";

export function useAiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    station: StationData | StationData[] | null,
    mode: "station" | "city" | "compare" | "ward",
    ward?: WardFeature["properties"],
    liveIaqi?: Record<string, { v: number }>
  ) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-station", {
        body: { station, mode, ward, liveIaqi },
      });
      if (fnError) throw fnError;
      setAnalysis(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return { analyze, analysis, loading, error };
}
