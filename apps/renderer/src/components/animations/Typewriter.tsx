import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { CaptionSettings } from "@steno/contracts";
import { DEFAULT_CAPTION_SETTINGS } from "@steno/contracts";

interface TypewriterProps {
  text: string;
  /** Emphasis words to highlight */
  emphasis: string[];
  /** Caption settings */
  settings?: Partial<CaptionSettings>;
  /** Characters revealed per frame */
  charsPerFrame?: number;
}

/**
 * Typewriter animation - reveals text character by character.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  emphasis,
  settings,
  charsPerFrame = 0.5,
}) => {
  const frame = useCurrentFrame();
  const mergedSettings = { ...DEFAULT_CAPTION_SETTINGS, ...settings };

  // Calculate how many characters to show
  const charsToShow = Math.floor(frame * charsPerFrame);
  const visibleText = text.slice(0, charsToShow);

  // Check if a word should be emphasized
  const isEmphasized = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return emphasis.some(
      (e) => e.toLowerCase().replace(/[.,!?]/g, "") === cleanWord
    );
  };

  // Split visible text into words and render with emphasis
  const words = visibleText.split(/(\s+)/);

  return (
    <div className="flex flex-wrap justify-center items-baseline">
      {words.map((segment, index) => {
        // Check if this is a space
        if (/^\s+$/.test(segment)) {
          return <span key={index}>{segment}</span>;
        }

        const emphasized = isEmphasized(segment);

        return (
          <span
            key={index}
            className="inline-block"
            style={{
              fontWeight: emphasized ? 900 : mergedSettings.fontWeight,
              color: emphasized ? "#FFD700" : mergedSettings.color,
              textShadow:
                "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
              transform: emphasized
                ? `scale(${mergedSettings.emphasisScale})`
                : "scale(1)",
            }}
          >
            {segment}
          </span>
        );
      })}
      {/* Blinking cursor */}
      {charsToShow < text.length && (
        <span
          style={{
            opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
            color: mergedSettings.color,
          }}
        >
          |
        </span>
      )}
    </div>
  );
};

export default Typewriter;
