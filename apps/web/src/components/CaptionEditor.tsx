import React, { useMemo } from "react";
import { Preview } from "./Preview";
import { CaptionTimeline } from "./CaptionTimeline";
import { CaptionDetailsPanel } from "./CaptionDetailsPanel";
import { Export } from "./Export";
import { useStenoStore } from "../store/useStenoStore";

export const CaptionEditor: React.FC = () => {
  const { selectedCaptionId, captions, setSelectedCaptionId } = useStenoStore();
  
  const selectedCaption = useMemo(() => {
    if (!selectedCaptionId || !captions) return null;
    return captions.captions.find((c) => c.id === selectedCaptionId) || null;
  }, [selectedCaptionId, captions]);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
        {/* Top Section: Preview & Inspector */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Video Preview */}
            <div className="lg:col-span-8 flex flex-col min-h-0 bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex-1 flex items-center justify-center bg-black/50 rounded-lg overflow-hidden relative">
                    <Preview />
                </div>
                {/* Export Bar */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <Export />
                </div>
            </div>

            {/* Right: Inspector */}
            <div className="lg:col-span-4 flex flex-col min-h-0">
                <CaptionDetailsPanel 
                    caption={selectedCaption} 
                    onClose={() => setSelectedCaptionId(null)} 
                />
            </div>
        </div>

        {/* Bottom Section: Timeline */}
        <div className="h-48 lg:h-64 flex-shrink-0 bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
            <CaptionTimeline />
        </div>
    </div>
  );
};

export default CaptionEditor;
