# Tracker Tasks Calendar Sync Setup

This project uses a deterministic app-to-Google sync model with three lanes:

1. Live lane (automatic): per-task create/update/delete jobs.
2. Reconcile lane (`Sync now`): full differential app vs Google pass.
3. Rebuild lane (`Rebuild calendar`): wipe `Tracker Tasks` events, then rebuild from app scope.

Current source-of-truth policy: app -> Google. Inbound Google field edits are not written back to tasks.

## 1) Supabase migrations (manual)

Run these in Supabase SQL editor, in order:

1. `backend/sql/2026-03-04_tracker_tasks_due_timezone.sql`
2. `backend/sql/2026-03-04_tracker_google_sync_jobs_fk_fix.sql`
3. `backend/sql/2026-03-04_tracker_calendar_sync_rebuild.sql`

The rebuild migration adds:

1. `tracker_google_sync_runs` (run tracking).
2. New job columns (`run_id`, `lane`, `dedupe_key`, `source`, `google_event_id`).
3. Claim RPC lane filtering + ordering.
4. Live enqueue triggers on `tracker_tasks` insert/update/delete.

## 2) Google Cloud setup

1. Enable Google Calendar API.
2. Configure OAuth consent screen.
3. Add test users if app is still in Testing mode.
4. Add OAuth redirect URIs:
   - Local: `http://localhost:5000/api/private/calendar/google/callback`
   - Prod: `https://<your-backend-domain>/api/private/calendar/google/callback`

Note: Testing mode can cause refresh token expiration (frequent reconnects). Publishing to production reduces this.

## 3) Required backend env vars

1. `GOOGLE_CLIENT_ID`
2. `GOOGLE_CLIENT_SECRET`
3. `GOOGLE_OAUTH_REDIRECT_URI`
4. `GOOGLE_WEBHOOK_URL`
5. `GOOGLE_OAUTH_STATE_SECRET`
6. `GOOGLE_EVENT_TIMEZONE` (fallback only)
7. `GOOGLE_API_TIMEOUT_MS` (default `4500`)
8. `TRACKER_FRONTEND_URL`
9. `CALENDAR_SYNC_ENABLED=1`
10. `SUPABASE_URL`
11. `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
12. `ENCRYPTION_KEY`
13. `CRON_SECRET`

## 4) Cron jobs (Hobby-safe)

Current Vercel cron schedule in `backend/vercel.json` is daily:

1. `POST /api/private/cron/calendar-sync`
2. `POST /api/private/cron/calendar-watch-renew`

Realtime correctness does not depend on high-frequency cron.

## 5) API behavior

1. `POST /api/private/calendar/live-pump`
   - Processes a tiny live batch for authenticated user.
   - Used automatically by UI after task CRUD.

2. `POST /api/private/calendar/sync-now`
   - Seeds reconcile run and returns immediately with `run_id`.

3. `POST /api/private/calendar/rebuild`
   - Seeds rebuild run and returns immediately with `run_id`.

4. `GET /api/private/calendar/sync-progress?run_id=...`
   - Returns run counters/status/failures.
   - UI polls until done.

5. `GET /api/private/calendar/runs/:runId`
   - Debug view: run summary, counts by job type, recent failures.

## 6) Scope rules

Reconcile and rebuild scope:

1. Sync-enabled lists only.
2. Incomplete tasks only.
3. `due_at IS NOT NULL` only.

Timed task rule:

1. Timed tasks must carry `due_timezone`.
2. Date-only tasks keep `due_timezone = null`.

## 7) Expected behavior checklist

1. Create task in sync-enabled list with due date -> appears in `Tracker Tasks` calendar.
2. Edit task -> same event updates (no duplicate).
3. Delete task -> event deleted.
4. Mark complete / move out of sync scope -> event removed.
5. `Sync now` repairs drift (missing/stale/orphan events).
6. `Rebuild calendar` wipes and recreates from current in-scope app tasks.
