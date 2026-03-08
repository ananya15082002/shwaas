import { getAqiLevel } from "@/lib/aqi";
import { useLanguage } from "@/contexts/LanguageContext";

interface AqiGaugeProps {
  aqi: number;
  size?: number;
}

export function AqiGauge({ aqi, size = 200 }: AqiGaugeProps) {
  const level = getAqiLevel(aqi);
  const { t } = useLanguage();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const maxAqi = 500;
  const progress = Math.min(aqi / maxAqi, 1);
  const dashOffset = circumference * (1 - progress * 0.75);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-[135deg]" style={{ width: size, height: size }}>
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeLinecap="round"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="animate-gauge transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 8px ${level.color}80)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="font-display text-5xl font-black tabular-nums sm:text-6xl"
          style={{ color: level.color, textShadow: `0 0 20px ${level.color}60` }}
        >
          {aqi}
        </span>
        <span className="font-body text-sm font-semibold text-muted-foreground">{t("gauge.usAqi")}</span>
      </div>
    </div>
  );
}
