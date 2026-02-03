# Migration Notes

**Executive Summary**
- Refactored `/tracker` into a modular feature system with a shared shell, module registry, and per-module `api.ts`/`hooks.ts`/`components/`.
- Public portfolio pages and styling remain identical in behavior and appearance; only tracker internals were reorganized.
- Tasks and pipeline functionality were preserved 1:1 and relocated into dedicated modules.
- Added a finance tracker placeholder module to establish the future architecture without implementing logic.
- Introduced a tracker-wide auth/context layer so modules share session, Supabase client, and loading state.
- Extracted shared tracker utilities (dates, styles, types) to keep modules focused and consistent.
- Standardized tracker Supabase usage via a thin re-export (`shared/supabase/client.ts`) to avoid multiple client instances.
- Backend routes/controllers/services were reorganized into public/private folders with central route mounting.
- Added shared middleware for error handling and cron-secret verification (future use).
- Assumed existing Supabase tables/RLS and environment variables remain unchanged.

**New Repository Tree (High-Level)**
```text
frontend/src
  components/                 # Public site components (unchanged)
  features/
    tracker/
      TrackerShell.tsx        # Auth gate + layout + module nav
      registry.ts             # Module registry
      shared/
        hooks/
          useTrackerAuth.ts
          useTrackerContext.ts
        supabase/
          client.ts
        utils/
          date.ts
        styles.ts
        types.ts
      modules/
        tasks/
          api.ts
          hooks.ts
          types.ts
          components/
            TasksTracker.tsx
        pipeline/
          api.ts
          hooks.ts
          types.ts
          components/
            PipelineTracker.tsx
        finance/
          api.ts
          hooks.ts
          types.ts
          components/
            FinanceTracker.tsx
  pages/
    Home.tsx                  # Public site (unchanged)
    Tracker.tsx               # Now renders <TrackerShell />
  lib/
    supabaseClient.ts         # Existing Supabase client (unchanged)
  types/
    tracker.ts                # Re-export of tracker shared types
```

```text
backend/src
  app.ts
  server.ts
  routes/
    index.ts                  # Central route mounting
    public/
      index.ts
      projectRoutes.ts
      experienceRoutes.ts
      educationRoutes.ts
      introRoutes.ts
      githubRoutes.ts
      weatherRoutes.ts
      leetcodeRoutes.ts
    private/
      index.ts
      financeRoutes.ts        # Placeholder
      cronRoutes.ts           # Placeholder + CRON_SECRET check
  controllers/
    public/
      projectController.ts
      experienceController.ts
      educationController.ts
      introController.ts
      githubController.ts
      weatherController.ts
      leetcodeController.ts
  services/
    public/
      githubStatsService.ts
  middleware/
    errorHandler.ts
    cronAuth.ts
  data/
  config/
```

**Old → New Mapping (Tracker)**
| Old Path | New Path | Notes |
| --- | --- | --- |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/TrackerShell.tsx` | Auth gate, layout, nav extracted to shell |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/modules/tasks/components/TasksTracker.tsx` | Weekly tasks UI moved as-is |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/modules/tasks/hooks.ts` | Tasks orchestration/state split out |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/modules/tasks/api.ts` | Tasks Supabase access split out |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/modules/pipeline/components/PipelineTracker.tsx` | Pipeline UI moved as-is |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/modules/pipeline/hooks.ts` | Pipeline orchestration/state split out |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/modules/pipeline/api.ts` | Pipeline Supabase access split out |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/shared/utils/date.ts` | Date helpers extracted |
| `frontend/src/pages/Tracker.tsx` | `frontend/src/features/tracker/shared/styles.ts` | Shared UI class constants extracted |
| `frontend/src/types/tracker.ts` | `frontend/src/features/tracker/shared/types.ts` | Canonical tracker types live here |
| `frontend/src/types/tracker.ts` | `frontend/src/types/tracker.ts` | Now re-exports shared types for legacy imports |
| `frontend/src/lib/supabaseClient.ts` | `frontend/src/features/tracker/shared/supabase/client.ts` | Re-export wrapper for tracker modules |

**How To Add A New Tracker Module**
1. Create `frontend/src/features/tracker/modules/<module-name>/` with this structure:
```text
modules/<module-name>/
  api.ts
  hooks.ts
  types.ts
  components/
    <ModuleName>Tracker.tsx
```
2. Implement data access in `api.ts` and state/orchestration in `hooks.ts`.
3. Build the UI in `components/<ModuleName>Tracker.tsx`.
4. Register the module in `frontend/src/features/tracker/registry.ts`:
```ts
{
  id: "<module-id>",
  label: "<Nav Label>",
  Component: <ModuleName>Tracker,
}
```
5. The module will appear in the `/tracker` navigation automatically via the registry.
6. Optional deep-link: `/tracker?module=<module-id>` selects the module; default is `tasks` if missing/invalid.
7. Optional lazy-load: replace the static import in `registry.ts` with `React.lazy` and wrap rendering in `Suspense` (not currently enabled).

**Runtime Verification Checklist**
Commands:
```bash
cd backend
npm run dev

cd frontend
npm run dev

cd backend
npm run build

cd frontend
npm run build
```
Manual checks:
- Home page sections (Intro/About/Education/Experience/Projects) render and animate exactly as before.
- `/tracker` loads, prompts for auth, and renders the shell layout.
- Tasks module works: weekly navigation, templates, snapshots, and status updates.
- Pipeline module works: create/update/archive deals.
- Refreshing `/tracker` (including `/tracker?module=pipeline`) preserves module selection.

**Backend Changes (Explicit)**
Public endpoints (unchanged paths and response shapes):
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/experiences`
- `GET /api/experiences/:id`
- `GET /api/education`
- `GET /api/education/:id`
- `GET /api/intro`
- `GET /api/github/stats`
- `GET /api/weather`
- `GET /api/leetcode/stats`

New private scaffolding (placeholders):
- `GET /api/private/finance/health`
- `GET /api/private/cron/health` (requires `CRON_SECRET` via `Authorization: Bearer <secret>` or `x-cron-secret`)

New middleware:
- `backend/src/middleware/errorHandler.ts` for centralized error responses
- `backend/src/middleware/cronAuth.ts` for cron secret verification (supports `Authorization: Bearer` + `x-cron-secret`)

**Plan 2 (Finance) Notes**
- Frontend placeholder lives at `frontend/src/features/tracker/modules/finance/`.
- Backend placeholder lives at `backend/src/routes/private/financeRoutes.ts` and is mounted at `/api/private/finance`.
- Shared utilities for reuse: `frontend/src/features/tracker/shared/hooks/useTrackerContext.ts`, `frontend/src/features/tracker/shared/supabase/client.ts`, and `frontend/src/features/tracker/shared/utils/date.ts`.
- Private API naming convention: `/api/private/<domain>` with routes under `backend/src/routes/private/`.
- Cron auth secret is defined in `backend/.env.example` as `CRON_SECRET`.
- Finance placeholder is inert (no data calls); it only renders a “coming soon” message.
- Plan 2 should add Supabase JWT verification middleware for private routes and derive `user_id` from the token.
