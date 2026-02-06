"""Whisper integration for speech-to-text with word-level timestamps."""

import logging
from pathlib import Path
from typing import Optional, Union

import whisper

from ..models import Transcript, TranscriptWord

logger = logging.getLogger(__name__)


class WhisperService:
    """Speech-to-text service using OpenAI Whisper."""

    # Available models: tiny, base, small, medium, large
    # Changed default from "base" to "small" for better accuracy
    DEFAULT_MODEL = "small"

    def __init__(self, model_name: Optional[str] = None):
        """Initialize the Whisper service.

        Args:
            model_name: Whisper model to use. Defaults to "small".
                Options: tiny, base, small, medium, large
                - tiny/base: Fast but less accurate
                - small: Good balance (default)
                - medium/large: More accurate but slower
        """  # noqa: E501
        self.model_name = model_name or self.DEFAULT_MODEL
        self._model: whisper.Optional[Whisper] = None
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
        audio_path: Union[str, Path],
        language: Optional[str] = None,
    ) -> Transcript:
        """Transcribe audio file with word-level timestamps.

        Enhanced with better parameters for improved accuracy and timing.

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
            # Enhanced transcription parameters for better accuracy
            # - beam_size: Higher values = better accuracy (5 is good)
            # - best_of: Generate multiple candidates and pick best
            # - temperature: Lower = more deterministic (0.0 for greedy)
            # - condition_on_previous_text: False reduces repetition
            result = self.model.transcribe(
                str(audio_path),
                language=language,
                word_timestamps=True,
                verbose=False,
                # Improved parameters for better accuracy
                beam_size=5,  # Beam search for better decoding
                best_of=5,  # Generate 5 candidates, pick best
                temperature=0.0,  # More deterministic, less random
                condition_on_previous_text=False,  # Reduce repetition
                # Suppression parameters
                suppress_blank=True,  # Suppress blank outputs
                suppress_tokens=[-1],  # Suppress special tokens
                # Better silence detection
                no_speech_threshold=0.6,  # No-speech detection threshold
            )

            # Extract word-level data
            words = self._extract_words(result)

            # Normalize word timings for accuracy
            words = self._normalize_word_timings(words)

            # Build transcript
            transcript = Transcript(
                words=words,
                text=result.get("text", "").strip(),
                duration=self._get_duration(result),
                language=result.get("language", language or "en"),
            )

            logger.info(
                f"Transcription complete: {len(words)} words, "
                f"{transcript.duration:.2f}s, model: {self.model_name}"
            )

            return transcript

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise RuntimeError(f"Transcription failed: {e}") from e

    def _extract_words(self, result: dict) -> list[TranscriptWord]:
        """Extract word-level data from Whisper result.

        Enhanced with confidence filtering for better quality.

        Args:
            result: Raw Whisper transcription result.

        Returns:
            List of TranscriptWord objects.
        """
        words = []
        # Filter out very low confidence words
        min_confidence = 0.1

        segments = result.get("segments", [])
        for segment in segments:
            segment_words = segment.get("words", [])
            for word_data in segment_words:
                word_text = word_data.get("word", "").strip()
                confidence = word_data.get("probability")

                # Filter low-confidence words (optional, can be adjusted)
                if confidence is not None and confidence < min_confidence:
                    logger.debug(
                        f"Filtered low-confidence word: '{word_text}' "
                        f"(confidence: {confidence:.2f})"  # noqa: E501
                    )
                    continue

                word = TranscriptWord(
                    text=word_text,
                    start=word_data.get("start", 0.0),
                    end=word_data.get("end", 0.0),
                    confidence=confidence,
                )
                # Only add non-empty words
                if word.text:
                    words.append(word)

        return words

    def _normalize_word_timings(
        self, words: list[TranscriptWord]
    ) -> list[TranscriptWord]:
        """Normalize word timings to ensure sequential, non-overlapping timestamps.

        Fixes timing accuracy issues by:
        - Ensuring words are sequential (no going backwards)
        - Preventing overlaps between words
        - Ensuring minimum word duration
        - Fixing invalid timing ranges

        Args:
            words: List of words with potentially overlapping/incorrect timings.

        Returns:
            List of words with normalized, sequential timings.
        """
        if not words:
            return words

        normalized = []
        prev_end = 0.0

        for word in words:
            # Ensure start time is not before previous end time
            if word.start < prev_end:
                # Small overlap: adjust start to prev_end
                # Larger gap: keep original start if gap is reasonable
                gap = word.start - prev_end
                if gap > -0.1:  # Less than 100ms overlap
                    word.start = max(prev_end, word.start)
                else:
                    # Significant overlap, keep original but warn
                    logger.debug(
                        f"Warning: Significant timing overlap for "
                        f"word '{word.text}': start={word.start:.3f}, "
                        f"prev_end={prev_end:.3f}"
                    )

            # Ensure end time is after start time
            if word.end <= word.start:
                # If end <= start, set a minimum duration
                min_duration = 0.05  # 50ms minimum
                word.end = word.start + min_duration
                logger.debug(
                    f"Fixed invalid timing for word '{word.text}': "
                    f"start={word.start:.3f}, end={word.end:.3f}"  # noqa: E501
                )

            # Ensure minimum word duration (prevents zero-length words)
            min_duration = 0.03  # 30ms minimum
            if word.end - word.start < min_duration:
                word.end = word.start + min_duration

            normalized.append(word)
            prev_end = word.end

        return normalized

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
            raise ValueError(f"Invalid model: {model_name}. Available: {available}")

        if model_name != self.model_name:
            logger.info(f"Changing model from {self.model_name} to {model_name}")
            self.model_name = model_name
            self._model = None  # Force reload on next use
