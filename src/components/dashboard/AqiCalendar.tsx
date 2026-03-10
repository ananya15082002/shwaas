import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "lucide-react";
import { WardHistory } from "@/hooks/useWardHistory";

interface AqiCalendarProps {
  history: WardHistory | null;
}

const aqiColor = (aqi: number) => {
  if (!aqi) return "transparent";
  if (aqi <= 50) return "#00E5A0";
  if (aqi <= 100) return "#FFD600";
  if (aqi <= 150) return "#FF8C00";
  if (aqi <= 200) return "#FF3D3D";
  if (aqi <= 300) return "#C62BFF";
  return "#FF0033";
};

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

export function AqiCalendar({ history }: AqiCalendarProps) {
  const { lang } = useLanguage();
  const dayNames = lang === "hi" ? DAYS_HI : DAYS_EN;

  const weekDays = useMemo(() => {
    const dailyAqi: Record<string, number> = {};
    if (history) {
      history.pm25.forEach((h) => {
        const aqi = Math.round(h.avg * 1.5);
        if (!dailyAqi[h.day] || aqi > dailyAqi[h.day]) dailyAqi[h.day] = aqi;
      });
    }

    const today = new Date();
    const days: { label: string; date: string; aqi: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        label: dayNames[d.getDay()],
        date: String(d.getDate()),
        aqi: dailyAqi[key] ?? 0,
        isToday: i === 0,
      });
    }
    return days;
  }, [history, lang]);

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
        <Calendar className="h-4 w-4" /> {lang === "hi" ? "साप्ताहिक AQI" : "WEEKLY AQI"}
      </h4>
      <div className="rounded-lg border border-border bg-card/50 p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{d.label}</span>
              <div
                className="flex h-10 w-full flex-col items-center justify-center rounded-md transition-all"
                style={{
                  background: d.aqi ? `${aqiColor(d.aqi)}20` : "hsl(var(--secondary) / 0.3)",
                  border: d.isToday ? `2px solid hsl(var(--primary))` : d.aqi ? `1px solid ${aqiColor(d.aqi)}40` : "1px solid transparent",
                }}
                title={d.aqi ? `AQI ${d.aqi}` : ""}
              >
                <span className="font-mono text-[9px] text-muted-foreground">{d.date}</span>
                {d.aqi > 0 && (
                  <span className="font-display text-[10px] font-black leading-none" style={{ color: aqiColor(d.aqi) }}>{d.aqi}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
