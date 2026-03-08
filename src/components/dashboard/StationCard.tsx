import { StationData, getAqiLevel } from "@/lib/aqi";
import { MapPin } from "lucide-react";

interface StationCardProps {
  station: StationData;
  onClick: () => void;
  index: number;
}

export function StationCard({ station, onClick, index }: StationCardProps) {
  const level = getAqiLevel(station.aqi);

  return (
    <button
      onClick={onClick}
      className="cyber-border group w-full cursor-pointer rounded-lg p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:border-primary/40"
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">{station.area}</span>
          </div>
          <h3 className="mt-1 font-display text-sm font-bold tracking-wide text-foreground">
            {station.name}
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <span
            className="font-display text-3xl font-black tabular-nums"
            style={{ color: level.color, textShadow: `0 0 15px ${level.color}40` }}
          >
            {station.aqi}
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
            style={{
              backgroundColor: `${level.color}20`,
              color: level.color,
              border: `1px solid ${level.color}40`,
            }}
          >
            {level.label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Mini pollutant bars */}
      <div className="mt-3 space-y-1">
        {["pm25", "pm10", "no2"].map((p) => {
          const val = station.iaqi[p]?.v;
          if (!val) return null;
          return (
            <div key={p} className="flex items-center gap-2">
              <span className="w-10 font-mono text-[9px] text-muted-foreground uppercase">{p.replace("25", "2.5")}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((val / 300) * 100, 100)}%`,
                    backgroundColor: level.color,
                  }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[9px] text-muted-foreground">{val}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 font-mono text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Click for detailed analysis →
      </div>
    </button>
  );
}
