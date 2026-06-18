-- Supabase advisor cleanup for the tracker schema.
--
-- Run this after reviewing the generated schema snapshot in
-- backend/sql/06-18-26-personal-site-db.sql.
--
-- This file intentionally does not attempt to fix the Auth dashboard-only
-- "Leaked Password Protection Disabled" warning.

BEGIN;

-- Legacy tracker surfaces removed from the app. Dropping these also removes
-- their stale RLS policies and indexes.
DROP TABLE IF EXISTS
  public.weekly_task_status,
  public.weekly_snapshots,
  public.weekly_task_templates,
  public.pipeline_items,
  public.proof_vault_items
CASCADE;

-- RLS must be enabled for every table in the exposed public schema.
ALTER TABLE IF EXISTS public.tracker_task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_task_sort_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_google_calendar_connections_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_google_calendar_connections_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_task_google_event_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_task_list_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_google_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_google_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tracker_task_google_projection_event_links ENABLE ROW LEVEL SECURITY;

-- Replace existing policies so the advisor no longer sees duplicate permissive
-- policies or per-row auth helper calls.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'tracker_task_lists',
        'tracker_tasks',
        'tracker_task_sort_preferences',
        'tracker_google_calendar_connections_public',
        'tracker_google_calendar_connections_secrets',
        'tracker_task_google_event_links',
        'tracker_task_list_sync_settings',
        'tracker_google_sync_jobs',
        'tracker_google_sync_runs',
        'tracker_task_google_projection_event_links'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.tracker_task_lists') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_task_lists_owner_access
      ON public.tracker_task_lists
      FOR ALL
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_tasks') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_tasks_owner_access
      ON public.tracker_tasks
      FOR ALL
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK (
        (select auth.uid()) = user_id
        AND EXISTS (
          SELECT 1
          FROM public.tracker_task_lists lists
          WHERE lists.id = tracker_tasks.list_id
            AND lists.user_id = (select auth.uid())
        )
      )
    $policy$;
  END IF;

  IF to_regclass('public.tracker_task_sort_preferences') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_task_sort_preferences_owner_access
      ON public.tracker_task_sort_preferences
      FOR ALL
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK (
        (select auth.uid()) = user_id
        AND EXISTS (
          SELECT 1
          FROM public.tracker_task_lists lists
          WHERE lists.id = tracker_task_sort_preferences.list_id
            AND lists.user_id = (select auth.uid())
        )
      )
    $policy$;
  END IF;

  IF to_regclass('public.tracker_google_calendar_connections_public') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_google_calendar_connections_public_owner_read
      ON public.tracker_google_calendar_connections_public
      FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_google_calendar_connections_secrets') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_google_calendar_connections_secrets_deny_clients
      ON public.tracker_google_calendar_connections_secrets
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_task_google_event_links') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_task_google_event_links_deny_clients
      ON public.tracker_task_google_event_links
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_task_list_sync_settings') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_task_list_sync_settings_deny_clients
      ON public.tracker_task_list_sync_settings
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_google_sync_jobs') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_google_sync_jobs_deny_clients
      ON public.tracker_google_sync_jobs
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_google_sync_runs') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_google_sync_runs_deny_clients
      ON public.tracker_google_sync_runs
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;

  IF to_regclass('public.tracker_task_google_projection_event_links') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY tracker_task_google_projection_event_links_deny_clients
      ON public.tracker_task_google_projection_event_links
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false)
    $policy$;
  END IF;
END $$;

-- Keep browser access scoped to the tables the tracker frontend actually uses.
REVOKE ALL ON TABLE
  public.tracker_google_calendar_connections_secrets,
  public.tracker_task_google_event_links,
  public.tracker_task_list_sync_settings,
  public.tracker_google_sync_jobs,
  public.tracker_google_sync_runs,
  public.tracker_task_google_projection_event_links
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON TABLE
  public.tracker_task_lists,
  public.tracker_tasks,
  public.tracker_task_sort_preferences,
  public.tracker_google_calendar_connections_public
FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.tracker_task_lists,
  public.tracker_tasks,
  public.tracker_task_sort_preferences
TO authenticated;

GRANT SELECT ON TABLE
  public.tracker_google_calendar_connections_public
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.tracker_task_lists,
  public.tracker_tasks,
  public.tracker_task_sort_preferences,
  public.tracker_google_calendar_connections_public,
  public.tracker_google_calendar_connections_secrets,
  public.tracker_task_google_event_links,
  public.tracker_task_list_sync_settings,
  public.tracker_google_sync_jobs,
  public.tracker_google_sync_runs,
  public.tracker_task_google_projection_event_links
TO service_role;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Harden public functions. This resolves mutable search_path warnings and
-- removes direct client execution of SECURITY DEFINER trigger helpers.
DO $$
DECLARE
  function_identity text;
BEGIN
  FOR function_identity IN
    SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (
        p.prosecdef
        OR p.proname = ANY (ARRAY[
          'set_updated_at_timestamp',
          'set_tracker_calendar_updated_at',
          'claim_sync_jobs',
          'complete_sync_job',
          'fail_sync_job',
          'enqueue_task_google_sync_job',
          'tracker_next_due_at',
          'queue_live_sync_job_on_task_change',
          'queue_live_sync_job_on_task_delete'
        ])
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', function_identity);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', function_identity);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', function_identity);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', function_identity);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', function_identity);
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Foreign-key indexes called out by the performance advisor.
CREATE INDEX IF NOT EXISTS idx_tracker_google_calendar_connections_secrets_connection_public_id
  ON public.tracker_google_calendar_connections_secrets (connection_public_id);

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_list_id
  ON public.tracker_google_sync_jobs (list_id);

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_runs_user_id
  ON public.tracker_google_sync_runs (user_id);

CREATE INDEX IF NOT EXISTS idx_tracker_task_google_projection_event_links_task_id
  ON public.tracker_task_google_projection_event_links (task_id);

CREATE INDEX IF NOT EXISTS idx_tracker_task_list_sync_settings_list_id
  ON public.tracker_task_list_sync_settings (list_id);

CREATE INDEX IF NOT EXISTS idx_tracker_task_sort_preferences_list_id
  ON public.tracker_task_sort_preferences (list_id);

CREATE INDEX IF NOT EXISTS idx_tracker_tasks_list_id
  ON public.tracker_tasks (list_id);

CREATE INDEX IF NOT EXISTS idx_tracker_tasks_parent_task_id
  ON public.tracker_tasks (parent_task_id);

-- Useful access-path indexes for the remaining RLS policies and queue queries.
CREATE INDEX IF NOT EXISTS idx_tracker_task_lists_user_archived_sort
  ON public.tracker_task_lists (user_id, archived, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_tracker_tasks_user_list_parent_sort
  ON public.tracker_tasks (user_id, list_id, parent_task_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_tracker_tasks_user_parent
  ON public.tracker_tasks (user_id, parent_task_id);

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_queue
  ON public.tracker_google_sync_jobs (user_id, status, priority, run_after, id);

CREATE INDEX IF NOT EXISTS idx_tracker_google_sync_jobs_run_status
  ON public.tracker_google_sync_jobs (run_id, status, id)
  WHERE run_id IS NOT NULL;

WITH ranked_sort_preferences AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, list_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_rank
  FROM public.tracker_task_sort_preferences
)
DELETE FROM public.tracker_task_sort_preferences prefs
USING ranked_sort_preferences ranked
WHERE prefs.id = ranked.id
  AND ranked.row_rank > 1;

WITH ranked_sync_settings AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, list_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_rank
  FROM public.tracker_task_list_sync_settings
)
DELETE FROM public.tracker_task_list_sync_settings settings
USING ranked_sync_settings ranked
WHERE settings.id = ranked.id
  AND ranked.row_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_task_sort_preferences_user_list
  ON public.tracker_task_sort_preferences (user_id, list_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_task_list_sync_settings_user_list
  ON public.tracker_task_list_sync_settings (user_id, list_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_google_sync_jobs_dedupe_active
  ON public.tracker_google_sync_jobs (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('pending', 'running');

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_task_google_projection_links_task_projection
  ON public.tracker_task_google_projection_event_links (user_id, task_id, projection_index);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracker_task_google_projection_links_google_event
  ON public.tracker_task_google_projection_event_links (user_id, calendar_id, google_event_id);

CREATE INDEX IF NOT EXISTS idx_tracker_task_google_projection_links_task
  ON public.tracker_task_google_projection_event_links (user_id, task_id, is_deleted, projection_index);

CREATE INDEX IF NOT EXISTS idx_tracker_task_google_event_links_user_task
  ON public.tracker_task_google_event_links (user_id, task_id);

CREATE INDEX IF NOT EXISTS idx_tracker_task_google_event_links_user_google_event
  ON public.tracker_task_google_event_links (user_id, google_event_id);

-- Known non-FK queue indexes from older patches that the current code does not
-- query directly. Keep the queue, run-status, and dedupe indexes above.
DROP INDEX IF EXISTS public.idx_tracker_google_sync_jobs_task_id;
DROP INDEX IF EXISTS public.idx_tracker_google_sync_jobs_google_event_id;
DROP INDEX IF EXISTS public.idx_tracker_google_sync_runs_user_created;

COMMIT;
