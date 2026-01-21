import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface FadeInProps {
  children: React.ReactNode;
  /** Duration in frames for the animation */
  durationInFrames?: number;
}

/**
 * Fade-in animation - content fades from 0 to 1 opacity.
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  durationInFrames = 15,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slight upward movement for more polish
  const translateY = interpolate(frame, [0, durationInFrames], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
