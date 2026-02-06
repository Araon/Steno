import React from "react";
import { Loader2, CheckCircle, AlertCircle, Upload, Mic, Sparkles } from "lucide-react";
import { useStenoStore, ProcessingStep } from "../store/useStenoStore";

const STEP_INFO: Record<ProcessingStep, { label: string; icon: React.ElementType }> = {
  idle: { label: "Ready", icon: CheckCircle },
  uploading: { label: "Uploading video...", icon: Upload },
  transcribing: { label: "Transcribing audio...", icon: Mic },
  generating: { label: "Generating captions...", icon: Sparkles },
  ready: { label: "Ready to edit", icon: CheckCircle },
  rendering: { label: "Rendering...", icon: Upload },
  error: { label: "Error", icon: AlertCircle },
};

export const ProcessingStatus: React.FC = () => {
  const { processingStep, processingProgress, errorMessage } = useStenoStore();

  if (processingStep === "idle" || processingStep === "ready") {
    return null;
  }

  const { label, icon: Icon } = STEP_INFO[processingStep];
  const isError = processingStep === "error";
  const isProcessing = ["uploading", "transcribing", "generating", "rendering"].includes(
    processingStep
  );

  return (
    <div
      className={`
        fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        ${isError ? "bg-red-500/20 border border-red-500/50" : "bg-slate-800 border border-slate-700"}
      `}
    >
      {isProcessing ? (
        <Loader2 size={20} className="animate-spin text-primary-400" />
      ) : (
        <Icon
          size={20}
          className={isError ? "text-red-400" : "text-green-400"}
        />
      )}

      <div>
        <p className={`text-sm font-medium ${isError ? "text-red-400" : "text-slate-200"}`}>
          {isError && errorMessage ? errorMessage : label}
        </p>
        {isProcessing && processingProgress > 0 && (
          <div className="mt-1 w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus;
