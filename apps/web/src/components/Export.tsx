import React, { useState, useCallback } from "react";
import {
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Video,
  FileJson,
} from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";
import { renderVideo, downloadRenderedVideo } from "../api/client";
import type { AspectRatio } from "@steno/contracts";

type ExportStatus = "idle" | "rendering" | "success" | "error";

export const Export: React.FC = () => {
  const {
    captions,
    videoId,
    aspectRatio,
    renderProgress,
    setRenderProgress,
    setRenderStatus,
    setRenderedVideoUrl,
  } = useStenoStore();

  const [status, setStatus] = useState<ExportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  const handleRenderVideo = useCallback(async () => {
    if (!captions || !videoId) return;

    setStatus("rendering");
    setRenderProgress(0);
    setErrorMessage(null);
    setRenderedUrl(null);

    try {
      setRenderStatus("rendering");

      const outputUrl = await renderVideo(
        videoId,
        captions,
        {
          aspectRatio: aspectRatio as AspectRatio,
          quality: 80,
        },
        (progress, renderStatus) => {
          setRenderProgress(progress);
          setRenderStatus(renderStatus);
        }
      );

      setRenderedUrl(outputUrl);
      setRenderedVideoUrl(outputUrl);
      setRenderStatus("complete");
      setStatus("success");
    } catch (error) {
      console.error("Render failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Render failed"
      );
      setRenderStatus("error");
      setStatus("error");
    }
  }, [
    captions,
    videoId,
    aspectRatio,
    setRenderProgress,
    setRenderStatus,
    setRenderedVideoUrl,
  ]);

  const handleDownloadVideo = useCallback(async () => {
    if (!renderedUrl) return;

    const filename = `steno-video-${aspectRatio.replace(":", "x")}-${Date.now()}.mp4`;
    await downloadRenderedVideo(renderedUrl, filename);
  }, [renderedUrl, aspectRatio]);

  const handleExportJson = useCallback(() => {
    if (!captions) return;

    const exportData = {
      captions,
      aspectRatio,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `steno-captions-${aspectRatio.replace(":", "x")}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [captions, aspectRatio]);

  const canRender =
    captions &&
    captions.captions.length > 0 &&
    videoId &&
    status !== "rendering";

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Export</h3>

      {/* Status messages */}
      {status === "success" && renderedUrl && (
        <div className="flex flex-col gap-3 p-4 bg-green-500/20 text-green-400 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            <span>Video rendered successfully!</span>
          </div>
          <button
            onClick={handleDownloadVideo}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Download size={18} />
            Download Video
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 text-red-400 rounded-lg mb-4">
          <AlertCircle size={20} />
          <span>{errorMessage || "Render failed"}</span>
        </div>
      )}

      {/* Progress bar */}
      {status === "rendering" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Rendering video...</span>
            <span>{renderProgress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            This may take a few minutes depending on video length
          </p>
        </div>
      )}

      {/* Export info */}
      <div className="text-sm text-slate-400 mb-4">
        <p className="mt-2">
          Aspect ratio: <span className="text-slate-200">{aspectRatio}</span>
        </p>
        {captions && (
          <p>
            Captions:{" "}
            <span className="text-slate-200">
              {captions.captions.length} segments
            </span>
          </p>
        )}
        {!videoId && (
          <p className="text-amber-400 mt-2">
            Video not stored. Please reprocess the video to enable rendering.
          </p>
        )}
      </div>

      {/* Render Video button */}
      <button
        onClick={handleRenderVideo}
        disabled={!canRender}
        className={`
          w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium
          transition-colors mb-3
          ${
            canRender
              ? "bg-primary-500 hover:bg-primary-600 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        {status === "rendering" ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Rendering Video...
          </>
        ) : (
          <>
            <Video size={20} />
            Render Video
          </>
        )}
      </button>

      {/* Export JSON button (fallback) */}
      <button
        onClick={handleExportJson}
        disabled={!captions || captions.captions.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium
          text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
      >
        <FileJson size={18} />
        Export Captions JSON
      </button>

      {/* Help text */}
      {!videoId && (
        <div className="mt-4 p-4 bg-slate-900 rounded-lg">
          <p className="text-sm font-medium text-slate-300 mb-2">
            Alternative: Manual render
          </p>
          <p className="text-xs text-slate-400 mb-2">
            Export the JSON above and run:
          </p>
          <code className="text-xs text-slate-400 block bg-slate-950 p-2 rounded overflow-x-auto">
            cd apps/renderer && npx remotion render StenoPortrait
            --props=captions.json
          </code>
        </div>
      )}
    </div>
  );
};

export default Export;
