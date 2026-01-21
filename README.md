# Steno

Local-first video captioning with lyric-style kinetic typography.

## Overview

Steno takes vlog-style videos (talking to camera), transcribes the speech, and overlays **lyric-style, kinetic typography captions** (Instagram-like) on the video.

## Features

- Import MP4 video
- Extract audio and transcribe with word-level timestamps
- Segment transcript into short, lyric-style phrases
- Emphasize key words (font size / weight changes)
- Animate captions (scale-in, fade-in, word-by-word reveal)
- Preview captions over video
- Export final MP4 (9:16 and 16:9)

## Tech Stack

**Frontend / Renderer**
- TypeScript, React, Remotion
- Tailwind CSS, Zustand, Vite

**Backend Intelligence**
- Python 3.11, FastAPI
- Whisper (word-level timestamps)
- FFmpeg + pydub (audio)
- spaCy (light NLP)

## Project Structure

```
apps/
  web/        # Editor + preview UI (React + Vite)
  renderer/   # Remotion compositions (video rendering)
  api/        # Python ASR + caption intelligence (FastAPI)

packages/
  contracts/  # JSON schemas and TypeScript types
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Python >= 3.11
- FFmpeg installed on system

### Installation

```bash
# Install Node.js dependencies
pnpm install

# Set up Python API (requires pipenv)
pip install pipenv
cd apps/api
pipenv install
pipenv run python -m spacy download en_core_web_sm
```

### Development

```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev:web      # Web UI at http://localhost:5173
pnpm dev:renderer # Remotion preview
pnpm dev:api      # Python API at http://localhost:8000
```

### Building

```bash
pnpm build
```

## Architecture

The system uses **JSON contracts** as the boundary between Python and TypeScript:

1. **Transcript Contract**: Word-level transcription with timestamps
2. **Captions Contract**: Segmented phrases with emphasis, style, and animation

This separation allows:
- Transcription/NLP backend to be swappable
- Rendering to be deterministic and testable
- UI to be independent of backend implementation

## License

MIT
