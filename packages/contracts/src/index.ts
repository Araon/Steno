// Types
export type {
  // Transcript
  TranscriptWord,
  Transcript,
  // Captions
  CaptionStyle,
  CaptionAnimation,
  CaptionPosition,
  CaptionWord,
  Caption,
  CaptionSettings,
  Captions,
  // Video
  VideoMetadata,
  AspectRatio,
  RenderConfig,
  // API
  TranscribeRequest,
  TranscribeResponse,
  GenerateCaptionsRequest,
  GenerateCaptionsResponse,
  ProcessRequest,
  ProcessResponse,
} from './types';

// Default values
export {
  DEFAULT_CAPTION_SETTINGS,
  DEFAULT_CAPTION,
} from './types';

// Re-export schemas as JSON paths for runtime validation
export const SCHEMAS = {
  transcript: '@steno/contracts/schemas/transcript.schema.json',
  captions: '@steno/contracts/schemas/captions.schema.json',
} as const;
