import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StationData } from "@/lib/aqi";
import { WardFeature } from "@/hooks/useDelhiWards";

function recoverJsonFromRaw(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // continue
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return null;
}

export function useAiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    station: StationData | StationData[] | null,
    mode: "station" | "city" | "compare" | "ward",
    ward?: WardFeature["properties"],
    liveIaqi?: Record<string, { v: number }>,
    language?: string,
  ) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const invokeWithRetry = async (attempt = 0) => {
      try {
        return await supabase.functions.invoke("analyze-station", {
          body: { station, mode, ward, liveIaqi, language: language || "en" },
        });
      } catch (invokeError) {
        const message = invokeError instanceof Error ? invokeError.message.toLowerCase() : "";
        const isTransportError =
          message.includes("failed to send a request") ||
          message.includes("network") ||
          message.includes("fetch");

        if (isTransportError && attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          return invokeWithRetry(attempt + 1);
        }

        throw invokeError;
      }
    };

    try {
      const { data, error: fnError } = await invokeWithRetry();

      if (fnError) {
        const errMsg =
          typeof data === "object" && data && "error" in data && typeof data.error === "string"
            ? data.error
            : fnError instanceof Error
              ? fnError.message
              : "AI analysis failed";

        if (errMsg.includes("credits") || errMsg.includes("402") || errMsg.includes("non-2xx")) {
          throw new Error("AI analysis temporarily unavailable. Please try again shortly.");
        }
        if (errMsg.includes("rate") || errMsg.includes("429")) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error(errMsg);
      }

      if (!data) throw new Error("No analysis data received");

      let finalData: Record<string, unknown> = data as Record<string, unknown>;
      if (
        typeof data === "object" &&
        data &&
        "raw" in data &&
        typeof (data as { raw?: unknown }).raw === "string"
      ) {
        const recovered = recoverJsonFromRaw((data as { raw: string }).raw);
        if (recovered) finalData = recovered;
      }

      setAnalysis(finalData);
    } catch (e: unknown) {
      console.error("[AI Analysis]", e);
      setError(e instanceof Error ? e.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return { analyze, analysis, loading, error };
}
