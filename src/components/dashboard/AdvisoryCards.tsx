import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, User } from "lucide-react";
import { getAdvisoryIconSVG } from "@/lib/mapIcons";

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

const CATEGORY_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  transport:    { border: "hsl(var(--primary) / 0.45)",      bg: "hsl(var(--primary) / 0.08)",      badge: "hsl(var(--primary) / 0.18)" },
  construction: { border: "hsl(var(--accent) / 0.45)",       bg: "hsl(var(--accent) / 0.08)",       badge: "hsl(var(--accent) / 0.18)" },
  trees:        { border: "hsl(var(--aqi-good) / 0.45)",     bg: "hsl(var(--aqi-good) / 0.08)",     badge: "hsl(var(--aqi-good) / 0.18)" },
  health:       { border: "hsl(var(--destructive) / 0.45)",  bg: "hsl(var(--destructive) / 0.08)",  badge: "hsl(var(--destructive) / 0.18)" },
  industry:     { border: "hsl(var(--secondary-foreground) / 0.35)", bg: "hsl(var(--secondary) / 0.45)", badge: "hsl(var(--secondary-foreground) / 0.14)" },
  waste:        { border: "hsl(var(--muted-foreground) / 0.35)",     bg: "hsl(var(--muted) / 0.45)",     badge: "hsl(var(--muted-foreground) / 0.14)" },
};

const CATEGORY_ICON_COLORS: Record<string, string> = {
  transport: "hsl(180, 100%, 45%)",
  construction: "hsl(30, 100%, 50%)",
  trees: "hsl(142, 71%, 45%)",
  health: "hsl(0, 84%, 60%)",
  industry: "hsl(220, 14%, 60%)",
  waste: "hsl(280, 65%, 50%)",
};

function LottieCard({ card }: { card: AdvisoryCard }) {
  const colors = CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS.transport;
  const iconColor = CATEGORY_ICON_COLORS[card.category] ?? CATEGORY_ICON_COLORS.transport;
  const isGovt = card.target === "govt";

  return (
    <div
      className="flex min-w-0 w-full flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: colors.border, background: colors.bg, backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative flex h-16 w-full items-center justify-center xs:h-20 sm:h-24"
        style={{
          background: card.category === "trees"
            ? "linear-gradient(135deg, hsl(var(--aqi-good) / 0.2), hsl(var(--primary) / 0.08), hsl(var(--background) / 0.7))"
            : `linear-gradient(135deg, ${colors.bg}, hsl(var(--background) / 0.55))`,
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl xs:h-12 xs:w-12 sm:h-14 sm:w-14"
          style={{
            background: `${iconColor}15`,
            border: `1.5px solid ${iconColor}40`,
            color: iconColor,
            filter: `drop-shadow(0 4px 12px ${iconColor}30)`,
          }}
          dangerouslySetInnerHTML={{ __html: getAdvisoryIconSVG(card.visual_key, 28) }}
        />

        <div
          className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full px-1 py-0.5 sm:right-2 sm:top-2 sm:px-1.5"
          style={{ background: colors.badge }}
        >
          {isGovt
            ? <Building2 className="h-2.5 w-2.5 text-accent" />
            : <User className="h-2.5 w-2.5 text-primary" />
          }
          <span
            className="font-mono text-[7px] font-bold uppercase tracking-wider"
            style={{ color: isGovt ? "hsl(var(--accent))" : "hsl(var(--primary))" }}
          >
            {isGovt ? "GOVT" : "YOU"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-1.5 xs:p-2 sm:gap-1 sm:p-2.5">
        <p className="line-clamp-2 font-display text-[9px] font-bold leading-tight text-foreground xs:text-[10px] sm:text-[11px]">
          {card.title}
        </p>
        <p className="line-clamp-2 break-words font-body text-[8px] leading-snug text-muted-foreground xs:text-[9px] sm:text-[10px]">
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
    <div className="min-w-0 w-full space-y-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-base">⚡</span>
        <h4 className="font-display text-xs font-bold uppercase tracking-widest text-primary">
          {lang === "hi" ? "रियल-टाइम एडवाइजरी" : "Real-Time Advisories"}
        </h4>
        <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {lang === "hi" ? "AI द्वारा उत्पन्न" : "AI Generated"}
        </span>
      </div>

      {citizenCards.length > 0 && (
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-primary">
              {lang === "hi" ? "आप क्या करें" : "Citizen Actions"}
            </span>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {citizenCards.map((card, i) => (
              <LottieCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {govtCards.length > 0 && (
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-accent" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
              {lang === "hi" ? "सरकार क्या करे" : "Govt Actions"}
            </span>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {govtCards.map((card, i) => (
              <LottieCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
