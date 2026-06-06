-- Drop legacy tracker surfaces removed from the app.
-- This intentionally does not touch tracker_tasks, tracker_task_lists,
-- task sort preferences, or calendar sync tables.

DROP TABLE IF EXISTS
  public.weekly_task_status,
  public.weekly_snapshots,
  public.weekly_task_templates,
  public.pipeline_items;
