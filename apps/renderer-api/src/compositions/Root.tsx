import { Composition } from "remotion";
import { StenoComposition } from "./Composition";
import type { Captions } from "@steno/contracts";
import "./styles.css";

// Default captions for preview
const defaultCaptions: Captions = {
  version: "1.0",
  captions: [
    {
      id: "caption_0",
      text: "Hello world",
      start: 0,
      end: 1.5,
      words: [
        { text: "Hello", start: 0, end: 0.6, fontSizeMultiplier: 1.0 },
        { text: "world", start: 0.7, end: 1.5, fontSizeMultiplier: 1.2 },
      ],
      emphasis: ["world"],
      style: "bold",
      animation: "word-by-word",
      position: { x: 50, y: 50 },
      lineCount: 1,
    },
    {
      id: "caption_1",
      text: "This is Steno",
      start: 1.6,
      end: 3.0,
      words: [
        { text: "This", start: 1.6, end: 1.9 },
        { text: "is", start: 2.0, end: 2.2 },
        { text: "Steno", start: 2.3, end: 3.0, fontSizeMultiplier: 1.15 },
      ],
      emphasis: ["Steno"],
      style: "normal",
      animation: "word-by-word",
      position: { x: 50, y: 50 },
      lineCount: 1,
    },
    {
      id: "caption_2",
      text: "Lyric-style captions",
      start: 3.1,
      end: 5.0,
      words: [
        { text: "Lyric-style", start: 3.1, end: 3.8, fontSizeMultiplier: 1.1 },
        { text: "captions", start: 3.9, end: 5.0, fontSizeMultiplier: 1.2 },
      ],
      emphasis: ["captions"],
      style: "highlight",
      animation: "word-by-word",
      position: { x: 50, y: 50 },
      lineCount: 1,
    },
  ],
  settings: {
    fontFamily: "Inter",
    fontSize: 48,
    fontWeight: 700,
    color: "#FFFFFF",
    backgroundColor: "transparent",
    emphasisScale: 1.2,
    maxCharsPerLine: 30,
    lineHeight: 1.3,
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 9:16 Portrait (Reels/TikTok) */}
      <Composition
        id="StenoPortrait"
        component={StenoComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          captions: defaultCaptions,
          videoSrc: undefined,
          backgroundColor: "#000000",
        }}
      />

      {/* 16:9 Landscape (YouTube) */}
      <Composition
        id="StenoLandscape"
        component={StenoComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          captions: defaultCaptions,
          videoSrc: undefined,
          backgroundColor: "#000000",
        }}
      />
    </>
  );
};
