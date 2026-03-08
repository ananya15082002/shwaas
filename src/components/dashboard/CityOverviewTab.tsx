import { useEffect, useMemo } from "react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useDelhiWards } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToBorderColor, getAQICategory } from "@/lib/wardAqi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, TrendingUp, AlertTriangle } from "lucide-react";

interface CityOverviewTabProps {
  stations: StationData[];
  cityAqi: number;
}

export function CityOverviewTab({ stations, cityAqi }: CityOverviewTabProps) {
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const level = getAqiLevel(cityAqi);
  const { wardsGeoJSON } = useDelhiWards();

  const STATION_COORDS: { lat: number; lon: number; aqi: number }[] = useMemo(
    () =>
      stations
        .map((s) => {
          const coordMap: Record<string, [number, number]> = {
            "delhi/ito": [28.6289, 77.2414],
            "delhi/anand-vihar": [28.6468, 77.316],
            "delhi/rk-puram": [28.5633, 77.1725],
            "delhi/punjabi-bagh": [28.6682, 77.1313],
            "delhi/dwarka-sector-8": [28.5708, 77.0711],
            "delhi/chandni-chowk": [28.6506, 77.2302],
            "delhi/rohini": [28.7329, 77.1166],
            "delhi/shadipur": [28.6514, 77.1594],
          };
          const c = coordMap[s.stationId];
          return c ? { lat: c[0], lon: c[1], aqi: s.aqi } : null;
        })
        .filter(Boolean) as { lat: number; lon: number; aqi: number }[],
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

  useEffect(() => {
    if (stations.length > 0) {
      analyze(
        stations.map((s) => ({ name: s.name, area: s.area, aqi: s.aqi, dominantPollutant: s.dominantPollutant, iaqi: s.iaqi })) as unknown as StationData[],
        "city"
      );
    }
  }, [stations.length]);

  const ai = analysis as {
    city_summary?: string;
    worst_areas?: string[];
    best_areas?: string[];
    primary_pollutants?: string[];
    health_advisory?: string;
    outlook?: string;
  } | null;

  // Bar chart data
  const barData = stations.map((s) => ({
    name: s.name,
    aqi: s.aqi,
    color: getAqiLevel(s.aqi).color,
  }));

  // Radar chart — average pollutants across stations
  const pollutantKeys = ["pm25", "pm10", "no2", "so2", "o3", "co"];
  const radarData = pollutantKeys.map((key) => {
    const values = stations.map((s) => s.iaqi[key]?.v).filter((v): v is number => v !== undefined);
    const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return { pollutant: key.toUpperCase().replace("25", "2.5"), value: avg };
  });

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-5 p-4">
        {/* City AQI Header */}
        <div className="cyber-border rounded-lg p-4 text-center">
          <span className="font-mono text-[10px] text-muted-foreground">DELHI NCR CITY AVERAGE</span>
          <div className="mt-1 font-display text-4xl font-black" style={{ color: level.color, textShadow: `0 0 20px ${level.color}60` }}>
            {cityAqi}
          </div>
          <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
            {level.label.toUpperCase()}
          </span>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">{stations.length} stations reporting</p>
        </div>

        {/* AI City Overview */}
        <div className="cyber-border rounded-lg p-4">
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <Brain className="h-4 w-4" /> AI CITY INTELLIGENCE
          </h4>
          {aiLoading ? (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">Analyzing city data...</span>
            </div>
          ) : aiError ? (
            <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
          ) : ai ? (
            <div className="mt-3 space-y-2">
              {ai.city_summary && <p className="font-body text-sm leading-relaxed text-foreground">{ai.city_summary}</p>}
              {ai.health_advisory && (
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="font-mono text-[10px] text-muted-foreground">HEALTH ADVISORY</span>
                  <p className="mt-0.5 font-body text-xs text-secondary-foreground">{ai.health_advisory}</p>
                </div>
              )}
              {ai.outlook && (
                <div className="rounded border border-border bg-secondary/30 p-2">
                  <span className="font-mono text-[10px] text-muted-foreground">OUTLOOK</span>
                  <p className="mt-0.5 font-body text-xs text-secondary-foreground">{ai.outlook}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Station AQI Bar Chart */}
        <div>
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <TrendingUp className="h-4 w-4" /> STATION AQI COMPARISON
          </h4>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "hsl(220, 15%, 18%)" }}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 10%)",
                    border: "1px solid hsl(220, 15%, 18%)",
                    borderRadius: "8px",
                    fontFamily: "JetBrains Mono",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="aqi" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pollutant Radar */}
        <div>
          <h4 className="font-display text-xs font-bold tracking-widest text-primary">
            🎯 AVERAGE POLLUTANT PROFILE
          </h4>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 15%, 18%)" />
                <PolarAngleAxis
                  dataKey="pollutant"
                  tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                />
                <PolarRadiusAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 8 }} />
                <Radar
                  name="Average"
                  dataKey="value"
                  stroke="hsl(180, 100%, 45%)"
                  fill="hsl(180, 100%, 45%)"
                  fillOpacity={0.2}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Top 10 Most Polluted Wards */}
        {top10Polluted.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
              <AlertTriangle className="h-4 w-4" /> TOP 10 MOST POLLUTED WARDS
            </h4>
            <div className="mt-2 space-y-1">
              {top10Polluted.map((w) => {
                const aqi = w.interpolated_aqi ?? 0;
                const barWidth = Math.min((aqi / 500) * 100, 100);
                const color = aqiToBorderColor(aqi).replace("0.7", "1").replace("0.75", "1").replace("0.8", "1").replace("0.85", "1");
                return (
                  <div
                    key={w.ward_no}
                    className="group relative flex items-center gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2 transition-colors hover:bg-secondary/40"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-black"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {w.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-mono text-[11px] font-semibold text-foreground">{w.ward_name}</span>
                        <span className="ml-2 shrink-0 font-display text-sm font-black" style={{ color }}>
                          {aqi}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-secondary/50 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${barWidth}%`, background: color }}
                          />
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
    </ScrollArea>
  );
}
