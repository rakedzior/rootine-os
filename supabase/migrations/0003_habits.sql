-- ============================================================
-- ROOTINE OS — 0003 Habits (feeds Start "Nawyki i rutyny")
-- habits + habit_logs (one row per completed day). RLS on both.
-- ============================================================

-- ---------- habits ----------
create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default '',
  category    text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
alter table public.habits enable row level security;
create policy "habits_select" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete" on public.habits for delete using (auth.uid() = user_id);
create index on public.habits (user_id);
create trigger trg_habits_updated before update on public.habits
  for each row execute function public.set_updated_at();

-- ---------- habit_logs ----------
-- Presence of a row == habit completed that day. Toggle off = delete row.
create table public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  habit_id    uuid not null references public.habits (id) on delete cascade,
  log_date    date not null,
  created_at  timestamptz not null default now(),
  unique (user_id, habit_id, log_date)
);
alter table public.habit_logs enable row level security;
create policy "habit_logs_select" on public.habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs_insert" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs_update" on public.habit_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_logs_delete" on public.habit_logs for delete using (auth.uid() = user_id);
create index on public.habit_logs (user_id);
create index on public.habit_logs (habit_id, log_date);
