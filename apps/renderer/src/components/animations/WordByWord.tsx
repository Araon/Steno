import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { CaptionWord, CaptionSettings } from "@steno/contracts";
import { DEFAULT_CAPTION_SETTINGS } from "@steno/contracts";

interface WordByWordProps {
  words: CaptionWord[];
  /** Start time of the caption in seconds */
  captionStart: number;
  /** Emphasis words to highlight */
  emphasis: string[];
  /** Caption settings */
  settings?: Partial<CaptionSettings>;
}

/**
 * Word-by-word animation - reveals words sequentially based on their timestamps.
 */
export const WordByWord: React.FC<WordByWordProps> = ({
  words,
  captionStart,
  emphasis,
  settings,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mergedSettings = { ...DEFAULT_CAPTION_SETTINGS, ...settings };

  // Check if a word should be emphasized
  const isEmphasized = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return emphasis.some(
      (e) => e.toLowerCase().replace(/[.,!?]/g, "") === cleanWord
    );
  };

  return (
    <div className="flex flex-wrap justify-center items-baseline">
      {words.map((word, index) => {
        // Calculate when this word should appear (relative to caption start)
        const wordStartFrame = Math.round((word.start - captionStart) * fps);
        const localFrame = frame - wordStartFrame;

        // Word visibility and animation
        const isVisible = localFrame >= 0;

        // Spring animation for each word
        const wordSpring = isVisible
          ? spring({
              frame: localFrame,
              fps,
              config: {
                damping: 15,
                stiffness: 200,
                mass: 0.4,
              },
            })
          : 0;

        const opacity = interpolate(wordSpring, [0, 1], [0, 1]);
        const scale = interpolate(wordSpring, [0, 1], [0.5, 1]);
        const translateY = interpolate(wordSpring, [0, 1], [20, 0]);

        const emphasized = isEmphasized(word.text);

        return (
          <span
            key={index}
            className="inline-block mx-1"
            style={{
              opacity,
              transform: `scale(${scale * (emphasized ? mergedSettings.emphasisScale : 1)}) translateY(${translateY}px)`,
              fontWeight: emphasized ? 900 : mergedSettings.fontWeight,
              color: emphasized ? "#FFD700" : mergedSettings.color,
              textShadow:
                "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};

export default WordByWord;
