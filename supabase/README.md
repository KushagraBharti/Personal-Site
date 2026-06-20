# Supabase CLI Setup

This project uses the official Supabase CLI for reproducible database work.

The CLI is checked into the root `package.json` as a pinned dev dependency. It is the right project-level tool here because it supports local Supabase, migrations, remote linking, schema diffs, pushes, and type generation. Supabase MCP is also official, but it is an AI-assistant integration and depends on each developer's MCP client and access token, so it is not a replacement for checked-in migrations.

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

## Migrations

New executable migrations should live in `supabase/migrations`.

```bash
npm run supabase:migration:new -- add_tracker_sync_functions
npm run supabase:db:reset
npm run supabase:db:push
```

The existing `backend/sql` files are historical snapshots and cleanup scripts. Keep them for context, but do not use the warning-labeled schema snapshot as a runnable migration.

## Schema Diff And Types

```bash
npm run supabase:db:diff -- --file <migration_name>
npm run supabase:types:local
npm run supabase:types:linked
```

Use `types:local` when the local stack is running. Use `types:linked` after linking to the remote project.
