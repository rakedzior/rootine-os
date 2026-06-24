-- ============================================================
-- 0019_planner_core
-- Rootine OS Planner foundation (spec-aligned):
-- planner_tasks, planner_task_instances, planner_tags,
-- planner_task_tags, planner_notes + RLS policies.
-- Also extends habits/habit_logs and user_preferences with planner fields.
-- ============================================================

-- ---------- planner_tasks ----------
create table if not exists public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  title text not null,
  description text null,

  status text not null default 'todo',
  priority text not null default 'none',

  source text not null default 'manual',

  all_day boolean not null default true,
  start_at timestamptz null,
  end_at timestamptz null,
  due_date date null,

  reminder_at timestamptz null,
  repeat_rule jsonb null,

  completed_at timestamptz null,
  archived_at timestamptz null,
  deleted_at timestamptz null,

  sort_order numeric null,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planner_tasks enable row level security;

drop policy if exists planner_tasks_select_own on public.planner_tasks;
create policy planner_tasks_select_own
on public.planner_tasks
for select
using (auth.uid() = user_id);

drop policy if exists planner_tasks_insert_own on public.planner_tasks;
create policy planner_tasks_insert_own
on public.planner_tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists planner_tasks_update_own on public.planner_tasks;
create policy planner_tasks_update_own
on public.planner_tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists planner_tasks_delete_own on public.planner_tasks;
create policy planner_tasks_delete_own
on public.planner_tasks
for delete
using (auth.uid() = user_id);

create index if not exists planner_tasks_user_idx on public.planner_tasks (user_id);
create index if not exists planner_tasks_user_due_idx on public.planner_tasks (user_id, due_date);
create index if not exists planner_tasks_user_status_idx on public.planner_tasks (user_id, status);
create index if not exists planner_tasks_user_deleted_idx on public.planner_tasks (user_id, deleted_at);

alter table public.planner_tasks drop constraint if exists planner_tasks_status_chk;
alter table public.planner_tasks
  add constraint planner_tasks_status_chk
  check (status in ('todo', 'in_progress', 'done', 'cancelled'));

alter table public.planner_tasks drop constraint if exists planner_tasks_priority_chk;
alter table public.planner_tasks
  add constraint planner_tasks_priority_chk
  check (priority in ('none', 'low', 'medium', 'high', 'urgent'));

alter table public.planner_tasks drop constraint if exists planner_tasks_source_chk;
alter table public.planner_tasks
  add constraint planner_tasks_source_chk
  check (source in ('manual', 'quick_add', 'calendar_quick', 'drag_drop', 'imported'));

alter table public.planner_tasks drop constraint if exists planner_tasks_time_window_chk;
alter table public.planner_tasks
  add constraint planner_tasks_time_window_chk
  check (start_at is null or end_at is null or end_at > start_at);

drop trigger if exists trg_planner_tasks_updated on public.planner_tasks;
create trigger trg_planner_tasks_updated
before update on public.planner_tasks
for each row execute function public.set_updated_at();

-- ---------- planner_task_instances ----------
create table if not exists public.planner_task_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null references public.planner_tasks (id) on delete cascade,

  instance_date date not null,
  start_at timestamptz null,
  end_at timestamptz null,

  status text not null default 'todo',
  completed_at timestamptz null,

  is_override boolean not null default false,
  override_title text null,
  override_description text null,

  sort_order numeric null,

  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planner_task_instances enable row level security;

drop policy if exists planner_task_instances_select_own on public.planner_task_instances;
create policy planner_task_instances_select_own
on public.planner_task_instances
for select
using (auth.uid() = user_id);

drop policy if exists planner_task_instances_insert_own on public.planner_task_instances;
create policy planner_task_instances_insert_own
on public.planner_task_instances
for insert
with check (auth.uid() = user_id);

drop policy if exists planner_task_instances_update_own on public.planner_task_instances;
create policy planner_task_instances_update_own
on public.planner_task_instances
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists planner_task_instances_delete_own on public.planner_task_instances;
create policy planner_task_instances_delete_own
on public.planner_task_instances
for delete
using (auth.uid() = user_id);

create index if not exists planner_task_instances_user_idx on public.planner_task_instances (user_id);
create index if not exists planner_task_instances_task_idx on public.planner_task_instances (task_id);
create index if not exists planner_task_instances_user_date_idx on public.planner_task_instances (user_id, instance_date);
create unique index if not exists planner_task_instances_unique_active_idx
  on public.planner_task_instances (user_id, task_id, instance_date)
  where deleted_at is null;

alter table public.planner_task_instances drop constraint if exists planner_task_instances_status_chk;
alter table public.planner_task_instances
  add constraint planner_task_instances_status_chk
  check (status in ('todo', 'in_progress', 'done', 'cancelled'));

alter table public.planner_task_instances drop constraint if exists planner_task_instances_time_window_chk;
alter table public.planner_task_instances
  add constraint planner_task_instances_time_window_chk
  check (start_at is null or end_at is null or end_at > start_at);

drop trigger if exists trg_planner_task_instances_updated on public.planner_task_instances;
create trigger trg_planner_task_instances_updated
before update on public.planner_task_instances
for each row execute function public.set_updated_at();

-- ---------- planner_tags ----------
create table if not exists public.planner_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  color text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, name)
);

alter table public.planner_tags enable row level security;

drop policy if exists planner_tags_select_own on public.planner_tags;
create policy planner_tags_select_own
on public.planner_tags
for select
using (auth.uid() = user_id);

drop policy if exists planner_tags_insert_own on public.planner_tags;
create policy planner_tags_insert_own
on public.planner_tags
for insert
with check (auth.uid() = user_id);

drop policy if exists planner_tags_update_own on public.planner_tags;
create policy planner_tags_update_own
on public.planner_tags
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists planner_tags_delete_own on public.planner_tags;
create policy planner_tags_delete_own
on public.planner_tags
for delete
using (auth.uid() = user_id);

create index if not exists planner_tags_user_idx on public.planner_tags (user_id);
create index if not exists planner_tags_user_name_idx on public.planner_tags (user_id, name);

drop trigger if exists trg_planner_tags_updated on public.planner_tags;
create trigger trg_planner_tags_updated
before update on public.planner_tags
for each row execute function public.set_updated_at();

-- ---------- planner_task_tags ----------
create table if not exists public.planner_task_tags (
  task_id uuid not null references public.planner_tasks (id) on delete cascade,
  tag_id uuid not null references public.planner_tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

alter table public.planner_task_tags enable row level security;

drop policy if exists planner_task_tags_select_own on public.planner_task_tags;
create policy planner_task_tags_select_own
on public.planner_task_tags
for select
using (
  exists (
    select 1
    from public.planner_tasks t
    where t.id = planner_task_tags.task_id
      and t.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.planner_tags g
    where g.id = planner_task_tags.tag_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists planner_task_tags_insert_own on public.planner_task_tags;
create policy planner_task_tags_insert_own
on public.planner_task_tags
for insert
with check (
  exists (
    select 1
    from public.planner_tasks t
    where t.id = planner_task_tags.task_id
      and t.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.planner_tags g
    where g.id = planner_task_tags.tag_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists planner_task_tags_delete_own on public.planner_task_tags;
create policy planner_task_tags_delete_own
on public.planner_task_tags
for delete
using (
  exists (
    select 1
    from public.planner_tasks t
    where t.id = planner_task_tags.task_id
      and t.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.planner_tags g
    where g.id = planner_task_tags.tag_id
      and g.user_id = auth.uid()
  )
);

create index if not exists planner_task_tags_task_idx on public.planner_task_tags (task_id);
create index if not exists planner_task_tags_tag_idx on public.planner_task_tags (tag_id);

-- ---------- planner_notes ----------
create table if not exists public.planner_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  title text null,
  body text not null,

  note_date date not null,
  start_at timestamptz null,
  end_at timestamptz null,

  pinned boolean not null default false,
  color text null,

  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planner_notes enable row level security;

drop policy if exists planner_notes_select_own on public.planner_notes;
create policy planner_notes_select_own
on public.planner_notes
for select
using (auth.uid() = user_id);

drop policy if exists planner_notes_insert_own on public.planner_notes;
create policy planner_notes_insert_own
on public.planner_notes
for insert
with check (auth.uid() = user_id);

drop policy if exists planner_notes_update_own on public.planner_notes;
create policy planner_notes_update_own
on public.planner_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists planner_notes_delete_own on public.planner_notes;
create policy planner_notes_delete_own
on public.planner_notes
for delete
using (auth.uid() = user_id);

create index if not exists planner_notes_user_idx on public.planner_notes (user_id);
create index if not exists planner_notes_user_date_idx on public.planner_notes (user_id, note_date);

drop trigger if exists trg_planner_notes_updated on public.planner_notes;
create trigger trg_planner_notes_updated
before update on public.planner_notes
for each row execute function public.set_updated_at();

-- ---------- backfill from legacy public.tasks ----------
insert into public.planner_tasks (
  id,
  user_id,
  title,
  description,
  status,
  priority,
  source,
  all_day,
  start_at,
  end_at,
  due_date,
  repeat_rule,
  completed_at,
  deleted_at,
  sort_order,
  metadata,
  created_at,
  updated_at
)
select
  t.id,
  t.user_id,
  t.title,
  nullif(t.note, ''),
  case when t.done then 'done' else 'todo' end,
  case
    when t.priority = 'high' then 'high'
    when t.priority = 'low' then 'low'
    else 'medium'
  end,
  'manual',
  t.scheduled_time is null,
  case
    when t.due_date is null then null
    else ((t.due_date::text || ' ' || coalesce(t.scheduled_time, '00:00') || ':00')::timestamp at time zone 'UTC')
  end,
  case
    when t.due_date is null or t.duration_minutes is null then null
    else (((t.due_date::text || ' ' || coalesce(t.scheduled_time, '00:00') || ':00')::timestamp + make_interval(mins => t.duration_minutes)) at time zone 'UTC')
  end,
  t.due_date,
  case
    when t.repeat_mode = 'daily' then jsonb_build_object('frequency', 'daily', 'interval', 1, 'until', t.repeat_until)
    when t.repeat_mode = 'weekly' then jsonb_build_object('frequency', 'weekly', 'interval', 1, 'days_of_week', t.repeat_weekdays, 'until', t.repeat_until)
    else null
  end,
  case when t.done then coalesce(t.updated_at, now()) else null end,
  t.deleted_at,
  t.sort_order,
  jsonb_build_object(
    'category', t.category,
    'favorite', t.favorite,
    'series_id', t.series_id,
    'legacy_table', 'tasks'
  ),
  t.created_at,
  t.updated_at
from public.tasks t
on conflict (id) do nothing;

insert into public.planner_tags (user_id, name)
select distinct
  t.user_id,
  lower(trim(both from regexp_replace(raw_tag, '^#', '')))
from public.tasks t
cross join lateral unnest(coalesce(t.tags, array[]::text[])) as raw_tag
where trim(both from raw_tag) <> ''
on conflict (user_id, name) do nothing;

insert into public.planner_task_tags (task_id, tag_id)
select
  t.id,
  pt.id
from public.tasks t
cross join lateral unnest(coalesce(t.tags, array[]::text[])) as raw_tag
join public.planner_tags pt
  on pt.user_id = t.user_id
 and pt.name = lower(trim(both from regexp_replace(raw_tag, '^#', '')))
where trim(both from raw_tag) <> ''
on conflict (task_id, tag_id) do nothing;

insert into public.planner_task_instances (
  user_id,
  task_id,
  instance_date,
  start_at,
  end_at,
  status,
  completed_at,
  is_override,
  created_at,
  updated_at
)
select
  pt.user_id,
  pt.id,
  pt.due_date,
  pt.start_at,
  pt.end_at,
  pt.status,
  pt.completed_at,
  false,
  pt.created_at,
  pt.updated_at
from public.planner_tasks pt
where pt.due_date is not null
  and pt.deleted_at is null
  and not exists (
    select 1
    from public.planner_task_instances pi
    where pi.task_id = pt.id
      and pi.instance_date = pt.due_date
      and pi.deleted_at is null
  );

-- ---------- extend habits to planner spec ----------
alter table public.habits
  add column if not exists description text,
  add column if not exists icon text,
  add column if not exists color text,
  add column if not exists frequency text not null default 'daily',
  add column if not exists weekly_goal int,
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_time time,
  add column if not exists archived_at timestamptz;

alter table public.habits drop constraint if exists habits_frequency_chk;
alter table public.habits
  add constraint habits_frequency_chk
  check (frequency in ('daily', 'weekly', 'monthly', 'custom'));

alter table public.habit_logs
  add column if not exists completed boolean not null default true,
  add column if not exists completed_at timestamptz,
  add column if not exists note text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_habit_logs_updated on public.habit_logs;
create trigger trg_habit_logs_updated
before update on public.habit_logs
for each row execute function public.set_updated_at();

-- ---------- extend user_preferences for planner ----------
alter table public.user_preferences
  add column if not exists sidebar_collapsed boolean not null default true,
  add column if not exists planner_default_view text not null default 'month',
  add column if not exists timezone text not null default 'Europe/Warsaw';

alter table public.user_preferences drop constraint if exists user_preferences_planner_default_view_chk;
alter table public.user_preferences
  add constraint user_preferences_planner_default_view_chk
  check (planner_default_view in ('month', 'week', 'day'));
