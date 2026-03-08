import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StationData, getAqiLevel, getHealthAdvisory, getPollutionSources, getPolicyRecommendations } from "@/lib/aqi";
import { useLanguage } from "@/contexts/LanguageContext";
import { AqiGauge } from "./AqiGauge";
import { ForecastChart } from "./ForecastChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Factory, Landmark, Activity } from "lucide-react";

interface StationDetailProps {
  station: StationData | null;
  open: boolean;
  onClose: () => void;
}

const POLLUTANTS = [
  { key: "pm25", label: "PM2.5", max: 500, unit: "µg/m³" },
  { key: "pm10", label: "PM10", max: 600, unit: "µg/m³" },
  { key: "no2", label: "NO₂", max: 200, unit: "ppb" },
  { key: "so2", label: "SO₂", max: 200, unit: "ppb" },
  { key: "o3", label: "O₃", max: 300, unit: "ppb" },
  { key: "co", label: "CO", max: 50, unit: "ppm" },
];

export function StationDetail({ station, open, onClose }: StationDetailProps) {
  const { t } = useLanguage();
  if (!station) return null;

  const level = getAqiLevel(station.aqi);
  const advisory = getHealthAdvisory(station.aqi);
  const sources = getPollutionSources(station.aqi, station.dominantPollutant);
  const policies = getPolicyRecommendations(station.aqi);
  const forecastData = station.forecast?.daily?.pm25?.slice(0, 7) ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl border-border bg-card p-0 sm:max-h-[85vh]">
        <ScrollArea className="max-h-[90vh] sm:max-h-[85vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 font-display tracking-wide">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: level.color, boxShadow: `0 0 10px ${level.color}` }} />
                {station.name} — {station.area}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <AqiGauge aqi={station.aqi} size={160} />
              <div className="flex-1 text-center sm:text-left">
                <span className="inline-block rounded-full px-3 py-1 font-display text-xs font-bold" style={{ backgroundColor: `${level.color}20`, color: level.color, border: `1px solid ${level.color}40` }}>
                  {level.label}
                </span>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {t("detail.dominantPollutant")}: <strong className="text-foreground">{station.dominantPollutant.toUpperCase().replace("25", "2.5")}</strong>
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {t("detail.lastMeasured")}: {station.time.s}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                <Activity className="h-4 w-4" /> {t("detail.pollutantBreakdown")}
              </h3>
              <div className="mt-3 space-y-2.5">
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
                      <span className="w-16 text-right font-mono text-xs text-foreground">{val} <span className="text-muted-foreground">{unit}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

            {forecastData.length > 0 && (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                  📊 {t("detail.forecast")}
                </h3>
                <div className="mt-3">
                  <ForecastChart data={forecastData} />
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                <ShieldAlert className="h-4 w-4" /> {t("detail.healthAdvisory")}
              </h3>
              <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-3">
                <p className="font-body text-sm leading-relaxed text-foreground">{advisory}</p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                <Factory className="h-4 w-4" /> {t("detail.pollutionSources")}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {sources.map((s, i) => (
                  <li key={i} className="rounded-md border border-border bg-secondary/30 px-3 py-1.5 font-body text-sm text-secondary-foreground">{s}</li>
                ))}
              </ul>
            </div>

            <div className="mt-5 pb-2">
              <h3 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
                <Landmark className="h-4 w-4" /> {t("detail.policyRecs")}
              </h3>
              <ol className="mt-2 space-y-1.5">
                {policies.map((p, i) => (
                  <li key={i} className="flex gap-2 rounded-md border border-border bg-secondary/30 px-3 py-1.5 font-body text-sm text-secondary-foreground">
                    <span className="font-display text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
