import { Thermometer, Droplets, Wind, Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherInfoProps {
  iaqi: Record<string, { v: number }>;
}

export function WeatherInfo({ iaqi }: WeatherInfoProps) {
  const { t } = useLanguage();

  const temp = iaqi.t?.v;
  const humidity = iaqi.h?.v;
  const wind = iaqi.w?.v;
  const pressure = iaqi.p?.v;

  if (temp == null && humidity == null && wind == null) return null;

  const items = [
    temp != null && { icon: Thermometer, label: t("weather.temp"), value: `${Math.round(temp)}°C`, color: temp > 35 ? "#FF3D3D" : temp > 25 ? "#FFD600" : "#00E5A0" },
    humidity != null && { icon: Droplets, label: t("weather.humidity"), value: `${Math.round(humidity)}%`, color: humidity > 70 ? "#00B4D8" : "#00E5A0" },
    wind != null && { icon: Wind, label: t("weather.wind"), value: `${wind.toFixed(1)} m/s`, color: wind > 5 ? "#FF8C00" : "#00E5A0" },
    pressure != null && { icon: Sun, label: t("weather.pressure"), value: `${Math.round(pressure)} hPa`, color: "#C62BFF" },
  ].filter(Boolean) as { icon: any; label: string; value: string; color: string }[];

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-display text-xs font-bold tracking-widest text-primary">
        🌡️ {t("weather.title")}
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
            </div>
            <p className="mt-1 font-display text-sm font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
