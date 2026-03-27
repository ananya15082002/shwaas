import { useState, useEffect } from "react";
import { RefreshCw, Wind, Radio, Languages, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavbarProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
  onLogoClick?: () => void;
  onBackToMap?: () => void;
}

export function Navbar({ lastUpdated, onRefresh, loading, onLogoClick, onBackToMap }: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const { t, toggleLang, lang } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBackToMap && (
            <button onClick={onBackToMap} title="Back to Delhi Map" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:text-primary hover:border-primary/50">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer sm:gap-3" onClick={onLogoClick} title="Replay intro">
          <Wind className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          <div>
            <h1 className="font-display text-xs font-bold tracking-wider text-primary sm:text-sm md:text-base">
              {t("nav.title")}
            </h1>
            <p className="hidden font-mono text-[9px] text-muted-foreground xs:block sm:text-[10px]">
              {t("nav.subtitle")}
            </p>
          </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-1">
            <Radio className="h-2.5 w-2.5 animate-pulse-live text-aqi-unhealthy sm:h-3 sm:w-3" />
            <span className="font-mono text-[9px] font-semibold text-aqi-unhealthy xs:text-[10px] sm:text-xs">{t("nav.live")}</span>
          </div>

          <div className="hidden flex-col items-end lg:flex">
            <span className="font-mono text-[10px] text-muted-foreground">
              {lastUpdated ? `${t("nav.updated")} ${lastUpdated.toLocaleTimeString("en-IN")}` : t("nav.loading")}
            </span>
          </div>

          <div className="hidden flex-col items-end font-mono tabular-nums sm:flex">
            <span className="text-xs font-semibold text-primary text-glow-primary sm:text-sm">
              {time.toLocaleTimeString("en-IN", { hour12: false })}
            </span>
            <span className="text-[8px] text-muted-foreground sm:text-[9px]">
              {time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLang}
            className="h-7 gap-1 border-primary/30 px-1.5 font-mono text-[9px] hover:border-primary hover:bg-primary/10 xs:px-2 xs:text-[10px] sm:h-8 sm:gap-1.5 sm:px-3"
          >
            <Languages className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">{t("lang.toggle")}</span>
            <span className="sm:hidden">{lang === "en" ? "हि" : "EN"}</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="h-7 w-7 border-primary/30 hover:border-primary hover:bg-primary/10 sm:h-8 sm:w-8 md:h-9 md:w-9"
          >
            <RefreshCw className={`h-3 w-3 text-primary sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
