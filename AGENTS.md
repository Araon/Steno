# AGENTS.md - Steno Repository Guidelines

## Repository Overview

Steno is a local-first video captioning tool with lyric-style kinetic typography. It's a monorepo with TypeScript/React frontend apps and a Python FastAPI backend.

**Architecture:**
- `apps/web` - React/Vite frontend (port 5173)
- `apps/renderer` - Remotion video renderer
- `apps/renderer-api` - Express API for rendering (port 3001)
- `apps/api` - Python FastAPI for transcription/NLP (port 8000)
- `packages/contracts` - Shared TypeScript types and JSON schemas

## Build Commands

```bash
# Install dependencies
pnpm install
cd apps/api && pipenv install

# Development (start all services)
pnpm dev

# Individual services
pnpm dev:web          # Frontend only
pnpm dev:api          # Python API
pnpm dev:renderer     # Remotion studio
pnpm dev:renderer-api # Renderer API

# Build
pnpm build

# Clean build artifacts
pnpm clean
```

## Lint Commands

```bash
# TypeScript/JavaScript (from root)
pnpm lint                    # Lint all TS apps

# Python (from apps/api)
pipenv run lint             # Run ruff check
pipenv run lint-fix         # Auto-fix issues
pipenv run format           # Format with black
pipenv run format-check     # Check formatting

# Fix specific file
ruff check --fix src/main.py
black src/main.py
```

## Test Commands

**Note:** No tests currently exist in this repository. When adding tests:

```bash
# Python tests (when added)
cd apps/api
pipenv run pytest
pipenv run pytest -k test_name     # Single test
pipenv run pytest -x               # Stop on first failure

# TypeScript tests (when added)
pnpm test
pnpm test -- --testNamePattern="test name"
```

## Code Style Guidelines

### TypeScript/React

**Formatting:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- No trailing commas
- Max line length: 88 characters (matching Python)

**Naming Conventions:**
- `PascalCase`: Components, interfaces, types, enums
- `camelCase`: Variables, functions, methods, hooks
- `kebab-case`: File names, directory names
- `UPPER_SNAKE_CASE`: Constants, enum values

**Imports:**
- Group order: React/libraries → Workspace packages → Local imports
- Use `@/*` alias for web app imports (e.g., `@/components/Button`)
- Use `@steno/*` for workspace packages
- Example:
  ```typescript
  import { useState } from 'react';
  import { Player } from '@remotion/player';
  import { useStenoStore } from '@/store/useStenoStore';
  import { CaptionEditor } from './components';
  ```

**Components:**
- Use functional components with hooks
- Props interface named `{ComponentName}Props`
- Default exports for page components, named for reusable components
- Prefer destructured props

**Types:**
- Strict TypeScript enabled (`strict: true`)
- Always type function parameters and returns
- Use `interface` for object shapes, `type` for unions/aliases
- Export types from `packages/contracts` for shared contracts

### Python

**Formatting (Black):**
- Line length: 88 characters
- Target Python: 3.9
- Use double quotes for strings

**Linting (Ruff):**
- Enabled: E, W, F, I, N, UP, B, C4, SIM
- Ignored: E501 (line length - handled by black), B008, N815

**Naming Conventions:**
- `snake_case`: Functions, variables, modules
- `PascalCase`: Classes, Pydantic models, enums
- `UPPER_SNAKE_CASE`: Constants, enum values
- `CamelCase` for API response field aliases (for TS compatibility)

**Imports:**
- Group order: stdlib → third-party → local
- Use absolute imports from `src` (e.g., `from .models import Caption`)
- Example:
  ```python
  import logging
  from pathlib import Path
  
  from fastapi import FastAPI
  from pydantic import BaseModel
  
  from .audio import AudioProcessor
  ```

**Type Hints:**
- Use Python 3.10+ union syntax: `str | None` instead of `Optional[str]`
- Type all function parameters and returns
- Use Pydantic for API request/response models

### Error Handling

**TypeScript:**
- Use try/catch for async operations
- Provide user-friendly error messages in UI
- Log errors to console for debugging
- Check for null/undefined before accessing properties

**Python:**
- Raise specific exceptions (FileNotFoundError, ValueError)
- Use FastAPI HTTPException for API errors
- Always clean up temp files in `finally` blocks
- Log errors with context using `logger.exception()`

### Architecture Patterns

**Contracts:**
- TypeScript types are the source of truth in `packages/contracts`
- Python models mirror TypeScript contracts using Pydantic
- Use `alias` and `populate_by_name=True` for camelCase API fields

**State Management:**
- Web app uses Zustand for global state
- Prefer local state for component-specific data
- Use selectors to avoid unnecessary re-renders

**API Design:**
- RESTful endpoints under `/api/`
- Consistent response format with processing times
- File uploads use multipart/form-data
- CORS configured for localhost development

## Environment Setup

**Requirements:**
- Node.js >= 18, pnpm >= 9
- Python >= 3.11, FFmpeg

**Environment Variables:**
- `WHISPER_MODEL` - Whisper model size (default: "small")
- `STENO_STORAGE_DIR` - Storage path (default: "./storage")

## Git Workflow

- Main branch: `main`
- CI runs lint on PRs
- Auto-fix commits applied on push
- Commit message format: `type: description` (e.g., `feat: add caption animation`)
- setup a Release branch and changes are pushed to main and then auto merged to release branch and tagged with version number

## Testing Guidelines
- Add tests for new features and bug fixes
- Use descriptive test names
- Aim for high coverage on critical logic (transcription, rendering)
- Mock external dependencies (FFmpeg, Whisper) in tests
- Run tests as a part of CI after pushing to main

