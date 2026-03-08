import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ForecastChartProps {
  data: Array<{ day: string; avg: number; min: number; max: number }>;
}

export function ForecastChart({ data }: ForecastChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="pmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(180, 100%, 45%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(180, 100%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={{ stroke: "hsl(220, 15%, 18%)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 10%)",
              border: "1px solid hsl(220, 15%, 18%)",
              borderRadius: "8px",
              fontFamily: "JetBrains Mono",
              fontSize: "11px",
            }}
            labelStyle={{ color: "hsl(180, 100%, 45%)" }}
          />
          <ReferenceLine y={150} stroke="hsl(0, 85%, 55%)" strokeDasharray="3 3" label="" />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="hsl(180, 100%, 45%)"
            fill="url(#pmGradient)"
            strokeWidth={2}
            dot={{ fill: "hsl(180, 100%, 45%)", r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
