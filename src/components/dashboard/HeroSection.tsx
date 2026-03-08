import { getAqiLevel } from "@/lib/aqi";
import { useLanguage } from "@/contexts/LanguageContext";
import { AqiGauge } from "./AqiGauge";
import { Shield, AlertTriangle, Skull } from "lucide-react";

interface HeroSectionProps {
  aqi: number;
  stationCount: number;
}

export function HeroSection({ aqi, stationCount }: HeroSectionProps) {
  const level = getAqiLevel(aqi);
  const { t } = useLanguage();

  const Icon = aqi <= 100 ? Shield : aqi <= 200 ? AlertTriangle : Skull;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg scanline" />
      <div className="container relative mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center sm:items-start">
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-5 w-5" style={{ color: level.color }} />
              <span
                className="font-display text-xs font-bold tracking-widest uppercase"
                style={{ color: level.color }}
              >
                {level.label}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold tracking-wide text-foreground sm:text-xl">
              {t("hero.cityAverage")}
            </h2>
            <p className="mt-1 max-w-md text-center font-body text-sm text-muted-foreground sm:text-left">
              {level.description}. {t("hero.aggregated")} {stationCount} {t("hero.monitoringStations")}
            </p>

            <div className="mt-4 flex gap-3">
              <div className="cyber-border rounded-lg px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">{t("hero.stations")}</span>
                <p className="font-display text-lg font-bold text-primary">{stationCount}</p>
              </div>
              <div className="cyber-border rounded-lg px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">{t("hero.dominant")}</span>
                <p className="font-display text-lg font-bold text-primary">PM2.5</p>
              </div>
              <div className="cyber-border rounded-lg px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">{t("hero.status")}</span>
                <p className="font-display text-lg font-bold" style={{ color: level.color }}>
                  {aqi > 200 ? t("hero.alert") : aqi > 100 ? t("hero.watch") : t("hero.clear")}
                </p>
              </div>
            </div>
          </div>

          <AqiGauge aqi={aqi} size={220} />
        </div>
      </div>
    </section>
  );
}
