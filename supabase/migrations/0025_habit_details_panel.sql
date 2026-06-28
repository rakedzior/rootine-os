-- ============================================================
-- ROOTINE OS - 0025 Habit details panel
-- Extends old habits/habit_logs model with status, visibility,
-- richer schedules and completed/skipped history entries.
-- ============================================================

alter table public.habits
  add column if not exists description text,
  add column if not exists status text not null default 'active',
  add column if not exists visible_on_dashboard boolean not null default true,
  add column if not exists schedule_type text not null default 'daily',
  add column if not exists interval_value integer not null default 1,
  add column if not exists end_mode text not null default 'forever',
  add column if not exists end_after_cycles integer,
  add column if not exists time_of_day time;

update public.habits
set schedule_type = case
  when recurrence_type = 'weekly' then 'selected_weekdays'
  else 'daily'
end
where schedule_type = 'daily';

update public.habits
set end_mode = case when end_date is null then 'forever' else 'on_date' end
where end_mode = 'forever';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'habits_status_chk') then
    alter table public.habits
      add constraint habits_status_chk check (status in ('active', 'paused', 'archived'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'habits_schedule_type_chk') then
    alter table public.habits
      add constraint habits_schedule_type_chk check (schedule_type in ('daily', 'selected_weekdays', 'every_n_weeks', 'every_n_months'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'habits_interval_value_chk') then
    alter table public.habits
      add constraint habits_interval_value_chk check (interval_value >= 1);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'habits_end_mode_chk') then
    alter table public.habits
      add constraint habits_end_mode_chk check (end_mode in ('forever', 'after_cycles', 'on_date'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'habits_end_after_cycles_chk') then
    alter table public.habits
      add constraint habits_end_after_cycles_chk check (end_after_cycles is null or end_after_cycles >= 1);
  end if;
end $$;

create table if not exists public.habit_schedule_days (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  weekday integer not null check (weekday between 1 and 7),
  unique (habit_id, weekday)
);

alter table public.habit_schedule_days enable row level security;

drop policy if exists "habit_schedule_days_select" on public.habit_schedule_days;
drop policy if exists "habit_schedule_days_insert" on public.habit_schedule_days;
drop policy if exists "habit_schedule_days_update" on public.habit_schedule_days;
drop policy if exists "habit_schedule_days_delete" on public.habit_schedule_days;

create policy "habit_schedule_days_select" on public.habit_schedule_days
  for select using (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));
create policy "habit_schedule_days_insert" on public.habit_schedule_days
  for insert with check (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));
create policy "habit_schedule_days_update" on public.habit_schedule_days
  for update using (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
  with check (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));
create policy "habit_schedule_days_delete" on public.habit_schedule_days
  for delete using (exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()));

insert into public.habit_schedule_days (habit_id, weekday)
select h.id, unnest(h.weekdays)
from public.habits h
on conflict (habit_id, weekday) do nothing;

create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  status text not null check (status in ('completed', 'skipped')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, entry_date)
);

alter table public.habit_entries enable row level security;

drop policy if exists "habit_entries_select" on public.habit_entries;
drop policy if exists "habit_entries_insert" on public.habit_entries;
drop policy if exists "habit_entries_update" on public.habit_entries;
drop policy if exists "habit_entries_delete" on public.habit_entries;

create policy "habit_entries_select" on public.habit_entries for select using (auth.uid() = user_id);
create policy "habit_entries_insert" on public.habit_entries for insert with check (auth.uid() = user_id);
create policy "habit_entries_update" on public.habit_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_entries_delete" on public.habit_entries for delete using (auth.uid() = user_id);

insert into public.habit_entries (habit_id, user_id, entry_date, status, created_at)
select habit_id, user_id, log_date, 'completed', created_at
from public.habit_logs
on conflict (habit_id, entry_date) do nothing;

drop trigger if exists trg_habit_entries_updated on public.habit_entries;
create trigger trg_habit_entries_updated before update on public.habit_entries
  for each row execute function public.set_updated_at();

create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habits_status_idx on public.habits(status);
create index if not exists habits_visible_idx on public.habits(visible_on_dashboard);
create index if not exists habit_schedule_days_habit_idx on public.habit_schedule_days(habit_id);
create index if not exists habit_entries_habit_date_idx on public.habit_entries(habit_id, entry_date);
create index if not exists habit_entries_user_date_idx on public.habit_entries(user_id, entry_date);
