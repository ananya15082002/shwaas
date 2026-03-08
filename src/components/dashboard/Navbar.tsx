import { useState, useEffect } from "react";
import { RefreshCw, Wind, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export function Navbar({ lastUpdated, onRefresh, loading }: NavbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Wind className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-sm font-bold tracking-wider text-primary sm:text-base">
              DELHI AQI COMMAND CENTER
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground">
              REAL-TIME AIR QUALITY INTELLIGENCE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <Radio className="h-3 w-3 animate-pulse-live text-aqi-unhealthy" />
            <span className="font-mono text-xs font-semibold text-aqi-unhealthy">LIVE</span>
          </div>

          <div className="hidden flex-col items-end md:flex">
            <span className="font-mono text-xs text-muted-foreground">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-IN")}` : "Loading..."}
            </span>
          </div>

          <div className="font-mono text-sm font-semibold tabular-nums text-primary text-glow-primary">
            {time.toLocaleTimeString("en-IN", { hour12: false })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            <RefreshCw className={`h-4 w-4 text-primary ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
