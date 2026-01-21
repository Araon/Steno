import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Type,
  Clock,
} from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";
import type { Caption, CaptionAnimation, CaptionStyle } from "@steno/contracts";

const ANIMATION_OPTIONS: { value: CaptionAnimation; label: string }[] = [
  { value: "scale-in", label: "Scale In" },
  { value: "fade-in", label: "Fade In" },
  { value: "word-by-word", label: "Word by Word" },
  { value: "typewriter", label: "Typewriter" },
  { value: "none", label: "None" },
];

const STYLE_OPTIONS: { value: CaptionStyle; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "highlight", label: "Highlight" },
];

interface CaptionItemProps {
  caption: Caption;
  index: number;
}

const CaptionItem: React.FC<CaptionItemProps> = ({ caption, index }) => {
  const { updateCaption, deleteCaption } = useStenoStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(caption.text);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, "0")}`;
  };

  const handleTextSave = () => {
    updateCaption(caption.id, { text: editText });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTextSave();
    } else if (e.key === "Escape") {
      setEditText(caption.text);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-xs font-mono text-slate-500 w-6">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleTextSave}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-slate-700 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          ) : (
            <p className="text-sm truncate">{caption.text}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={12} />
          <span>
            {formatTime(caption.start)} - {formatTime(caption.end)}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
        >
          <Edit2 size={14} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCaption(caption.id);
          }}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
        >
          <Trash2 size={14} />
        </button>

        {isExpanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-700 space-y-3">
          {/* Animation */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 w-24">
              <Sparkles size={12} />
              Animation
            </label>
            <select
              value={caption.animation}
              onChange={(e) =>
                updateCaption(caption.id, {
                  animation: e.target.value as CaptionAnimation,
                })
              }
              className="flex-1 bg-slate-700 px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ANIMATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 w-24">
              <Type size={12} />
              Style
            </label>
            <select
              value={caption.style}
              onChange={(e) =>
                updateCaption(caption.id, {
                  style: e.target.value as CaptionStyle,
                })
              }
              className="flex-1 bg-slate-700 px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Emphasis words */}
          <div className="flex items-start gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 w-24 pt-1.5">
              <Sparkles size={12} />
              Emphasis
            </label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5">
                {caption.words.map((word, idx) => {
                  const isEmphasized = caption.emphasis.some(
                    (e) =>
                      e.toLowerCase() === word.text.toLowerCase().replace(/[.,!?]/g, "")
                  );
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const cleanWord = word.text.replace(/[.,!?]/g, "");
                        if (isEmphasized) {
                          updateCaption(caption.id, {
                            emphasis: caption.emphasis.filter(
                              (e) => e.toLowerCase() !== cleanWord.toLowerCase()
                            ),
                          });
                        } else {
                          updateCaption(caption.id, {
                            emphasis: [...caption.emphasis, cleanWord],
                          });
                        }
                      }}
                      className={`
                        px-2 py-0.5 rounded text-xs transition-colors
                        ${
                          isEmphasized
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }
                      `}
                    >
                      {word.text}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Click words to toggle emphasis
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CaptionEditor: React.FC = () => {
  const { captions } = useStenoStore();

  if (!captions || captions.captions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Type size={48} className="mb-4 opacity-50" />
        <p>No captions yet</p>
        <p className="text-sm text-slate-500">
          Process a video to generate captions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Captions</h3>
        <span className="text-sm text-slate-400">
          {captions.captions.length} segments
        </span>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {captions.captions.map((caption, index) => (
          <CaptionItem key={caption.id} caption={caption} index={index} />
        ))}
      </div>
    </div>
  );
};

export default CaptionEditor;
