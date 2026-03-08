import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StationData } from "@/lib/aqi";

export function useAiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (station: StationData | StationData[], mode: "station" | "city" | "compare") => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-station", {
        body: { station, mode },
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
