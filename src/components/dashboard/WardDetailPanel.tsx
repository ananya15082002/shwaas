import { useEffect } from "react";
import { WardFeature } from "@/hooks/useDelhiWards";
import { getAQICategory, aqiToBorderColor } from "@/lib/wardAqi";
import { getAqiLevel } from "@/lib/aqi";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Users, MapPin, Activity, Shield, Brain, ShieldAlert, Loader2, Lightbulb } from "lucide-react";

interface WardDetailPanelProps {
  ward: WardFeature["properties"];
  onClose: () => void;
}

export function WardDetailPanel({ ward, onClose }: WardDetailPanelProps) {
  const aqi = ward.interpolated_aqi ?? 0;
  const level = getAqiLevel(aqi);
  const category = getAQICategory(aqi);
  const { analyze, analysis, loading: aiLoading, error: aiError } = useAiAnalysis();

  useEffect(() => {
    analyze(null, "ward", ward);
  }, [ward.ward_no]);

  const ai = analysis as {
    summary?: string;
    health_risk?: string;
    vulnerable_impact?: string;
    key_concerns?: string[];
    recommendations?: string[];
    local_insight?: string;
  } | null;

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{ward.ward_name}</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Ward {ward.ward_no} · {ward.ac_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-display text-3xl font-black"
              style={{ color: level.color }}
            >
              {aqi}
            </span>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AQI Category Badge */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold"
          style={{ background: level.color + "20", color: level.color }}
        >
          <Activity className="h-3 w-3" />
          {category}
        </div>

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
            <Brain className="h-4 w-4" /> AI WARD ANALYSIS
          </h4>
          {aiLoading ? (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">Analyzing ward data...</span>
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
                    RISK: {ai.health_risk}
                  </span>
                </div>
              )}
              {ai.vulnerable_impact && (
                <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                  <span className="font-mono text-[10px] text-muted-foreground">VULNERABLE POPULATION IMPACT</span>
                  <p className="mt-1 font-body text-xs text-secondary-foreground">{ai.vulnerable_impact}</p>
                </div>
              )}
              {ai.key_concerns && ai.key_concerns.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">KEY CONCERNS</span>
                  <ul className="mt-1 space-y-1">
                    {ai.key_concerns.map((c, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1 font-body text-xs text-secondary-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.recommendations && ai.recommendations.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground">RECOMMENDATIONS</span>
                  <ul className="mt-1 space-y-1">
                    {ai.recommendations.map((r, i) => (
                      <li key={i} className="rounded border border-border bg-secondary/30 px-2.5 py-1 font-body text-xs text-secondary-foreground">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.local_insight && (
                <div className="rounded-md border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span className="font-mono text-[10px] text-muted-foreground">LOCAL INSIGHT</span>
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
