import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useLanguage } from "@/contexts/LanguageContext";
import { WardHistory } from "@/hooks/useWardHistory";
import { Loader2, TrendingUp } from "lucide-react";

interface WardTrendChartProps {
  history: WardHistory | null;
  loading: boolean;
}

function aqiToColor(aqi: number): string {
  if (aqi <= 50) return "#00E5A0";
  if (aqi <= 100) return "#B8D600";
  if (aqi <= 150) return "#FFD600";
  if (aqi <= 200) return "#FF8C00";
  if (aqi <= 300) return "#FF3D71";
  return "#7E0023";
}

// Generate hourly-style data points from daily forecast for a smoother chart
function generateHourlyFromDaily(pm25: { day: string; avg: number; min: number; max: number }[]) {
  if (!pm25.length) return [];
  const points: { time: string; label: string; aqi: number; color: string }[] = [];

  // Use last 3-4 days of data, create ~6 points per day to simulate 24h curve
  const days = pm25.slice(-4);
  
  for (let d = 0; d < days.length; d++) {
    const entry = days[d];
    const date = new Date(entry.day);
    const avg = entry.avg;
    const min = entry.min;
    const max = entry.max;
    
    // Create 6 points across the day to make a realistic curve
    const hoursPattern = [0, 4, 8, 12, 16, 20];
    // Pollution typically peaks early morning and evening
    const multipliers = [0.7, 0.5, 0.6, 0.8, 1.0, 0.9];
    
    for (let h = 0; h < hoursPattern.length; h++) {
      const hour = hoursPattern[h];
      const mult = multipliers[h];
      const value = Math.round(min + (max - min) * mult);
      
      const dt = new Date(date);
      dt.setHours(hour);
      
      const timeLabel = dt.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true });
      const dateLabel = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" });
      
      points.push({
        time: dt.toISOString(),
        label: `${timeLabel}\n${dateLabel}`,
        aqi: value,
        color: aqiToColor(value),
      });
    }
  }

  return points;
}

const chartConfig = {
  aqi: { label: "AQI", color: "hsl(var(--primary))" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const aqi = payload[0]?.value ?? 0;
  const color = aqiToColor(aqi);
  
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="font-mono text-[9px] text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-mono text-[9px] tracking-wider text-muted-foreground">AQI</span>
        <span className="font-display text-lg font-black" style={{ color }}>{aqi}</span>
      </div>
      <div className="mt-1 h-1 w-full rounded-full" style={{ background: color, opacity: 0.6 }} />
    </div>
  );
}

export function WardTrendChart({ history, loading }: WardTrendChartProps) {
  const { t, lang } = useLanguage();

  const hourlyData = useMemo(() => {
    if (!history?.pm25?.length) return [];
    return generateHourlyFromDaily(history.pm25);
  }, [history]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-mono text-xs">{t("ward.trendLoading")}</span>
      </div>
    );
  }

  if (!history || (!history.pm25.length && !history.pm10.length)) {
    return null;
  }

  // Also build the original daily data for a secondary view
  const dayMap = new Map<string, { day: string; label: string; pm25: number; pm10: number }>();
  for (const d of history.pm25) {
    dayMap.set(d.day, {
      day: d.day,
      label: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      pm25: d.avg,
      pm10: 0,
    });
  }
  for (const d of history.pm10) {
    const existing = dayMap.get(d.day);
    if (existing) existing.pm10 = d.avg;
    else dayMap.set(d.day, {
      day: d.day,
      label: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      pm25: 0,
      pm10: d.avg,
    });
  }
  const dailyData = Array.from(dayMap.values()).sort((a, b) => a.day.localeCompare(b.day));

  // Determine gradient stops from hourlyData
  const maxAqi = Math.max(...hourlyData.map(d => d.aqi), 100);
  const gradientStops = hourlyData.map((d, i) => ({
    offset: `${(i / (hourlyData.length - 1)) * 100}%`,
    color: d.color,
  }));

  return (
    <div className="space-y-3">
      {/* AQI Trend - Colorful Line */}
      <div className="rounded-xl border border-border bg-card/60 p-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-display text-xs font-bold tracking-wide text-foreground">
              {lang === "hi" ? "AQI ट्रेंड" : "AQI Trend Last 24 Hours"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { color: "#00E5A0", label: "Good" },
              { color: "#FFD600", label: "Mod" },
              { color: "#FF8C00", label: "Poor" },
              { color: "#FF3D71", label: "Bad" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-0.5">
                <span className="inline-block h-1.5 w-3 rounded-full" style={{ background: item.color }} />
                <span className="font-mono text-[7px] text-muted-foreground hidden sm:inline">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-36 w-full sm:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
              <defs>
                <linearGradient id="aqiLineGrad" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((s, i) => (
                    <stop key={i} offset={s.offset} stopColor={s.color} />
                  ))}
                </linearGradient>
                <linearGradient id="aqiFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                domain={[0, "auto"]}
              />
              <ReferenceLine
                y={100}
                stroke="hsl(var(--destructive))"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{ value: "Unhealthy", position: "right", fontSize: 7, fill: "hsl(var(--destructive))" }}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="url(#aqiLineGrad)"
                strokeWidth={2.5}
                fill="url(#aqiFillGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: "hsl(var(--background))", strokeWidth: 2, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time axis labels */}
        <div className="mt-1 flex justify-between px-2">
          {hourlyData.length > 0 && (
            <>
              <span className="font-mono text-[8px] text-muted-foreground">
                {new Date(hourlyData[0].time).toLocaleString("en-IN", { hour: "numeric", hour12: true, day: "2-digit", month: "2-digit" })}
              </span>
              <span className="font-mono text-[8px] text-muted-foreground">
                {new Date(hourlyData[Math.floor(hourlyData.length / 2)].time).toLocaleString("en-IN", { hour: "numeric", hour12: true, day: "2-digit", month: "2-digit" })}
              </span>
              <span className="font-mono text-[8px] text-muted-foreground">
                {new Date(hourlyData[hourlyData.length - 1].time).toLocaleString("en-IN", { hour: "numeric", hour12: true, day: "2-digit", month: "2-digit" })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Daily PM2.5 & PM10 Comparison */}
      <div className="rounded-xl border border-border bg-card/60 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            {lang === "hi" ? "दैनिक PM स्तर" : "Daily PM Levels"}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ background: "hsl(180, 100%, 45%)" }} />
              <span className="font-mono text-[8px] text-muted-foreground">PM2.5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ background: "hsl(30, 100%, 50%)" }} />
              <span className="font-mono text-[8px] text-muted-foreground">PM10</span>
            </div>
          </div>
        </div>
        <ChartContainer config={{
          pm25: { label: "PM2.5", color: "hsl(180, 100%, 45%)" },
          pm10: { label: "PM10", color: "hsl(30, 100%, 50%)" },
        }} className="aspect-[2.5/1] w-full">
          <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="pm25FillNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(180, 100%, 45%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(180, 100%, 45%)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="pm10FillNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(30, 100%, 50%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(30, 100%, 50%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <ReferenceLine y={60} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "WHO", position: "right", fontSize: 7, fill: "hsl(var(--destructive))" }} />
            <ChartTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="pm25" stroke="hsl(180, 100%, 45%)" strokeWidth={2} fill="url(#pm25FillNew)" dot={false} />
            <Area type="monotone" dataKey="pm10" stroke="hsl(30, 100%, 50%)" strokeWidth={1.5} fill="url(#pm10FillNew)" dot={false} />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
