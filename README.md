# Steno

Local-first video captioning with lyric-style kinetic typography.

Takes vlog-style videos, transcribes speech with word-level timestamps, and overlays Instagram-style animated captions on the video.

## Features

- Word-level transcription with Whisper
- Automatic caption segmentation into lyric-style phrases
- Key word emphasis (font size/weight changes)
- Multiple animations (scale-in, fade-in, word-by-word)
- Preview captions over video
- Export MP4 in 9:16 and 16:9 aspect ratios

## Setup

**Prerequisites:**
- Node.js >= 18, pnpm >= 9
- Python >= 3.11, FFmpeg

**Install:**
```bash
pnpm install
cd apps/api
pip install pipenv
pipenv install
pipenv run python -m spacy download en_core_web_sm
```

## Usage

```bash
# Start all services
pnpm dev

# Or individually
pnpm dev:web      # http://localhost:5173
pnpm dev:renderer # Remotion preview
pnpm dev:api      # http://localhost:8000
```

## Tech Stack

- **Frontend**: TypeScript, React, Remotion, Tailwind, Zustand
- **Backend**: Python 3.11, FastAPI, Whisper, FFmpeg, spaCy

## Architecture

JSON contracts separate Python (transcription/NLP) from TypeScript (rendering):
- **Transcript Contract**: Word-level transcription with timestamps
- **Captions Contract**: Segmented phrases with emphasis, style, animation
