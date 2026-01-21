import React, { useState, useRef, useCallback, useMemo } from "react";
import { GripVertical, Type } from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";
import type { Caption } from "@steno/contracts";

interface TimelineCaptionBlockProps {
  caption: Caption;
  timelineWidth: number;
  totalDuration: number;
  onDragStart: (e: React.MouseEvent, captionId: string, dragType: 'move' | 'resize-left' | 'resize-right') => void;
  onSelect: (captionId: string) => void;
  selectedCaptionId: string | null;
  trackIndex: number;
}

const TimelineCaptionBlock: React.FC<TimelineCaptionBlockProps> = ({
  caption,
  timelineWidth,
  totalDuration,
  onDragStart,
  onSelect,
  selectedCaptionId,
  trackIndex,
}) => {
  const isSelected = selectedCaptionId === caption.id;
  const left = (caption.start / totalDuration) * timelineWidth;
  const width = Math.max(20, ((caption.end - caption.start) / totalDuration) * timelineWidth);

  return (
    <div
      className={`absolute h-10 rounded cursor-pointer transition-all overflow-hidden ${
        isSelected
          ? "bg-primary-500/90 border-2 border-primary-400 z-10"
          : "bg-slate-700/90 border border-slate-600 hover:bg-slate-600 z-0"
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${trackIndex * 44 + 32}px`, // 32px offset for header
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(caption.id);
      }}
    >
      {/* Resize handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary-400/50 z-20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e, caption.id, 'resize-left');
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary-400/50 z-20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e, caption.id, 'resize-right');
        }}
      />

      {/* Content */}
      <div className="flex items-center h-full px-2">
        <GripVertical
          size={12}
          className="text-slate-400 mr-1 flex-shrink-0"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(e, caption.id, 'move');
          }}
        />
        <span className="text-xs text-white/90 truncate flex-1 font-medium select-none">
          {caption.text}
        </span>
      </div>
    </div>
  );
};

export const CaptionTimeline: React.FC = () => {
  const {
    captions,
    updateCaption,
    selectedCaptionId,
    setSelectedCaptionId,
  } = useStenoStore();
  const [dragState, setDragState] = useState<{
    captionId: string;
    dragType: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    startTime: number;
    startDuration?: number;
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(1000);

  const totalDuration = useMemo(() => {
    if (!captions || captions.captions.length === 0) return 10;
    const lastCaption = captions.captions[captions.captions.length - 1];
    return Math.ceil(lastCaption.end) + 2;
  }, [captions]);

  const pixelsPerSecond = timelineWidth / totalDuration;

  // Calculate tracks to prevent overlapping
  const captionTracks = useMemo(() => {
    if (!captions) return new Map<string, number>();
    const tracks = new Map<string, number>();
    const trackEndTimes: number[] = [];

    // Sort captions by start time
    const sortedCaptions = [...captions.captions].sort((a, b) => a.start - b.start);

    sortedCaptions.forEach(caption => {
      let assignedTrack = -1;
      // Try to fit in existing tracks
      for (let i = 0; i < trackEndTimes.length; i++) {
        if (trackEndTimes[i] <= caption.start + 0.05) { // Small buffer
          assignedTrack = i;
          trackEndTimes[i] = caption.end;
          break;
        }
      }
      
      // Create new track if needed
      if (assignedTrack === -1) {
        assignedTrack = trackEndTimes.length;
        trackEndTimes.push(caption.end);
      }
      
      tracks.set(caption.id, assignedTrack);
    });

    return tracks;
  }, [captions]);

  const maxTrackIndex = Math.max(...Array.from(captionTracks.values()), 0);

  // Update timeline width on resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        setTimelineWidth(Math.max(1000, rect.width - 32));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      captionId: string,
      dragType: 'move' | 'resize-left' | 'resize-right'
    ) => {
      const caption = captions?.captions.find((c) => c.id === captionId);
      if (!caption || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startTime = caption.start;

      setDragState({
        captionId,
        dragType,
        startX,
        startTime,
        startDuration: caption.end - caption.start,
      });
      setSelectedCaptionId(captionId);
    },
    [captions, setSelectedCaptionId]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !timelineRef.current || !captions) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const deltaX = currentX - dragState.startX;
      const deltaTime = deltaX / pixelsPerSecond;

      const caption = captions.captions.find((c) => c.id === dragState.captionId);
      if (!caption) return;

      if (dragState.dragType === 'move') {
        const newStart = Math.max(0, dragState.startTime + deltaTime);
        const duration = caption.end - caption.start;
        const newEnd = newStart + duration;
        updateCaption(dragState.captionId, {
          start: newStart,
          end: newEnd,
        });
      } else if (dragState.dragType === 'resize-left') {
        const newStart = Math.max(0, dragState.startTime + deltaTime);
        const minDuration = 0.5;
        if (newStart < caption.end - minDuration) {
          updateCaption(dragState.captionId, { start: newStart });
        }
      } else if (dragState.dragType === 'resize-right') {
        const newEnd = Math.max(
          caption.start + 0.5,
          caption.end + deltaTime
        );
        updateCaption(dragState.captionId, { end: newEnd });
      }
    },
    [dragState, pixelsPerSecond, captions, updateCaption]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  React.useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  if (!captions || captions.captions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 bg-slate-800 rounded-lg">
        <Type size={32} className="mb-2 opacity-50" />
        <p>No captions yet</p>
      </div>
    );
  }

  // Generate time markers
  const timeMarkers = [];
  const markerInterval = totalDuration > 30 ? 10 : totalDuration > 10 ? 5 : 1;
  for (let i = 0; i <= totalDuration; i += markerInterval) {
    timeMarkers.push(i);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
           <h3 className="text-sm font-semibold text-slate-300">Timeline</h3>
           <span className="text-xs text-slate-500">
             {captions.captions.length} segments
           </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden flex flex-col" ref={timelineContainerRef}>
        {/* Timeline Ruler */}
        <div className="h-8 bg-slate-800 border-b border-slate-700 relative overflow-hidden flex-shrink-0" style={{ width: '100%' }}>
            <div className="absolute inset-0" style={{ width: `${timelineWidth}px` }}>
                {timeMarkers.map((time) => (
                    <div
                    key={time}
                    className="absolute top-0 bottom-0 border-l border-slate-600 pl-1"
                    style={{ left: `${(time / totalDuration) * timelineWidth}px` }}
                    >
                    <span className="text-[10px] text-slate-500 font-mono">
                        {Math.floor(time / 60)}:{(time % 60).toFixed(0).padStart(2, '0')}
                    </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar">
            <div 
                ref={timelineRef}
                className="relative"
                style={{ 
                    minHeight: `${(maxTrackIndex + 1) * 44 + 32}px`, // Adjusted height based on tracks
                    width: `${timelineWidth}px`
                }}
                onClick={() => setSelectedCaptionId(null)}
            >
                {/* Grid lines */}
                {timeMarkers.map((time) => (
                    <div
                        key={`grid-${time}`}
                        className="absolute top-0 bottom-0 border-l border-slate-800/50"
                        style={{ left: `${(time / totalDuration) * timelineWidth}px` }}
                    />
                ))}

                {/* Caption blocks */}
                {captions.captions.map((caption) => (
                    <TimelineCaptionBlock
                        key={caption.id}
                        caption={caption}
                        timelineWidth={timelineWidth}
                        totalDuration={totalDuration}
                        onDragStart={handleDragStart}
                        onSelect={setSelectedCaptionId}
                        selectedCaptionId={selectedCaptionId}
                        trackIndex={captionTracks.get(caption.id) || 0}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CaptionTimeline;
