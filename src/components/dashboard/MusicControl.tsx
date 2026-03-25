import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";

interface MusicControlProps {
  isPlaying: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
}

export function MusicControl({ isPlaying, volume, onToggle, onVolumeChange }: MusicControlProps) {
  const [expanded, setExpanded] = useState(false);
  const [touchMode, setTouchMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTouchMode(window.matchMedia("(hover: none)").matches);
  }, []);

  const handleMainClick = () => {
    onToggle();
    if (touchMode) setExpanded((prev) => !prev);
  };

  return (
    <motion.div
      className="fixed bottom-2 right-2 z-[110] flex items-center gap-2 sm:bottom-4 sm:right-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: touchMode ? 100 : 120 }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-2 py-1.5 backdrop-blur-xl sm:px-3 sm:py-2">
              <Slider
                value={[volume * 100]}
                onValueChange={([v]) => onVolumeChange(v / 100)}
                max={100}
                step={1}
                className="w-16 sm:w-20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleMainClick}
        onMouseEnter={() => !touchMode && setExpanded(true)}
        onMouseLeave={() => !touchMode && setExpanded(false)}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-card/90 backdrop-blur-xl transition-all hover:border-primary hover:bg-primary/10 sm:h-10 sm:w-10"
        title={isPlaying ? "Mute music" : "Play ambient music"}
      >
        {isPlaying ? (
          <>
            <Volume2 className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            <div className="absolute -top-1 -right-1 flex gap-[2px]">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full bg-primary"
                  animate={{ height: [3, 8, 3] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
        )}
      </button>
    </motion.div>
  );
}
