"""Caption stylization - add emphasis, animations, and visual styles."""

import logging
import random
from typing import Optional

import spacy
from spacy.language import Language

from ..models import Caption, CaptionAnimation, CaptionStyle, Captions, CaptionSettings

logger = logging.getLogger(__name__)


class CaptionStylizer:
    """Apply visual styles and emphasis to captions."""

    DEFAULT_MODEL = "en_core_web_sm"

    # POS tags for words that are good candidates for emphasis
    EMPHASIS_POS_TAGS = {"NOUN", "VERB", "ADJ", "ADV", "PROPN"}

    # Animation variety - cycle through these for visual interest
    ANIMATION_CYCLE = [
        CaptionAnimation.SCALE_IN,
        CaptionAnimation.FADE_IN,
        CaptionAnimation.WORD_BY_WORD,
    ]

    def __init__(self, model_name: Optional[str] = None):
        """Initialize the caption stylizer.

        Args:
            model_name: spaCy model to use for NLP analysis.
        """
        self.model_name = model_name or self.DEFAULT_MODEL
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

    def stylize(
        self,
        captions: list[Caption],
        vary_animations: bool = True,
        emphasize_keywords: bool = True,
    ) -> Captions:
        """Apply styles and emphasis to a list of captions.

        Args:
            captions: List of Caption objects to stylize.
            vary_animations: Whether to vary animations for visual interest.
            emphasize_keywords: Whether to identify and mark emphasis words.

        Returns:
            Complete Captions document with styling applied.
        """
        logger.info(f"Stylizing {len(captions)} captions")

        styled_captions = []
        for i, caption in enumerate(captions):
            styled = self._stylize_caption(
                caption=caption,
                index=i,
                vary_animations=vary_animations,
                emphasize_keywords=emphasize_keywords,
            )
            styled_captions.append(styled)

        return Captions(
            version="1.0",
            captions=styled_captions,
            settings=CaptionSettings(),
        )

    def _stylize_caption(
        self,
        caption: Caption,
        index: int,
        vary_animations: bool,
        emphasize_keywords: bool,
    ) -> Caption:
        """Apply styling to a single caption.

        Args:
            caption: Caption to style.
            index: Caption index (for animation cycling).
            vary_animations: Whether to vary animations.
            emphasize_keywords: Whether to add emphasis.

        Returns:
            Styled Caption.
        """
        # Find emphasis words
        emphasis = []
        if emphasize_keywords:
            emphasis = self._find_emphasis_words(caption)

        # Select animation
        animation = caption.animation
        if vary_animations:
            animation = self._select_animation(index)

        # Select style based on content
        style = self._select_style(caption, emphasis)

        # Create new caption with styling
        return Caption(
            id=caption.id,
            text=caption.text,
            start=caption.start,
            end=caption.end,
            words=caption.words,
            emphasis=emphasis,
            style=style,
            animation=animation,
            position=caption.position,
        )

    def _find_emphasis_words(self, caption: Caption) -> list[str]:
        """Find words to emphasize in a caption.

        Uses NLP to identify important words (nouns, verbs, adjectives).
        Also considers position (last word often emphasized in lyrics).

        Args:
            caption: Caption to analyze.

        Returns:
            List of words to emphasize.
        """
        if not caption.words:
            return []

        # Analyze with spaCy
        doc = self.nlp(caption.text)

        emphasis = []
        word_texts = [w.text.lower() for w in caption.words]

        for token in doc:
            # Check if this is an emphasis-worthy POS
            if token.pos_ in self.EMPHASIS_POS_TAGS:
                # Find matching word in caption
                token_lower = token.text.lower()
                if token_lower in word_texts:
                    emphasis.append(token.text)

        # If no emphasis found, emphasize the last word (lyric style)
        if not emphasis and caption.words:
            last_word = caption.words[-1].text
            # Clean punctuation
            clean_word = last_word.rstrip('.,!?')
            if clean_word:
                emphasis.append(clean_word)

        # Limit to 1-2 emphasis words per caption for clean look
        return emphasis[:2]

    def _select_animation(self, index: int) -> CaptionAnimation:
        """Select animation based on caption index.

        Cycles through animations for visual variety.

        Args:
            index: Caption index.

        Returns:
            Selected animation.
        """
        return self.ANIMATION_CYCLE[index % len(self.ANIMATION_CYCLE)]

    def _select_style(
        self,
        caption: Caption,
        emphasis: list[str],
    ) -> CaptionStyle:
        """Select visual style for a caption.

        Args:
            caption: Caption to style.
            emphasis: Emphasis words (may influence style).

        Returns:
            Selected style.
        """
        text = caption.text.lower()

        # Questions get italic style
        if caption.text.strip().endswith('?'):
            return CaptionStyle.ITALIC

        # Exclamations get bold style
        if caption.text.strip().endswith('!'):
            return CaptionStyle.BOLD

        # Short, punchy captions (1-2 words) get bold
        if len(caption.words) <= 2:
            return CaptionStyle.BOLD

        # Captions with multiple emphasis words get highlight
        if len(emphasis) >= 2:
            return CaptionStyle.HIGHLIGHT

        # Default to normal
        return CaptionStyle.NORMAL

    def apply_theme(
        self,
        captions: Captions,
        theme: str = "default",
    ) -> Captions:
        """Apply a predefined theme to captions.

        Args:
            captions: Captions document.
            theme: Theme name ("default", "minimal", "bold", "playful").

        Returns:
            Captions with theme-based settings.
        """
        themes = {
            "default": CaptionSettings(
                fontFamily="Inter",
                fontSize=48,
                fontWeight=700,
                color="#FFFFFF",
                emphasisScale=1.2,
            ),
            "minimal": CaptionSettings(
                fontFamily="Helvetica",
                fontSize=40,
                fontWeight=400,
                color="#FFFFFF",
                emphasisScale=1.1,
            ),
            "bold": CaptionSettings(
                fontFamily="Impact",
                fontSize=56,
                fontWeight=900,
                color="#FFFFFF",
                emphasisScale=1.3,
            ),
            "playful": CaptionSettings(
                fontFamily="Comic Sans MS",
                fontSize=44,
                fontWeight=700,
                color="#FFFF00",
                emphasisScale=1.4,
            ),
        }

        settings = themes.get(theme, themes["default"])

        return Captions(
            version=captions.version,
            captions=captions.captions,
            settings=settings,
        )
