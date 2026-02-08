import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import type {
  Caption as CaptionType,
  CaptionSettings,
  CaptionPosition,
  CaptionPositionCoords,
} from "@steno/contracts";
import {
  DEFAULT_CAPTION_SETTINGS,
  isPositionCoords,
  presetToCoords,
} from "@steno/contracts";
import { WordByWord } from "./animations";

interface CaptionSequenceProps {
  captions: CaptionType[];
  settings?: Partial<CaptionSettings>;
}

/**
 * Convert position to coordinates (handles both presets and coordinates)
 */
function getPositionCoords(position: CaptionPosition): CaptionPositionCoords {
  if (isPositionCoords(position)) {
    return position;
  }
  return presetToCoords(position);
}

/**
 * Maps captions array to Remotion sequences with word-by-word animation.
 */
export const CaptionSequence: React.FC<CaptionSequenceProps> = ({
  captions,
  settings,
}) => {
  const { fps } = useVideoConfig();
  const mergedSettings = { ...DEFAULT_CAPTION_SETTINGS, ...settings };

  return (
    <>
      {captions.map((caption) => {
        // Convert seconds to frames
        const startFrame = Math.round(caption.start * fps);
        const endFrame = Math.round(caption.end * fps);
        const durationInFrames = endFrame - startFrame;

        return (
          <Sequence
            key={caption.id}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
              }}
            >
              <WordByWordCaption
                caption={caption}
                settings={mergedSettings}
              />
            </div>
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * Word-by-word caption wrapper with freeform positioning
 */
const WordByWordCaption: React.FC<{
  caption: CaptionType;
  settings: CaptionSettings;
}> = ({ caption, settings }) => {
  const coords = getPositionCoords(caption.position);

  // Get style classes
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

  return (
    <div
      className="absolute"
      style={{
        position: "absolute",
        left: `${coords.x}%`,
        top: `${coords.y}%`,
        transform: "translate(-50%, -50%)",
        maxWidth: "90%",
      }}
    >
      <div
        className={`text-center ${getStyleClasses()} relative`}
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.fontWeight,
          color: settings.color,
          lineHeight: settings.lineHeight,
        }}
      >
        {caption.style === "highlight" && (
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,107,107,0.2) 100%)",
              filter: "blur(40px)",
            }}
          />
        )}
        <WordByWord
          words={caption.words}
          captionStart={caption.start}
          emphasis={caption.emphasis}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default CaptionSequence;
