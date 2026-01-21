import { useMemo } from "react";
import { Player } from "@remotion/player";
import { Monitor, Smartphone, Square } from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";
import { PreviewComposition, type PreviewCompositionProps } from "./PreviewComposition";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const { captions, videoUrl, aspectRatio, setAspectRatio } = useStenoStore();

  const { width, height } = ASPECT_RATIOS[aspectRatio];

  // Calculate duration from captions
  const durationInSeconds = useMemo(() => {
    if (!captions || captions.captions.length === 0) return 5;
    const lastCaption = captions.captions[captions.captions.length - 1];
    return Math.ceil(lastCaption.end) + 1;
  }, [captions]);

  const fps = 30;
  const durationInFrames = durationInSeconds * fps;

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
      </div>
    </div>
  );
};

export default Preview;
