import { useEffect } from "react";
import { WardFeature } from "@/hooks/useDelhiWards";
import { getAQICategory, aqiToBorderColor } from "@/lib/wardAqi";
import { getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useWardLiveData } from "@/hooks/useWardLiveData";
import { useWardHistory } from "@/hooks/useWardHistory";
import { WardTrendChart } from "@/components/dashboard/WardTrendChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X, Users, MapPin, Activity, Shield, Brain, ShieldAlert, Loader2,
  Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, Building2, User,
} from "lucide-react";

interface WardDetailPanelProps {
  ward: WardFeature["properties"];
  onClose: () => void;
}

export function WardDetailPanel({ ward, onClose }: WardDetailPanelProps) {
  const aqi = ward.interpolated_aqi ?? 0;
  const level = getAqiLevel(aqi);
  const category = getAQICategory(aqi);
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();
  const { data: liveData, loading: liveLoading } = useWardLiveData(ward.centroid ?? null);

  const displayAqi = liveData?.aqi ?? aqi;
  const displayLevel = getAqiLevel(displayAqi);
  const iaqi = liveData?.iaqi ?? {};

  // Trigger AI analysis once live data is resolved
  useEffect(() => {
    if (liveLoading) return;
    analyze(null, "ward", ward, liveData?.iaqi);
  }, [ward.ward_no, liveLoading]);

  const ai = analysis as {
    summary?: string;
    health_risk?: string;
    pollution_source?: string;
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
    anomaly?: boolean;
    anomaly_detail?: string;
    pm25_status?: string;
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
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{ward.ward_name}</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Ward {ward.ward_no} · {ward.ac_name} · {ward.total_pop?.toLocaleString()} residents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span
                className="font-display text-4xl font-black leading-none"
                style={{ color: displayLevel.color, textShadow: `0 0 20px ${displayLevel.color}60` }}
              >
                {displayAqi}
              </span>
              <span
                className="mt-1 block font-mono text-[9px] font-bold tracking-widest"
                style={{ color: displayLevel.color }}
              >
                {getAQICategory(displayAqi)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live data badge */}
        {liveData && (
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            LIVE from {liveData.station} · {liveData.dominentpol?.toUpperCase()} dominant
          </div>
        )}

        {/* Pollutant chips */}
        {pollutantChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pollutantChips.map((p) => (
              <div
                key={p.key}
                className="rounded-md border border-border bg-secondary/30 px-2 py-1 font-mono text-[10px]"
              >
                <span className="text-muted-foreground">{p.label} </span>
                <span className="font-bold text-foreground">{iaqi[p.key]?.v}</span>
                <span className="text-muted-foreground/50"> {p.unit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Population" value={ward.total_pop?.toLocaleString() ?? "—"} />
          <StatCard icon={<Shield className="h-3.5 w-3.5" />} label="SC Population" value={ward.sc_pop?.toLocaleString() ?? "—"} />
          <StatCard icon={<MapPin className="h-3.5 w-3.5" />} label="Nearest Station" value={`${ward.nearest_station_dist ?? "—"}m`} />
          <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="AQI Category" value={category} />
        </div>

        {/* AI Analysis */}
        <div className="cyber-border rounded-lg p-4">
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <Brain className="h-4 w-4" /> AI WARD INTELLIGENCE
          </h4>
          {aiLoading ? (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">
                {liveLoading ? "Fetching live data..." : "Analyzing ward data..."}
              </span>
            </div>
          ) : aiError ? (
            <p className="mt-2 font-mono text-xs text-destructive">{aiError}</p>
          ) : ai ? (
            <div className="mt-3 space-y-3">
              {/* Source + Confidence row */}
              {ai.pollution_source && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[9px] text-muted-foreground">PRIMARY SOURCE</span>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {ai.source_icon} {ai.pollution_source}
                    </p>
                  </div>
                  {ai.confidence && (
                    <div className="text-right">
                      <span className="font-mono text-[9px] text-muted-foreground">CONFIDENCE</span>
                      <p className="font-display text-sm font-bold text-primary">{ai.confidence}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {ai.summary && (
                <p className="font-body text-sm leading-relaxed text-foreground">{ai.summary}</p>
              )}

              {/* Risk + Trend row */}
              <div className="flex items-center gap-2 flex-wrap">
                {ai.health_risk && (
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" style={{ color: displayLevel.color }} />
                    <span className="font-display text-xs font-bold" style={{ color: displayLevel.color }}>
                      RISK: {ai.health_risk}
                    </span>
                  </div>
                )}
                {ai.trend && (
                  <div
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold"
                    style={{
                      background: `${trendColor}15`,
                      color: trendColor,
                    }}
                  >
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

              {ai.trend_reason && (
                <p className="font-mono text-[10px] text-muted-foreground">{ai.trend_reason}</p>
              )}

              {/* Anomaly alert */}
              {ai.anomaly && ai.anomaly_detail && (
                <div className="flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 p-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                  <p className="font-mono text-[10px] text-orange-300">{ai.anomaly_detail}</p>
                </div>
              )}

              {/* Vulnerable impact */}
              {ai.vulnerable_impact && (
                <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                  <span className="font-mono text-[9px] text-muted-foreground">VULNERABLE POPULATION IMPACT</span>
                  <p className="mt-1 font-body text-xs text-secondary-foreground">{ai.vulnerable_impact}</p>
                </div>
              )}

              {/* Key concerns */}
              {ai.key_concerns && ai.key_concerns.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] text-muted-foreground">KEY CONCERNS</span>
                  <ul className="mt-1 space-y-1">
                    {ai.key_concerns.map((c, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1.5 font-body text-xs text-secondary-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Admin + Citizen action cards */}
              {(ai.admin_action || ai.citizen_tip) && (
                <div className="grid grid-cols-2 gap-2">
                  {ai.admin_action && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                      <div className="flex items-center gap-1 font-mono text-[8px] tracking-widest text-destructive">
                        <Building2 className="h-3 w-3" /> ADMIN ACTION
                      </div>
                      <p className="mt-1 font-body text-[11px] leading-snug text-foreground/80">{ai.admin_action}</p>
                    </div>
                  )}
                  {ai.citizen_tip && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                      <div className="flex items-center gap-1 font-mono text-[8px] tracking-widest text-primary">
                        <User className="h-3 w-3" /> CITIZEN TIP
                      </div>
                      <p className="mt-1 font-body text-[11px] leading-snug text-foreground/80">{ai.citizen_tip}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {ai.recommendations && ai.recommendations.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] text-muted-foreground">RECOMMENDATIONS</span>
                  <ul className="mt-1 space-y-1">
                    {ai.recommendations.map((r, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1.5 font-body text-xs text-secondary-foreground">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Local insight */}
              {ai.local_insight && (
                <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span className="font-mono text-[9px] text-muted-foreground">LOCAL INSIGHT</span>
                  </div>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{ai.local_insight}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Assembly Info */}
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="font-mono text-[10px] text-muted-foreground">ASSEMBLY CONSTITUENCY</p>
          <p className="mt-1 font-mono text-xs font-semibold text-foreground">
            {ward.ac_name} (AC #{ward.ac_no})
          </p>
        </div>
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
