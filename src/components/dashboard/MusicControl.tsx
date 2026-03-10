import { useState } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
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

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-[110] flex items-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 120 }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-3 py-2 backdrop-blur-xl">
              <Slider
                value={[volume * 100]}
                onValueChange={([v]) => onVolumeChange(v / 100)}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onToggle}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card/90 backdrop-blur-xl transition-all hover:border-primary hover:bg-primary/10"
        title={isPlaying ? "Mute music" : "Play ambient music"}
      >
        {isPlaying ? (
          <>
            <Volume2 className="h-4 w-4 text-primary" />
            {/* Animated music bars */}
            <div className="absolute -top-1 -right-1 flex gap-[2px]">
              {[0, 1, 2].map(i => (
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
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </motion.div>
  );
}
