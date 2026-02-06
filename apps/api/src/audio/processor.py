from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Extract and process audio from video files."""

    # Target format for Whisper
    SAMPLE_RATE = 16000
    CHANNELS = 1  # Mono
    FORMAT = "wav"

    def __init__(self, temp_dir: str | None = None):
        """Initialize the audio processor.

        Args:
            temp_dir: Directory for temporary files. Uses system temp if None.
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self._ffmpeg_verified = False

    def _verify_ffmpeg(self) -> None:
        """Verify FFmpeg is installed and accessible.

        This is called lazily when FFmpeg is actually needed.
        """
        if self._ffmpeg_verified:
            return

        try:
            result = subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                text=True,
                check=True,
            )
            logger.debug(f"FFmpeg found: {result.stdout.split(chr(10))[0]}")
            self._ffmpeg_verified = True
        except FileNotFoundError as e:
            raise RuntimeError(
                "FFmpeg not found. Please install FFmpeg and ensure it's "
                "in PATH.\n"
                "Installation instructions:\n"
                "  Ubuntu/Debian: sudo apt-get install ffmpeg\n"
                "  macOS: brew install ffmpeg\n"
                "  Windows: Download from https://ffmpeg.org/download.html\n"
                "  Or use your system's package manager."
            ) from e
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"FFmpeg error: {e.stderr}") from e

    def extract_audio(
        self,
        video_path: str | Path,
        output_path: str | Path | None = None,
    ) -> Path:

        video_path = Path(video_path)
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Generate output path if not provided
        if output_path is None:
            output_path = Path(self.temp_dir) / f"{video_path.stem}_audio.wav"
        else:
            output_path = Path(output_path)

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"Extracting audio from {video_path} to {output_path}")

        # Verify FFmpeg is available before using it
        self._verify_ffmpeg()

        try:
            # FFmpeg command to extract and convert audio
            cmd = [
                "ffmpeg",
                "-i",
                str(video_path),
                "-vn",  # No video
                "-acodec",
                "pcm_s16le",  # PCM 16-bit
                "-ar",
                str(self.SAMPLE_RATE),  # Sample rate
                "-ac",
                str(self.CHANNELS),  # Mono
                "-y",  # Overwrite output
                str(output_path),
            ]

            subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
            )

            if not output_path.exists():
                raise RuntimeError("Audio extraction failed: output file not created")

            logger.info(f"Audio extracted successfully: {output_path}")
            return output_path

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr}")
            raise RuntimeError(f"Audio extraction failed: {e.stderr}") from e

    def get_audio_duration(self, audio_path: str | Path) -> float:
        """Get the duration of an audio file in seconds.

        Args:
            audio_path: Path to the audio file.

        Returns:
            Duration in seconds.
        """
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Verify FFmpeg is available before using it
        self._verify_ffmpeg()

        try:
            cmd = [
                "ffprobe",
                "-v",
                "quiet",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                str(audio_path),
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
            )

            duration = float(result.stdout.strip())
            return duration

        except (subprocess.CalledProcessError, ValueError) as e:
            logger.error(f"Error getting audio duration: {e}")
            raise RuntimeError(f"Failed to get audio duration: {e}") from e

    def get_duration(self, video_path: str | Path) -> float:
        """Get the duration of a video file in seconds.

        Args:
            video_path: Path to the video file.

        Returns:
            Duration in seconds.
        """
        metadata = self.get_video_metadata(video_path)
        return metadata.get("duration", 0.0)

    def get_video_metadata(self, video_path: str | Path) -> dict:
        """Get metadata from a video file.

        Args:
            video_path: Path to the video file.

        Returns:
            Dict with duration, width, height, fps.
        """
        video_path = Path(video_path)
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Verify FFmpeg is available before using it
        self._verify_ffmpeg()

        try:
            # Get duration
            duration_cmd = [
                "ffprobe",
                "-v",
                "quiet",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                str(video_path),
            ]
            duration_result = subprocess.run(
                duration_cmd, capture_output=True, text=True, check=True
            )
            duration = float(duration_result.stdout.strip())

            # Get video stream info (width, height, fps)
            stream_cmd = [
                "ffprobe",
                "-v",
                "quiet",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height,r_frame_rate",
                "-of",
                "csv=p=0",
                str(video_path),
            ]
            stream_result = subprocess.run(
                stream_cmd, capture_output=True, text=True, check=True
            )

            parts = stream_result.stdout.strip().split(",")
            width = int(parts[0]) if len(parts) > 0 else 1920
            height = int(parts[1]) if len(parts) > 1 else 1080

            # Parse frame rate (could be "30/1" or "29.97")
            fps_str = parts[2] if len(parts) > 2 else "30/1"
            if "/" in fps_str:
                num, den = fps_str.split("/")
                fps = float(num) / float(den)
            else:
                fps = float(fps_str)

            return {
                "duration": duration,
                "width": width,
                "height": height,
                "fps": fps,
            }

        except (subprocess.CalledProcessError, ValueError, IndexError) as e:
            logger.error(f"Error getting video metadata: {e}")
            # Return defaults on error
            return {
                "duration": 0.0,
                "width": 1920,
                "height": 1080,
                "fps": 30.0,
            }

    def cleanup(self, file_path: str | Path) -> None:
        """Remove a temporary file.

        Args:
            file_path: Path to the file to remove.
        """
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                logger.debug(f"Cleaned up: {path}")
        except OSError as e:
            logger.warning(f"Failed to cleanup {file_path}: {e}")
