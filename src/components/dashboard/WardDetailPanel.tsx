import { useEffect } from "react";
import { WardFeature } from "@/hooks/useDelhiWards";
import { getAQICategory, aqiToBorderColor } from "@/lib/wardAqi";
import { getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWardLiveData } from "@/hooks/useWardLiveData";
import { useWardHistory } from "@/hooks/useWardHistory";
import { WardTrendChart } from "@/components/dashboard/WardTrendChart";
import { HealthAdvisoryCards } from "@/components/dashboard/HealthAdvisoryCards";
import { AdvisoryCards, AdvisoryCard } from "@/components/dashboard/AdvisoryCards";
import { WeatherInfo } from "@/components/dashboard/WeatherInfo";
import { AqiCalendar } from "@/components/dashboard/AqiCalendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X, Users, MapPin, Activity, Brain, ShieldAlert, Loader2,
  Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, Building2, User,
} from "lucide-react";

interface WardDetailPanelProps {
  ward: WardFeature["properties"];
  onClose: () => void;
}

export function WardDetailPanel({ ward, onClose }: WardDetailPanelProps) {
  const isSpecialZone = ward.ward_no === -1;
  const rawAqi = ward.interpolated_aqi ?? 0;
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const { t, lang } = useLanguage();
  const { data: liveData, loading: liveLoading } = useWardLiveData(ward.centroid ?? null);
  const { history, loading: historyLoading } = useWardHistory(ward.centroid ?? null);

  // Use interpolated AQI if available, otherwise fall back to live station AQI
  const liveStationAqi = liveData?.aqi ?? null;
  const displayAqi = rawAqi > 0 ? rawAqi : (liveStationAqi ?? 0);
  const displayLevel = getAqiLevel(displayAqi);
  const iaqi = liveData?.iaqi ?? {};

  useEffect(() => {
    if (liveLoading) return;
    analyze(null, "ward", ward, liveData?.iaqi, lang);
  }, [ward.ward_no, liveLoading, lang]);

  const ai = analysis as {
    summary?: string;
    health_risk?: string;
    pollution_source?: string;
    source_type?: string;
    source_icon?: string;
    confidence?: number;
    trend?: string;
    trend_reason?: string;
    vulnerable_impact?: string;
    key_concerns?: string[];
    recommendations?: string[];
    admin_action?: string;
    citizen_tip?: string;
    local_insight?: string;
    seasonal_factor?: string;
    anomaly?: boolean;
    anomaly_detail?: string;
    pm25_status?: string;
    predicted_next_hours?: string;
    advisory_cards?: AdvisoryCard[];
  } | null;

  const TrendIcon = ai?.trend === "RISING" ? TrendingUp : ai?.trend === "FALLING" ? TrendingDown : Minus;
  const trendColor = ai?.trend === "RISING" ? "hsl(var(--destructive))" : ai?.trend === "FALLING" ? "hsl(180, 100%, 45%)" : "hsl(var(--muted-foreground))";

  const pollutantChips = [
    { key: "pm25", label: "PM2.5", unit: "µg/m³" },
    { key: "pm10", label: "PM10", unit: "µg/m³" },
    { key: "no2", label: "NO₂", unit: "ppb" },
    { key: "o3", label: "O₃", unit: "ppb" },
    { key: "co", label: "CO", unit: "ppm" },
    { key: "so2", label: "SO₂", unit: "ppb" },
  ].filter((p) => iaqi[p.key]);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{ward.ward_name}</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              {isSpecialZone
                ? ward.ac_name
                : `Ward ${ward.ward_no} · ${ward.ac_name} · ${ward.total_pop?.toLocaleString()} ${t("ward.residents")}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-display text-4xl font-black leading-none" style={{ color: displayLevel.color, textShadow: `0 0 20px ${displayLevel.color}60` }}>
                {displayAqi}
              </span>
              <span className="mt-1 block font-mono text-[9px] font-bold tracking-widest" style={{ color: displayLevel.color }}>
                {getAQICategory(displayAqi)}
              </span>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Highlighted Pollution Source Badge */}
        {ai?.source_icon && ai?.pollution_source && !aiLoading && (
          <div className="flex items-center gap-3 rounded-xl border-2 p-3 animate-pulse-subtle" style={{
            borderColor: `${displayLevel.color}60`,
            background: `linear-gradient(135deg, ${displayLevel.color}10, transparent)`,
          }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl" style={{
              background: `${displayLevel.color}20`,
              boxShadow: `0 0 20px ${displayLevel.color}30`,
            }}>
              {ai.source_icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                {lang === "hi" ? "प्रमुख प्रदूषण स्रोत" : "MAJOR POLLUTION SOURCE"}
              </span>
              <p className="font-display text-sm font-bold text-foreground leading-tight mt-0.5">{ai.pollution_source}</p>
              {ai.source_type && (
                <span className="inline-block mt-1 rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider" style={{
                  background: `${displayLevel.color}15`,
                  color: displayLevel.color,
                }}>
                  {ai.source_type.replace(/_/g, " ")}
                </span>
              )}
            </div>
            {ai.confidence && (
              <div className="text-right shrink-0">
                <span className="font-display text-xl font-black text-primary">{ai.confidence}%</span>
                <span className="block font-mono text-[7px] text-muted-foreground tracking-wider">{lang === "hi" ? "विश्वास" : "CONF"}</span>
              </div>
            )}
          </div>
        )}

        {liveData && (
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {lang === "hi" ? "डेटा स्रोत स्टेशन" : "Data Source Station"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-foreground">{liveData.station.split(",")[0]}</p>
                {liveData.stationGeo && ward.centroid && (
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                    {(() => {
                      const [lon, lat] = ward.centroid;
                      const [sLat, sLon] = liveData.stationGeo;
                      const distM = Math.round(Math.sqrt(Math.pow((lat - sLat) * 111000, 2) + Math.pow((lon - sLon) * 111000 * Math.cos(lat * Math.PI / 180), 2)));
                      return distM >= 1000 ? `${(distM / 1000).toFixed(1)} km away` : `${distM}m away`;
                    })()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="font-display text-lg font-black" style={{ color: getAqiLevel(liveStationAqi ?? 0).color }}>
                  {liveStationAqi ?? "—"}
                </span>
                <p className="font-mono text-[8px] text-muted-foreground">{liveData.dominentpol?.toUpperCase()} {t("ward.dominant")}</p>
              </div>
            </div>
          </div>
        )}

        {pollutantChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pollutantChips.map((p) => (
              <div key={p.key} className="rounded-md border border-border bg-secondary/30 px-2 py-1 font-mono text-[10px]">
                <span className="text-muted-foreground">{p.label} </span>
                <span className="font-bold text-foreground">{iaqi[p.key]?.v}</span>
                <span className="text-muted-foreground/50"> {p.unit}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`grid ${isSpecialZone ? "grid-cols-2" : "grid-cols-2"} gap-2`}>
          {!isSpecialZone && <StatCard icon={<Users className="h-3.5 w-3.5" />} label={t("ward.population")} value={ward.total_pop?.toLocaleString() ?? "—"} />}
          <StatCard icon={<Activity className="h-3.5 w-3.5" />} label={t("ward.aqiCategory")} value={getAQICategory(displayAqi)} />
          {!isSpecialZone && <StatCard icon={<MapPin className="h-3.5 w-3.5" />} label={t("ward.assembly")} value={`${ward.ac_name} (#${ward.ac_no})`} />}
        </div>

        <div className="cyber-border rounded-lg p-4">
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <Brain className="h-4 w-4" /> {t("ward.aiIntelligence")}
          </h4>
          {aiLoading ? (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">
                {liveLoading ? t("ward.fetchingLive") : t("ward.analyzingWard")}
              </span>
            </div>
          ) : aiError ? (
            <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
          ) : ai ? (
            <div className="mt-3 space-y-3">
              {/* Source already shown in highlighted badge above */}

              {ai.summary && <p className="font-body text-sm leading-relaxed text-foreground">{ai.summary}</p>}

              <div className="flex items-center gap-2 flex-wrap">
                {ai.health_risk && (
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" style={{ color: displayLevel.color }} />
                    <span className="font-display text-xs font-bold" style={{ color: displayLevel.color }}>
                      {t("intel.risk")}: {ai.health_risk}
                    </span>
                  </div>
                )}
                {ai.trend && (
                  <div className="flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold" style={{ background: `${trendColor}15`, color: trendColor }}>
                    <TrendIcon className="h-3 w-3" />
                    {ai.trend}
                  </div>
                )}
                {ai.pm25_status && ai.pm25_status !== "SAFE" && (
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[9px] font-bold text-destructive">
                    PM2.5: {ai.pm25_status}
                  </span>
                )}
              </div>

              {ai.trend_reason && <p className="font-mono text-[10px] text-muted-foreground">{ai.trend_reason}</p>}

              {ai.anomaly && ai.anomaly_detail && (
                <div className="flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 p-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                  <p className="font-mono text-[10px] text-orange-300">{ai.anomaly_detail}</p>
                </div>
              )}

              {ai.vulnerable_impact && (
                <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                  <span className="font-mono text-[9px] text-muted-foreground">{t("ward.vulnerableImpact")}</span>
                  <p className="mt-1 font-body text-xs text-secondary-foreground">{ai.vulnerable_impact}</p>
                </div>
              )}

              {ai.key_concerns && ai.key_concerns.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] text-muted-foreground">{t("intel.keyConcerns")}</span>
                  <ul className="mt-1 space-y-1">
                    {ai.key_concerns.map((c, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1.5 font-body text-xs text-secondary-foreground">{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(ai.admin_action || ai.citizen_tip) && (
                <div className="grid grid-cols-2 gap-2">
                  {ai.admin_action && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                      <div className="flex items-center gap-1 font-mono text-[8px] tracking-widest text-destructive">
                        <Building2 className="h-3 w-3" /> {t("ward.adminAction")}
                      </div>
                      <p className="mt-1 font-body text-[11px] leading-snug text-foreground/80">{ai.admin_action}</p>
                    </div>
                  )}
                  {ai.citizen_tip && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                      <div className="flex items-center gap-1 font-mono text-[8px] tracking-widest text-primary">
                        <User className="h-3 w-3" /> {t("ward.citizenTip")}
                      </div>
                      <p className="mt-1 font-body text-[11px] leading-snug text-foreground/80">{ai.citizen_tip}</p>
                    </div>
                  )}
                </div>
              )}

              {ai.recommendations && ai.recommendations.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] text-muted-foreground">{t("intel.recommendations")}</span>
                  <ul className="mt-1 space-y-1">
                    {ai.recommendations.map((r, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1.5 font-body text-xs text-secondary-foreground">{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.seasonal_factor && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🌿</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{lang === "hi" ? "मौसमी कारक" : "SEASONAL FACTOR"}</span>
                  </div>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{ai.seasonal_factor}</p>
                </div>
              )}

              {ai.predicted_next_hours && (
                <div className="rounded-md border border-accent/20 bg-accent/5 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⏱️</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{lang === "hi" ? "अगले 4-6 घंटे" : "NEXT 4-6 HRS PREDICTION"}</span>
                  </div>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{ai.predicted_next_hours}</p>
                </div>
              )}

              {ai.local_insight && (
                <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span className="font-mono text-[9px] text-muted-foreground">{t("ward.localInsight")}</span>
                  </div>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{ai.local_insight}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <WeatherInfo iaqi={iaqi} />

        <HealthAdvisoryCards aqi={displayAqi} />

        {ai?.advisory_cards && ai.advisory_cards.length > 0 && (
          <div className="rounded-lg border border-border bg-card/30 p-3">
            <AdvisoryCards cards={ai.advisory_cards} />
          </div>
        )}

        <WardTrendChart history={history} loading={historyLoading} />

        <AqiCalendar history={history} />

        {!isSpecialZone && (
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <p className="font-mono text-[10px] text-muted-foreground">{t("ward.assembly")}</p>
            <p className="mt-1 font-mono text-xs font-semibold text-foreground">
              {ward.ac_name} (AC #{ward.ac_no})
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
