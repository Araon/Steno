import { useCallback } from "react";
import { Play, RefreshCw } from "lucide-react";
import {
  VideoUpload,
  CaptionEditor,
  Preview,
  Export,
  ProcessingStatus,
} from "./components";
import { useStenoStore } from "./store/useStenoStore";
import { processVideo } from "./api/client";

function App() {
  const {
    videoFile,
    captions,
    processingStep,
    setTranscript,
    setCaptions,
    setVideoId,
    setVideoDuration,
    setProcessingStep,
    setProcessingProgress,
    setErrorMessage,
    reset,
  } = useStenoStore();

  const handleProcess = useCallback(async () => {
    if (!videoFile) return;

    setProcessingStep("uploading");
    setProcessingProgress(0);
    setErrorMessage(null);

    try {
      // Call the API
      setProcessingStep("transcribing");
      
      const result = await processVideo(
        videoFile,
        {
          maxWordsPerCaption: 4,
          defaultAnimation: "scale-in",
        },
        (progress) => {
          if (progress < 20) {
            setProcessingStep("uploading");
          } else if (progress < 60) {
            setProcessingStep("transcribing");
          } else {
            setProcessingStep("generating");
          }
          setProcessingProgress(progress);
        }
      );

      setTranscript(result.transcript);
      setCaptions(result.captions);
      setVideoId(result.videoId);
      setVideoDuration(result.videoDuration);
      setProcessingStep("ready");
      setProcessingProgress(100);
    } catch (error) {
      console.error("Processing failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Processing failed. Is the API running?"
      );
      setProcessingStep("error");
    }
  }, [
    videoFile,
    setTranscript,
    setCaptions,
    setVideoId,
    setVideoDuration,
    setProcessingStep,
    setProcessingProgress,
    setErrorMessage,
  ]);

  const isProcessing = ["uploading", "transcribing", "generating"].includes(
    processingStep
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white">
              S
            </div>
            <h1 className="text-xl font-bold">Steno</h1>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              MVP
            </span>
          </div>

          <div className="flex items-center gap-2">
            {captions && (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!captions ? (
          /* Upload and Process Stage */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                Create Lyric-Style Captions
              </h2>
              <p className="text-slate-400">
                Upload a video and we'll generate animated captions automatically
              </p>
            </div>

            <VideoUpload />

            {videoFile && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className={`
                  w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg
                  transition-all duration-200
                  ${
                    isProcessing
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white shadow-lg shadow-primary-500/25"
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Generate Captions
                  </>
                )}
              </button>
            )}

            {processingStep === "error" && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">
                  Make sure the Python API is running at{" "}
                  <code className="bg-slate-800 px-1 rounded">
                    http://localhost:8000
                  </code>
                </p>
                <p className="text-red-400/70 text-xs mt-2">
                  Run: <code className="bg-slate-800 px-1 rounded">cd apps/api && uvicorn src.main:app --reload</code>
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Editor Stage */
          <div className="max-w-7xl mx-auto">
            <CaptionEditor />
          </div>
        )}
      </main>

      {/* Processing status toast */}
      <ProcessingStatus />
    </div>
  );
}

export default App;
