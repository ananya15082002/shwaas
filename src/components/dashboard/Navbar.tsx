import { useState, useEffect } from "react";
import { RefreshCw, Wind, Radio, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavbarProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
  onLogoClick?: () => void;
}

export function Navbar({ lastUpdated, onRefresh, loading, onLogoClick }: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const { t, toggleLang, lang } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onLogoClick} title="Replay intro">
          <Wind className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-sm font-bold tracking-wider text-primary sm:text-base">
              {t("nav.title")}
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground">
              {t("nav.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-pulse-live text-aqi-unhealthy" />
            <span className="font-mono text-[10px] font-semibold text-aqi-unhealthy sm:text-xs">{t("nav.live")}</span>
          </div>

          <div className="hidden flex-col items-end md:flex">
            <span className="font-mono text-xs text-muted-foreground">
              {lastUpdated ? `${t("nav.updated")} ${lastUpdated.toLocaleTimeString("en-IN")}` : t("nav.loading")}
            </span>
          </div>

          <div className="hidden flex-col items-end font-mono tabular-nums sm:flex">
            <span className="text-sm font-semibold text-primary text-glow-primary">
              {time.toLocaleTimeString("en-IN", { hour12: false })}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLang}
            className="gap-1 border-primary/30 px-2 font-mono text-[10px] hover:border-primary hover:bg-primary/10 sm:gap-1.5 sm:px-3"
          >
            <Languages className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">{t("lang.toggle")}</span>
            <span className="sm:hidden">{lang === "en" ? "हि" : "EN"}</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 border-primary/30 hover:border-primary hover:bg-primary/10 sm:h-9 sm:w-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
