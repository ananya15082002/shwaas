import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, User, Zap } from "lucide-react";

// AI-generated illustrations for each advisory visual_key
import imgMetro from "@/assets/advisory/transport-metro.jpg";
import imgCarpool from "@/assets/advisory/transport-carpool.jpg";
import imgWfh from "@/assets/advisory/transport-wfh.jpg";
import imgCycling from "@/assets/advisory/transport-cycling.jpg";
import imgOddEven from "@/assets/advisory/transport-oddeven.jpg";
import imgTruckBan from "@/assets/advisory/transport-truckban.jpg";
import imgConstructionDust from "@/assets/advisory/construction-dust.jpg";
import imgWaterSpray from "@/assets/advisory/construction-waterspray.jpg";
import imgTreesPlanting from "@/assets/advisory/trees-planting.jpg";
import imgHealthProtection from "@/assets/advisory/health-protection.jpg";
import imgIndustryShutdown from "@/assets/advisory/industry-shutdown.jpg";
import imgSchoolClosure from "@/assets/advisory/health-school.jpg";

export interface AdvisoryCard {
  visual_key: string;
  title: string;
  desc: string;
  target: "citizen" | "govt";
  category: string;
}

interface AdvisoryCardsProps {
  cards: AdvisoryCard[];
}

const CARD_IMAGES: Record<string, string> = {
  metro: imgMetro,
  carpool: imgCarpool,
  wfh: imgWfh,
  cycling: imgCycling,
  ev_vehicle: imgCycling,
  odd_even: imgOddEven,
  truck_ban: imgTruckBan,
  construction_shroud: imgConstructionDust,
  water_spray: imgWaterSpray,
  smog_gun: imgWaterSpray,
  dust_netting: imgConstructionDust,
  factory_shutdown: imgIndustryShutdown,
  school_closure: imgSchoolClosure,
  emergency_alert: imgHealthProtection,
  tree_peepal: imgTreesPlanting,
  tree_neem: imgTreesPlanting,
  tree_arjun: imgTreesPlanting,
  tree_ashoka: imgTreesPlanting,
  n95_mask: imgHealthProtection,
  air_purifier: imgHealthProtection,
  stay_indoors: imgHealthProtection,
};

const CATEGORY_COLORS: Record<string, { border: string; bg: string; badge: string; glow: string }> = {
  transport:    { border: "hsl(var(--primary) / 0.5)",       bg: "hsl(var(--primary) / 0.06)",     badge: "hsl(var(--primary) / 0.2)",      glow: "hsl(var(--primary) / 0.15)" },
  construction: { border: "hsl(var(--accent) / 0.5)",        bg: "hsl(var(--accent) / 0.06)",      badge: "hsl(var(--accent) / 0.2)",       glow: "hsl(var(--accent) / 0.15)" },
  trees:        { border: "hsl(142, 71%, 45%, 0.5)",         bg: "hsl(142, 71%, 45%, 0.06)",       badge: "hsl(142, 71%, 45%, 0.2)",        glow: "hsl(142, 71%, 45%, 0.15)" },
  health:       { border: "hsl(var(--destructive) / 0.5)",   bg: "hsl(var(--destructive) / 0.06)", badge: "hsl(var(--destructive) / 0.2)",   glow: "hsl(var(--destructive) / 0.15)" },
  industry:     { border: "hsl(var(--secondary-foreground) / 0.35)", bg: "hsl(var(--secondary) / 0.3)", badge: "hsl(var(--secondary-foreground) / 0.15)", glow: "hsl(var(--secondary-foreground) / 0.1)" },
  waste:        { border: "hsl(var(--muted-foreground) / 0.35)",     bg: "hsl(var(--muted) / 0.3)",     badge: "hsl(var(--muted-foreground) / 0.15)",     glow: "hsl(var(--muted-foreground) / 0.1)" },
};

function AdvisoryImageCard({ card }: { card: AdvisoryCard }) {
  const colors = CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS.transport;
  const imgSrc = CARD_IMAGES[card.visual_key] ?? imgHealthProtection;
  const isGovt = card.target === "govt";

  return (
    <div
      className="group relative flex min-w-0 w-full flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{
        borderColor: colors.border,
        background: colors.bg,
        boxShadow: `0 4px 20px ${colors.glow}`,
      }}
    >
      {/* Image section */}
      <div className="relative h-24 w-full overflow-hidden xs:h-28 sm:h-32">
        <img
          src={imgSrc}
          alt={card.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.6) 40%, transparent 100%)`,
          }}
        />

        {/* Target badge */}
        <div
          className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 backdrop-blur-md sm:right-2 sm:top-2"
          style={{ background: isGovt ? "rgba(255,140,0,0.85)" : "rgba(0,229,160,0.85)" }}
        >
          {isGovt
            ? <Building2 className="h-2.5 w-2.5 text-black" />
            : <User className="h-2.5 w-2.5 text-black" />
          }
          <span className="font-mono text-[7px] font-black uppercase tracking-wider text-black">
            {isGovt ? "GOVT" : "YOU"}
          </span>
        </div>

        {/* Category chip */}
        <div
          className="absolute left-1.5 bottom-1.5 rounded-full px-2 py-0.5 backdrop-blur-md sm:left-2 sm:bottom-2"
          style={{ background: colors.badge }}
        >
          <span className="font-mono text-[7px] font-bold uppercase tracking-wider text-foreground/80">
            {card.category}
          </span>
        </div>
      </div>

      {/* Text section */}
      <div className="flex flex-1 flex-col gap-1 p-2 xs:p-2.5 sm:p-3">
        <p className="line-clamp-2 font-display text-[10px] font-bold leading-tight text-foreground xs:text-[11px] sm:text-xs">
          {card.title}
        </p>
        <p className="line-clamp-3 break-words font-body text-[8px] leading-snug text-muted-foreground xs:text-[9px] sm:text-[10px]">
          {card.desc}
        </p>
      </div>
    </div>
  );
}

export function AdvisoryCards({ cards }: AdvisoryCardsProps) {
  const { lang } = useLanguage();
  if (!cards || cards.length === 0) return null;

  const citizenCards = cards.filter((c) => c.target === "citizen");
  const govtCards = cards.filter((c) => c.target === "govt");

  return (
    <div className="min-w-0 w-full space-y-4">
      <div className="flex min-w-0 items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <h4 className="font-display text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
          {lang === "hi" ? "रियल-टाइम एडवाइजरी" : "Real-Time Advisories"}
        </h4>
        <span className="ml-auto shrink-0 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-primary">
          {lang === "hi" ? "AI जनित" : "AI Powered"}
        </span>
      </div>

      {citizenCards.length > 0 && (
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              {lang === "hi" ? "आप क्या करें" : "Citizen Actions"}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground ml-1">({citizenCards.length})</span>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {citizenCards.map((card, i) => (
              <AdvisoryImageCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {govtCards.length > 0 && (
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
              {lang === "hi" ? "सरकार क्या करे" : "Government Actions"}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground ml-1">({govtCards.length})</span>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {govtCards.map((card, i) => (
              <AdvisoryImageCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
