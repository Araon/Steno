# Steno API

Python backend for speech-to-text transcription and caption intelligence.

## Setup

```bash
# Install pipenv if not already installed
pip install pipenv

# Install dependencies
pipenv install

# Install dev dependencies (optional)
pipenv install --dev

# Download spaCy model
pipenv run python -m spacy download en_core_web_sm
```

## Requirements

- Python >= 3.11
- FFmpeg installed on system (for audio extraction)

## Running

```bash
# Development server (with hot reload)
pipenv run dev

# Or production mode
pipenv run start

# Or manually
pipenv run uvicorn src.main:app --reload --port 8000
```

## Linting & Formatting

This project uses `ruff` (a fast Python linter) and `black` (code formatter) instead of flake8.

```bash
# Check for linting issues
pipenv run lint

# Auto-fix linting issues (replaces flake8)
pipenv run lint-fix

# Format code with black
pipenv run format

# Check formatting without making changes
pipenv run format-check
```

**Note:** `ruff` can auto-fix most flake8-style errors. Run `pipenv run lint-fix` to automatically fix issues like:
- Unused imports
- Line length issues
- Import sorting
- Code style violations
- And many more!

## API Endpoints

- `POST /api/transcribe` - Upload video, get word-level transcript
- `POST /api/captions` - Convert transcript to styled captions
- `POST /api/process` - End-to-end: video → transcript → captions
- `GET /health` - Health check

## Project Structure

```
src/
  main.py           # FastAPI app and routes
  models.py         # Pydantic models
  audio/
    processor.py    # Audio extraction (FFmpeg)
  transcription/
    whisper_service.py  # Whisper integration
  captions/
    segmenter.py    # Transcript → caption groups
    stylizer.py     # Caption styling and emphasis
```
