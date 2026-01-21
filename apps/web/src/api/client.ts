import axios from "axios";
import type {
  Transcript,
  Captions,
  CaptionAnimation,
  AspectRatio,
  RenderStatus,
} from "@steno/contracts";

const API_BASE_URL = "/api";
const RENDERER_API_URL = import.meta.env.VITE_RENDERER_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long transcription jobs
});

const renderApi = axios.create({
  baseURL: RENDERER_API_URL,
  timeout: 600000, // 10 minutes for render jobs
});

export interface TranscribeResponse {
  transcript: Transcript;
  processingTime: number;
}

export interface GenerateCaptionsResponse {
  captions: Captions;
  processingTime: number;
}

export interface ProcessResponse {
  transcript: Transcript;
  captions: Captions;
  processingTime: number;
  videoId: string;
  videoDuration: number;
}

export interface RenderResponse {
  jobId: string;
  status: RenderStatus;
}

export interface RenderProgressResponse {
  jobId: string;
  status: RenderStatus;
  progress: number;
  error?: string;
  outputUrl?: string;
}

/**
 * Upload a video and get word-level transcript
 */
export async function transcribeVideo(
  file: File,
  language?: string,
  onProgress?: (progress: number) => void
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (language) {
    formData.append("language", language);
  }

  const response = await api.post<TranscribeResponse>(
    "/transcribe",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    }
  );

  return response.data;
}

/**
 * Generate styled captions from a transcript
 */
export async function generateCaptions(
  transcript: Transcript,
  options?: {
    maxWordsPerCaption?: number;
    defaultAnimation?: CaptionAnimation;
  }
): Promise<GenerateCaptionsResponse> {
  const response = await api.post<GenerateCaptionsResponse>("/captions", {
    transcript,
    maxWordsPerCaption: options?.maxWordsPerCaption ?? 4,
    defaultAnimation: options?.defaultAnimation ?? "scale-in",
  });

  return response.data;
}

/**
 * End-to-end processing: video → transcript → captions
 */
export async function processVideo(
  file: File,
  options?: {
    language?: string;
    maxWordsPerCaption?: number;
    defaultAnimation?: CaptionAnimation;
  },
  onProgress?: (progress: number) => void
): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.language) {
    formData.append("language", options.language);
  }
  formData.append(
    "max_words_per_caption",
    String(options?.maxWordsPerCaption ?? 4)
  );
  formData.append(
    "default_animation",
    options?.defaultAnimation ?? "scale-in"
  );

  const response = await api.post<ProcessResponse>("/process", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        // Upload is roughly 20% of total progress
        const progress = Math.round(
          (progressEvent.loaded * 20) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });

  return response.data;
}

/**
 * Health check
 */
export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await api.get<{ status: string; version: string }>("/health");
  return response.data;
}

// ============================================
// Render API Functions
// ============================================

/**
 * Start a render job
 */
export async function startRender(
  videoId: string,
  captions: Captions,
  options?: {
    aspectRatio?: AspectRatio;
    quality?: number;
  }
): Promise<RenderResponse> {
  const response = await renderApi.post<RenderResponse>("/api/render", {
    videoId,
    captions,
    aspectRatio: options?.aspectRatio ?? "9:16",
    quality: options?.quality ?? 80,
  });

  return response.data;
}

/**
 * Get render job progress
 */
export async function getRenderProgress(jobId: string): Promise<RenderProgressResponse> {
  const response = await renderApi.get<RenderProgressResponse>(`/api/render/${jobId}`);
  return response.data;
}

/**
 * Cancel a render job
 */
export async function cancelRender(jobId: string): Promise<void> {
  await renderApi.delete(`/api/render/${jobId}`);
}

/**
 * Render a video with captions (polls for completion)
 */
export async function renderVideo(
  videoId: string,
  captions: Captions,
  options?: {
    aspectRatio?: AspectRatio;
    quality?: number;
  },
  onProgress?: (progress: number, status: RenderStatus) => void
): Promise<string> {
  // Start the render job
  const { jobId } = await startRender(videoId, captions, options);

  // Poll for progress
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const progress = await getRenderProgress(jobId);

        // Report progress
        if (onProgress) {
          onProgress(progress.progress, progress.status);
        }

        // Check if complete
        if (progress.status === "complete" && progress.outputUrl) {
          clearInterval(pollInterval);
          // Return full URL to the rendered video
          resolve(`${RENDERER_API_URL}${progress.outputUrl}`);
        }

        // Check if error
        if (progress.status === "error") {
          clearInterval(pollInterval);
          reject(new Error(progress.error || "Render failed"));
        }
      } catch (error) {
        clearInterval(pollInterval);
        reject(error);
      }
    }, 1000); // Poll every second
  });
}

/**
 * Download a rendered video
 */
export async function downloadRenderedVideo(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();

  // Create download link
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

// Export API instances for custom usage
export { api, renderApi };
