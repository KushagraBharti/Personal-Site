# Repository Guide

## Overview

This repo has two product surfaces:

- `portfolio`: the public site, `/ai`, `llms.txt`, public assets, and public APIs
- `tracker`: the private task/workflow/calendar application

That split exists in both frontend and backend and should stay intact.

## Top-Level Layout

- `frontend` -> Vite + React app
- `backend` -> Express + TypeScript API
- `docs/active` -> current docs
- `docs/archive` -> historical docs only

## Frontend Layout

Main folders under `frontend/src`:

- `portfolio`
- `tracker`
- `shared`
- `types`

Primary routes:

- `/` -> `frontend/src/portfolio/pages/HomePage.tsx`
- `/ai` -> `frontend/src/portfolio/pages/AiProfilePage.tsx`
- `/tracker` -> `frontend/src/tracker/pages/TrackerPage.tsx`

Route behavior:

- `/` is eager-loaded
- `/ai` and `/tracker` are lazy-loaded
- intro/hero content renders first and live widgets hydrate later

## Backend Layout

Main folders under `backend/src`:

- `portfolio`
- `tracker`
- `routes`
- `config`
- `middleware`

Mounting:

- `/api` -> portfolio routes
- `/api/private` -> tracker routes

## Portfolio Source Of Truth

Portfolio-authored data lives in backend content modules:

- `backend/src/portfolio/content/profile.ts`
- `backend/src/portfolio/content/about.ts`
- `backend/src/portfolio/content/intro.ts`
- `backend/src/portfolio/content/media.ts`
- `backend/src/portfolio/content/ai.ts`
- `backend/src/portfolio/content/education.ts`
- `backend/src/portfolio/content/experiences.ts`
- `backend/src/portfolio/content/projects.ts`

Frontend components render that data. They should not become a second content source.

## Contracts And Data Flow

Backend contract shapes live under:

- `backend/src/portfolio/contracts`

Frontend API-facing contracts live under:

- `frontend/src/portfolio/api/contracts.ts`

Frontend data entrypoints:

- `frontend/src/portfolio/api/portfolioApi.ts`
- `frontend/src/portfolio/api/liveWidgetsApi.ts`

## Public APIs

Authored content:

- `/api/portfolio`
- `/api/portfolio/llms.txt`
- `/api/intro`
- `/api/projects`
- `/api/projects/:slug`
- `/api/experiences`
- `/api/experiences/:slug`
- `/api/education`
- `/api/education/:slug`

Live widgets:

- `/api/github/stats`
- `/api/weather`

The public site currently uses only GitHub and weather as live portfolio widgets.

Tracker:

- `/api/private/calendar`
- `/api/private/cron`

## llms.txt Flow

The backend owns snapshot and `llms.txt` generation:

- `backend/src/portfolio/services/portfolioSnapshotService.ts`
- `backend/src/portfolio/services/llmsTextService.ts`
- `backend/src/portfolio/services/portfolioExportService.ts`

The frontend syncs the generated text into:

- `frontend/public/llms.txt`

via:

- `frontend/scripts/sync-portfolio-exports.ts`

## Assets

Public portfolio assets live under:

- `frontend/public/portfolio/profile`
- `frontend/public/portfolio/projects`
- `frontend/public/portfolio/icons`

Use stable slug-style names and public paths rooted at `/portfolio/...`.

## Runtime Notes

GitHub stats:

- repo count uses public repo count
- commit count prefers GitHub GraphQL contribution totals
- frontend shows cached data first, then force-refreshes

Weather:

- frontend calls backend only
- backend uses Vercel geo headers when available
- local fallback is Austin
- no browser location prompt

Analytics:

- Vercel Analytics is mounted in the frontend app
- `ERR_BLOCKED_BY_CLIENT` is usually an extension/privacy blocker, not an app-serving failure

## Workflow

This repo is Bun-first.

Use Bun for:

- installs during normal development
- dev servers
- builds
- linting

Use repo-level verification for testing:

- `bun run verify`
- `bun run verify:live`
- `bun run verify:full`
- `bun run verify:full:live`

Those verification commands are allowed to use npm internally because Bun is unreliable for the current test toolchain in this Windows + OneDrive environment.

Typical commands:

```bash
cd frontend
bun install
bun run dev
bun run build
bun run lint
```

```bash
cd backend
bun install
bun run dev
bun run build
bun run lint
```

Repo-level verification:

```bash
bun install
bun run verify
bun run verify:full
```
