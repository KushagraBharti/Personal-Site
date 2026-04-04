# Repository Guide

## Overview

This repository is split into two product surfaces:

- `portfolio`: the public website, `/ai`, `llms.txt`, public APIs, and public assets
- `tracker`: the private productivity, finance, and calendar tooling

The split exists in both the frontend and backend.

## Top-Level Layout

- `frontend`: Vite + React application
- `backend`: Express + TypeScript API
- `docs/active`: current documentation
- `docs/archive`: historical docs that are no longer the source of truth

## Frontend Layout

Primary folders under `frontend/src`:

- `portfolio`: public site pages, sections, APIs, and live widgets
- `tracker`: private tracker pages, shell, modules, and tracker-specific shared code
- `shared`: cross-surface UI primitives and app helpers
- `types`: shared frontend-only types

Key frontend routes:

- `/` -> `frontend/src/portfolio/pages/HomePage.tsx`
- `/ai` -> `frontend/src/portfolio/pages/AiProfilePage.tsx`
- `/tracker` -> `frontend/src/tracker/pages/TrackerPage.tsx`

`HomePage` is eagerly loaded. `/ai` and `/tracker` are lazy-loaded.

## Backend Layout

Primary folders under `backend/src`:

- `portfolio`: public content, services, controllers, and routes
- `tracker`: private tracker services and routes
- `routes`: app-level route composition
- `config`: environment-backed configuration
- `middleware`: Express middleware

App mounting:

- `/api` -> `backend/src/portfolio/routes`
- `/api/private` -> `backend/src/tracker`

## Portfolio Source Of Truth

Portfolio-authored data lives in backend TypeScript modules under:

- `backend/src/portfolio/content/profile.ts`
- `backend/src/portfolio/content/about.ts`
- `backend/src/portfolio/content/intro.ts`
- `backend/src/portfolio/content/media.ts`
- `backend/src/portfolio/content/ai.ts`
- `backend/src/portfolio/content/education.ts`
- `backend/src/portfolio/content/experiences.ts`
- `backend/src/portfolio/content/projects.ts`

These files are the canonical content source for the public site.

The frontend should render this data. It should not redefine portfolio content in components.

## Contracts And Data Flow

Canonical backend contract shapes live in:

- `backend/src/portfolio/contracts`

The frontend currently keeps its own local API-facing contract definitions in:

- `frontend/src/portfolio/api/contracts.ts`

That is intentional. The frontend no longer imports backend source files directly for runtime typing.

Frontend portfolio data flow:

- authored content APIs -> `frontend/src/portfolio/api/portfolioApi.ts`
- live widget APIs -> `frontend/src/portfolio/api/liveWidgetsApi.ts`

Current frontend caching behavior:

- portfolio snapshot and intro data are cached in `sessionStorage`
- GitHub stats are shown from cache first and then force-refreshed on mount
- weather responses are cached in `sessionStorage` by query key

## Public APIs

Authored content endpoints:

- `/api/portfolio`
- `/api/portfolio/llms.txt`
- `/api/intro`
- `/api/projects`
- `/api/projects/:slug`
- `/api/experiences`
- `/api/experiences/:slug`
- `/api/education`
- `/api/education/:slug`

Live widget endpoints:

- `/api/github/stats`
- `/api/weather`
- `/api/leetcode/stats`

Tracker endpoints mount under `/api/private`, with current subtrees:

- `/api/private/finance`
- `/api/private/calendar`
- `/api/private/cron`

## llms.txt Export Flow

The backend owns snapshot and `llms.txt` generation:

- `backend/src/portfolio/services/portfolioSnapshotService.ts`
- `backend/src/portfolio/services/llmsTextService.ts`
- `backend/src/portfolio/services/portfolioExportService.ts`

The frontend sync script:

- `frontend/scripts/sync-portfolio-exports.ts`

imports the backend export function and writes:

- `frontend/public/llms.txt`

Frontend `dev` and `build` both run that sync step first.

## Public Assets

Portfolio assets live under:

- `frontend/public/portfolio/profile`
- `frontend/public/portfolio/projects`
- `frontend/public/portfolio/media`
- `frontend/public/portfolio/icons`

Use stable, slug-style filenames and public paths rooted at `/portfolio/...`.

## Runtime Notes

GitHub stats:

- repo count uses the public GitHub repo count
- commit count prefers GitHub GraphQL commit contributions and falls back if needed
- frontend forces a refresh on mount so reloads do not stay stuck on stale session data

Weather:

- frontend calls `/api/weather` without asking the browser for location permission
- backend uses Vercel geo headers when available
- invalid location guesses fall back to Austin
- local development usually falls back to Austin because Vercel geo headers are not present locally

Analytics:

- Vercel Analytics is mounted in the frontend app
- `ERR_BLOCKED_BY_CLIENT` in the browser console is usually caused by an extension or privacy blocker, not by the app failing to serve the script

## Bun Workflow

This repository is Bun-only.

Frontend:

```bash
cd frontend
bun install
bun run dev
bun run build
bun run lint
```

Backend:

```bash
cd backend
bun install
bun run dev
bun run build
bun run lint
```
