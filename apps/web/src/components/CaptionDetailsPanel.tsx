import React, { useState, useCallback, useMemo } from "react";
import { Edit2, Trash2, Sparkles, Type, Move, Copy } from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";
import type {
  Caption,
  CaptionAnimation,
  CaptionStyle,
  CaptionPosition,
  CaptionPositionPreset,
  CaptionPositionCoords,
} from "@steno/contracts";
import { isPositionCoords, presetToCoords } from "@steno/contracts";

const ANIMATION_OPTIONS: { value: CaptionAnimation; label: string }[] = [
  { value: "word-by-word", label: "Word by Word" },
];

const STYLE_OPTIONS: { value: CaptionStyle; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "highlight", label: "Highlight" },
];

const POSITION_PRESETS: { value: CaptionPositionPreset; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

function getPositionCoords(position: CaptionPosition): CaptionPositionCoords {
  if (isPositionCoords(position)) {
    return position;
  }
  return presetToCoords(position);
}

function matchesPreset(
  position: CaptionPosition,
  preset: CaptionPositionPreset
): boolean {
  const posCoords = getPositionCoords(position);
  const presetCoords = presetToCoords(preset);
  return (
    Math.abs(posCoords.x - presetCoords.x) < 5 &&
    Math.abs(posCoords.y - presetCoords.y) < 5
  );
}

interface CaptionDetailsPanelProps {
  caption: Caption | null;
  onClose: () => void;
}

export const CaptionDetailsPanel: React.FC<CaptionDetailsPanelProps> = ({
  caption,
  onClose,
}) => {
  const { updateCaption, updateAllCaptions, deleteCaption } = useStenoStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const positionCoords = useMemo(
    () => (caption ? getPositionCoords(caption.position) : { x: 50, y: 50 }),
    [caption]
  );

  const handlePresetChange = useCallback(
    (preset: CaptionPositionPreset) => {
      if (!caption) return;
      const coords = presetToCoords(preset);
      updateCaption(caption.id, { position: coords });
    },
    [caption, updateCaption]
  );

  const handleApplyToAll = (
    type: "style" | "animation" | "position",
    value: CaptionStyle | CaptionAnimation | CaptionPosition
  ) => {
    if (!caption) return;
    if (confirm(`Apply this ${type} to all captions?`)) {
      if (type === "position") {
        updateAllCaptions({ position: value as CaptionPosition });
      } else {
        updateAllCaptions({ [type]: value });
      }
    }
  };

  const handlePositionChange = useCallback(
    (axis: "x" | "y", value: number) => {
      if (!caption) return;
      const newPosition: CaptionPositionCoords = {
        ...positionCoords,
        [axis]: value,
      };
      updateCaption(caption.id, { position: newPosition });
    },
    [caption, positionCoords, updateCaption]
  );

  if (!caption) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center">
        <Sparkles size={48} className="mb-4 opacity-20" />
        <p>Select a caption to edit its properties</p>
      </div>
    );
  }

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
    <div className="bg-slate-800 rounded-lg p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold">Caption Details</h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200"
        >
          ×
        </button>
      </div>

      {/* Text */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Text</label>
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleTextSave}
            className="w-full bg-slate-700 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm flex-1">{caption.text}</p>
            <button
              onClick={() => {
                setEditText(caption.text);
                setIsEditing(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Time */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Time</label>
        <p className="text-sm">
          {formatTime(caption.start)} - {formatTime(caption.end)}
        </p>
      </div>

      {/* Animation */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles size={12} />
            Animation
          </label>
          <button
            onClick={() => handleApplyToAll("animation", caption.animation)}
            className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1"
            title="Apply to all captions"
          >
            <Copy size={10} />
            Apply all
          </button>
        </div>
        <select
          value={caption.animation}
          onChange={(e) =>
            updateCaption(caption.id, {
              animation: e.target.value as CaptionAnimation,
            })
          }
          className="w-full bg-slate-700 px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {ANIMATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Style */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <Type size={12} />
            Style
          </label>
          <button
            onClick={() => handleApplyToAll("style", caption.style)}
            className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1"
            title="Apply to all captions"
          >
            <Copy size={10} />
            Apply all
          </button>
        </div>
        <select
          value={caption.style}
          onChange={(e) =>
            updateCaption(caption.id, {
              style: e.target.value as CaptionStyle,
            })
          }
          className="w-full bg-slate-700 px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Emphasis */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Sparkles size={12} />
          Emphasis
        </label>
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
      </div>

      {/* Position */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <Move size={12} />
            Position
          </label>
          <button
            onClick={() => handleApplyToAll("position", caption.position)}
            className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1"
            title="Apply to all captions"
          >
            <Copy size={10} />
            Apply all
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {POSITION_PRESETS.map((preset) => {
              const isActive = matchesPreset(caption.position, preset.value);
              const label = preset.label
                .replace("Top ", "T ")
                .replace("Bottom ", "B ")
                .replace("Left", "L")
                .replace("Right", "R")
                .replace("Center", "C");
              return (
                <button
                  key={preset.value}
                  onClick={() => handlePresetChange(preset.value)}
                  className={`
                    px-1 py-1.5 rounded text-[10px] font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary-500/20 text-primary-400 border border-primary-500/50"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }
                  `}
                  title={preset.label}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="space-y-2 pt-2 bg-slate-900/30 p-2 rounded">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-4 font-mono">X</span>
              <input
                type="range"
                min="0"
                max="100"
                value={positionCoords.x}
                onChange={(e) =>
                  handlePositionChange("x", Number(e.target.value))
                }
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="text-xs text-slate-400 w-8 text-right font-mono">
                {Math.round(positionCoords.x)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-4 font-mono">Y</span>
              <input
                type="range"
                min="0"
                max="100"
                value={positionCoords.y}
                onChange={(e) =>
                  handlePositionChange("y", Number(e.target.value))
                }
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="text-xs text-slate-400 w-8 text-right font-mono">
                {Math.round(positionCoords.y)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => {
          deleteCaption(caption.id);
          onClose();
        }}
        className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
      >
        <Trash2 size={14} />
        Delete Caption
      </button>
    </div>
  );
};
