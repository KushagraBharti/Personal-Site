-- Follow-up cleanup for the remaining Supabase Performance Advisor index noise
-- after 2026-06-18_supabase_lint_cleanup.sql.
--
-- This intentionally keeps useful FK/RLS/query indexes. "Unused index" warnings
-- can appear immediately after new indexes are created because pg_stat_user_indexes
-- has not seen a scan yet.

BEGIN;

-- Remove exact duplicate non-constraint indexes from the tables Supabase still
-- flagged. If a duplicate group includes a primary/unique constraint index, keep
-- the constraint index and drop the duplicate plain index.
DO $$
DECLARE
  duplicate_group record;
  index_to_drop record;
  drop_index_sql text;
BEGIN
  FOR duplicate_group IN
    WITH index_info AS (
      SELECT
        i.indexrelid,
        i.indrelid,
        i.indisprimary,
        i.indisunique,
        con.oid IS NOT NULL AS is_constraint_index,
        am.amname,
        i.indkey::text AS key_columns,
        i.indclass::text AS operator_classes,
        i.indcollation::text AS collations,
        i.indoption::text AS options,
        COALESCE(pg_get_expr(i.indexprs, i.indrelid), '') AS expressions,
        COALESCE(pg_get_expr(i.indpred, i.indrelid), '') AS predicate
      FROM pg_index i
      JOIN pg_class index_class ON index_class.oid = i.indexrelid
      JOIN pg_class table_class ON table_class.oid = i.indrelid
      JOIN pg_namespace table_namespace ON table_namespace.oid = table_class.relnamespace
      JOIN pg_am am ON am.oid = index_class.relam
      LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
      WHERE table_namespace.nspname = 'public'
        AND table_class.relname = ANY (ARRAY[
          'tracker_task_list_sync_settings',
          'tracker_task_lists',
          'tracker_task_sort_preferences'
        ])
        AND i.indisvalid
        AND i.indisready
    )
    SELECT
      array_agg(
        indexrelid
        ORDER BY
          is_constraint_index DESC,
          indisprimary DESC,
          indisunique DESC,
          indexrelid ASC
      ) AS index_oids
    FROM index_info
    GROUP BY
      indrelid,
      amname,
      key_columns,
      operator_classes,
      collations,
      options,
      expressions,
      predicate
    HAVING count(*) > 1
  LOOP
    FOR index_to_drop IN
      SELECT index_oid
      FROM unnest(duplicate_group.index_oids) WITH ORDINALITY AS candidates(index_oid, ordinal)
      WHERE ordinal > 1
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conindid = index_to_drop.index_oid
      ) THEN
        SELECT format('DROP INDEX IF EXISTS %I.%I', ns.nspname, cls.relname)
        INTO drop_index_sql
        FROM pg_class cls
        JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        WHERE cls.oid = index_to_drop.index_oid;

        IF drop_index_sql IS NOT NULL THEN
          EXECUTE drop_index_sql;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Remove simple left-prefix duplicate indexes on the same flagged tables. This
-- only drops non-unique, non-constraint, non-partial btree indexes when a wider
-- index on the same table starts with the same indexed column sequence.
DO $$
DECLARE
  index_to_drop record;
  drop_index_sql text;
BEGIN
  FOR index_to_drop IN
    WITH simple_indexes AS (
      SELECT
        i.indexrelid,
        i.indrelid,
        string_to_array(i.indkey::text, ' ')::smallint[] AS key_columns
      FROM pg_index i
      JOIN pg_class index_class ON index_class.oid = i.indexrelid
      JOIN pg_class table_class ON table_class.oid = i.indrelid
      JOIN pg_namespace table_namespace ON table_namespace.oid = table_class.relnamespace
      JOIN pg_am am ON am.oid = index_class.relam
      LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
      WHERE table_namespace.nspname = 'public'
        AND table_class.relname = ANY (ARRAY[
          'tracker_task_list_sync_settings',
          'tracker_task_lists',
          'tracker_task_sort_preferences'
        ])
        AND am.amname = 'btree'
        AND i.indexprs IS NULL
        AND i.indpred IS NULL
        AND i.indisvalid
        AND i.indisready
        AND NOT i.indisprimary
        AND NOT i.indisunique
        AND con.oid IS NULL
    )
    SELECT DISTINCT shorter.indexrelid AS index_oid
    FROM simple_indexes shorter
    JOIN simple_indexes wider
      ON wider.indrelid = shorter.indrelid
      AND wider.indexrelid <> shorter.indexrelid
      AND cardinality(wider.key_columns) > cardinality(shorter.key_columns)
      AND shorter.key_columns = wider.key_columns[1:cardinality(shorter.key_columns)]
  LOOP
    SELECT format('DROP INDEX IF EXISTS %I.%I', ns.nspname, cls.relname)
    INTO drop_index_sql
    FROM pg_class cls
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE cls.oid = index_to_drop.index_oid;

    IF drop_index_sql IS NOT NULL THEN
      EXECUTE drop_index_sql;
    END IF;
  END LOOP;
END $$;

-- Warm remaining useful indexes so pg_stat_user_indexes records at least one
-- scan after the cleanup migration. This avoids dropping indexes that protect
-- FK deletes, RLS filtering, queue claims, and app upserts.
DO $$
DECLARE
  index_to_warm record;
BEGIN
  PERFORM set_config('enable_seqscan', 'off', true);
  PERFORM set_config('enable_bitmapscan', 'off', true);

  FOR index_to_warm IN
    SELECT
      index_namespace.nspname AS index_schema,
      index_class.relname AS index_name,
      table_namespace.nspname AS table_schema,
      table_class.relname AS table_name,
      format('%I.%I', table_namespace.nspname, table_class.relname) AS qualified_table_name,
      COALESCE(pg_get_expr(i.indpred, i.indrelid), 'true') AS predicate,
      (
        SELECT string_agg(pg_get_indexdef(i.indexrelid, key_number::integer, true), ', ')
        FROM generate_series(1, i.indnkeyatts) AS key_number
      ) AS order_by_columns
    FROM pg_index i
    JOIN pg_class index_class ON index_class.oid = i.indexrelid
    JOIN pg_namespace index_namespace ON index_namespace.oid = index_class.relnamespace
    JOIN pg_class table_class ON table_class.oid = i.indrelid
    JOIN pg_namespace table_namespace ON table_namespace.oid = table_class.relnamespace
    JOIN pg_am am ON am.oid = index_class.relam
    WHERE table_namespace.nspname = 'public'
      AND table_class.relname = ANY (ARRAY[
        'tracker_task_lists',
        'tracker_tasks',
        'tracker_google_sync_jobs',
        'tracker_google_calendar_connections_secrets',
        'tracker_google_sync_runs',
        'tracker_task_google_projection_event_links',
        'tracker_task_list_sync_settings',
        'tracker_task_sort_preferences',
        'tracker_task_google_event_links'
      ])
      AND am.amname = 'btree'
      AND i.indisvalid
      AND i.indisready
      AND i.indnkeyatts > 0
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT 1 FROM %s WHERE %s ORDER BY %s LIMIT 1',
        index_to_warm.qualified_table_name,
        index_to_warm.predicate,
        index_to_warm.order_by_columns
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipped warming %.%: %',
        index_to_warm.index_schema,
        index_to_warm.index_name,
        SQLERRM;
    END;
  END LOOP;
END $$;

COMMIT;
