import { useState, useEffect } from "react";
import { StationData, getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Brain, Loader2, GitCompareArrows } from "lucide-react";

interface CompareTabProps {
  stations: StationData[];
}

export function CompareTab({ stations }: CompareTabProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();

  const toggleStation = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedStations = stations.filter((s) => selected.includes(s.stationId));

  useEffect(() => {
    if (selectedStations.length >= 2) {
      analyze(selectedStations, "compare");
    }
  }, [selected.join(",")]);

  const ai = analysis as {
    comparison_summary?: string;
    patterns?: string[];
    hotspot_analysis?: string;
    disparity_index?: string;
  } | null;

  // Multi-pollutant grouped bar data
  const pollutantKeys = ["pm25", "pm10", "no2"];
  const groupedData = pollutantKeys.map((key) => {
    const entry: Record<string, unknown> = { pollutant: key.toUpperCase().replace("25", "2.5") };
    selectedStations.forEach((s) => {
      entry[s.name] = s.iaqi[key]?.v ?? 0;
    });
    return entry;
  });

  const colors = ["hsl(180, 100%, 45%)", "hsl(260, 80%, 60%)", "hsl(30, 100%, 55%)", "hsl(145, 100%, 45%)"];

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-5 p-4">
        {/* Station Selector */}
        <div>
          <h4 className="font-display text-xs font-bold tracking-widest text-primary">
            SELECT STATIONS TO COMPARE (2-4)
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {stations.map((s) => {
              const isSelected = selected.includes(s.stationId);
              const level = getAqiLevel(s.aqi);
              return (
                <button
                  key={s.stationId}
                  onClick={() => toggleStation(s.stationId)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: level.color }} />
                  {s.name} ({s.aqi})
                </button>
              );
            })}
          </div>
        </div>

        {selectedStations.length < 2 ? (
          <div className="cyber-border rounded-lg p-8 text-center">
            <GitCompareArrows className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Select at least 2 stations to compare
            </p>
          </div>
        ) : (
          <>
            {/* AQI Side by Side */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selectedStations.map((s) => {
                const level = getAqiLevel(s.aqi);
                return (
                  <div key={s.stationId} className="cyber-border rounded-lg p-3 text-center">
                    <span className="font-mono text-[10px] text-muted-foreground">{s.name}</span>
                    <div
                      className="mt-1 font-display text-2xl font-black"
                      style={{ color: level.color, textShadow: `0 0 12px ${level.color}50` }}
                    >
                      {s.aqi}
                    </div>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 font-mono text-[8px] font-bold"
                      style={{ backgroundColor: `${level.color}20`, color: level.color }}
                    >
                      {level.label.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pollutant Comparison Chart */}
            <div>
              <h4 className="font-display text-xs font-bold tracking-widest text-primary">
                📊 POLLUTANT COMPARISON
              </h4>
              <div className="mt-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupedData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis
                      dataKey="pollutant"
                      tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      axisLine={{ stroke: "hsl(220, 15%, 18%)" }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 10%)",
                        border: "1px solid hsl(220, 15%, 18%)",
                        borderRadius: "8px",
                        fontFamily: "JetBrains Mono",
                        fontSize: "11px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                    {selectedStations.map((s, i) => (
                      <Bar key={s.stationId} dataKey={s.name} fill={colors[i]} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Comparison */}
            <div className="cyber-border rounded-lg p-4">
              <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                <Brain className="h-4 w-4" /> AI COMPARISON ANALYSIS
              </h4>
              {aiLoading ? (
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-mono text-xs">Comparing stations...</span>
                </div>
              ) : aiError ? (
                <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
              ) : ai ? (
                <div className="mt-3 space-y-2">
                  {ai.comparison_summary && <p className="font-body text-sm text-foreground">{ai.comparison_summary}</p>}
                  {ai.patterns && ai.patterns.length > 0 && (
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground">PATTERNS DETECTED</span>
                      <ul className="mt-1 space-y-1">
                        {ai.patterns.map((p, i) => (
                          <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1 font-body text-xs text-secondary-foreground">{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ai.hotspot_analysis && (
                    <div className="rounded border border-border bg-secondary/30 p-2">
                      <span className="font-mono text-[10px] text-muted-foreground">HOTSPOT ANALYSIS</span>
                      <p className="mt-0.5 font-body text-xs text-secondary-foreground">{ai.hotspot_analysis}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
