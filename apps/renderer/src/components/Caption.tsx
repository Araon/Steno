import React from "react";
import type { Caption as CaptionType, CaptionSettings } from "@steno/contracts";
import { DEFAULT_CAPTION_SETTINGS } from "@steno/contracts";

interface CaptionProps {
  caption: CaptionType;
  settings?: Partial<CaptionSettings>;
}

/**
 * Base caption component that renders text with emphasis styling.
 */
export const Caption: React.FC<CaptionProps> = ({ caption, settings }) => {
  const mergedSettings = { ...DEFAULT_CAPTION_SETTINGS, ...settings };

  // Get style classes based on caption style
  const getStyleClasses = () => {
    switch (caption.style) {
      case "bold":
        return "font-bold";
      case "italic":
        return "italic";
      case "highlight":
        return "font-bold";
      default:
        return "";
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (caption.position) {
      case "top":
        return "items-start pt-20";
      case "bottom":
        return "items-end pb-20";
      case "center":
      default:
        return "items-center";
    }
  };

  // Check if a word should be emphasized
  const isEmphasized = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return caption.emphasis.some(
      (e) => e.toLowerCase().replace(/[.,!?]/g, "") === cleanWord
    );
  };

  // Render word with optional emphasis
  const renderWord = (word: { text: string }, index: number) => {
    const emphasized = isEmphasized(word.text);

    return (
      <span
        key={index}
        className="inline-block mx-1"
        style={{
          transform: emphasized ? `scale(${mergedSettings.emphasisScale})` : "scale(1)",
          fontWeight: emphasized ? 900 : mergedSettings.fontWeight,
          color: emphasized ? "#FFD700" : mergedSettings.color,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
          transition: "transform 0.1s ease",
        }}
      >
        {word.text}
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col justify-center ${getPositionClasses()} w-full h-full px-8`}
    >
      <div
        className={`text-center ${getStyleClasses()}`}
        style={{
          fontFamily: mergedSettings.fontFamily,
          fontSize: `${mergedSettings.fontSize}px`,
          fontWeight: mergedSettings.fontWeight,
          color: mergedSettings.color,
          lineHeight: 1.3,
        }}
      >
        {caption.style === "highlight" && (
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,107,107,0.2) 100%)",
              filter: "blur(40px)",
            }}
          />
        )}
        <div className="flex flex-wrap justify-center items-baseline">
          {caption.words.map((word, index) => renderWord(word, index))}
        </div>
      </div>
    </div>
  );
};

export default Caption;
