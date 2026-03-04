# Google Calendar Two-Way Sync Setup

This project now includes two-way Google Calendar sync for the Tracker Tasks module.

## 1) Supabase setup

1. Open Supabase SQL Editor.
2. Run:
   - `backend/sql/2026-03-04_tracker_tasks_due_timezone.sql`
   - `backend/sql/2026-03-04_tracker_google_sync_jobs_fk_fix.sql`
3. Verify tables exist:
   - `tracker_google_calendar_connections_public`
   - `tracker_google_calendar_connections_secrets`
   - `tracker_task_google_event_links`
   - `tracker_task_list_sync_settings`
   - `tracker_google_sync_jobs`

## 2) Google Cloud setup

1. Open Google Cloud Console and select/create a project.
2. Enable **Google Calendar API**.
3. Configure OAuth consent screen:
   - User type: External
   - Add test users if still in testing mode
   - For longer-lived refresh-token behavior, move Publishing Status to **In production**
4. Create OAuth Client ID (Web application).
5. Add redirect URIs:
   - Local: `http://localhost:5000/api/private/calendar/google/callback`
   - Prod: `https://<your-backend-domain>/api/private/calendar/google/callback`

## 3) Backend env vars

Add these in backend environment (see `backend/.env.example`):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_WEBHOOK_URL` (must be public HTTPS endpoint for `/api/private/calendar/google/webhook`)
- `GOOGLE_OAUTH_STATE_SECRET` (long random secret)
- `GOOGLE_EVENT_TIMEZONE` (optional fallback, defaults to `UTC`; used when a task has no stored timezone yet)
- `TRACKER_FRONTEND_URL` (for callback redirect; e.g. `https://<frontend>/tracker?module=tasks`)
- `CALENDAR_SYNC_ENABLED=1`
- existing required vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ENCRYPTION_KEY`
  - `CRON_SECRET`

## 4) Cron jobs

Call these endpoints with `Authorization: Bearer <CRON_SECRET>`:

- Daily fallback (Vercel Hobby-compatible):
  - `POST /api/private/cron/calendar-sync`
- Daily watch renew:
  - `POST /api/private/cron/calendar-watch-renew`

Notes:
- On Vercel Hobby, cron schedules must run at most once per day.
- Near-real-time sync is handled by:
  - Google webhook events (`/api/private/calendar/google/webhook`)
  - User-triggered sync (`/api/private/calendar/sync-now`, called by app actions)
- Cron is now a safety fallback for catch-up + watch maintenance.

## 5) App usage flow

1. Open Tracker -> Tasks.
2. In sidebar, use **Calendar Sync**:
   - Click **Connect Google**
   - OAuth callback auto-creates/selects calendar named `Tracker Tasks`
3. For each list to sync, enable the new sync checkbox in the list row.
4. Use **Sync now** for immediate processing.
   - `POST /api/private/calendar/sync-now` enqueues + processes a bounded batch immediately
   - Response includes processed/failed counts and top failure messages

## 6) Behavior implemented

- App is source of truth for completion.
- Google edits sync back for:
  - title
  - due date/time
  - description/details
- Subtasks sync as individual events.
- Date-only tasks sync as all-day events.
- Timed tasks store timezone per task (captured from browser timezone at creation/update).
- Existing timed tasks without timezone are auto-seeded from current browser timezone when loading Tasks.
- Conflict resolution uses newest edit timestamp.
- Incremental inbound sync uses sync tokens and handles 410 token resets.
- Queue has retry + dead-letter behavior.

