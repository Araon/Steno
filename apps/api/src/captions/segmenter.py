"""Caption segmentation - convert transcript to lyric-style phrases."""

import logging
import uuid
from typing import Optional

import spacy
from spacy.language import Language

from ..models import (
    Caption,
    CaptionAnimation,
    CaptionPosition,
    CaptionStyle,
    CaptionWord,
    Transcript,
    TranscriptWord,
)

logger = logging.getLogger(__name__)


class CaptionSegmenter:
    """Segment transcripts into lyric-style caption phrases."""

    DEFAULT_MODEL = "en_core_web_sm"
    DEFAULT_MAX_WORDS = 4
    DEFAULT_MIN_WORDS = 2

    # Pause threshold in seconds - if gap between words is larger, start new caption
    PAUSE_THRESHOLD = 0.5

    def __init__(
        self,
        model_name: Optional[str] = None,
        max_words_per_caption: int = DEFAULT_MAX_WORDS,
        min_words_per_caption: int = DEFAULT_MIN_WORDS,
    ):
        """Initialize the caption segmenter.

        Args:
            model_name: spaCy model to use. Defaults to "en_core_web_sm".
            max_words_per_caption: Maximum words per caption segment.
            min_words_per_caption: Minimum words per caption (soft limit).
        """
        self.model_name = model_name or self.DEFAULT_MODEL
        self.max_words = max_words_per_caption
        self.min_words = min_words_per_caption
        self._nlp: Optional[Language] = None

    @property
    def nlp(self) -> Language:
        """Lazy-load the spaCy model."""
        if self._nlp is None:
            logger.info(f"Loading spaCy model: {self.model_name}")
            try:
                self._nlp = spacy.load(self.model_name)
            except OSError:
                logger.warning(
                    f"Model {self.model_name} not found, downloading..."
                )
                spacy.cli.download(self.model_name)
                self._nlp = spacy.load(self.model_name)
            logger.info("spaCy model loaded successfully")
        return self._nlp

    def segment(
        self,
        transcript: Transcript,
        default_animation: CaptionAnimation = CaptionAnimation.SCALE_IN,
    ) -> list[Caption]:
        """Segment a transcript into caption phrases.

        Args:
            transcript: Input transcript with word-level timestamps.
            default_animation: Default animation style for captions.

        Returns:
            List of Caption objects.
        """
        if not transcript.words:
            return []

        logger.info(f"Segmenting {len(transcript.words)} words into captions")

        # Group words into phrases
        phrases = self._group_into_phrases(transcript.words)

        # Convert phrases to captions
        captions = []
        for i, phrase_words in enumerate(phrases):
            caption = self._create_caption(
                words=phrase_words,
                index=i,
                default_animation=default_animation,
            )
            captions.append(caption)

        logger.info(f"Created {len(captions)} caption segments")
        return captions

    def _group_into_phrases(
        self,
        words: list[TranscriptWord],
    ) -> list[list[TranscriptWord]]:
        """Group words into natural phrases.

        Uses a combination of:
        - Maximum word count
        - Natural pauses (gaps between words)
        - Sentence boundaries
        - Punctuation

        Args:
            words: List of transcript words.

        Returns:
            List of word groups (phrases).
        """
        if not words:
            return []

        phrases = []
        current_phrase: list[TranscriptWord] = []

        for i, word in enumerate(words):
            # Check for natural break points
            should_break = False

            if current_phrase:
                # Check for pause between words
                prev_word = current_phrase[-1]
                gap = word.start - prev_word.end
                if gap > self.PAUSE_THRESHOLD:
                    should_break = True

                # Check for max words
                if len(current_phrase) >= self.max_words:
                    should_break = True

                # Check for sentence-ending punctuation
                if self._ends_with_punctuation(prev_word.text):
                    should_break = True

            if should_break and current_phrase:
                phrases.append(current_phrase)
                current_phrase = []

            current_phrase.append(word)

        # Don't forget the last phrase
        if current_phrase:
            phrases.append(current_phrase)

        # Merge very short phrases with neighbors
        phrases = self._merge_short_phrases(phrases)

        return phrases

    def _merge_short_phrases(
        self,
        phrases: list[list[TranscriptWord]],
    ) -> list[list[TranscriptWord]]:
        """Merge very short phrases with neighboring phrases.

        Args:
            phrases: List of word groups.

        Returns:
            Merged list with fewer tiny phrases.
        """
        if len(phrases) <= 1:
            return phrases

        merged = []
        i = 0

        while i < len(phrases):
            current = phrases[i]

            # If current phrase is too short and there's a next phrase
            if len(current) < self.min_words and i + 1 < len(phrases):
                next_phrase = phrases[i + 1]

                # Merge if combined length is acceptable
                if len(current) + len(next_phrase) <= self.max_words + 1:
                    merged.append(current + next_phrase)
                    i += 2
                    continue

            merged.append(current)
            i += 1

        return merged

    def _ends_with_punctuation(self, text: str) -> bool:
        """Check if text ends with sentence-ending punctuation.

        Args:
            text: Text to check.

        Returns:
            True if ends with sentence punctuation.
        """
        text = text.strip()
        return text.endswith(('.', '!', '?', '...'))

    def _create_caption(
        self,
        words: list[TranscriptWord],
        index: int,
        default_animation: CaptionAnimation,
    ) -> Caption:
        """Create a Caption object from a group of words.

        Args:
            words: Words in this caption.
            index: Caption index (for ID generation).
            default_animation: Animation style to use.

        Returns:
            Caption object.
        """
        # Convert to CaptionWord objects
        caption_words = [
            CaptionWord(
                text=w.text,
                start=w.start,
                end=w.end,
            )
            for w in words
        ]

        # Build full text
        text = " ".join(w.text for w in words)

        # Get timing
        start = words[0].start
        end = words[-1].end

        return Caption(
            id=f"caption_{index}_{uuid.uuid4().hex[:8]}",
            text=text,
            start=start,
            end=end,
            words=caption_words,
            emphasis=[],  # Will be filled by stylizer
            style=CaptionStyle.NORMAL,
            animation=default_animation,
            position=CaptionPosition.CENTER,
        )

    def get_word_pos_tags(self, text: str) -> list[tuple[str, str]]:
        """Get part-of-speech tags for words in text.

        Args:
            text: Text to analyze.

        Returns:
            List of (word, POS tag) tuples.
        """
        doc = self.nlp(text)
        return [(token.text, token.pos_) for token in doc]
