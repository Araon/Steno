// ============================================
// Transcript Types
// ============================================

/**
 * A single word from speech-to-text with timing information
 */
export interface TranscriptWord {
  /** The transcribed word */
  text: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Complete transcript with word-level timestamps
 */
export interface Transcript {
  /** Array of words with timing information */
  words: TranscriptWord[];
  /** Full transcript text */
  text?: string;
  /** Total duration in seconds */
  duration: number;
  /** Detected or specified language code */
  language: string;
}

// ============================================
// Caption Types
// ============================================

/** Visual style for captions */
export type CaptionStyle = 'normal' | 'bold' | 'italic' | 'highlight';

/** Animation type for captions */
export type CaptionAnimation = 'none' | 'fade-in' | 'scale-in' | 'word-by-word' | 'typewriter';

/** Legacy vertical position presets */
export type CaptionPositionPreset = 'top' | 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Freeform position with x/y coordinates (percentage-based, 0-100)
 * Origin is top-left corner of the video
 */
export interface CaptionPositionCoords {
  /** X position as percentage (0 = left, 50 = center, 100 = right) */
  x: number;
  /** Y position as percentage (0 = top, 50 = center, 100 = bottom) */
  y: number;
}

/** Position can be a preset string or freeform coordinates */
export type CaptionPosition = CaptionPositionPreset | CaptionPositionCoords;

/**
 * A word within a caption segment
 */
export interface CaptionWord {
  /** The word text */
  text: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Font size multiplier for this word (1.0 = base size) */
  fontSizeMultiplier?: number;
  /** Whether this word starts a new line */
  lineBreakBefore?: boolean;
}

/**
 * A single caption segment (lyric-style phrase)
 */
export interface Caption {
  /** Unique identifier */
  id: string;
  /** Full text of the caption segment */
  text: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Individual words with timing */
  words: CaptionWord[];
  /** Words to emphasize */
  emphasis: string[];
  /** Visual style */
  style: CaptionStyle;
  /** Animation type */
  animation: CaptionAnimation;
  /** Position - can be a preset or freeform x/y coordinates */
  position: CaptionPosition;
  /** Maximum characters per line for wrapping (optional) */
  maxCharsPerLine?: number;
  /** Number of lines this caption spans */
  lineCount?: number;
}

/**
 * Global caption settings
 */
export interface CaptionSettings {
  /** Font family name */
  fontFamily: string;
  /** Base font size in pixels */
  fontSize: number;
  /** Font weight (100-900) */
  fontWeight: number;
  /** Text color (CSS color value) */
  color: string;
  /** Background color (CSS color value) */
  backgroundColor: string;
  /** Scale factor for emphasized words */
  emphasisScale: number;
  /** Maximum characters per line (for line wrapping) */
  maxCharsPerLine: number;
  /** Line height multiplier */
  lineHeight: number;
}

/**
 * Complete captions document
 */
export interface Captions {
  /** Schema version */
  version: '1.0';
  /** Array of caption segments */
  captions: Caption[];
  /** Global settings */
  settings?: Partial<CaptionSettings>;
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  fontFamily: 'Inter',
  fontSize: 48,
  fontWeight: 700,
  color: '#FFFFFF',
  backgroundColor: 'transparent',
  emphasisScale: 1.2,
  maxCharsPerLine: 30,
  lineHeight: 1.3,
};

export const DEFAULT_CAPTION: Omit<Caption, 'id' | 'text' | 'start' | 'end' | 'words'> = {
  emphasis: [],
  style: 'normal',
  animation: 'scale-in',
  position: { x: 50, y: 50 },  // Center by default
  lineCount: 1,
};

/**
 * Helper to check if position is a preset string
 */
export function isPositionPreset(position: CaptionPosition): position is CaptionPositionPreset {
  return typeof position === 'string';
}

/**
 * Helper to check if position is coordinates
 */
export function isPositionCoords(position: CaptionPosition): position is CaptionPositionCoords {
  return typeof position === 'object' && 'x' in position && 'y' in position;
}

/**
 * Convert preset position to coordinates
 */
export function presetToCoords(preset: CaptionPositionPreset): CaptionPositionCoords {
  switch (preset) {
    case 'top':
      return { x: 50, y: 15 };
    case 'top-left':
      return { x: 15, y: 15 };
    case 'top-right':
      return { x: 85, y: 15 };
    case 'center':
      return { x: 50, y: 50 };
    case 'bottom':
      return { x: 50, y: 85 };
    case 'bottom-left':
      return { x: 15, y: 85 };
    case 'bottom-right':
      return { x: 85, y: 85 };
    default:
      return { x: 50, y: 50 };
  }
}

// ============================================
// Utility Types
// ============================================

/**
 * Video metadata for rendering
 */
export interface VideoMetadata {
  /** Duration in seconds */
  duration: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Frame rate (fps) */
  fps: number;
}

/**
 * Aspect ratio presets
 */
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

/**
 * Render configuration
 */
export interface RenderConfig {
  /** Input video path */
  videoPath: string;
  /** Captions data */
  captions: Captions;
  /** Output path */
  outputPath: string;
  /** Target aspect ratio */
  aspectRatio: AspectRatio;
  /** Output quality (0-100) */
  quality?: number;
}

// ============================================
// API Types
// ============================================

/**
 * Transcription request
 */
export interface TranscribeRequest {
  /** Video file path or binary data */
  file: string | ArrayBuffer;
  /** Language hint */
  language?: string;
}

/**
 * Transcription response
 */
export interface TranscribeResponse {
  /** The transcript */
  transcript: Transcript;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Caption generation request
 */
export interface GenerateCaptionsRequest {
  /** Input transcript */
  transcript: Transcript;
  /** Maximum words per caption */
  maxWordsPerCaption?: number;
  /** Preferred animation style */
  defaultAnimation?: CaptionAnimation;
}

/**
 * Caption generation response
 */
export interface GenerateCaptionsResponse {
  /** Generated captions */
  captions: Captions;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Combined process request (video to captions)
 */
export interface ProcessRequest {
  /** Video file path or binary data */
  file: string | ArrayBuffer;
  /** Language hint */
  language?: string;
  /** Caption generation options */
  captionOptions?: {
    maxWordsPerCaption?: number;
    defaultAnimation?: CaptionAnimation;
  };
}

/**
 * Combined process response
 */
export interface ProcessResponse {
  /** The transcript */
  transcript: Transcript;
  /** Generated captions */
  captions: Captions;
  /** Total processing time in milliseconds */
  processingTime: number;
  /** Video ID for the stored video (used for rendering) */
  videoId: string;
  /** Video duration in seconds */
  videoDuration: number;
}

// ============================================
// Render API Types
// ============================================

/**
 * Render request
 */
export interface RenderRequest {
  /** Video ID returned from process endpoint */
  videoId: string;
  /** Captions to overlay */
  captions: Captions;
  /** Target aspect ratio */
  aspectRatio: AspectRatio;
  /** Output quality (0-100) */
  quality?: number;
}

/**
 * Render status
 */
export type RenderStatus = 'pending' | 'rendering' | 'complete' | 'error';

/**
 * Render progress response
 */
export interface RenderProgress {
  /** Render job ID */
  jobId: string;
  /** Current status */
  status: RenderStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if status is error */
  error?: string;
  /** Output video URL when complete */
  outputUrl?: string;
}

/**
 * Render response (initial)
 */
export interface RenderResponse {
  /** Render job ID */
  jobId: string;
  /** Initial status */
  status: RenderStatus;
}
