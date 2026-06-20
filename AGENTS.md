# Developer Guide

`AGENTS.md` and `CLAUDE.md` must stay identical. Keep this file short, operational, and current; it is the fast onboarding file for coding agents.

## Repo Shape

This repo has two product surfaces:

- `portfolio`: public site, `/ai`, public APIs, generated `llms.txt`/`portfolio.json`/`version.json`, public assets
- `tracker`: private task and calendar-connected planning app

Keep the split intact in both apps.

Frontend:

- `frontend/src/portfolio`
- `frontend/src/tracker`
- `frontend/src/shared`

Backend:

- `backend/src/portfolio`
- `backend/src/tracker`
- `backend/src/routes`

Database tooling:

- `backend/supabase/config.toml`

Routes:

- `/` -> public homepage
- `/ai` -> AI-readable portfolio page
- `/tracker` -> private tracker
- `/api` -> public portfolio APIs
- `/api/private` -> tracker APIs
- `/api/mcp` -> tracker MCP endpoint for Poke

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

Supabase:

- CLI config -> `backend/supabase`

Current tracker modules:

- `tasks` -> tasks-hub UI

## Known Codebase Notes

- `AboutSection` renders backend-owned about copy and featured writings, while `FeaturedSection` still hardcodes some public project selections in the frontend. Prefer moving future public content changes to backend content rather than adding more frontend content sources.
- Tracker frontend uses Supabase for auth/session. Task/list CRUD, custom ordering, sort preferences, task completion, recurrence repair, cron, and Google Calendar sync go through backend private APIs.
- Tracker MCP uses a separate bearer token, scopes to `TRACKER_MCP_OWNER_USER_ID`, and only sees non-archived task lists with Google Calendar sync enabled.
- Tracker UI realtime refresh uses Supabase Realtime Broadcast from DB on private `tracker:user:<user_id>` topics. Broadcast payloads are invalidation signals only; the frontend refetches backend private APIs.
- Calendar sync uses the live queue path; do not add legacy task-change trigger paths back.
- Supabase CLI config lives in `backend/supabase/config.toml`; this repo intentionally does not keep checked-in SQL snapshots or migrations.
- The old `docs/` tree has been removed. Do not point new onboarding instructions at `docs/active/*`.

## Environment

Frontend local env:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend env:

- use `backend/.env.example`
- key portfolio vars: `GITHUB_USERNAME`, `GITHUB_TOKEN`, `OPENWEATHER_API_KEY`
- tracker/calendar vars: prefer `SUPABASE_SERVICE_ROLE_KEY` with a service-role JWT; `SUPABASE_SECRET_KEY` is a fallback server key
- tracker MCP vars: `TRACKER_MCP_ENABLED`, `TRACKER_MCP_API_KEY`, `TRACKER_MCP_OWNER_USER_ID`, optional `TRACKER_MCP_ALLOWED_ORIGINS`, `TRACKER_MCP_ALLOWED_POKE_USER_IDS`, `TRACKER_MCP_DEFAULT_TIMEZONE`
- production CORS only accepts known frontend aliases unless `ALLOW_VERCEL_PREVIEW_ORIGINS=1` is set
- frontend tracker env must use only Supabase anon/publishable values; never expose service-role or `sb_secret_*` keys to Vite env

## Workflow

This repo is Bun-first, with repo-level npm exceptions:

- use Bun for normal app work, installs, dev servers, builds, and linting
- use repo-level `verify` commands for broad testing
- use repo-level `supabase:*` commands for Supabase CLI work
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

Supabase:

```bash
npm install
npm run supabase:start
npm run supabase:status
npm run supabase:types:local
npm run supabase:types:linked
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
3. `frontend/src/main.tsx` and `backend/src/routes/index.ts` for route mounting
4. `frontend/src/tracker/shell/registry.ts` for tracker modules
