import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDelhiWards, WardFeature } from "@/hooks/useDelhiWards";
import { assignAQIToWards, aqiToBorderColor, getAQICategory } from "@/lib/wardAqi";
import { StationData } from "@/lib/aqi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, AlertTriangle, Leaf, TrendingUp } from "lucide-react";

const WHO_PM25_DAILY = 15; // µg/m³

interface WardRankingsProps {
  stations: StationData[];
}

const STATION_COORDS: Record<string, [number, number]> = {
  "delhi/ito": [28.6289, 77.2414],
  "delhi/anand-vihar": [28.6468, 77.316],
  "delhi/rk-puram": [28.5633, 77.1725],
  "delhi/punjabi-bagh": [28.6682, 77.1313],
  "delhi/dwarka-sector-8": [28.5708, 77.0711],
  "delhi/chandni-chowk": [28.6506, 77.2302],
  "delhi/rohini": [28.7329, 77.1166],
  "delhi/shadipur": [28.6514, 77.1594],
};

export function WardRankings({ stations }: WardRankingsProps) {
  const { t } = useLanguage();
  const { wardsGeoJSON } = useDelhiWards();

  const stationsWithCoords = useMemo(
    () => stations.map((s) => {
      const c = STATION_COORDS[s.stationId];
      return c ? { lat: c[0], lon: c[1], aqi: s.aqi } : null;
    }).filter(Boolean) as { lat: number; lon: number; aqi: number }[],
    [stations]
  );

  const enrichedWards = useMemo(
    () => assignAQIToWards(wardsGeoJSON, stationsWithCoords),
    [wardsGeoJSON, stationsWithCoords]
  );

  const sorted = useMemo(() => {
    if (!enrichedWards) return [];
    return [...enrichedWards.features]
      .filter((f) => (f.properties.interpolated_aqi ?? 0) > 0)
      .sort((a, b) => (b.properties.interpolated_aqi ?? 0) - (a.properties.interpolated_aqi ?? 0))
      .map((f, i) => ({ rank: i + 1, ...f.properties }));
  }, [enrichedWards]);

  const mostPolluted = sorted.slice(0, 10);
  const leastPolluted = [...sorted].reverse().slice(0, 5);
  const avgAqi = sorted.length ? Math.round(sorted.reduce((s, w) => s + (w.interpolated_aqi ?? 0), 0) / sorted.length) : 0;
  const whoMultiple = avgAqi > 0 ? Math.round(avgAqi / 50 * WHO_PM25_DAILY / WHO_PM25_DAILY) : 0;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
            <span className="font-mono text-[9px] text-muted-foreground">{t("ranking.totalWards")}</span>
            <p className="mt-1 font-display text-lg font-black text-primary">{sorted.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
            <span className="font-mono text-[9px] text-muted-foreground">{t("ranking.avgAqi")}</span>
            <p className="mt-1 font-display text-lg font-black text-destructive">{avgAqi}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
            <span className="font-mono text-[9px] text-muted-foreground">{t("ranking.whoExceed")}</span>
            <p className="mt-1 font-display text-lg font-black text-orange-400">{whoMultiple}x</p>
          </div>
        </div>

        {/* Most polluted */}
        <div>
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-destructive">
            <AlertTriangle className="h-4 w-4" /> {t("ranking.mostPolluted")}
          </h4>
          <div className="mt-2 space-y-1">
            {mostPolluted.map((w) => {
              const aqi = w.interpolated_aqi ?? 0;
              const barWidth = Math.min((aqi / 500) * 100, 100);
              const color = aqiToBorderColor(aqi).replace(/0\.\d+\)/, "1)");
              const times = Math.round(aqi / 50);
              return (
                <div key={w.ward_no} className="flex items-center gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-black" style={{ backgroundColor: `${color}20`, color }}>{w.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-mono text-[11px] font-semibold text-foreground">{w.ward_name}</span>
                      <div className="ml-2 flex items-center gap-1.5 shrink-0">
                        <span className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold" style={{ background: `${color}15`, color }}>{times}x {t("ranking.aboveStd")}</span>
                        <span className="font-display text-sm font-black" style={{ color }}>{aqi}</span>
                      </div>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-secondary/50 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: color }} />
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {w.ac_name} · Pop: {w.total_pop?.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Least polluted */}
        <div>
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest" style={{ color: "#00E5A0" }}>
            <Leaf className="h-4 w-4" /> {t("ranking.leastPolluted")}
          </h4>
          <div className="mt-2 space-y-1">
            {leastPolluted.map((w, i) => {
              const aqi = w.interpolated_aqi ?? 0;
              const color = aqiToBorderColor(aqi).replace(/0\.\d+\)/, "1)");
              return (
                <div key={w.ward_no} className="flex items-center gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-black" style={{ backgroundColor: "rgba(0,229,160,0.15)", color: "#00E5A0" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-mono text-[11px] font-semibold text-foreground">{w.ward_name}</span>
                      <span className="ml-2 font-display text-sm font-black" style={{ color }}>{aqi}</span>
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground">{w.ac_name} · {getAQICategory(aqi)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AQI Distribution */}
        <div>
          <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
            <TrendingUp className="h-4 w-4" /> {t("ranking.distribution")}
          </h4>
          <div className="mt-2 space-y-1.5">
            {[
              { label: "Good (0-50)", color: "#00E5A0", min: 0, max: 50 },
              { label: "Moderate (51-100)", color: "#FFD600", min: 51, max: 100 },
              { label: "Sensitive (101-150)", color: "#FF8C00", min: 101, max: 150 },
              { label: "Unhealthy (151-200)", color: "#FF3D3D", min: 151, max: 200 },
              { label: "Very Unhealthy (201-300)", color: "#C62BFF", min: 201, max: 300 },
              { label: "Hazardous (300+)", color: "#FF0033", min: 301, max: 999 },
            ].map((band) => {
              const count = sorted.filter((w) => {
                const a = w.interpolated_aqi ?? 0;
                return a >= band.min && a <= band.max;
              }).length;
              const pct = sorted.length ? Math.round((count / sorted.length) * 100) : 0;
              return (
                <div key={band.label} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ background: band.color }} />
                  <span className="w-36 font-mono text-[10px] text-muted-foreground">{band.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: band.color }} />
                  </div>
                  <span className="w-12 text-right font-mono text-[10px] font-bold text-foreground">{count} <span className="text-muted-foreground">({pct}%)</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
