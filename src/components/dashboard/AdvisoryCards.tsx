import Lottie from "lottie-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, User } from "lucide-react";

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

// Lottie animation URLs from LottieFiles CDN (public/free)
const LOTTIE_URLS: Record<string, string> = {
  metro:               "https://assets9.lottiefiles.com/packages/lf20_yd8fbnml.json",
  carpool:             "https://assets10.lottiefiles.com/packages/lf20_jbb8uhgo.json",
  wfh:                 "https://assets5.lottiefiles.com/packages/lf20_w51pcehl.json",
  cycling:             "https://assets3.lottiefiles.com/packages/lf20_uu0x8lqv.json",
  ev_vehicle:          "https://assets2.lottiefiles.com/packages/lf20_zlrpnoxz.json",
  odd_even:            "https://assets4.lottiefiles.com/packages/lf20_jziihkr4.json",
  truck_ban:           "https://assets6.lottiefiles.com/packages/lf20_ky24lkyk.json",
  construction_shroud: "https://assets1.lottiefiles.com/packages/lf20_obhph8tb.json",
  water_spray:         "https://assets7.lottiefiles.com/packages/lf20_m6cuL8.json",
  smog_gun:            "https://assets8.lottiefiles.com/packages/lf20_r3gxcqlf.json",
  dust_netting:        "https://assets3.lottiefiles.com/packages/lf20_obhph8tb.json",
  factory_shutdown:    "https://assets4.lottiefiles.com/packages/lf20_rsgkq9s3.json",
  school_closure:      "https://assets5.lottiefiles.com/packages/lf20_1pxqjqps.json",
  emergency_alert:     "https://assets9.lottiefiles.com/packages/lf20_vvxx0abm.json",
  tree_peepal:         "https://assets3.lottiefiles.com/packages/lf20_twijbubv.json",
  tree_neem:           "https://assets3.lottiefiles.com/packages/lf20_twijbubv.json",
  tree_arjun:          "https://assets10.lottiefiles.com/packages/lf20_twijbubv.json",
  tree_ashoka:         "https://assets2.lottiefiles.com/packages/lf20_twijbubv.json",
  n95_mask:            "https://assets6.lottiefiles.com/packages/lf20_8ymqv9so.json",
  air_purifier:        "https://assets5.lottiefiles.com/packages/lf20_qnqnhqnq.json",
  stay_indoors:        "https://assets4.lottiefiles.com/packages/lf20_w51pcehl.json",
};

// Emoji fallback when Lottie fails or is loading
const EMOJI_FALLBACK: Record<string, string> = {
  metro:               "🚇",
  carpool:             "🚗",
  wfh:                 "💻",
  cycling:             "🚲",
  ev_vehicle:          "⚡",
  odd_even:            "🔁",
  truck_ban:           "🚛",
  construction_shroud: "🏗️",
  water_spray:         "💧",
  smog_gun:            "🌊",
  dust_netting:        "🟩",
  factory_shutdown:    "🏭",
  school_closure:      "🏫",
  emergency_alert:     "🚨",
  tree_peepal:         "🌳",
  tree_neem:           "🌿",
  tree_arjun:          "🌲",
  tree_ashoka:         "🍃",
  n95_mask:            "😷",
  air_purifier:        "🌬️",
  stay_indoors:        "🏠",
};

const CATEGORY_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  transport:    { border: "rgba(59,130,246,0.4)",  bg: "rgba(59,130,246,0.06)",  badge: "rgba(59,130,246,0.15)"  },
  construction: { border: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.06)",  badge: "rgba(245,158,11,0.15)"  },
  trees:        { border: "rgba(34,197,94,0.4)",   bg: "rgba(34,197,94,0.06)",   badge: "rgba(34,197,94,0.15)"   },
  health:       { border: "rgba(239,68,68,0.4)",   bg: "rgba(239,68,68,0.06)",   badge: "rgba(239,68,68,0.15)"   },
  industry:     { border: "rgba(168,85,247,0.4)",  bg: "rgba(168,85,247,0.06)",  badge: "rgba(168,85,247,0.15)"  },
  waste:        { border: "rgba(107,114,128,0.4)", bg: "rgba(107,114,128,0.06)", badge: "rgba(107,114,128,0.15)" },
};

function LottieCard({ card }: { card: AdvisoryCard }) {
  const colors = CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS.transport;
  const lottieUrl = LOTTIE_URLS[card.visual_key];
  const emoji = EMOJI_FALLBACK[card.visual_key] ?? "📋";
  const isGovt = card.target === "govt";

  return (
    <div
      className="shrink-0 w-44 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: colors.border, background: colors.bg, backdropFilter: "blur(8px)" }}
    >
      {/* Animation / Emoji area */}
      <div
        className="flex items-center justify-center h-28 w-full relative"
        style={{ background: `linear-gradient(135deg, ${colors.bg}, rgba(0,0,0,0.3))` }}
      >
        {lottieUrl ? (
          <LottieEmbed url={lottieUrl} emoji={emoji} />
        ) : (
          <span className="text-5xl select-none">{emoji}</span>
        )}

        {/* target badge */}
        <div
          className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
          style={{ background: colors.badge }}
        >
          {isGovt
            ? <Building2 className="h-2.5 w-2.5 text-amber-400" />
            : <User className="h-2.5 w-2.5 text-sky-400" />}
          <span className="font-mono text-[7px] font-bold uppercase tracking-wider"
            style={{ color: isGovt ? "#fbbf24" : "#38bdf8" }}>
            {isGovt ? "GOVT" : "YOU"}
          </span>
        </div>
      </div>

      {/* Text area */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        <p className="font-display text-[12px] font-bold leading-tight text-foreground line-clamp-2">
          {card.title}
        </p>
        <p className="font-body text-[10px] leading-snug text-muted-foreground line-clamp-3">
          {card.desc}
        </p>
      </div>
    </div>
  );
}

function LottieEmbed({ url, emoji }: { url: string; emoji: string }) {
  // Fetch lottie JSON and render, fall back to emoji on error
  const [animData, setAnimData] = React.useState<object | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setAnimData(d); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [url]);

  if (failed || (!animData)) {
    return <span className="text-5xl select-none">{emoji}</span>;
  }

  return (
    <Lottie
      animationData={animData}
      loop
      autoplay
      style={{ width: 88, height: 88 }}
    />
  );
}

// Need React import for hooks in LottieEmbed
import React from "react";

export function AdvisoryCards({ cards }: AdvisoryCardsProps) {
  const { lang } = useLanguage();
  if (!cards || cards.length === 0) return null;

  const govtCards = cards.filter((c) => c.target === "govt");
  const citizenCards = cards.filter((c) => c.target === "citizen");

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-base">⚡</span>
        <h4 className="font-display text-xs font-bold tracking-widest text-primary uppercase">
          {lang === "hi" ? "रियल-टाइम एडवाइजरी" : "Real-Time Advisories"}
        </h4>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
          {lang === "hi" ? "AI द्वारा उत्पन्न" : "AI Generated"}
        </span>
      </div>

      {/* Citizen cards */}
      {citizenCards.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-sky-400" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-sky-400">
              {lang === "hi" ? "आप क्या करें" : "Citizen Actions"}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {citizenCards.map((card, i) => (
              <LottieCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Govt cards */}
      {govtCards.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-amber-400" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">
              {lang === "hi" ? "सरकार क्या करे" : "Govt Actions"}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {govtCards.map((card, i) => (
              <LottieCard key={i} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
