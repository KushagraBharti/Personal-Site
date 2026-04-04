# Tracker Architecture

## Scope

The tracker is the private application surface. The current refactor reorganized tracker code into clearer frontend and backend boundaries without intentionally redesigning tracker behavior.

## Frontend Tracker Layout

Tracker frontend code lives under:

- `frontend/src/tracker/pages`
- `frontend/src/tracker/shell`
- `frontend/src/tracker/modules`
- `frontend/src/tracker/shared`
- `frontend/src/tracker/styles`

Primary entrypoint:

- `frontend/src/tracker/pages/TrackerPage.tsx`

Shell and module registration:

- `frontend/src/tracker/shell/TrackerShell.tsx`
- `frontend/src/tracker/shell/registry.ts`

Current module families:

- `tasks`
- `tasks-hub`
- `pipeline`
- `finance`

Each module generally owns:

- `api.ts`
- `hooks.ts`
- `types.ts`
- `components/`

Tracker-specific shared code lives under `frontend/src/tracker/shared`, including:

- auth/context hooks
- Supabase clients
- tracker utilities
- tracker-only shared types and styles

## Backend Tracker Layout

Tracker backend code lives under:

- `backend/src/tracker/finance`
- `backend/src/tracker/calendar`
- `backend/src/tracker/cron`
- `backend/src/tracker/shared`

Mounting entrypoint:

- `backend/src/tracker/index.ts`

Current route subtrees:

- `/api/private/finance`
- `/api/private/calendar`
- `/api/private/cron`

## Finance

Finance backend code:

- `backend/src/tracker/finance/routes/financeRoutes.ts`
- `backend/src/tracker/finance/services/financeSyncService.ts`
- `backend/src/tracker/finance/services/plaidService.ts`

Finance frontend code:

- `frontend/src/tracker/modules/finance`

## Calendar

Calendar backend code:

- `backend/src/tracker/calendar/routes/calendarRoutes.ts`
- `backend/src/tracker/calendar/services/googleCalendarApiService.ts`
- `backend/src/tracker/calendar/services/googleCalendarOAuthService.ts`
- `backend/src/tracker/calendar/services/taskCalendarSyncService.ts`
- `backend/src/tracker/calendar/services/calendarWebhookService.ts`
- `backend/src/tracker/calendar/services/calendarSyncQueueService.ts`

Calendar functionality is exposed through `/api/private/calendar`.

## Cron

Cron backend code:

- `backend/src/tracker/cron/routes/cronRoutes.ts`

Current Vercel cron entries are defined in:

- `backend/vercel.json`

Current schedules target:

- `/api/private/cron/calendar-sync`
- `/api/private/cron/calendar-watch-renew`

## Shared Backend Services

Tracker backend shared services currently live in:

- `backend/src/tracker/shared/services/encryptionService.ts`

If a tracker concern is used across multiple tracker domains, it belongs in `backend/src/tracker/shared`, not under the public portfolio tree.

## Working Rules

Tracker code should follow these rules:

- keep tracker concerns inside `frontend/src/tracker` and `backend/src/tracker`
- do not move tracker-specific logic into the public portfolio tree
- prefer module-local APIs/hooks/types unless a concern is genuinely shared
- treat behavior changes as separate work from structural cleanup

## When Updating Tracker Code

Typical verification commands:

```bash
cd frontend
bun run build
```

```bash
cd backend
bun run build
```

If tracker API shapes change, also verify the relevant module integration manually through `/tracker`, since the tracker surface is still a larger interactive app with multiple moving parts.
