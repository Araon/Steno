import React from "react";
import { AbsoluteFill, Video, staticFile } from "remotion";
import type { Captions } from "@steno/contracts";
import { DEFAULT_CAPTION_SETTINGS } from "@steno/contracts";
import { CaptionSequence } from "./components";

export interface StenoCompositionProps {
  /** Captions data */
  captions: Captions;
  /** Video source URL or path */
  videoSrc?: string;
  /** Background color when no video */
  backgroundColor?: string;
}

/**
 * Main Steno composition - renders video with caption overlay.
 */
export const StenoComposition: React.FC<StenoCompositionProps> = ({
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

      {/* Semi-transparent overlay for better caption readability */}
      {videoSrc && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)",
          }}
        />
      )}

      {/* Captions layer */}
      <AbsoluteFill>
        <CaptionSequence
          captions={captions.captions}
          settings={settings}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default StenoComposition;
