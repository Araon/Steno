import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Video,
} from "remotion";
import type { Captions, Caption, CaptionSettings } from "@steno/contracts";
import { DEFAULT_CAPTION_SETTINGS } from "@steno/contracts";

export interface PreviewCompositionProps {
  captions: Captions;
  videoSrc?: string;
  backgroundColor?: string;
}

/**
 * Simplified composition for web preview (mirrors renderer composition)
 */
export const PreviewComposition: React.FC<PreviewCompositionProps> = ({
  captions,
  videoSrc,
  backgroundColor = "#000000",
}) => {
  const settings = { ...DEFAULT_CAPTION_SETTINGS, ...captions.settings };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Video layer */}
      {videoSrc && (
        <AbsoluteFill>
          <Video
            src={videoSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Gradient overlay */}
      {videoSrc && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)",
          }}
        />
      )}

      {/* Captions */}
      <CaptionSequence captions={captions.captions} settings={settings} />
    </AbsoluteFill>
  );
};

const CaptionSequence: React.FC<{
  captions: Caption[];
  settings: CaptionSettings;
}> = ({ captions, settings }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      {captions.map((caption) => {
        const startFrame = Math.round(caption.start * fps);
        const endFrame = Math.round(caption.end * fps);
        const durationInFrames = endFrame - startFrame;

        return (
          <Sequence
            key={caption.id}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <AnimatedCaption caption={caption} settings={settings} />
          </Sequence>
        );
      })}
    </>
  );
};

const AnimatedCaption: React.FC<{
  caption: Caption;
  settings: CaptionSettings;
}> = ({ caption, settings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation based on caption.animation
  let scale = 1;
  let opacity = 1;
  let translateY = 0;

  switch (caption.animation) {
    case "scale-in": {
      const springValue = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 200, mass: 0.5 },
      });
      scale = interpolate(springValue, [0, 1], [0.8, 1]);
      opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
      break;
    }
    case "fade-in": {
      opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
      translateY = interpolate(frame, [0, 15], [20, 0], { extrapolateRight: "clamp" });
      break;
    }
    case "word-by-word":
    case "typewriter":
      // These need word-level rendering
      return (
        <WordByWordCaption caption={caption} settings={settings} />
      );
    default:
      break;
  }

  const getPositionClasses = () => {
    switch (caption.position) {
      case "top":
        return "items-start pt-20";
      case "bottom":
        return "items-end pb-20";
      default:
        return "items-center";
    }
  };

  const isEmphasized = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return caption.emphasis.some(
      (e) => e.toLowerCase().replace(/[.,!?]/g, "") === cleanWord
    );
  };

  return (
    <div
      className={`flex flex-col justify-center ${getPositionClasses()} w-full h-full px-8`}
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div
        className="text-center"
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.fontWeight,
          lineHeight: 1.3,
        }}
      >
        <div className="flex flex-wrap justify-center items-baseline">
          {caption.words.map((word, index) => (
            <span
              key={index}
              className="inline-block mx-1"
              style={{
                transform: isEmphasized(word.text)
                  ? `scale(${settings.emphasisScale})`
                  : "scale(1)",
                fontWeight: isEmphasized(word.text) ? 900 : settings.fontWeight,
                color: isEmphasized(word.text) ? "#FFD700" : settings.color,
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
              }}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const WordByWordCaption: React.FC<{
  caption: Caption;
  settings: CaptionSettings;
}> = ({ caption, settings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const getPositionClasses = () => {
    switch (caption.position) {
      case "top":
        return "items-start pt-20";
      case "bottom":
        return "items-end pb-20";
      default:
        return "items-center";
    }
  };

  const isEmphasized = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return caption.emphasis.some(
      (e) => e.toLowerCase().replace(/[.,!?]/g, "") === cleanWord
    );
  };

  return (
    <div
      className={`flex flex-col justify-center ${getPositionClasses()} w-full h-full px-8`}
    >
      <div
        className="text-center"
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.fontWeight,
          lineHeight: 1.3,
        }}
      >
        <div className="flex flex-wrap justify-center items-baseline">
          {caption.words.map((word, index) => {
            const wordStartFrame = Math.round((word.start - caption.start) * fps);
            const localFrame = frame - wordStartFrame;
            const isVisible = localFrame >= 0;

            const wordSpring = isVisible
              ? spring({
                  frame: localFrame,
                  fps,
                  config: { damping: 15, stiffness: 200, mass: 0.4 },
                })
              : 0;

            const wordOpacity = interpolate(wordSpring, [0, 1], [0, 1]);
            const wordScale = interpolate(wordSpring, [0, 1], [0.5, 1]);
            const wordTranslateY = interpolate(wordSpring, [0, 1], [20, 0]);

            const emphasized = isEmphasized(word.text);

            return (
              <span
                key={index}
                className="inline-block mx-1"
                style={{
                  opacity: wordOpacity,
                  transform: `scale(${wordScale * (emphasized ? settings.emphasisScale : 1)}) translateY(${wordTranslateY}px)`,
                  fontWeight: emphasized ? 900 : settings.fontWeight,
                  color: emphasized ? "#FFD700" : settings.color,
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PreviewComposition;
