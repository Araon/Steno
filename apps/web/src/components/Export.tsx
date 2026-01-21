import React, { useState } from "react";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";

type ExportStatus = "idle" | "preparing" | "exporting" | "success" | "error";

export const Export: React.FC = () => {
  const { captions, aspectRatio } = useStenoStore();
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    if (!captions) return;

    setStatus("preparing");
    setProgress(0);
    setErrorMessage(null);

    try {
      // For MVP, we'll export the captions JSON that can be used with the renderer CLI
      // In production, this would call a render API
      
      setStatus("exporting");
      
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Create downloadable JSON
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

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `steno-captions-${aspectRatio.replace(":", "x")}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("success");
    } catch (error) {
      console.error("Export failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Export failed");
      setStatus("error");
    }
  };

  const canExport = captions && captions.captions.length > 0 && status !== "exporting";

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Export</h3>

      {/* Status messages */}
      {status === "success" && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 text-green-400 rounded-lg mb-4">
          <CheckCircle size={20} />
          <span>
            Captions exported! Use the JSON with the Remotion renderer CLI.
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 text-red-400 rounded-lg mb-4">
          <AlertCircle size={20} />
          <span>{errorMessage || "Export failed"}</span>
        </div>
      )}

      {/* Progress bar */}
      {(status === "preparing" || status === "exporting") && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>
              {status === "preparing" ? "Preparing..." : "Exporting..."}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export info */}
      <div className="text-sm text-slate-400 mb-4">
        <p>
          This will export your captions as a JSON file that can be used with
          the Remotion renderer to create the final video.
        </p>
        <p className="mt-2">
          Aspect ratio: <span className="text-slate-200">{aspectRatio}</span>
        </p>
        {captions && (
          <p>
            Captions: <span className="text-slate-200">{captions.captions.length} segments</span>
          </p>
        )}
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={!canExport}
        className={`
          w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium
          transition-colors
          ${
            canExport
              ? "bg-primary-500 hover:bg-primary-600 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        {status === "preparing" || status === "exporting" ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {status === "preparing" ? "Preparing..." : "Exporting..."}
          </>
        ) : (
          <>
            <Download size={20} />
            Export Captions JSON
          </>
        )}
      </button>

      {/* Render instructions */}
      <div className="mt-4 p-4 bg-slate-900 rounded-lg">
        <p className="text-sm font-medium text-slate-300 mb-2">
          To render the final video:
        </p>
        <code className="text-xs text-slate-400 block bg-slate-950 p-2 rounded overflow-x-auto">
          cd apps/renderer && npx remotion render StenoPortrait --props=captions.json
        </code>
      </div>
    </div>
  );
};

export default Export;
