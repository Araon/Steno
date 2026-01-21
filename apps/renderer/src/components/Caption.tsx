import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import type {
  Caption as CaptionType,
  CaptionSettings,
  CaptionWord,
  CaptionPosition,
  CaptionPositionCoords,
} from "@steno/contracts";
import {
  DEFAULT_CAPTION_SETTINGS,
  isPositionCoords,
  presetToCoords,
} from "@steno/contracts";

interface CaptionProps {
  caption: CaptionType;
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
 * Base caption component that renders text with emphasis styling.
 * Supports freeform x/y positioning and multi-line rendering.
 */
export const Caption: React.FC<CaptionProps> = ({ caption, settings }) => {
  const mergedSettings = { ...DEFAULT_CAPTION_SETTINGS, ...settings };
  const coords = getPositionCoords(caption.position);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const frame = useCurrentFrame();

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/70d951d1-f59d-4979-ab77-07fedbe75bc1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run2",
      hypothesisId: "H1",
      location: "Caption.tsx:coords",
      message: "Resolved caption coordinates",
      data: {
        id: caption.id,
        rawPosition: caption.position,
        resolvedCoords: coords,
        style: caption.style,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // #region agent log
  useLayoutEffect(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const parentRect = wrapperRef.current?.parentElement?.getBoundingClientRect();
    const parentStyles = wrapperRef.current?.parentElement
      ? getComputedStyle(wrapperRef.current.parentElement)
      : null;
    fetch(
      "http://127.0.0.1:7243/ingest/70d951d1-f59d-4979-ab77-07fedbe75bc1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "run2",
          hypothesisId: "H6",
          location: "Caption.tsx:layout",
          message: "Caption wrapper rect",
          data: {
            id: caption.id,
            resolvedCoords: coords,
            rect,
            parentRect,
            parentStyles: parentStyles
              ? {
                  position: parentStyles.position,
                  transform: parentStyles.transform,
                  width: parentStyles.width,
                  height: parentStyles.height,
                }
              : null,
            viewport: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
            },
            frame,
          },
          timestamp: Date.now(),
        }),
      }
    ).catch(() => {});
  }, [caption.id, coords, frame]);
  // #endregion

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

  // Check if a word should be emphasized
  const isEmphasized = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return caption.emphasis.some(
      (e) => e.toLowerCase().replace(/[.,!?]/g, "") === cleanWord
    );
  };

  // Render word with optional emphasis and font size multiplier
  const renderWord = (word: CaptionWord, index: number, lineLength: number) => {
    const emphasized = isEmphasized(word.text);
    const fontSizeMultiplier = word.fontSizeMultiplier || 1.0;
    const fontSize = mergedSettings.fontSize * fontSizeMultiplier;

    return (
      <React.Fragment key={index}>
        <span
          className="inline-block"
          style={{
            fontSize: `${fontSize}px`,
            transform: emphasized
              ? `scale(${mergedSettings.emphasisScale})`
              : "scale(1)",
            fontWeight: emphasized ? 900 : mergedSettings.fontWeight,
            color: emphasized ? "#FFD700" : mergedSettings.color,
            textShadow:
              "0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)",
            transition: "transform 0.1s ease",
          }}
        >
          {word.text}
        </span>
        {index < lineLength - 1 && (
          <span style={{ width: "0.35em", display: "inline-block" }}>&nbsp;</span>
        )}
      </React.Fragment>
    );
  };

  // Group words into lines based on lineBreakBefore
  const getLines = (): CaptionWord[][] => {
    const lines: CaptionWord[][] = [];
    let currentLine: CaptionWord[] = [];

    for (const word of caption.words) {
      if (word.lineBreakBefore && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
      currentLine.push(word);
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  };

  const lines = getLines();

  return (
    <div
      ref={wrapperRef}
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
          fontFamily: mergedSettings.fontFamily,
          fontSize: `${mergedSettings.fontSize}px`,
          fontWeight: mergedSettings.fontWeight,
          color: mergedSettings.color,
          lineHeight: mergedSettings.lineHeight,
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
        <div className="flex flex-col items-center">
          {lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="flex flex-wrap justify-center items-baseline"
            >
              {line.map((word, wordIndex) => renderWord(word, wordIndex, line.length))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Caption;
