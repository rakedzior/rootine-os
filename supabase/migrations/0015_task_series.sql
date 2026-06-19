alter table public.tasks
  add column if not exists priority text not null default 'mid',
  add column if not exists note text not null default '',
  add column if not exists series_id uuid,
  add column if not exists repeat_mode text not null default 'none',
  add column if not exists repeat_until date,
  add column if not exists repeat_weekdays int[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_priority_chk'
  ) then
    alter table public.tasks
      add constraint tasks_priority_chk
      check (priority in ('high', 'mid', 'low'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_repeat_mode_chk'
  ) then
    alter table public.tasks
      add constraint tasks_repeat_mode_chk
      check (repeat_mode in ('none', 'daily', 'weekly'));
  end if;
end $$;

create index if not exists tasks_user_series_idx on public.tasks (user_id, series_id);
