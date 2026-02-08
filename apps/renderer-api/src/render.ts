import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { RenderJob } from "./types.js";
import { ASPECT_RATIO_DIMENSIONS } from "./types.js";

// Python API URL for serving videos
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Path to the renderer entry point
const RENDERER_ENTRY = path.resolve(
  process.cwd(),
  "src/compositions/index.ts"
);

// Bundled site URL (cached after first bundle)
let bundledSiteUrl: string | null = null;

// Control rebundling (default to true in debug to pick up code changes)
const REBUNDLE_ON_EACH_RENDER =
  process.env.REBUNDLE_ON_EACH_RENDER !== "0";

// Render concurrency: number of browser tabs rendering frames in parallel
// Default to 4, can be tuned via environment variable or set to "50%" for half of CPU cores
const RENDER_CONCURRENCY = process.env.RENDER_CONCURRENCY
  ? (process.env.RENDER_CONCURRENCY.includes("%")
      ? process.env.RENDER_CONCURRENCY
      : parseInt(process.env.RENDER_CONCURRENCY, 10))
  : 4;

/**
 * Bundle the Remotion project (cached for performance)
 */
async function getBundledSite(): Promise<string> {
  if (bundledSiteUrl) {
    return bundledSiteUrl;
  }

  console.log("Bundling Remotion project...");
  bundledSiteUrl = await bundle({
    entryPoint: RENDERER_ENTRY,
    // Enable caching for faster subsequent bundles
    webpackOverride: (config) => config,
  });
  console.log("Bundling complete:", bundledSiteUrl);

  return bundledSiteUrl;
}

/**
 * Get the composition ID based on aspect ratio
 */
function getCompositionId(aspectRatio: string): string {
  switch (aspectRatio) {
    case "9:16":
      return "StenoPortrait";
    case "16:9":
      return "StenoLandscape";
    default:
      return "StenoPortrait";
  }
}

export interface RenderOptions {
  job: RenderJob;
  videoPath: string;
  outputPath: string;
  onProgress: (progress: number) => void;
}

/**
 * Render a video with captions overlay
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
  const { job, videoPath, outputPath, onProgress } = options;

  // Force re-bundle to ensure latest renderer code is used
  if (REBUNDLE_ON_EACH_RENDER) {
    bundledSiteUrl = null;
  }

  // Get the bundled site
  const serveUrl = await getBundledSite();

  // Get dimensions for aspect ratio
  const dimensions = ASPECT_RATIO_DIMENSIONS[job.aspectRatio] || {
    width: 1080,
    height: 1920,
  };

  // Get composition ID
  const compositionId = getCompositionId(job.aspectRatio);

  // Calculate duration from captions
  const lastCaption = job.captions.captions[job.captions.captions.length - 1];
  const durationInSeconds = lastCaption ? Math.ceil(lastCaption.end) + 1 : 10;
  const fps = 30;
  const durationInFrames = durationInSeconds * fps;

  console.log(`Rendering ${compositionId} at ${dimensions.width}x${dimensions.height}`);
  console.log(`Duration: ${durationInSeconds}s (${durationInFrames} frames)`);

  // Convert file path to HTTP URL for browser access
  // The videoPath is a file system path, but Remotion needs an HTTP URL
  const videoUrl = `${PYTHON_API_URL}/api/videos/${job.videoId}`;

  // Select the composition
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: {
      captions: job.captions,
      videoSrc: videoUrl,
      backgroundColor: "#000000",
    },
  });

  // Override composition settings
  const compositionWithDuration = {
    ...composition,
    width: dimensions.width,
    height: dimensions.height,
    fps,
    durationInFrames,
  };

  // Render the video
  console.log(`Using concurrency: ${RENDER_CONCURRENCY}`);
  await renderMedia({
    composition: compositionWithDuration,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: {
      captions: job.captions,
      videoSrc: videoUrl,
      backgroundColor: "#000000",
    },
    onProgress: ({ progress }) => {
      onProgress(Math.round(progress * 100));
    },
    // Quality settings
    crf: Math.round(51 - (job.quality / 100) * 40), // CRF 11-51 (lower = better)
    // Performance: render multiple frames in parallel
    concurrency: RENDER_CONCURRENCY,
    // Performance: encode frames while still rendering (10-15% speedup)
    disallowParallelEncoding: false,
    // Reduce logging overhead
    logLevel: "warn",
  });

  return outputPath;
}

/**
 * Clear the bundled site cache (useful for development)
 */
export function clearBundleCache(): void {
  bundledSiteUrl = null;
}
