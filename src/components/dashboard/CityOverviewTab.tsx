import { useEffect } from "react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, TrendingUp } from "lucide-react";

interface CityOverviewTabProps {
  stations: StationData[];
  cityAqi: number;
}

export function CityOverviewTab({ stations, cityAqi }: CityOverviewTabProps) {
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const level = getAqiLevel(cityAqi);

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
      </div>
    </ScrollArea>
  );
}
