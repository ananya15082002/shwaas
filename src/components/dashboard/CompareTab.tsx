import { useState, useEffect, useMemo } from "react";
import { getAqiLevel } from "@/lib/aqi";
import { useDelhiWards } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToBorderColor, getAQICategory } from "@/lib/wardAqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Brain, Loader2, GitCompareArrows, Search, X } from "lucide-react";
import { StationData } from "@/lib/aqi";
import { TabMiniMap, HighlightedWard } from "@/components/dashboard/TabMiniMap";

interface CompareTabProps {
  stations: StationData[];
}

export function CompareTab({ stations }: CompareTabProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const { t, lang } = useLanguage();
  const { wardsGeoJSON } = useDelhiWards();

  const stationsWithCoords = useMemo(
    () => stations
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => ({ lat: s.lat!, lon: s.lon!, aqi: s.aqi })),
    [stations]
  );

  const enrichedWards = useMemo(
    () => assignAQIToWards(wardsGeoJSON, stationsWithCoords),
    [wardsGeoJSON, stationsWithCoords]
  );

  const wardList = useMemo(() => {
    if (!enrichedWards) return [];
    return enrichedWards.features.map((f) => f.properties);
  }, [enrichedWards]);

  const filteredWards = useMemo(() => {
    if (!search.trim()) return wardList.slice(0, 20);
    const q = search.toLowerCase();
    return wardList.filter(
      (w) => w.ward_name.toLowerCase().includes(q) || String(w.ward_no).includes(q) || w.ac_name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [wardList, search]);

  const toggleWard = (wardNo: number) => {
    setSelected((prev) =>
      prev.includes(wardNo) ? prev.filter((n) => n !== wardNo) : prev.length < 4 ? [...prev, wardNo] : prev
    );
  };

  const selectedWards = wardList.filter((w) => selected.includes(w.ward_no));

  const highlightedWards: HighlightedWard[] = useMemo(
    () => selectedWards.map((w) => ({
      ward_no: w.ward_no,
      borderColor: "hsl(180, 100%, 45%)",
      label: w.ward_name.length > 12 ? w.ward_name.slice(0, 12) + "…" : w.ward_name,
    })),
    [selectedWards]
  );

  useEffect(() => {
    if (selectedWards.length >= 2) {
      const wardData = selectedWards.map((w) => ({
        name: w.ward_name,
        ward_no: w.ward_no,
        ac_name: w.ac_name,
        aqi: w.interpolated_aqi ?? 0,
        total_pop: w.total_pop,
      }));
      analyze(
        wardData as unknown as StationData[],
        "compare",
        undefined,
        undefined,
        lang
      );
    }
  }, [selected.join(","), lang]);

  const ai = analysis as {
    comparison_summary?: string;
    patterns?: string[];
    hotspot_analysis?: string;
    disparity_index?: string;
  } | null;

  const colors = ["hsl(180, 100%, 45%)", "hsl(260, 80%, 60%)", "hsl(30, 100%, 55%)", "hsl(145, 100%, 45%)"];

  return (
    <div>
      <div className="space-y-5 p-4 pb-20 sm:pb-16">
        <div>
          <h4 className="font-display text-xs font-bold tracking-widest text-primary">
            {t("compare.select")} (Max 4 Wards)
          </h4>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wards..."
              className="w-full rounded-lg border border-border bg-secondary/30 py-2 pl-8 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selected chips */}
          {selectedWards.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedWards.map((w, i) => {
                const aqi = w.interpolated_aqi ?? 0;
                const level = getAqiLevel(aqi);
                return (
                  <button
                    key={w.ward_no}
                    onClick={() => toggleWard(w.ward_no)}
                    className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary"
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: level.color }} />
                    {w.ward_name} ({aqi})
                    <X className="h-2.5 w-2.5" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Ward list */}
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border bg-secondary/10 p-2">
            {filteredWards.map((w) => {
              const isSelected = selected.includes(w.ward_no);
              const aqi = w.interpolated_aqi ?? 0;
              const level = getAqiLevel(aqi);
              return (
                <button
                  key={w.ward_no}
                  onClick={() => toggleWard(w.ward_no)}
                  disabled={!isSelected && selected.length >= 4}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left font-mono text-[10px] transition-all ${
                    isSelected
                      ? "border border-primary bg-primary/10 text-primary"
                      : "border border-transparent hover:bg-secondary/40 text-muted-foreground disabled:opacity-40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: level.color }} />
                    <span className="font-semibold text-foreground">{w.ward_name}</span>
                    <span className="text-muted-foreground">Ward {w.ward_no} · {w.ac_name}</span>
                  </span>
                  <span className="font-display text-xs font-bold" style={{ color: level.color }}>{aqi}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedWards.length < 2 ? (
          <div className="cyber-border rounded-lg p-8 text-center">
            <GitCompareArrows className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {t("compare.selectAtLeast")}
            </p>
          </div>
        ) : (
          <>
            {/* AQI cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {selectedWards.map((w, i) => {
                const aqi = w.interpolated_aqi ?? 0;
                const level = getAqiLevel(aqi);
                return (
                  <div key={w.ward_no} className="cyber-border rounded-lg p-3 text-center">
                    <span className="font-mono text-[10px] text-muted-foreground">{w.ward_name}</span>
                    <div className="mt-1 font-display text-2xl font-black" style={{ color: level.color, textShadow: `0 0 12px ${level.color}50` }}>
                      {aqi}
                    </div>
                    <span className="inline-block rounded-full px-2 py-0.5 font-mono text-[8px] font-bold" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
                      {level.label.toUpperCase()}
                    </span>
                    <p className="mt-1 font-mono text-[8px] text-muted-foreground">Pop: {w.total_pop?.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            {/* AQI comparison bar chart */}
            <div>
              <h4 className="font-display text-xs font-bold tracking-widest text-primary">
                📊 {t("compare.pollutantComparison")}
              </h4>
              <div className="mt-2 h-56 sm:h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedWards.map((w) => ({
                      name: w.ward_name.length > 10 ? w.ward_name.slice(0, 10) + "…" : w.ward_name,
                      AQI: w.interpolated_aqi ?? 0,
                      Population: Math.round((w.total_pop ?? 0) / 1000),
                    }))}
                    margin={{ top: 5, right: 5, bottom: 40, left: 0 }}
                  >
                    <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "hsl(220, 15%, 18%)" }} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                    <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 9 }} />
                    <Bar dataKey="AQI" fill="hsl(180, 100%, 45%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Population" fill="hsl(260, 80%, 60%)" radius={[3, 3, 0, 0]} name="Pop (K)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="cyber-border rounded-lg p-4">
              <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                <Brain className="h-4 w-4" /> {t("compare.aiAnalysis")}
              </h4>
              {aiLoading ? (
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-mono text-xs">{t("compare.comparing")}</span>
                </div>
              ) : aiError ? (
                <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
              ) : ai ? (
                <div className="mt-3 space-y-2">
                  {ai.comparison_summary && <p className="font-body text-sm text-foreground">{ai.comparison_summary}</p>}
                  {ai.patterns && ai.patterns.length > 0 && (
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground">{t("compare.patterns")}</span>
                      <ul className="mt-1 space-y-1">
                        {ai.patterns.map((p, i) => (
                          <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1 font-body text-xs text-secondary-foreground">{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ai.hotspot_analysis && (
                    <div className="rounded border border-border bg-secondary/30 p-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{t("compare.hotspot")}</span>
                      <p className="mt-0.5 font-body text-xs text-secondary-foreground">{ai.hotspot_analysis}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
