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
    liveIaqi?: Record<string, { v: number }>,
    language?: string
  ) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-station", {
        body: { station, mode, ward, liveIaqi, language: language || "en" },
      });

      // Handle rate limit / credits exhausted gracefully
      if (fnError) {
        const errMsg = (typeof data === "object" && data?.error)
          ? data.error
          : (fnError instanceof Error ? fnError.message : "AI analysis failed");
        
        if (errMsg.includes("credits") || errMsg.includes("402") || errMsg.includes("non-2xx")) {
          throw new Error("AI analysis temporarily unavailable. Credits may be exhausted.");
        }
        if (errMsg.includes("rate") || errMsg.includes("429")) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error(errMsg);
      }
      if (!data) throw new Error("No analysis data received");
      setAnalysis(data);
    } catch (e: unknown) {
      console.error("[AI Analysis]", e);
      setError(e instanceof Error ? e.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return { analyze, analysis, loading, error };
}
