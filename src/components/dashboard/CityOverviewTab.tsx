import { useEffect, useMemo } from "react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDelhiWards } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToBorderColor, getAQICategory } from "@/lib/wardAqi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { TabMiniMap } from "@/components/dashboard/TabMiniMap";

interface CityOverviewTabProps {
  stations: StationData[];
  cityAqi: number;
}

export function CityOverviewTab({ stations, cityAqi }: CityOverviewTabProps) {
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const { t, lang } = useLanguage();
  // mlLevel computed later from ward data
  const { wardsGeoJSON } = useDelhiWards();

  // Use lat/lon directly from station data (dynamically discovered)
  const STATION_COORDS: { lat: number; lon: number; aqi: number }[] = useMemo(
    () =>
      stations
        .filter((s) => s.lat != null && s.lon != null)
        .map((s) => ({ lat: s.lat!, lon: s.lon!, aqi: s.aqi })),
    [stations]
  );

  const enrichedWards = useMemo(
    () => assignAQIToWards(wardsGeoJSON, STATION_COORDS),
    [wardsGeoJSON, STATION_COORDS]
  );

  const top10Polluted = useMemo(() => {
    if (!enrichedWards) return [];
    return [...enrichedWards.features]
      .filter((f) => (f.properties.interpolated_aqi ?? 0) > 0)
      .sort((a, b) => (b.properties.interpolated_aqi ?? 0) - (a.properties.interpolated_aqi ?? 0))
      .slice(0, 10)
      .map((f, i) => ({ rank: i + 1, ...f.properties }));
  }, [enrichedWards]);

  // Use ML-based city AQI from all wards (weighted by population) instead of simple station average
  const mlCityAqi = useMemo(() => {
    if (!enrichedWards) return cityAqi;
    const wards = enrichedWards.features.filter((f) => (f.properties.interpolated_aqi ?? 0) > 0);
    if (wards.length === 0) return cityAqi;
    const totalPop = wards.reduce((s, f) => s + (f.properties.total_pop ?? 1), 0);
    const weightedAqi = wards.reduce((s, f) => {
      const pop = f.properties.total_pop ?? 1;
      return s + (f.properties.interpolated_aqi ?? 0) * pop;
    }, 0);
    return Math.round(weightedAqi / totalPop);
  }, [enrichedWards, cityAqi]);

  const mlLevel = getAqiLevel(mlCityAqi);

  useEffect(() => {
    if (stations.length > 0 && enrichedWards) {
      const wardSummary = enrichedWards.features
        .filter((f) => (f.properties.interpolated_aqi ?? 0) > 0)
        .sort((a, b) => (b.properties.interpolated_aqi ?? 0) - (a.properties.interpolated_aqi ?? 0))
        .slice(0, 20)
        .map((f) => ({ name: f.properties.ward_name, aqi: f.properties.interpolated_aqi, pop: f.properties.total_pop, ac: f.properties.ac_name }));
      const allWardsSorted = enrichedWards.features
        .filter((f) => (f.properties.interpolated_aqi ?? 0) > 0)
        .sort((a, b) => (b.properties.interpolated_aqi ?? 0) - (a.properties.interpolated_aqi ?? 0));
      const totalWardCount = allWardsSorted.length;
      const worstWards = allWardsSorted.slice(0, 30).map((f) => ({ name: f.properties.ward_name, aqi: f.properties.interpolated_aqi, pop: f.properties.total_pop, ac: f.properties.ac_name }));
      const bestWards = allWardsSorted.slice(-10).map((f) => ({ name: f.properties.ward_name, aqi: f.properties.interpolated_aqi, pop: f.properties.total_pop, ac: f.properties.ac_name }));
      const aqiBands = { good: 0, moderate: 0, sensitive: 0, unhealthy: 0, veryUnhealthy: 0, hazardous: 0 };
      allWardsSorted.forEach((f) => {
        const a = f.properties.interpolated_aqi ?? 0;
        if (a <= 50) aqiBands.good++;
        else if (a <= 100) aqiBands.moderate++;
        else if (a <= 150) aqiBands.sensitive++;
        else if (a <= 200) aqiBands.unhealthy++;
        else if (a <= 300) aqiBands.veryUnhealthy++;
        else aqiBands.hazardous++;
      });
      analyze(
        [{ name: "Delhi City (251 Wards)", aqi: mlCityAqi, area: "NCT Delhi", dominantPollutant: "pm25", iaqi: {}, wardSummary: worstWards, bestWards, aqiBands, totalWards: totalWardCount, stationCount: stations.length }] as unknown as StationData[],
        "city",
        undefined,
        undefined,
        lang
      );
    }
  }, [stations.length, lang, mlCityAqi]);

  const ai = analysis as {
    city_summary?: string;
    worst_areas?: string[];
    best_areas?: string[];
    primary_pollutants?: string[];
    health_advisory?: string;
    outlook?: string;
  } | null;

  // Use all enriched wards for the bar chart — top 15 most polluted
  const barData = useMemo(() => {
    if (!enrichedWards) return [];
    return [...enrichedWards.features]
      .filter((f) => (f.properties.interpolated_aqi ?? 0) > 0)
      .sort((a, b) => (b.properties.interpolated_aqi ?? 0) - (a.properties.interpolated_aqi ?? 0))
      .slice(0, 15)
      .map((f) => ({
        name: f.properties.ward_name,
        aqi: f.properties.interpolated_aqi ?? 0,
        color: getAqiLevel(f.properties.interpolated_aqi ?? 0).color,
        pop: f.properties.total_pop,
      }));
  }, [enrichedWards]);

  const pollutantKeys = ["pm25", "pm10", "no2", "so2", "o3", "co"];
  const radarData = pollutantKeys.map((key) => {
    const values = stations.map((s) => s.iaqi[key]?.v).filter((v): v is number => v !== undefined);
    const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return { pollutant: key.toUpperCase().replace("25", "2.5"), value: avg };
  });

  return (
    <div>
      <div className="space-y-4 p-3 pb-20 sm:p-4 sm:pb-16">
        <div className="cyber-border rounded-lg p-4 text-center">
          <span className="font-mono text-[10px] text-muted-foreground">CITY AQI (POPULATION-WEIGHTED · 251 WARDS)</span>
          <div className="mt-1 font-display text-4xl font-black" style={{ color: mlLevel.color, textShadow: `0 0 20px ${mlLevel.color}60` }}>
            {mlCityAqi}
          </div>
          <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold" style={{ backgroundColor: `${mlLevel.color}20`, color: mlLevel.color }}>
            {mlLevel.label.toUpperCase()}
          </span>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">{enrichedWards?.features.length ?? 0} wards · {stations.length} {t("city.stationsReporting")}</p>
        </div>

        <div className="cyber-border rounded-lg p-4">
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <Brain className="h-4 w-4" /> {t("city.aiIntelligence")}
          </h4>
          {aiLoading ? (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">{t("city.analyzingCity")}</span>
            </div>
          ) : aiError ? (
            <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
          ) : ai ? (
            <div className="mt-3 space-y-2">
              {ai.city_summary && <p className="font-body text-sm leading-relaxed text-foreground">{ai.city_summary}</p>}
              {ai.health_advisory && (
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{t("city.healthAdvisory")}</span>
                  <p className="mt-0.5 font-body text-xs text-secondary-foreground">{ai.health_advisory}</p>
                </div>
              )}
              {ai.outlook && (
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{t("city.outlook")}</span>
                  <p className="mt-0.5 font-body text-xs text-secondary-foreground">{ai.outlook}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div>
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <TrendingUp className="h-4 w-4" /> {t("city.top10")} — TOP 15 WARDS
          </h4>
          <div className="mt-2 h-56 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 50, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "hsl(220, 15%, 18%)" }} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                <Bar dataKey="aqi" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold tracking-widest text-primary">
            🎯 {t("city.pollutantProfile")}
          </h4>
          <div className="mt-2 h-52 sm:h-60 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 15%, 18%)" />
                <PolarAngleAxis dataKey="pollutant" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <PolarRadiusAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 7 }} />
                <Radar name="Average" dataKey="value" stroke="hsl(180, 100%, 45%)" fill="hsl(180, 100%, 45%)" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 9 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {top10Polluted.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
              <AlertTriangle className="h-4 w-4" /> {t("city.top10")}
            </h4>
            <div className="mt-2 space-y-1">
              {top10Polluted.map((w) => {
                const aqi = w.interpolated_aqi ?? 0;
                const barWidth = Math.min((aqi / 500) * 100, 100);
                const color = aqiToBorderColor(aqi).replace("0.7", "1").replace("0.75", "1").replace("0.8", "1").replace("0.85", "1");
                return (
                  <div key={w.ward_no} className="group relative flex items-center gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2 transition-colors hover:bg-secondary/40">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-black" style={{ backgroundColor: `${color}20`, color }}>{w.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-mono text-[11px] font-semibold text-foreground">{w.ward_name}</span>
                        <span className="ml-2 shrink-0 font-display text-sm font-black" style={{ color }}>{aqi}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-secondary/50 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: color }} />
                        </div>
                        <span className="shrink-0 font-mono text-[8px] text-muted-foreground">{getAQICategory(aqi)}</span>
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        Ward {w.ward_no} · {w.ac_name} · Pop: {w.total_pop?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
