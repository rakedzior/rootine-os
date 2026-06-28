-- ============================================================
-- 0027_goals_screen_parity
-- Extends Goals so the current Cele screen can move from
-- localStore to Supabase without losing roadmap/task data.
-- ============================================================

alter table public.goals
  add column if not exists description text not null default '',
  add column if not exists type text not null default 'project',
  add column if not exists priority text,
  add column if not exists deadline date,
  add column if not exists streak integer not null default 0,
  add column if not exists archived boolean not null default false,
  add column if not exists emoji text not null default 'target',
  add column if not exists completed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'goals_type_chk') then
    alter table public.goals
      add constraint goals_type_chk check (type in ('simple', 'project'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_priority_chk') then
    alter table public.goals
      add constraint goals_priority_chk check (priority is null or priority in ('low', 'mid', 'high'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_streak_chk') then
    alter table public.goals
      add constraint goals_streak_chk check (streak >= 0);
  end if;
end $$;

create index if not exists goals_user_archived_idx
  on public.goals(user_id, archived, completed_at);

create index if not exists goals_user_deadline_idx
  on public.goals(user_id, deadline);

alter table public.milestones
  add column if not exists progress integer not null default 0;

update public.milestones
set progress = case when done then 100 else progress end
where progress = 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'milestones_progress_range') then
    alter table public.milestones
      add constraint milestones_progress_range check (progress between 0 and 100);
  end if;
end $$;

create table if not exists public.goal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  parent_task_id uuid references public.goal_tasks(id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date date,
  priority text,
  status text not null default 'todo',
  progress integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'goal_tasks_priority_chk') then
    alter table public.goal_tasks
      add constraint goal_tasks_priority_chk check (priority is null or priority in ('low', 'mid', 'high'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goal_tasks_status_chk') then
    alter table public.goal_tasks
      add constraint goal_tasks_status_chk check (status in ('todo', 'active', 'waiting', 'done', 'blocked'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goal_tasks_progress_range') then
    alter table public.goal_tasks
      add constraint goal_tasks_progress_range check (progress between 0 and 100);
  end if;
end $$;

alter table public.goal_tasks enable row level security;

drop policy if exists goal_tasks_select_own on public.goal_tasks;
create policy goal_tasks_select_own on public.goal_tasks for select using (auth.uid() = user_id);

drop policy if exists goal_tasks_insert_own on public.goal_tasks;
create policy goal_tasks_insert_own on public.goal_tasks for insert with check (auth.uid() = user_id);

drop policy if exists goal_tasks_update_own on public.goal_tasks;
create policy goal_tasks_update_own on public.goal_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists goal_tasks_delete_own on public.goal_tasks;
create policy goal_tasks_delete_own on public.goal_tasks for delete using (auth.uid() = user_id);

create index if not exists goal_tasks_user_idx on public.goal_tasks(user_id);
create index if not exists goal_tasks_goal_idx on public.goal_tasks(goal_id, sort_order);
create index if not exists goal_tasks_parent_idx on public.goal_tasks(parent_task_id);
create index if not exists goal_tasks_user_due_idx on public.goal_tasks(user_id, due_date);

drop trigger if exists trg_goal_tasks_updated on public.goal_tasks;
create trigger trg_goal_tasks_updated before update on public.goal_tasks
  for each row execute function public.set_updated_at();
