import { WardFeature } from "@/hooks/useDelhiWards";
import { getAQICategory, aqiToBorderColor } from "@/lib/wardAqi";
import { getAqiLevel } from "@/lib/aqi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Users, MapPin, Activity, Shield } from "lucide-react";

interface WardDetailPanelProps {
  ward: WardFeature["properties"];
  onClose: () => void;
}

export function WardDetailPanel({ ward, onClose }: WardDetailPanelProps) {
  const aqi = ward.interpolated_aqi ?? 0;
  const level = getAqiLevel(aqi);
  const category = getAQICategory(aqi);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{ward.ward_name}</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Ward {ward.ward_no} · {ward.ac_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-display text-3xl font-black"
              style={{ color: level.color }}
            >
              {aqi}
            </span>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AQI Category Badge */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold"
          style={{ background: level.color + "20", color: level.color }}
        >
          <Activity className="h-3 w-3" />
          {category}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Population" value={ward.total_pop?.toLocaleString() ?? "—"} />
          <StatCard icon={<Shield className="h-3.5 w-3.5" />} label="SC Population" value={ward.sc_pop?.toLocaleString() ?? "—"} />
          <StatCard icon={<MapPin className="h-3.5 w-3.5" />} label="Nearest Station" value={`${ward.nearest_station_dist ?? "—"}m`} />
          <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="AQI Category" value={category} />
        </div>

        {/* Assembly Info */}
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="font-mono text-[10px] text-muted-foreground">ASSEMBLY CONSTITUENCY</p>
          <p className="mt-1 font-mono text-xs font-semibold text-foreground">
            {ward.ac_name} (AC #{ward.ac_no})
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
