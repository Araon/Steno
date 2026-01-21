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
import { Caption } from "./Caption";
import { ScaleIn, FadeIn, WordByWord, Typewriter } from "./animations";

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
 * Maps captions array to Remotion sequences with appropriate animations.
 */
export const CaptionSequence: React.FC<CaptionSequenceProps> = ({
  captions,
  settings,
}) => {
  const { fps, width, height } = useVideoConfig();
  const mergedSettings = { ...DEFAULT_CAPTION_SETTINGS, ...settings };

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/70d951d1-f59d-4979-ab77-07fedbe75bc1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H4",
      location: "CaptionSequence.tsx:video-config",
      message: "Video config sizing",
      data: { width, height, fps, captionCount: captions.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <>
      {captions.map((caption) => {
        // Convert seconds to frames
        const startFrame = Math.round(caption.start * fps);
        const endFrame = Math.round(caption.end * fps);
        const durationInFrames = endFrame - startFrame;

        // Render caption with appropriate animation
        const renderAnimatedCaption = () => {
          switch (caption.animation) {
            case "scale-in":
              return (
                <ScaleIn durationInFrames={15}>
                  <Caption caption={caption} settings={mergedSettings} />
                </ScaleIn>
              );

            case "fade-in":
              return (
                <FadeIn durationInFrames={15}>
                  <Caption caption={caption} settings={mergedSettings} />
                </FadeIn>
              );

            case "word-by-word":
              return (
                <WordByWordCaption
                  caption={caption}
                  settings={mergedSettings}
                />
              );

            case "typewriter":
              return (
                <TypewriterCaption
                  caption={caption}
                  settings={mergedSettings}
                />
              );

            case "none":
            default:
              return <Caption caption={caption} settings={mergedSettings} />;
          }
        };

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
              {renderAnimatedCaption()}
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

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/70d951d1-f59d-4979-ab77-07fedbe75bc1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H2",
      location: "CaptionSequence.tsx:word-by-word",
      message: "WordByWord caption coords",
      data: {
        id: caption.id,
        rawPosition: caption.position,
        resolvedCoords: coords,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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

/**
 * Typewriter caption wrapper with freeform positioning
 */
const TypewriterCaption: React.FC<{
  caption: CaptionType;
  settings: CaptionSettings;
}> = ({ caption, settings }) => {
  const coords = getPositionCoords(caption.position);

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/70d951d1-f59d-4979-ab77-07fedbe75bc1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H3",
      location: "CaptionSequence.tsx:typewriter",
      message: "Typewriter caption coords",
      data: {
        id: caption.id,
        rawPosition: caption.position,
        resolvedCoords: coords,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
        className={`text-center ${getStyleClasses()}`}
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.fontWeight,
          color: settings.color,
          lineHeight: settings.lineHeight,
        }}
      >
        <Typewriter
          text={caption.text}
          emphasis={caption.emphasis}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default CaptionSequence;
