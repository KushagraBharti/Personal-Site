# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

All commands use **bun** as the package manager.

### Frontend (Vite + React)
```bash
cd frontend
bun install           # Install dependencies
bun run dev           # Start dev server at http://localhost:5173
bun run build         # TypeScript check + Vite production build
bun run lint          # ESLint
bun run preview       # Preview production build
```

### Backend (Express + TypeScript)
```bash
cd backend
bun install           # Install dependencies
bun run dev           # Start dev server with nodemon at http://localhost:5000
bun run build         # Compile TypeScript to dist/
bun run start         # Run compiled production build
```

### Running Both Servers
Run frontend and backend in separate terminals. Frontend expects backend at `http://localhost:5000` (configured via `VITE_API_BASE_URL` in `.env.local`).

## Architecture Overview

### Monorepo Structure
```
Personal-Site/
├── frontend/          # React SPA (Vite, TailwindCSS, Framer Motion)
├── backend/           # Express API (TypeScript, Supabase, Plaid)
└── *.md               # Documentation
```

### Frontend Architecture

**Public Portfolio** (`frontend/src/components/`, `frontend/src/pages/Home.tsx`):
- Standard React components for portfolio sections (Intro, About, Education, Experience, Projects)
- Uses glassmorphism design system via `.glass` CSS class and `ui/` components
- Lazy-loaded sections with Framer Motion animations

**Private Tracker** (`frontend/src/features/tracker/`):
- Modular feature system with shared shell and module registry
- Each module follows: `modules/<name>/api.ts`, `hooks.ts`, `types.ts`, `components/`
- Current modules: `tasks`, `pipeline`, `finance`
- Shared context via `TrackerShell.tsx` (auth gate + layout + nav)
- Module selection via URL param: `/tracker?module=<module-id>`

**Adding a new tracker module:**
1. Create `frontend/src/features/tracker/modules/<name>/` with api.ts, hooks.ts, types.ts, components/
2. Register in `frontend/src/features/tracker/registry.ts`
3. Module appears automatically in `/tracker` navigation

### Backend Architecture

**Routes organization** (`backend/src/routes/`):
- `public/` - Portfolio API endpoints (projects, experiences, education, intro, github, weather, leetcode)
- `private/` - Authenticated endpoints (finance, cron)
- Central mounting in `routes/index.ts`

**Layered pattern**: Routes → Controllers → Services → External APIs / Data

**Static data**: Portfolio content lives in `backend/src/data/*.ts` (projects, experiences, education, intro)

**Middleware** (`backend/src/middleware/`):
- `errorHandler.ts` - Centralized error responses
- `cronAuth.ts` - CRON_SECRET verification
- `requireUser.ts` - Supabase JWT verification for private routes

### External Services

- **GitHub API** - Stats with in-memory caching (10min TTL via `GITHUB_STATS_TTL_MS`)
- **OpenWeatherMap** - Weather proxy
- **LeetCode Stats API** - Problem-solving statistics
- **Supabase** - Database + auth for tracker features
- **Plaid** - Bank account linking for finance module

## Environment Variables

### Frontend (`frontend/.env.local`)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend (`backend/.env`)
Copy from `backend/.env.example` and fill in values.

## Key Conventions

- **Styling**: TailwindCSS utilities + glassmorphism (`.glass` class in `frontend/src/index.css`)
- **UI Components**: Reusable glass components in `frontend/src/components/ui/`
- **Tracker state**: Uses React hooks + Supabase client, no global state library
- **API caching**: Frontend uses sessionStorage, backend uses in-memory cache
- **TypeScript**: Strict mode enabled in both frontend and backend
