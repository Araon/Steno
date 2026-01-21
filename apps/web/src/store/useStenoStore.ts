import { create } from "zustand";
import type { Transcript, Captions, Caption } from "@steno/contracts";

export type ProcessingStep = "idle" | "uploading" | "transcribing" | "generating" | "ready" | "exporting" | "error";

interface StenoState {
  // Video
  videoFile: File | null;
  videoUrl: string | null;

  // Data
  transcript: Transcript | null;
  captions: Captions | null;

  // UI State
  processingStep: ProcessingStep;
  processingProgress: number;
  errorMessage: string | null;

  // Settings
  aspectRatio: "16:9" | "9:16" | "1:1";

  // Actions
  setVideoFile: (file: File | null) => void;
  setTranscript: (transcript: Transcript | null) => void;
  setCaptions: (captions: Captions | null) => void;
  setProcessingStep: (step: ProcessingStep) => void;
  setProcessingProgress: (progress: number) => void;
  setErrorMessage: (message: string | null) => void;
  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;

  // Caption editing
  updateCaption: (id: string, updates: Partial<Caption>) => void;
  deleteCaption: (id: string) => void;
  addCaption: (caption: Caption) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  videoFile: null,
  videoUrl: null,
  transcript: null,
  captions: null,
  processingStep: "idle" as ProcessingStep,
  processingProgress: 0,
  errorMessage: null,
  aspectRatio: "9:16" as const,
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
      transcript: null,
      captions: null,
      processingStep: file ? "idle" : "idle",
      errorMessage: null,
    });
  },

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
