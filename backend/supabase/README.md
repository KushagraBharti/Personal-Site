# Supabase CLI Setup

This folder contains the Supabase CLI project config for the private tracker.

The CLI is pinned in the root `package.json`. Root `supabase:*` scripts pass `--workdir backend/supabase`, so run them from the repo root.

## First-Time Setup

```bash
npm install
npm run supabase:link -- --project-ref <your-project-ref>
```

The project ref is the short Supabase ref from the dashboard URL, for example `abcdefghijklmnopqrst`.

## Local Development

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

`supabase start` requires Docker Desktop.

## Schema

This repo intentionally does not keep checked-in SQL snapshots or migrations. The live Supabase project is the source of truth for tracker database objects.

The tracker code expects these live objects to exist:

- `tracker_task_lists`
- `tracker_tasks`
- `tracker_task_sort_preferences`
- `tracker_task_list_sync_settings`
- `tracker_google_calendar_connections_public`
- `tracker_google_calendar_connections_secrets`
- `tracker_google_sync_jobs`
- `tracker_google_sync_runs`
- `tracker_task_google_event_links`
- `tracker_task_google_projection_event_links`
- RPCs: `claim_sync_jobs`, `complete_sync_job`, `fail_sync_job`

RLS should keep user-owned tracker rows scoped by `user_id`. Backend service-role routes use `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`; frontend Vite env must only use anon/publishable Supabase credentials.

## Types

```bash
npm run supabase:types:local
npm run supabase:types:linked
```

Use `types:local` when the local stack is running. Use `types:linked` after linking to the remote project.
