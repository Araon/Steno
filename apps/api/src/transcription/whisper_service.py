"""Whisper integration for speech-to-text with word-level timestamps."""

import logging
from pathlib import Path
from typing import Optional

import whisper

from ..models import Transcript, TranscriptWord

logger = logging.getLogger(__name__)


class WhisperService:
    """Speech-to-text service using OpenAI Whisper."""

    # Available models: tiny, base, small, medium, large
    DEFAULT_MODEL = "base"

    def __init__(self, model_name: Optional[str] = None):
        """Initialize the Whisper service.

        Args:
            model_name: Whisper model to use. Defaults to "base".
                Options: tiny, base, small, medium, large
        """
        self.model_name = model_name or self.DEFAULT_MODEL
        self._model: Optional[whisper.Whisper] = None
        logger.info(f"WhisperService initialized with model: {self.model_name}")

    @property
    def model(self) -> whisper.Whisper:
        """Lazy-load the Whisper model."""
        if self._model is None:
            logger.info(f"Loading Whisper model: {self.model_name}")
            self._model = whisper.load_model(self.model_name)
            logger.info("Whisper model loaded successfully")
        return self._model

    def transcribe(
        self,
        audio_path: str | Path,
        language: Optional[str] = None,
    ) -> Transcript:
        """Transcribe audio file with word-level timestamps.

        Args:
            audio_path: Path to the audio file (WAV format recommended).
            language: Language code (e.g., "en"). Auto-detected if None.

        Returns:
            Transcript with word-level timing information.

        Raises:
            FileNotFoundError: If audio file doesn't exist.
            RuntimeError: If transcription fails.
        """
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Transcribing: {audio_path}")

        try:
            # Transcribe with word timestamps
            result = self.model.transcribe(
                str(audio_path),
                language=language,
                word_timestamps=True,
                verbose=False,
            )

            # Extract word-level data
            words = self._extract_words(result)

            # Build transcript
            transcript = Transcript(
                words=words,
                text=result.get("text", "").strip(),
                duration=self._get_duration(result),
                language=result.get("language", language or "en"),
            )

            logger.info(
                f"Transcription complete: {len(words)} words, "
                f"{transcript.duration:.2f}s"
            )

            return transcript

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise RuntimeError(f"Transcription failed: {e}")

    def _extract_words(self, result: dict) -> list[TranscriptWord]:
        """Extract word-level data from Whisper result.

        Args:
            result: Raw Whisper transcription result.

        Returns:
            List of TranscriptWord objects.
        """
        words = []

        segments = result.get("segments", [])
        for segment in segments:
            segment_words = segment.get("words", [])
            for word_data in segment_words:
                word = TranscriptWord(
                    text=word_data.get("word", "").strip(),
                    start=word_data.get("start", 0.0),
                    end=word_data.get("end", 0.0),
                    confidence=word_data.get("probability"),
                )
                # Only add non-empty words
                if word.text:
                    words.append(word)

        return words

    def _get_duration(self, result: dict) -> float:
        """Get total duration from Whisper result.

        Args:
            result: Raw Whisper transcription result.

        Returns:
            Duration in seconds.
        """
        segments = result.get("segments", [])
        if not segments:
            return 0.0

        # Get the end time of the last segment
        last_segment = segments[-1]
        return last_segment.get("end", 0.0)

    def get_available_models(self) -> list[str]:
        """Get list of available Whisper models.

        Returns:
            List of model names.
        """
        return ["tiny", "base", "small", "medium", "large"]

    def change_model(self, model_name: str) -> None:
        """Change the Whisper model.

        Args:
            model_name: New model to use.

        Raises:
            ValueError: If model name is invalid.
        """
        available = self.get_available_models()
        if model_name not in available:
            raise ValueError(
                f"Invalid model: {model_name}. Available: {available}"
            )

        if model_name != self.model_name:
            logger.info(f"Changing model from {self.model_name} to {model_name}")
            self.model_name = model_name
            self._model = None  # Force reload on next use
