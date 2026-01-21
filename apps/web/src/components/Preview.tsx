import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Monitor, Smartphone, Square } from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";
import { PreviewComposition, type PreviewCompositionProps } from "./PreviewComposition";
import { isPositionCoords, presetToCoords, type CaptionPosition } from "@steno/contracts";

const TypedPlayer = Player as React.ComponentType<{
  component: React.ComponentType<PreviewCompositionProps>;
  inputProps: PreviewCompositionProps;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  style?: React.CSSProperties;
  controls?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
}>;

const ASPECT_RATIOS = {
  "16:9": { width: 1920, height: 1080, icon: Monitor, label: "Landscape" },
  "9:16": { width: 1080, height: 1920, icon: Smartphone, label: "Portrait" },
  "1:1": { width: 1080, height: 1080, icon: Square, label: "Square" },
} as const;

export const Preview: React.FC = () => {
  const {
    captions,
    videoUrl,
    videoDuration,
    aspectRatio,
    setAspectRatio,
    selectedCaptionId,
    setSelectedCaptionId,
    updateCaption,
  } = useStenoStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { width, height } = ASPECT_RATIOS[aspectRatio];

  // Calculate duration from captions or video
  const durationInSeconds = useMemo(() => {
    if (videoDuration > 0) return videoDuration;
    if (!captions || captions.captions.length === 0) return 5;
    const lastCaption = captions.captions[captions.captions.length - 1];
    return Math.ceil(lastCaption.end) + 1;
  }, [captions, videoDuration]);

  const fps = 30;
  const durationInFrames = Math.ceil(durationInSeconds * fps);

  // Ensure we always have an active caption selected for positioning
  useEffect(() => {
    if (!captions || captions.captions.length === 0) return;
    if (!selectedCaptionId) {
      setSelectedCaptionId(captions.captions[0].id);
    }
  }, [captions, selectedCaptionId, setSelectedCaptionId]);

  const activeCaption = useMemo(() => {
    if (!captions || captions.captions.length === 0) return null;
    return (
      captions.captions.find((c) => c.id === selectedCaptionId) ||
      captions.captions[0]
    );
  }, [captions, selectedCaptionId]);

  const getCoords = useCallback((captionPosition: CaptionPosition) => {
    if (isPositionCoords(captionPosition)) return captionPosition;
    return presetToCoords(captionPosition);
  }, []);

  const activeCoords = useMemo(
    () => (activeCaption ? getCoords(activeCaption.position) : null),
    [activeCaption, getCoords]
  );

  const updatePositionFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !activeCaption) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.min(100, Math.max(0, x));
      const clampedY = Math.min(100, Math.max(0, y));

      updateCaption(activeCaption.id, { position: { x: clampedX, y: clampedY } });
    },
    [activeCaption, updateCaption]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      updatePositionFromEvent(e.clientX, e.clientY);
    },
    [isDragging, updatePositionFromEvent]
  );

  useEffect(() => {
    if (!isDragging) return;
    const stopDragging = () => setIsDragging(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [handlePointerMove, isDragging]);

  // Empty state
  if (!captions || captions.captions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-800 rounded-xl p-8">
        <Monitor size={64} className="text-slate-600 mb-4" />
        <p className="text-slate-400 text-center">
          Process a video to see the preview
        </p>
      </div>
    );
  }

  const inputProps = {
    captions: captions,
    videoSrc: videoUrl || undefined,
    backgroundColor: "#000000",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Aspect ratio selector */}
      <div className="flex items-center justify-center gap-2">
        {(Object.entries(ASPECT_RATIOS) as [keyof typeof ASPECT_RATIOS, typeof ASPECT_RATIOS["16:9"]][]).map(
          ([ratio, config]) => {
            const Icon = config.icon;
            const isActive = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-primary-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }
                `}
              >
                <Icon size={16} />
                <span className="text-sm">{config.label}</span>
              </button>
            );
          }
        )}
      </div>

      {/* Player */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black mx-auto"
        style={{
          maxWidth: "100%",
          aspectRatio: `${width} / ${height}`,
          maxHeight: aspectRatio === "9:16" ? "70vh" : "50vh",
        }}
      >
        <TypedPlayer
          component={PreviewComposition}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls
          loop
          autoPlay={false}
        />

        {activeCaption && activeCoords && (
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute"
              style={{
                left: `${activeCoords.x}%`,
                top: `${activeCoords.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                className="pointer-events-auto bg-primary-500 text-white text-xs px-3 py-1 rounded-full shadow-lg shadow-primary-500/30 hover:bg-primary-400 transition-colors"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCaptionId(activeCaption.id);
                  setIsDragging(true);
                  updatePositionFromEvent(e.clientX, e.clientY);
                }}
              >
                Drag caption
              </button>
              <div className="pointer-events-none mt-1 text-[11px] text-slate-100 text-center bg-black/70 px-3 py-1 rounded">
                {activeCaption.text}
              </div>
            </div>
          </div>
        )}
      </div>

      {activeCaption && (
        <p className="text-xs text-slate-400 text-center">
          Drag the handle on the preview to position the selected caption.
        </p>
      )}
    </div>
  );
};

export default Preview;
