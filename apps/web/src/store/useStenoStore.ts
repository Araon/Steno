import { create } from "zustand";
import type { Transcript, Captions, Caption, RenderStatus } from "@steno/contracts";

export type ProcessingStep = "idle" | "uploading" | "transcribing" | "generating" | "ready" | "rendering" | "error";

interface StenoState {
  // Video
  videoFile: File | null;
  videoUrl: string | null;
  videoId: string | null;
  videoDuration: number;

  // Data
  transcript: Transcript | null;
  captions: Captions | null;

  // UI State
  processingStep: ProcessingStep;
  processingProgress: number;
  errorMessage: string | null;

  // Render state
  renderStatus: RenderStatus | null;
  renderProgress: number;
  renderedVideoUrl: string | null;

  // Settings
  aspectRatio: "16:9" | "9:16";

  // Selection
  selectedCaptionId: string | null;

  // Actions
  setVideoFile: (file: File | null) => void;
  setVideoId: (videoId: string | null) => void;
  setVideoDuration: (duration: number) => void;
  setTranscript: (transcript: Transcript | null) => void;
  setCaptions: (captions: Captions | null) => void;
  setProcessingStep: (step: ProcessingStep) => void;
  setProcessingProgress: (progress: number) => void;
  setErrorMessage: (message: string | null) => void;
  setAspectRatio: (ratio: "16:9" | "9:16") => void;
  setSelectedCaptionId: (id: string | null) => void;

  // Render actions
  setRenderStatus: (status: RenderStatus | null) => void;
  setRenderProgress: (progress: number) => void;
  setRenderedVideoUrl: (url: string | null) => void;

  // Caption editing
  updateCaption: (id: string, updates: Partial<Caption>) => void;
  updateAllCaptions: (updates: Partial<Caption>) => void;
  deleteCaption: (id: string) => void;
  addCaption: (caption: Caption) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  videoFile: null,
  videoUrl: null,
  videoId: null,
  videoDuration: 0,
  transcript: null,
  captions: null,
  processingStep: "idle" as ProcessingStep,
  processingProgress: 0,
  errorMessage: null,
  renderStatus: null as RenderStatus | null,
  renderProgress: 0,
  renderedVideoUrl: null,
  aspectRatio: "9:16" as const,
  selectedCaptionId: null as string | null,
};

export const useStenoStore = create<StenoState>((set, get) => ({
  ...initialState,

  setVideoFile: (file) => {
    // Revoke previous URL if exists
    const prevUrl = get().videoUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }

    set({
      videoFile: file,
      videoUrl: file ? URL.createObjectURL(file) : null,
      // Reset downstream data when new video is uploaded
      videoId: null,
      videoDuration: 0,
      transcript: null,
      captions: null,
      processingStep: file ? "idle" : "idle",
      errorMessage: null,
      renderStatus: null,
      renderProgress: 0,
      renderedVideoUrl: null,
    });
  },

  setVideoId: (videoId) => set({ videoId }),

  setVideoDuration: (duration) => set({ videoDuration: duration }),

  setTranscript: (transcript) => set({ transcript }),

  setCaptions: (captions) => set({ captions }),

  setProcessingStep: (step) => set({ processingStep: step }),

  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  setErrorMessage: (message) =>
    set({
      errorMessage: message,
      processingStep: message ? "error" : get().processingStep,
    }),

  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

  setSelectedCaptionId: (id) => set({ selectedCaptionId: id }),

  setRenderStatus: (status) => set({ renderStatus: status }),

  setRenderProgress: (progress) => set({ renderProgress: progress }),

  setRenderedVideoUrl: (url) => set({ renderedVideoUrl: url }),

  updateCaption: (id, updates) => {
    const captions = get().captions;
    if (!captions) return;

    const updatedCaptions = captions.captions.map((cap) =>
      cap.id === id ? { ...cap, ...updates } : cap
    );

    set({
      captions: {
        ...captions,
        captions: updatedCaptions,
      },
    });
  },

  updateAllCaptions: (updates) => {
    const captions = get().captions;
    if (!captions) return;

    const updatedCaptions = captions.captions.map((cap) => ({
      ...cap,
      ...updates,
    }));

    set({
      captions: {
        ...captions,
        captions: updatedCaptions,
      },
    });
  },

  deleteCaption: (id) => {
    const captions = get().captions;
    if (!captions) return;

    set({
      captions: {
        ...captions,
        captions: captions.captions.filter((cap) => cap.id !== id),
      },
    });
  },

  addCaption: (caption) => {
    const captions = get().captions;
    if (!captions) return;

    // Insert in chronological order
    const newCaptions = [...captions.captions, caption].sort(
      (a, b) => a.start - b.start
    );

    set({
      captions: {
        ...captions,
        captions: newCaptions,
      },
    });
  },

  reset: () => {
    const prevUrl = get().videoUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    set(initialState);
  },
}));
