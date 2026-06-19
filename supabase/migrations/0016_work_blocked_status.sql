-- Add 'blocked' status to work_tasks
ALTER TABLE work_tasks
  DROP CONSTRAINT IF EXISTS work_tasks_status_check;

ALTER TABLE work_tasks
  ADD CONSTRAINT work_tasks_status_check
  CHECK (status IN ('todo', 'doing', 'blocked', 'done'));
