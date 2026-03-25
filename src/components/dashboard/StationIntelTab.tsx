import { useEffect } from "react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useLanguage } from "@/contexts/LanguageContext";
import { AqiGauge } from "./AqiGauge";
import { ForecastChart } from "./ForecastChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Brain, ShieldAlert, Loader2 } from "lucide-react";

interface StationIntelTabProps {
  station: StationData;
}

const POLLUTANTS = [
  { key: "pm25", label: "PM2.5", max: 500, unit: "µg/m³" },
  { key: "pm10", label: "PM10", max: 600, unit: "µg/m³" },
  { key: "no2", label: "NO₂", max: 200, unit: "ppb" },
  { key: "so2", label: "SO₂", max: 200, unit: "ppb" },
  { key: "o3", label: "O₃", max: 300, unit: "ppb" },
  { key: "co", label: "CO", max: 50, unit: "ppm" },
];

export function StationIntelTab({ station }: StationIntelTabProps) {
  const level = getAqiLevel(station.aqi);
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const { t, lang } = useLanguage();
  const forecastData = station.forecast?.daily?.pm25?.slice(0, 7) ?? [];

  useEffect(() => {
    analyze(station, "station", undefined, undefined, lang);
  }, [station.stationId, lang]);

  const ai = analysis as {
    summary?: string;
    health_risk?: string;
    key_concerns?: string[];
    recommendations?: string[];
    trend_analysis?: string;
  } | null;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4 pb-20 sm:pb-16">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <AqiGauge aqi={station.aqi} size={140} />
          <div className="flex-1">
            <h3 className="font-display text-base font-bold tracking-wide text-foreground">
              {station.name}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">{station.area}</p>
            <span
              className="mt-1 inline-block rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold"
              style={{ backgroundColor: `${level.color}20`, color: level.color, border: `1px solid ${level.color}40` }}
            >
              {level.label.toUpperCase()}
            </span>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {t("intel.dominant")}: {station.dominantPollutant.toUpperCase().replace("25", "2.5")} • {station.time.s}
            </p>
          </div>
        </div>

        <div className="cyber-border rounded-lg p-4">
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <Brain className="h-4 w-4" /> {t("intel.aiAnalysis")}
          </h4>
          {aiLoading ? (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">{t("intel.analyzing")}</span>
            </div>
          ) : aiError ? (
            <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
          ) : ai ? (
            <div className="mt-3 space-y-3">
              {ai.summary && (
                <p className="font-body text-sm leading-relaxed text-foreground">{ai.summary}</p>
              )}
              {ai.health_risk && (
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-aqi-unhealthy" />
                  <span className="font-display text-xs font-bold text-aqi-unhealthy">
                    {t("intel.risk")}: {ai.health_risk}
                  </span>
                </div>
              )}
              {ai.key_concerns && ai.key_concerns.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">{t("intel.keyConcerns")}</span>
                  <ul className="mt-1 space-y-1">
                    {ai.key_concerns.map((c, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1 font-body text-xs text-secondary-foreground">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.recommendations && ai.recommendations.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">{t("intel.recommendations")}</span>
                  <ul className="mt-1 space-y-1">
                    {ai.recommendations.map((r, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1 font-body text-xs text-secondary-foreground">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.trend_analysis && (
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">{t("intel.trendAnalysis")}</span>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{ai.trend_analysis}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div>
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <Activity className="h-4 w-4" /> {t("intel.pollutantBreakdown")}
          </h4>
          <div className="mt-2 space-y-2">
            {POLLUTANTS.map(({ key, label, max, unit }) => {
              const val = station.iaqi[key]?.v;
              if (val === undefined) return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-14 font-mono text-xs text-muted-foreground">{label}</span>
                  <span className="font-mono text-xs text-muted-foreground/50">{t("intel.na")}</span>
                </div>
              );
              const pct = Math.min((val / max) * 100, 100);
              const barLevel = getAqiLevel(val);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-14 font-mono text-xs text-muted-foreground">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barLevel.color }} />
                  </div>
                  <span className="w-16 text-right font-mono text-xs text-foreground">
                    {val} <span className="text-muted-foreground">{unit}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {forecastData.length > 0 && (
          <div>
            <h4 className="font-display text-xs font-bold tracking-widest text-primary">
              📊 {t("intel.forecast")}
            </h4>
            <div className="mt-2">
              <ForecastChart data={forecastData} />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
