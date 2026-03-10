import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_HI = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

export function AqiCalendar({ history }: AqiCalendarProps) {
  const { t, lang } = useLanguage();
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = (lang === "hi" ? MONTHS_HI : MONTHS_EN)[month];
  const dayNames = lang === "hi" ? DAYS_HI : DAYS_EN;

  const dailyAqi = useMemo(() => {
    const map: Record<string, number> = {};
    if (!history) return map;
    // Use pm25 forecast data as the calendar source
    history.pm25.forEach((h) => {
      const d = h.day;
      // Convert PM2.5 µg/m³ to approximate AQI
      const aqi = Math.round(h.avg * 1.5); // rough PM2.5 to AQI approximation
      if (!map[d] || aqi > map[d]) map[d] = aqi;
    });
    return map;
  }, [history]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { day: number; aqi: number }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, aqi: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, aqi: dailyAqi[key] ?? 0 });
  }

  const canGoForward = monthOffset < 0;

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-primary">
        <Calendar className="h-4 w-4" /> {t("ward.aqiCalendar")}
      </h4>
      <div className="rounded-lg border border-border bg-card/50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setMonthOffset((o) => o - 1)} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-xs font-bold text-foreground">{monthName} {year}</span>
          <button onClick={() => canGoForward && setMonthOffset((o) => o + 1)} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={!canGoForward}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {dayNames.map((d) => (
            <div key={d} className="py-1 text-center font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{d}</div>
          ))}
          {cells.map((cell, i) => (
            <div
              key={i}
              className="relative flex aspect-square flex-col items-center justify-center rounded-md text-center transition-all"
              style={{
                background: cell.day && cell.aqi ? `${aqiColor(cell.aqi)}20` : "transparent",
                border: cell.day && cell.aqi ? `1px solid ${aqiColor(cell.aqi)}40` : "1px solid transparent",
              }}
              title={cell.day && cell.aqi ? `Day ${cell.day}: AQI ${cell.aqi}` : ""}
            >
              {cell.day > 0 && (
                <>
                  <span className="font-mono text-[9px] text-muted-foreground">{cell.day}</span>
                  {cell.aqi > 0 && (
                    <span className="font-display text-[9px] font-black" style={{ color: aqiColor(cell.aqi) }}>{cell.aqi}</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Mini legend */}
        <div className="mt-2 flex items-center justify-center gap-1">
          {[
            { c: "#00E5A0", l: "0-50" },
            { c: "#FFD600", l: "51-100" },
            { c: "#FF8C00", l: "101-150" },
            { c: "#FF3D3D", l: "151-200" },
            { c: "#C62BFF", l: "201-300" },
            { c: "#FF0033", l: "300+" },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-sm" style={{ background: item.c }} />
              <span className="font-mono text-[7px] text-muted-foreground">{item.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
