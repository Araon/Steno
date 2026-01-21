import axios from "axios";
import type {
  Transcript,
  Captions,
  CaptionAnimation,
} from "@steno/contracts";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long transcription jobs
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

// Export API instance for custom usage
export { api };
