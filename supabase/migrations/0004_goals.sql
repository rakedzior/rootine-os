-- ============================================================
-- ROOTINE OS — 0004 Goals + milestones
-- Feeds Start "Postępy w celach" and the Cele module.
-- ============================================================

-- ---------- goals ----------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default '',
  category    text,                       -- e.g. 'Siła' | 'Nauka' | 'Finanse' | 'Zdrowie'
  progress    int not null default 0,     -- 0..100
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  constraint goals_progress_range check (progress between 0 and 100)
);
alter table public.goals enable row level security;
create policy "goals_select" on public.goals for select using (auth.uid() = user_id);
create policy "goals_insert" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals_update" on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete" on public.goals for delete using (auth.uid() = user_id);
create index on public.goals (user_id);
create trigger trg_goals_updated before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------- milestones ----------
create table public.milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  goal_id     uuid not null references public.goals (id) on delete cascade,
  title       text not null default '',
  done        boolean not null default false,
  due_date    date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.milestones enable row level security;
create policy "milestones_select" on public.milestones for select using (auth.uid() = user_id);
create policy "milestones_insert" on public.milestones for insert with check (auth.uid() = user_id);
create policy "milestones_update" on public.milestones for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "milestones_delete" on public.milestones for delete using (auth.uid() = user_id);
create index on public.milestones (user_id);
create index on public.milestones (goal_id, sort_order);
create trigger trg_milestones_updated before update on public.milestones
  for each row execute function public.set_updated_at();
