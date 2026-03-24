import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useLanguage } from "@/contexts/LanguageContext";
import { WardHistory } from "@/hooks/useWardHistory";
import { Loader2, BarChart3 } from "lucide-react";

interface WardTrendChartProps {
  history: WardHistory | null;
  loading: boolean;
}

const chartConfig = {
  pm25: { label: "PM2.5", color: "hsl(var(--primary))" },
  pm10: { label: "PM10", color: "hsl(var(--accent))" },
};

export function WardTrendChart({ history, loading }: WardTrendChartProps) {
  const { t } = useLanguage();

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

  const dayMap = new Map<string, { day: string; label: string; pm25: number; pm10: number; pm25Min: number; pm25Max: number }>();

  for (const d of history.pm25) {
    dayMap.set(d.day, {
      day: d.day,
      label: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      pm25: d.avg,
      pm10: 0,
      pm25Min: d.min,
      pm25Max: d.max,
    });
  }
  for (const d of history.pm10) {
    const existing = dayMap.get(d.day);
    if (existing) {
      existing.pm10 = d.avg;
    } else {
      dayMap.set(d.day, {
        day: d.day,
        label: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        pm25: 0,
        pm10: d.avg,
        pm25Min: 0,
        pm25Max: 0,
      });
    }
  }

  const data = Array.from(dayMap.values()).sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {t("ward.trendTitle")}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-mono text-[9px] text-muted-foreground">PM2.5</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-[9px] text-muted-foreground">PM10</span>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="aspect-[2/1] w-full sm:aspect-[2.5/1]">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="pm25Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="pm10Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <ReferenceLine y={60} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "WHO", position: "right", fontSize: 8, fill: "hsl(var(--destructive))" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="pm25" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pm25Fill)" />
          <Area type="monotone" dataKey="pm10" stroke="hsl(var(--accent))" strokeWidth={1.5} fill="url(#pm10Fill)" />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
