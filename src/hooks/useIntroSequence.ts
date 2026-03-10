import { useState, useCallback, useEffect } from "react";

export type IntroStage = 1 | 2 | 3 | "done";

const STAGE_DURATIONS: Record<number, number> = {
  1: 3500,  // Planet Earth Loading
  2: 4000,  // Finding Country India + Earth rises
  // Stage 3 waits for user click on Delhi — no auto-advance
};

export function useIntroSequence() {
  const hasVisited = typeof window !== "undefined" && localStorage.getItem("delhiaqi_visited") === "true";

  const [stage, setStage] = useState<IntroStage>(hasVisited ? "done" : 1);
  const [introDone, setIntroDone] = useState(hasVisited);

  const skip = useCallback(() => {
    setStage("done");
    setIntroDone(true);
    localStorage.setItem("delhiaqi_visited", "true");
  }, []);

  const advanceToNext = useCallback(() => {
    setStage((prev) => {
      if (prev === "done") return prev;
      const next = (prev as number) + 1;
      if (next > 3) {
        skip();
        return "done";
      }
      return next as IntroStage;
    });
  }, [skip]);

  useEffect(() => {
    if (stage === "done" || stage === 3) return; // Stage 3 waits for click

    const currentStage = stage as number;
    const duration = STAGE_DURATIONS[currentStage];
    if (!duration) return;

    const timer = setTimeout(() => {
      setStage((currentStage + 1) as IntroStage);
    }, duration);

    return () => clearTimeout(timer);
  }, [stage]);

  return { stage, introDone, skip, advanceToNext };
}
