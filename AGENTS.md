# Developer Guide

`AGENTS.md` and `CLAUDE.md` must stay identical. Keep this file short, operational, and current; it is the fast onboarding file for coding agents.

## Repo Shape

This repo has two product surfaces:

- `portfolio`: public site, `/ai`, public APIs, generated `llms.txt`/`portfolio.json`/`version.json`, public assets
- `tracker`: private task, workflow, pipeline, and calendar-connected planning app

Keep the split intact in both apps.

Frontend:

- `frontend/src/portfolio`
- `frontend/src/tracker`
- `frontend/src/shared`

Backend:

- `backend/src/portfolio`
- `backend/src/tracker`
- `backend/src/routes`

Routes:

- `/` -> public homepage
- `/ai` -> AI-readable portfolio page
- `/tracker` -> private tracker
- `/api` -> public portfolio APIs
- `/api/private` -> tracker APIs

## Non-Negotiable Decisions

- Portfolio content is backend-owned. Edit `backend/src/portfolio/content/*` first.
- Portfolio writings/thoughts are configured in `backend/src/portfolio/content/writings.ts`; each entry reads its hover preview body from `backend/src/portfolio/content/writings/*.md`.
- Frontend API-facing portfolio contracts live in `frontend/src/portfolio/api/contracts.ts`.
- Backend portfolio contracts live in `backend/src/portfolio/contracts`.
- `frontend/scripts/sync-portfolio-exports.mjs` generates `frontend/index.html`, `frontend/ai.html`, `frontend/public/llms.txt`, `frontend/public/portfolio.json`, `frontend/public/version.json`, `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, `frontend/src/portfolio/generated/introBootstrap.ts`, and `frontend/src/portfolio/generated/portfolioSnapshotBootstrap.ts`.
- `/` is statically prerendered from the real React homepage shell, then hydrated. Media-heavy homepage enhancements, the 3D model, and live data load after first paint with no skeleton placeholders. `/ai` and `/tracker` are lazy.
- Public portfolio fonts are self-hosted in `frontend/public/portfolio/fonts`; do not add Google Fonts back to the critical path.
- Public portfolio images should prefer optimized AVIF/WebP variants via `PortfolioImage`, with original PNG/SVG assets kept as fallback sources.
- Weather is backend-driven and must not trigger browser location prompts.
- GitHub stats should prefer the GraphQL contribution path.
- Public live widget APIs are currently GitHub stats and weather; keep any frontend usage explicit and route it through the backend.
- Finance is removed. Do not reintroduce tracker finance modules, routes, docs, or UI.

## Where To Work

Portfolio:

- content -> `backend/src/portfolio/content`
- writings markdown -> `backend/src/portfolio/content/writings/*.md`
- contracts -> `backend/src/portfolio/contracts` and `frontend/src/portfolio/api/contracts.ts`
- services/routes/controllers -> `backend/src/portfolio/*`
- frontend pages/sections/widgets -> `frontend/src/portfolio/*`
- public assets -> `frontend/public/portfolio/...`

Tracker:

- frontend shell/modules/shared -> `frontend/src/tracker/*`
- backend calendar/cron/task-list services -> `backend/src/tracker/*`
- private auth middleware -> `backend/src/middleware/requireUser.ts`

Current tracker modules:

- `tasks` -> tasks-hub UI
- `weekly` -> older weekly tasks UI
- `pipeline` -> active deals/workflow tracking

## Known Codebase Notes

- `AboutSection` renders backend-owned about copy and featured writings, while `FeaturedSection` still hardcodes some public project selections in the frontend. Prefer moving future public content changes to backend content rather than adding more frontend content sources.
- Tracker CRUD mostly uses Supabase from the browser. Backend private APIs are for service-role work, Google Calendar sync, cron, and task-list deletion.
- Calendar sync has queue-based and legacy fallback paths; preserve compatibility unless the migration state is explicitly being cleaned up.
- The old `docs/` tree has been removed. Do not point new onboarding instructions at `docs/active/*`.

## Environment

Frontend local env:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend env:

- use `backend/.env.example`
- key portfolio vars: `GITHUB_USERNAME`, `GITHUB_TOKEN`, `OPENWEATHER_API_KEY`
- tracker/calendar vars: Supabase service-role values and Google Calendar OAuth/webhook values from the example file

## Workflow

This repo is Bun-first, with one exception:

- use Bun for normal app work, installs, dev servers, builds, and linting
- use repo-level `verify` commands for broad testing
- `verify` uses npm internally because it is more reliable for the test toolchain in this Windows + OneDrive environment

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

Repo checks:

```bash
bun install
bun run verify
```

Verification tiers:

- `bun run verify` -> npm-backed installs, then build, lint, unit, integration
- `bun run verify:live` -> `verify` plus live backend checks

## Editing Rules

- Preserve the portfolio/tracker separation.
- Keep public asset paths under `/portfolio/...`.
- Use slug-based, ordered portfolio records.
- Remove placeholder links instead of leaving `#`.
- Update `README.md`, `AGENTS.md`, and `CLAUDE.md` when repo structure, commands, or non-obvious behavior changes.
- Keep `AGENTS.md` and `CLAUDE.md` identical.

## First Read For A New Developer

1. `README.md`
2. `backend/src/portfolio/content/*` for public content changes
3. `frontend/src/App.tsx` and `backend/src/routes/index.ts` for route mounting
4. `frontend/src/tracker/shell/registry.ts` for tracker modules
