# Developer Guide

This file is the developer startup guide for this repository.

`AGENTS.md` and `CLAUDE.md` are intentionally identical. Keep them in sync.

## What This Repo Is

This repo contains two product surfaces in one codebase:

- `portfolio`: the public site, `/ai`, public APIs, and generated `llms.txt`
- `tracker`: the private personal operating layer for tasks, workflow, and calendar-connected planning

The split exists in both the frontend and the backend. That separation is intentional and should be preserved.

## Architecture At A Glance

Frontend:

- `frontend/src/portfolio`
- `frontend/src/tracker`
- `frontend/src/shared`

Backend:

- `backend/src/portfolio`
- `backend/src/tracker`
- `backend/src/routes`

App-level route mounting:

- `/api` -> public portfolio routes
- `/api/private` -> tracker routes

Frontend routes:

- `/` -> public homepage
- `/ai` -> AI-readable portfolio surface
- `/tracker` -> private tracker app

## Core Decisions

These are not accidental implementation details. Do not casually undo them.

### 1. Portfolio content is backend-owned

All portfolio-authored content lives in:

- `backend/src/portfolio/content/profile.ts`
- `backend/src/portfolio/content/about.ts`
- `backend/src/portfolio/content/intro.ts`
- `backend/src/portfolio/content/media.ts`
- `backend/src/portfolio/content/ai.ts`
- `backend/src/portfolio/content/education.ts`
- `backend/src/portfolio/content/experiences.ts`
- `backend/src/portfolio/content/projects.ts`

If you need to update public-facing content, start there.

The frontend is responsible for presentation, interaction, layout, animation, and progressive loading. It should not become a second content source.

### 2. Portfolio and tracker stay separated

Keep public-site concerns in `portfolio` and private-app concerns in `tracker`.

Do not mix:

- tracker modules into portfolio folders
- public portfolio content into tracker code
- shared code that is actually tracker-specific into `frontend/src/shared`

### 3. Frontend contracts are local

Backend canonical contract definitions live under:

- `backend/src/portfolio/contracts`

Frontend currently keeps local API-facing contract definitions in:

- `frontend/src/portfolio/api/contracts.ts`

This is intentional. Do not reintroduce direct frontend imports from backend runtime source files just to reuse types.

### 4. `llms.txt` is backend-authored

Canonical generation lives in backend services:

- `backend/src/portfolio/services/portfolioSnapshotService.ts`
- `backend/src/portfolio/services/llmsTextService.ts`
- `backend/src/portfolio/services/portfolioExportService.ts`

Frontend sync happens via:

- `frontend/scripts/sync-portfolio-exports.ts`

That script writes:

- `frontend/public/llms.txt`

### 5. Home should feel instant

The homepage is optimized for immediate first paint.

Current behavior:

- `HomePage` is eagerly loaded
- `/ai` and `/tracker` are lazy-loaded
- intro content renders first
- secondary sections progressively load
- GitHub stats revalidate after paint

Do not add avoidable blocking work to the homepage path.

### 6. Weather must not use browser location prompts

Weather is backend-driven.

Current behavior:

- frontend calls `/api/weather`
- backend uses Vercel geo headers when available
- invalid/missing guessed locations fall back to Austin
- no browser geolocation prompt should be introduced

### 7. GitHub stats must refresh, not stay stale

Current behavior:

- frontend may show cached stats immediately
- frontend then force-refreshes on mount
- backend prefers GraphQL commit contribution totals
- backend falls back if GraphQL/token path is unavailable

Do not regress this to “session cache wins forever.”

## Folder Walkthrough

### Frontend portfolio

Main areas:

- `frontend/src/portfolio/pages`
- `frontend/src/portfolio/sections`
- `frontend/src/portfolio/components`
- `frontend/src/portfolio/api`

Notes:

- `HomePage.tsx` owns public page composition and section prefetching
- `AiProfilePage.tsx` renders the backend-owned machine-readable snapshot
- intro section owns hero layout and motion behavior
- other sections render backend-owned content from the shared snapshot/API layer

### Frontend tracker

Main areas:

- `frontend/src/tracker/pages`
- `frontend/src/tracker/shell`
- `frontend/src/tracker/modules`
- `frontend/src/tracker/shared`
- `frontend/src/tracker/styles`

Module families currently present:

- `tasks`
- `tasks-hub`
- `pipeline`
- `finance`

Use the existing module pattern unless you have a strong reason not to:

- `api.ts`
- `hooks.ts`
- `types.ts`
- `components/`

### Backend portfolio

Main areas:

- `backend/src/portfolio/content`
- `backend/src/portfolio/contracts`
- `backend/src/portfolio/controllers`
- `backend/src/portfolio/routes`
- `backend/src/portfolio/services`

Important services:

- `portfolioSnapshotService.ts`
- `llmsTextService.ts`
- `portfolioExportService.ts`
- `githubStatsService.ts`
- `weatherService.ts`
- `leetcodeService.ts`

### Backend tracker

Main areas:

- `backend/src/tracker/finance`
- `backend/src/tracker/calendar`
- `backend/src/tracker/cron`
- `backend/src/tracker/shared`

Tracker routes mount through:

- `backend/src/tracker/index.ts`

## Tooling Rules

### Package manager

This repository is Bun-only.

- use `bun install`
- use `bun run <script>`
- do not use `npm`
- do not use `yarn`
- do not use `pnpm`

### Useful commands

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
bun run start
```

## Environment Variables

Frontend local env:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend local env:

- see `backend/.env.example`

Important portfolio variables:

- `GITHUB_USERNAME`
- `GITHUB_TOKEN`
- `LEETCODE_USERNAME`
- `OPENWEATHER_API_KEY`

Tracker-related local setup also requires the Supabase and Google Calendar variables defined in the backend example file.

Defaults such as `PORT` and `GITHUB_STATS_TTL_MS` already live in `backend/.env.example`.

## Asset And Content Rules

- keep public asset paths rooted at `/portfolio/...`
- use stable slug-based filenames where possible
- remove placeholder links like `#`
- do not leave empty strings for optional links if the field should really be absent
- keep public collection records slug-based and ordered

## Skills And MCP Guidance

If you are doing frontend design or major UI work, use the frontend design skill.

- Skill: `frontend-design`

If you are working on React performance or rendering behavior, the Vercel React best-practices skill is relevant.

- Skill: `vercel-react-best-practices`

Available MCP/tooling context in this repo/session can include:

- Vercel MCP
- Supabase/Convex MCPs when relevant
- Linear MCP when issue tracking is involved
- Playwright tooling for browser-level verification

Use them when they materially help the task instead of guessing.

## Editing Expectations

- prefer surgical changes over broad churn
- preserve the portfolio/tracker split
- preserve backend-owned portfolio content
- preserve Bun-only workflow
- update docs when you make structural decisions
- if you change API shape, update both backend contract definitions and frontend local API contracts

## Quick Start For A New Developer

1. Read `docs/active/REPO_GUIDE.md`
2. Read `docs/active/PORTFOLIO_CONTENT_EDITING.md` if touching the public site
3. Read `docs/active/TRACKER_ARCHITECTURE.md` if touching the tracker
4. Start backend and frontend locally
5. Verify whether the task belongs to `portfolio` or `tracker` before editing anything
