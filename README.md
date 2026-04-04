# Personal Site

[Live Site](https://www.kushagrabharti.com)

This repo powers two connected products in one codebase: a public portfolio and a private tracker. The public side is interactive, animated, backend-authored, and machine-readable through `/ai` and `llms.txt`. The private side is a personal operating layer for tasks, workflow tracking, and calendar-connected planning. The backend owns portfolio content and live integrations; the frontend focuses on presentation, interaction, and route-level UX.

![Personal Site Preview](personal-site-preview.png)

## Highlights

- Interactive homepage with a staged hero, floating cards, live widgets, and progressively loaded sections
- Backend-owned portfolio content for intro, about, education, experiences, projects, media, and AI metadata
- Canonical `/ai` route and generated `llms.txt` built from the same backend snapshot
- Private tracker shell with modular task, tasks-hub, pipeline, and calendar-connected flows
- Live GitHub and weather integrations so the portfolio stays current
- Clean repo split between `portfolio` and `tracker` across both frontend and backend

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: Express, TypeScript, Axios
- Data/Auth: Supabase
- Integrations: GitHub API, OpenWeather, Google Calendar
- Testing: Vitest, Testing Library, Supertest, Playwright
- Deployment/Tooling: Vercel, Bun

## Getting Started

### Prerequisites

- Bun
- GitHub token for live GitHub stats
- OpenWeather API key for weather
- Supabase credentials if you want local tracker auth

### Clone

```bash
git clone https://github.com/KushagraBharti/Personal-Site.git
cd Personal-Site
```

### Frontend setup

```bash
cd frontend
bun install
cp .env.local.example .env.local
```

Populate `frontend/.env.local` with:

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend setup

```bash
cd backend
bun install
cp .env.example .env
```

Populate `backend/.env` with at least:

```bash
GITHUB_USERNAME=
GITHUB_TOKEN=
OPENWEATHER_API_KEY=
```

### Run locally

Frontend:

```bash
cd frontend
bun run dev
```

Backend:

```bash
cd backend
bun run dev
```

## Verification

Normal repo check:

```bash
bun install
bun run verify
```

Available tiers:

- `bun run verify` -> npm-backed installs, then build, lint, unit, integration
- `bun run verify:live` -> `verify` plus live backend checks
- `bun run verify:full` -> `verify` plus Playwright smoke and mocked E2E
- `bun run verify:full:live` -> everything

## Notes

- This repo is Bun-first. Normal app work uses Bun; the repo-level `verify` commands are allowed to use npm internally because Bun is unstable for this test toolchain in the current Windows + OneDrive environment.
- Portfolio content lives in `backend/src/portfolio/content`.
- `frontend/public/llms.txt` is synced from backend export logic during frontend dev/build.
- `/` is eager-loaded; `/ai` and `/tracker` are lazy-loaded.
- Weather is backend-driven and does not use browser location prompts.
