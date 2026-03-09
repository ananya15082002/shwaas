import { useState, useCallback, useEffect } from "react";

export type IntroStage = 1 | 2 | 3 | 4 | "done";

const STAGE_DURATIONS: Record<number, number> = {
  1: 3000,  // Planet Earth loading
  2: 4000,  // Earth rises
  3: 3000,  // India searching
  4: 3000,  // Delhi loading
};

export function useIntroSequence() {
  const hasVisited = typeof window !== "undefined" && localStorage.getItem("delhiaqi_visited") === "true";

  const [stage, setStage] = useState<IntroStage>(hasVisited ? 4 : 1);
  const [introDone, setIntroDone] = useState(false);

  const skip = useCallback(() => {
    setStage("done");
    setIntroDone(true);
    localStorage.setItem("delhiaqi_visited", "true");
  }, []);

  useEffect(() => {
    if (stage === "done") return;

    const currentStage = stage as number;
    const duration = STAGE_DURATIONS[currentStage];
    if (!duration) return;

    const timer = setTimeout(() => {
      if (currentStage < 4) {
        setStage((currentStage + 1) as IntroStage);
      } else {
        skip();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [stage, skip]);

  return { stage, introDone, skip };
}
