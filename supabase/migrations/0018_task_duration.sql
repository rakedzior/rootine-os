alter table public.tasks
  add column if not exists duration_minutes int;

alter table public.tasks
  drop constraint if exists tasks_duration_minutes_chk;

alter table public.tasks
  add constraint tasks_duration_minutes_chk
  check (duration_minutes is null or duration_minutes > 0);
