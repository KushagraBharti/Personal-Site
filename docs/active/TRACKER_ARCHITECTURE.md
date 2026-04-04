# Tracker Architecture

## Scope

The tracker is the private application surface. It is separate from the public portfolio and should stay separate in both frontend and backend.

Current scope:

- tasks
- tasks hub
- pipeline/workflow tracking
- calendar-connected planning

Finance is not part of the active tracker anymore.

## Frontend Layout

Tracker frontend code lives under:

- `frontend/src/tracker/pages`
- `frontend/src/tracker/shell`
- `frontend/src/tracker/modules`
- `frontend/src/tracker/shared`
- `frontend/src/tracker/styles`

Primary entrypoint:

- `frontend/src/tracker/pages/TrackerPage.tsx`

Shell and registry:

- `frontend/src/tracker/shell/TrackerShell.tsx`
- `frontend/src/tracker/shell/registry.ts`

Current module families:

- `tasks`
- `tasks-hub`
- `pipeline`

Each module generally owns its own:

- `api.ts`
- `hooks.ts`
- `types.ts`
- `components/`

## Backend Layout

Tracker backend code lives under:

- `backend/src/tracker/calendar`
- `backend/src/tracker/cron`
- `backend/src/tracker/shared`

Mounting entrypoint:

- `backend/src/tracker/index.ts`

Route subtrees:

- `/api/private/calendar`
- `/api/private/cron`

## Calendar

Calendar backend files include:

- `backend/src/tracker/calendar/routes/calendarRoutes.ts`
- `backend/src/tracker/calendar/services/googleCalendarApiService.ts`
- `backend/src/tracker/calendar/services/googleCalendarOAuthService.ts`
- `backend/src/tracker/calendar/services/taskCalendarSyncService.ts`
- `backend/src/tracker/calendar/services/calendarWebhookService.ts`
- `backend/src/tracker/calendar/services/calendarSyncQueueService.ts`

## Cron

Cron backend routing lives in:

- `backend/src/tracker/cron/routes/cronRoutes.ts`

Current Vercel cron config is in:

- `backend/vercel.json`

Current scheduled endpoints target:

- `/api/private/cron/calendar-sync`
- `/api/private/cron/calendar-watch-renew`

## Shared Backend Services

Tracker-wide backend utilities belong in:

- `backend/src/tracker/shared`

If a tracker concern is reused across multiple tracker domains, keep it there rather than moving it into portfolio code.

## Working Rules

- keep tracker concerns inside `frontend/src/tracker` and `backend/src/tracker`
- do not move tracker-specific logic into portfolio folders
- prefer module-local APIs/hooks/types unless the concern is genuinely shared
- treat structural cleanup and behavior changes as separate work

## Verification

Typical checks after tracker edits:

```bash
cd frontend
bun run build
```

```bash
cd backend
bun run build
```

For broader checks from the repo root:

```bash
bun run verify
```

If tracker API shapes or browser flows changed, also run the relevant tests and verify `/tracker` manually.
