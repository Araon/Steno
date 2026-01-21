import React, { useCallback, useRef, useState } from "react";
import { Upload, Film, X } from "lucide-react";
import { useStenoStore } from "../store/useStenoStore";

export const VideoUpload: React.FC = () => {
  const { videoFile, videoUrl, setVideoFile } = useStenoStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (isValidVideoFile(file)) {
          setVideoFile(file);
        }
      }
    },
    [setVideoFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (isValidVideoFile(file)) {
          setVideoFile(file);
        }
      }
    },
    [setVideoFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isValidVideoFile = (file: File): boolean => {
    const validTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
    ];
    return validTypes.includes(file.type);
  };

  if (videoFile && videoUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-slate-800">
        <video
          src={videoUrl}
          className="w-full aspect-video object-contain bg-black"
          controls
        />
        <div className="absolute top-2 right-2">
          <button
            onClick={handleRemove}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            title="Remove video"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 bg-slate-800/90">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Film size={16} />
            <span className="truncate">{videoFile.name}</span>
            <span className="text-slate-500">
              ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed p-12
        flex flex-col items-center justify-center gap-4
        transition-all duration-200
        ${
          isDragging
            ? "border-primary-500 bg-primary-500/10"
            : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        className={`
        p-4 rounded-full
        ${isDragging ? "bg-primary-500/20" : "bg-slate-700"}
      `}
      >
        <Upload
          size={32}
          className={isDragging ? "text-primary-400" : "text-slate-400"}
        />
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-slate-200">
          {isDragging ? "Drop your video here" : "Upload a video"}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Drag and drop or click to browse
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Supports MP4, MOV, AVI, MKV, WebM
        </p>
      </div>
    </div>
  );
};

export default VideoUpload;
