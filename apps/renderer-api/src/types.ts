import type { Captions, AspectRatio } from "@steno/contracts";

export interface RenderJob {
  id: string;
  status: "pending" | "rendering" | "complete" | "error";
  progress: number;
  videoId: string;
  captions: Captions;
  aspectRatio: AspectRatio;
  quality: number;
  outputPath?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderRequest {
  videoId: string;
  captions: Captions;
  aspectRatio?: AspectRatio;
  quality?: number;
}

export interface RenderResponse {
  jobId: string;
  status: RenderJob["status"];
}

export interface RenderProgressResponse {
  jobId: string;
  status: RenderJob["status"];
  progress: number;
  error?: string;
  outputUrl?: string;
}

export const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};
