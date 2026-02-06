import logging
import os
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .audio import AudioProcessor
from .captions import CaptionSegmenter, CaptionStylizer
from .models import (
    CaptionAnimation,
    GenerateCaptionsRequest,
    GenerateCaptionsResponse,
    HealthResponse,
    ProcessResponse,
    TranscribeResponse,
)
from .transcription import WhisperService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Storage configuration
STORAGE_DIR = Path(os.getenv("STENO_STORAGE_DIR", "./storage"))
VIDEO_STORAGE_DIR = STORAGE_DIR / "videos"
RENDER_OUTPUT_DIR = STORAGE_DIR / "renders"

audio_processor: AudioProcessor | None = None
whisper_service: WhisperService | None = None
caption_segmenter: CaptionSegmenter | None = None
caption_stylizer: CaptionStylizer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global audio_processor, whisper_service, caption_segmenter, caption_stylizer

    logger.info("Initializing Steno API services...")

    # Create storage directories
    VIDEO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    RENDER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Storage directories created: {STORAGE_DIR}")

    # Initialize services
    audio_processor = AudioProcessor()
    whisper_service = WhisperService(model_name=os.getenv("WHISPER_MODEL", "small"))
    caption_segmenter = CaptionSegmenter()
    caption_stylizer = CaptionStylizer()

    logger.info("Steno API services initialized")

    yield

    logger.info("Shutting down Steno API services...")


# Create FastAPI app
app = FastAPI(
    title="Steno API",
    description="Speech-to-text and caption intelligence for video captioning",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="0.1.0")


@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_video(
    file: UploadFile = File(..., description="Video file to transcribe"),
    language: str | None = Form(None, description="Language hint (e.g., 'en')"),
):
    """Transcribe a video file and return word-level timestamps.

    Accepts video file upload, extracts audio, and runs Whisper transcription.
    """
    if not audio_processor or not whisper_service:
        raise HTTPException(status_code=503, detail="Services not initialized")

    start_time = time.time()

    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    allowed_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_extensions}",
        )

    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_video:
        content = await file.read()
        tmp_video.write(content)
        tmp_video_path = tmp_video.name

    audio_path = None
    try:
        # Extract audio
        logger.info(f"Processing uploaded file: {file.filename}")
        logger.info("Extracting audio from video")
        audio_path = audio_processor.extract_audio(tmp_video_path)

        # Transcribe
        transcript = whisper_service.transcribe(audio_path, language=language)

        processing_time = (time.time() - start_time) * 1000

        return TranscribeResponse(
            transcript=transcript,
            processingTime=processing_time,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        # Cleanup temp files
        if os.path.exists(tmp_video_path):
            os.unlink(tmp_video_path)
        if audio_path and os.path.exists(audio_path):
            os.unlink(audio_path)


@app.post("/api/captions", response_model=GenerateCaptionsResponse)
async def generate_captions(request: GenerateCaptionsRequest):
    """Generate styled captions from a transcript.

    Takes a transcript with word-level timestamps and produces
    segmented, styled captions ready for rendering.
    """
    if not caption_segmenter or not caption_stylizer:
        raise HTTPException(status_code=503, detail="Services not initialized")

    start_time = time.time()

    try:
        # Update segmenter settings
        caption_segmenter.max_words = request.max_words_per_caption

        # Segment transcript into caption phrases
        captions_list = caption_segmenter.segment(
            transcript=request.transcript,
            default_animation=request.default_animation,
        )

        # Apply styling
        captions = caption_stylizer.stylize(captions_list)

        processing_time = (time.time() - start_time) * 1000

        return GenerateCaptionsResponse(
            captions=captions,
            processingTime=processing_time,
        )

    except Exception as e:
        logger.error(f"Caption generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# ============================================
# Combined Process Endpoint
# ============================================


@app.post("/api/process", response_model=ProcessResponse)
async def process_video(
    file: UploadFile = File(..., description="Video file to process"),
    language: str | None = Form(None, description="Language hint"),
    max_words_per_caption: int = Form(4, description="Max words per caption"),
    default_animation: str = Form("scale-in", description="Default animation"),
):
    """End-to-end processing: video → transcript → captions.

    Combines transcription and caption generation in a single request.
    Stores the video for later rendering.
    """
    if not audio_processor or not whisper_service:
        raise HTTPException(status_code=503, detail="Services not initialized")
    if not caption_segmenter or not caption_stylizer:
        raise HTTPException(status_code=503, detail="Services not initialized")

    start_time = time.time()

    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    allowed_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_extensions}",
        )

    # Parse animation enum
    try:
        animation = CaptionAnimation(default_animation)
    except ValueError:
        animation = CaptionAnimation.SCALE_IN

    # Generate unique video ID and save to storage
    video_id = str(uuid.uuid4())
    video_path = VIDEO_STORAGE_DIR / f"{video_id}{ext}"

    # Save uploaded file to storage
    content = await file.read()
    with open(video_path, "wb") as f:
        f.write(content)

    audio_path = None
    try:
        # Extract audio
        logger.info(f"Processing uploaded file: {file.filename}")
        logger.info(f"Stored video with ID: {video_id}")
        audio_path = audio_processor.extract_audio(str(video_path))

        # Get video duration
        video_duration = audio_processor.get_duration(str(video_path))

        # Transcribe
        transcript = whisper_service.transcribe(audio_path, language=language)

        # Update segmenter settings
        caption_segmenter.max_words = max_words_per_caption

        # Segment into captions
        captions_list = caption_segmenter.segment(
            transcript=transcript,
            default_animation=animation,
        )

        # Apply styling
        captions = caption_stylizer.stylize(captions_list)

        processing_time = (time.time() - start_time) * 1000

        return ProcessResponse(
            transcript=transcript,
            captions=captions,
            processingTime=processing_time,
            videoId=video_id,
            videoDuration=video_duration,
        )

    except FileNotFoundError as e:
        # Clean up stored video on error
        if video_path.exists():
            video_path.unlink()
        raise HTTPException(status_code=404, detail=str(e)) from e
    except RuntimeError as e:
        # Clean up stored video on error
        if video_path.exists():
            video_path.unlink()
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        # Cleanup audio temp file (but keep the video!)
        if audio_path and os.path.exists(audio_path):
            os.unlink(audio_path)


# ============================================
# Video Storage Endpoints
# ============================================


@app.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    """Serve a stored video file.

    Args:
        video_id: The video ID returned from the process endpoint.
    """
    # Find the video file (could have different extensions)
    video_files = list(VIDEO_STORAGE_DIR.glob(f"{video_id}.*"))
    if not video_files:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = video_files[0]
    return FileResponse(
        path=video_path,
        media_type="video/mp4",
        filename=video_path.name,
    )


@app.delete("/api/videos/{video_id}")
async def delete_video(video_id: str):
    """Delete a stored video file.

    Args:
        video_id: The video ID to delete.
    """
    video_files = list(VIDEO_STORAGE_DIR.glob(f"{video_id}.*"))
    if not video_files:
        raise HTTPException(status_code=404, detail="Video not found")

    for video_file in video_files:
        video_file.unlink()

    logger.info(f"Deleted video: {video_id}")
    return {"status": "deleted", "videoId": video_id}


def get_video_path(video_id: str) -> Path | None:
    """Get the path to a stored video by ID.

    Args:
        video_id: The video ID.

    Returns:
        Path to the video file, or None if not found.
    """
    video_files = list(VIDEO_STORAGE_DIR.glob(f"{video_id}.*"))
    return video_files[0] if video_files else None


# ============================================
# Development Server
# ============================================


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
