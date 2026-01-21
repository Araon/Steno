# Steno API

Python backend for speech-to-text transcription and caption intelligence.

## Setup

```bash
pip install pipenv
pipenv install
pipenv run python -m spacy download en_core_web_sm
```

## Running

```bash
pipenv run dev      # Development (hot reload)
pipenv run start    # Production
```

## Linting

```bash
pipenv run lint        # Check issues
pipenv run lint-fix    # Auto-fix
pipenv run format      # Format with black
```

## API Endpoints

- `POST /api/transcribe` - Upload video, get word-level transcript
- `POST /api/captions` - Convert transcript to styled captions
- `POST /api/process` - End-to-end: video → transcript → captions
- `GET /health` - Health check
