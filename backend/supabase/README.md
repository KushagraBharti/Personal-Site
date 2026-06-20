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

## Types

```bash
npm run supabase:types:local
npm run supabase:types:linked
```

Use `types:local` when the local stack is running. Use `types:linked` after linking to the remote project.
