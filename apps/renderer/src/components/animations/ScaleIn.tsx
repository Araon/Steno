import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface ScaleInProps {
  children: React.ReactNode;
  /** Duration in frames for the animation */
  durationInFrames?: number;
}

/**
 * Scale-in animation - content scales from 0.8 to 1.0 with a spring effect.
 */
export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  durationInFrames = 15,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring-based scale animation
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
      mass: 0.5,
    },
  });

  // Also animate opacity for smoother appearance
  const opacity = interpolate(frame, [0, durationInFrames * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `scale(${interpolate(scale, [0, 1], [0.8, 1])})`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};

export default ScaleIn;
