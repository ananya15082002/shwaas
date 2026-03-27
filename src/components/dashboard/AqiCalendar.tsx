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

    // Use actual forecast dates if available, otherwise fall back to today-centered range
    const availableDates = Object.keys(dailyAqi).sort();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let datesToShow: string[] = [];

    if (availableDates.length >= 7) {
      // Find today's index and center around it
      const todayIdx = availableDates.indexOf(todayKey);
      if (todayIdx >= 0) {
        const start = Math.max(0, Math.min(todayIdx - 3, availableDates.length - 7));
        datesToShow = availableDates.slice(start, start + 7);
      } else {
        datesToShow = availableDates.slice(0, 7);
      }
    } else if (availableDates.length > 0) {
      // Pad with surrounding dates to make 7
      const firstDate = new Date(availableDates[0]);
      const lastDate = new Date(availableDates[availableDates.length - 1]);
      const allDates = new Set(availableDates);
      // Extend backwards then forwards to fill 7
      let cursor = new Date(firstDate);
      while (allDates.size < 7) {
        cursor.setDate(cursor.getDate() - 1);
        const k = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        allDates.add(k);
      }
      datesToShow = [...allDates].sort();
      if (datesToShow.length > 7) datesToShow = datesToShow.slice(datesToShow.length - 7);
    } else {
      // No data at all — show past 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        datesToShow.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      }
    }

    return datesToShow.map((key) => {
      const d = new Date(key + "T00:00:00");
      return {
        label: dayNames[d.getDay()],
        date: String(d.getDate()),
        aqi: dailyAqi[key] ?? 0,
        isToday: key === todayKey,
      };
    });
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
