import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import type { Caption as CaptionType, CaptionSettings } from "@steno/contracts";
import { DEFAULT_CAPTION_SETTINGS } from "@steno/contracts";
import { Caption } from "./Caption";
import { ScaleIn, FadeIn, WordByWord, Typewriter } from "./animations";

interface CaptionSequenceProps {
  captions: CaptionType[];
  settings?: Partial<CaptionSettings>;
}

/**
 * Maps captions array to Remotion sequences with appropriate animations.
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
            {renderAnimatedCaption()}
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * Word-by-word caption wrapper with positioning
 */
const WordByWordCaption: React.FC<{
  caption: CaptionType;
  settings: CaptionSettings;
}> = ({ caption, settings }) => {
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
      className={`flex flex-col justify-center ${getPositionClasses()} w-full h-full px-8`}
    >
      <div
        className={`text-center ${getStyleClasses()} relative`}
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.fontWeight,
          color: settings.color,
          lineHeight: 1.3,
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
 * Typewriter caption wrapper with positioning
 */
const TypewriterCaption: React.FC<{
  caption: CaptionType;
  settings: CaptionSettings;
}> = ({ caption, settings }) => {
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
      className={`flex flex-col justify-center ${getPositionClasses()} w-full h-full px-8`}
    >
      <div
        className={`text-center ${getStyleClasses()}`}
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.fontWeight,
          color: settings.color,
          lineHeight: 1.3,
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
