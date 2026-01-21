"""Pydantic models for API requests and responses.

These models mirror the TypeScript contracts in @steno/contracts.
"""

from enum import Enum

from pydantic import BaseModel, Field


class CaptionStyle(str, Enum):
    """Visual style for captions."""

    NORMAL = "normal"
    BOLD = "bold"
    ITALIC = "italic"
    HIGHLIGHT = "highlight"


class CaptionAnimation(str, Enum):
    """Animation type for captions."""

    NONE = "none"
    FADE_IN = "fade-in"
    SCALE_IN = "scale-in"
    WORD_BY_WORD = "word-by-word"
    TYPEWRITER = "typewriter"


class CaptionPositionPreset(str, Enum):
    """Position presets on screen."""

    TOP = "top"
    CENTER = "center"
    BOTTOM = "bottom"
    TOP_LEFT = "top-left"
    TOP_RIGHT = "top-right"
    BOTTOM_LEFT = "bottom-left"
    BOTTOM_RIGHT = "bottom-right"


class CaptionPositionCoords(BaseModel):
    """Freeform position with x/y coordinates (percentage-based, 0-100)."""

    x: float = Field(..., ge=0, le=100, description="X position as percentage")
    y: float = Field(..., ge=0, le=100, description="Y position as percentage")


class TranscriptWord(BaseModel):
    """A single word from speech-to-text with timing information."""

    text: str = Field(..., description="The transcribed word")
    start: float = Field(..., ge=0, description="Start time in seconds")
    end: float = Field(..., ge=0, description="End time in seconds")
    confidence: float | None = Field(
        None, ge=0, le=1, description="Confidence score (0-1)"
    )


class Transcript(BaseModel):
    """Complete transcript with word-level timestamps."""

    words: list[TranscriptWord] = Field(
        ..., description="Array of words with timing information"
    )
    text: str | None = Field(None, description="Full transcript text")
    duration: float = Field(..., ge=0, description="Total duration in seconds")
    language: str = Field(default="en", description="Detected or specified language")


class CaptionWord(BaseModel):
    """A word within a caption segment."""

    text: str = Field(..., description="The word text")
    start: float = Field(..., ge=0, description="Start time in seconds")
    end: float = Field(..., ge=0, description="End time in seconds")
    fontSizeMultiplier: float | None = Field(
        default=None, description="Font size multiplier for this word"
    )
    lineBreakBefore: bool | None = Field(
        default=None, description="Whether this word starts a new line"
    )


class Caption(BaseModel):
    """A single caption segment (lyric-style phrase)."""

    id: str = Field(..., description="Unique identifier")
    text: str = Field(..., description="Full text of the caption segment")
    start: float = Field(..., ge=0, description="Start time in seconds")
    end: float = Field(..., ge=0, description="End time in seconds")
    words: list[CaptionWord] = Field(..., description="Individual words with timing")
    emphasis: list[str] = Field(default_factory=list, description="Words to emphasize")
    style: CaptionStyle = Field(default=CaptionStyle.NORMAL, description="Visual style")
    animation: CaptionAnimation = Field(
        default=CaptionAnimation.SCALE_IN, description="Animation type"
    )
    position: CaptionPositionPreset | CaptionPositionCoords = Field(
        default_factory=lambda: CaptionPositionCoords(x=50, y=50),
        description="Position - preset or freeform coordinates"
    )
    maxCharsPerLine: int | None = Field(
        default=None, description="Maximum characters per line for wrapping"
    )
    lineCount: int | None = Field(
        default=None, description="Number of lines this caption spans"
    )


class CaptionSettings(BaseModel):
    """Global caption settings."""

    fontFamily: str = Field(default="Inter", description="Font family name")
    fontSize: int = Field(default=48, description="Base font size in pixels")
    fontWeight: int = Field(default=700, description="Font weight (100-900)")
    color: str = Field(default="#FFFFFF", description="Text color")
    backgroundColor: str = Field(default="transparent", description="Background color")
    emphasisScale: float = Field(
        default=1.2, description="Scale factor for emphasized words"
    )
    maxCharsPerLine: int = Field(
        default=30, description="Maximum characters per line for wrapping"
    )
    lineHeight: float = Field(default=1.3, description="Line height multiplier")


class Captions(BaseModel):
    """Complete captions document."""

    version: str = Field(default="1.0", description="Schema version")
    captions: list[Caption] = Field(..., description="Array of caption segments")
    settings: CaptionSettings | None = Field(
        default=None, description="Global settings"
    )


class TranscribeResponse(BaseModel):
    """Transcription response."""

    transcript: Transcript = Field(..., description="The transcript")
    processing_time: float = Field(
        ..., alias="processingTime", description="Processing time in milliseconds"
    )

    class Config:
        populate_by_name = True


class GenerateCaptionsRequest(BaseModel):
    """Caption generation request."""

    transcript: Transcript = Field(..., description="Input transcript")
    max_words_per_caption: int = Field(
        default=4, alias="maxWordsPerCaption", description="Maximum words per caption"
    )
    default_animation: CaptionAnimation = Field(
        default=CaptionAnimation.SCALE_IN,
        alias="defaultAnimation",
        description="Default animation style",
    )

    class Config:
        populate_by_name = True


class GenerateCaptionsResponse(BaseModel):
    """Caption generation response."""

    captions: Captions = Field(..., description="Generated captions")
    processing_time: float = Field(
        ..., alias="processingTime", description="Processing time in milliseconds"
    )

    class Config:
        populate_by_name = True


class ProcessResponse(BaseModel):
    """Combined process response (video to captions)."""

    transcript: Transcript = Field(..., description="The transcript")
    captions: Captions = Field(..., description="Generated captions")
    processing_time: float = Field(
        ..., alias="processingTime", description="Total processing time in milliseconds"
    )
    video_id: str = Field(
        ..., alias="videoId", description="Video ID for the stored video"
    )
    video_duration: float = Field(
        ..., alias="videoDuration", description="Video duration in seconds"
    )

    class Config:
        populate_by_name = True


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Service status")
    version: str = Field(default="0.1.0", description="API version")
    uptime: float = Field(default=0, description="Uptime in seconds")


# ============================================
# Render API Models
# ============================================


class RenderRequest(BaseModel):
    """Render request."""

    video_id: str = Field(..., alias="videoId", description="Video ID")
    captions: Captions = Field(..., description="Captions to overlay")
    aspect_ratio: str = Field(
        default="9:16", alias="aspectRatio", description="Target aspect ratio"
    )
    quality: int = Field(default=80, ge=0, le=100, description="Output quality")

    class Config:
        populate_by_name = True


class RenderProgress(BaseModel):
    """Render progress response."""

    job_id: str = Field(..., alias="jobId", description="Render job ID")
    status: str = Field(..., description="Current status")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    error: str | None = Field(default=None, description="Error message if failed")
    output_url: str | None = Field(
        default=None, alias="outputUrl", description="Output video URL when complete"
    )

    class Config:
        populate_by_name = True
