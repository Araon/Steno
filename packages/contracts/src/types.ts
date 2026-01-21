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

/** Vertical position on screen */
export type CaptionPosition = 'top' | 'center' | 'bottom';

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
  /** Vertical position */
  position: CaptionPosition;
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
};

export const DEFAULT_CAPTION: Omit<Caption, 'id' | 'text' | 'start' | 'end' | 'words'> = {
  emphasis: [],
  style: 'normal',
  animation: 'scale-in',
  position: 'center',
};

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
}
