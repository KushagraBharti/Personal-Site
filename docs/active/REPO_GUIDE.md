# Repository Guide

## Product Split

This repository is organized around two product surfaces:

- `portfolio`: the public site, `/ai`, `llms.txt`, public assets, and public APIs
- `tracker`: the private productivity, finance, and calendar tooling

Both the frontend and backend mirror that split.

## Source Of Truth

The backend owns all portfolio-authored content.

Edit portfolio content in:

- `backend/src/portfolio/content/profile.ts`
- `backend/src/portfolio/content/about.ts`
- `backend/src/portfolio/content/intro.ts`
- `backend/src/portfolio/content/media.ts`
- `backend/src/portfolio/content/ai.ts`
- `backend/src/portfolio/content/education.ts`
- `backend/src/portfolio/content/experiences.ts`
- `backend/src/portfolio/content/projects.ts`

The frontend should present that data, not redefine it.

## Contracts Boundary

The only backend surface the frontend may import from is:

- `backend/src/portfolio/contracts`

Do not import backend content, services, controllers, or routes into frontend runtime code.

## Public Assets

Public portfolio assets live under:

- `frontend/public/portfolio/profile`
- `frontend/public/portfolio/projects`
- `frontend/public/portfolio/media`
- `frontend/public/portfolio/icons`

Use stable, slug-based filenames.

## AI Page And llms.txt

Canonical portfolio snapshot generation lives in:

- `backend/src/portfolio/services/portfolioSnapshotService.ts`

Canonical `llms.txt` generation lives in:

- `backend/src/portfolio/services/llmsTextService.ts`
- `backend/src/portfolio/services/portfolioExportService.ts`

Frontend build sync uses:

- `frontend/scripts/sync-portfolio-exports.ts`

That script writes:

- `frontend/public/llms.txt`

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
