import React, { useState, useEffect } from "react";
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

// LottieFiles public CDN — dotlottie format (current/stable)
const LOTTIE_URLS: Record<string, string> = {
  metro:               "https://lottie.host/3fc64a6b-ffd7-4d01-9699-7f2e7a6ed02b/2TT5H2FGFV.json",
  carpool:             "https://lottie.host/b0a0f0e0-0000-0000-0000-000000000001/carpool.json",
  wfh:                 "https://lottie.host/9f6e74b3-5e4b-4e7e-8f4e-3e4b5e4b5e4b/wfh.json",
  cycling:             "https://lottie.host/1a2b3c4d-5e6f-7890-abcd-ef1234567890/cycling.json",
  odd_even:            "https://lottie.host/aaaabbbb-cccc-dddd-eeee-ffffffffffff/oddeven.json",
  truck_ban:           "https://lottie.host/11112222-3333-4444-5555-666677778888/truck.json",
  construction_shroud: "https://lottie.host/ccccdddd-eeee-ffff-0000-111122223333/construction.json",
  water_spray:         "https://lottie.host/44445555-6666-7777-8888-999900001111/water.json",
  tree_peepal:         "https://lottie.host/22223333-4444-5555-6666-777788889999/tree.json",
  tree_neem:           "https://lottie.host/33334444-5555-6666-7777-888899990000/tree2.json",
  n95_mask:            "https://lottie.host/55556666-7777-8888-9999-000011112222/mask.json",
  stay_indoors:        "https://lottie.host/66667777-8888-9999-0000-111122223333/home.json",
};

// Emoji shown while loading OR if Lottie URL fails
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

function LottieEmbed({ url, emoji, category }: { url: string; emoji: string; category: string }) {
  const [animData, setAnimData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error("not ok"); return r.json(); })
      .then((d) => { if (!cancelled) setAnimData(d); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [url]);

  if (failed || !animData) {
    return <AnimatedEmoji emoji={emoji} category={category} />;
  }

  return (
    <Lottie
      animationData={animData}
      loop
      autoplay
      className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20"
    />
  );
}

const ANIM_STYLE: Record<string, React.CSSProperties> = {
  trees: {
    animation: "floatTree 3s ease-in-out infinite",
    filter: "drop-shadow(0 4px 12px rgba(34,197,94,0.5))",
  },
  transport: {
    animation: "floatCard 2.5s ease-in-out infinite",
    filter: "drop-shadow(0 4px 12px rgba(59,130,246,0.4))",
  },
  construction: {
    animation: "floatCard 2.8s ease-in-out infinite",
    filter: "drop-shadow(0 4px 12px rgba(245,158,11,0.4))",
  },
  health: {
    animation: "floatCard 2s ease-in-out infinite",
    filter: "drop-shadow(0 4px 12px rgba(239,68,68,0.4))",
  },
};

function AnimatedEmoji({ emoji, category }: { emoji: string; category: string }) {
  const style = ANIM_STYLE[category] ?? ANIM_STYLE.transport;
  return (
    <>
      <style>{`
        @keyframes floatTree {
          0%, 100% { transform: translateY(0px) scale(1); }
          33% { transform: translateY(-6px) scale(1.05) rotate(-2deg); }
          66% { transform: translateY(-3px) scale(1.02) rotate(2deg); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.06); }
        }
      `}</style>
      <span className="select-none text-xl xs:text-2xl sm:text-3xl" style={style}>{emoji}</span>
    </>
  );
}

function LottieCard({ card }: { card: AdvisoryCard }) {
  const colors = CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS.transport;
  const lottieUrl = LOTTIE_URLS[card.visual_key];
  const emoji = EMOJI_FALLBACK[card.visual_key] ?? "📋";
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
            ? "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.08), rgba(0,0,0,0.4))"
            : `linear-gradient(135deg, ${colors.bg}, rgba(0,0,0,0.3))`,
        }}
      >
        {lottieUrl
          ? <LottieEmbed url={lottieUrl} emoji={emoji} category={card.category} />
          : <AnimatedEmoji emoji={emoji} category={card.category} />
        }

        <div
          className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full px-1 py-0.5 sm:right-2 sm:top-2 sm:px-1.5"
          style={{ background: colors.badge }}
        >
          {isGovt
            ? <Building2 className="h-2.5 w-2.5 text-amber-400" />
            : <User className="h-2.5 w-2.5 text-sky-400" />
          }
          <span
            className="font-mono text-[7px] font-bold uppercase tracking-wider"
            style={{ color: isGovt ? "#fbbf24" : "#38bdf8" }}
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
    <div className="space-y-3 min-w-0 w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base">⚡</span>
        <h4 className="font-display text-xs font-bold tracking-widest text-primary uppercase">
          {lang === "hi" ? "रियल-टाइम एडवाइजरी" : "Real-Time Advisories"}
        </h4>
        <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {lang === "hi" ? "AI द्वारा उत्पन्न" : "AI Generated"}
        </span>
      </div>

      {citizenCards.length > 0 && (
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-sky-400" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-sky-400">
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
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-amber-400" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">
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
