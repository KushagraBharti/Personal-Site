# Developer Guide

`AGENTS.md` and `CLAUDE.md` should stay identical. This is the fast onboarding file for the repo.

## Repo Shape

There are two product surfaces:

- `portfolio`: the public site, `/ai`, public APIs, and generated `llms.txt`
- `tracker`: the private app for tasks, pipeline work, and calendar-connected planning

Keep that split intact in both apps.

Frontend:

- `frontend/src/portfolio`
- `frontend/src/tracker`
- `frontend/src/shared`

Backend:

- `backend/src/portfolio`
- `backend/src/tracker`
- `backend/src/routes`

Routes:

- `/` -> homepage
- `/ai` -> machine-readable portfolio page
- `/tracker` -> private tracker
- `/api` -> public portfolio APIs
- `/api/private` -> tracker APIs

## Non-Negotiable Decisions

- Portfolio content is backend-owned. Edit `backend/src/portfolio/content/*` first.
- The frontend presents portfolio data; it should not become a second content source.
- Frontend API contracts live in `frontend/src/portfolio/api/contracts.ts`. Do not import backend runtime files into the frontend just to share types.
- `llms.txt` is generated from backend services and synced into `frontend/public/llms.txt` by `frontend/scripts/sync-portfolio-exports.ts`.
- The homepage must stay fast. `/` is eager; `/ai` and `/tracker` are lazy; intro renders first; non-critical data hydrates later.
- Weather is backend-driven and must not trigger browser location prompts. Vercel geo headers are used when available; Austin is the fallback.
- GitHub stats should revalidate on mount and prefer the GraphQL contribution path.

## Where To Work

Portfolio:

- content -> `backend/src/portfolio/content`
- contracts -> `backend/src/portfolio/contracts`
- services/routes/controllers -> `backend/src/portfolio/*`
- frontend pages/sections/widgets -> `frontend/src/portfolio/*`

Tracker:

- frontend shell/modules/shared -> `frontend/src/tracker/*`
- backend calendar/cron/shared -> `backend/src/tracker/*`

Current tracker modules:

- `tasks`
- `tasks-hub`
- `pipeline`

## Environment

Frontend local env:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend env:

- use `backend/.env.example`
- key portfolio vars are `GITHUB_USERNAME`, `GITHUB_TOKEN`, `LEETCODE_USERNAME`, and `OPENWEATHER_API_KEY`
- tracker setup uses the Supabase and Google Calendar vars in the example file

## Workflow

This repo is Bun-only.

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

## Tooling

Use the relevant tools instead of guessing:

- `frontend-design` for major UI work
- `vercel-react-best-practices` for React performance or rendering behavior
- Vercel MCP for deploy/runtime checks
- Playwright tooling for browser verification
- Supabase or Convex tooling only when the task actually touches those systems

## Editing Rules

- Preserve the portfolio/tracker separation.
- Keep public asset paths under `/portfolio/...`.
- Use slug-based, ordered portfolio records.
- Remove placeholder links instead of leaving `#`.
- Update docs when structure or behavior changes.

## First Read For A New Developer

1. `docs/active/REPO_GUIDE.md`
2. `docs/active/PORTFOLIO_CONTENT_EDITING.md` for portfolio work
3. `docs/active/TRACKER_ARCHITECTURE.md` for tracker work
