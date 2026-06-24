-- ============================================================
-- 0022_training_cycles
-- Training cycles (macrocycle) wrapping the existing training_blocks
-- system: a cycle groups one or more blocks as "phases" (mezocykle) and
-- tags each calendar week with a type (standard/deload/test/special) +
-- goal (mikrocykle). Workout scheduling itself stays entirely on
-- scheduled_workouts/training_blocks (0021) — phases just link a
-- pre-existing block, so cycle-sourced workouts already show up
-- everywhere scheduled_workouts does (week view, history, records).
-- ============================================================

-- ---------- training_cycles ----------
create table if not exists public.training_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  goal text not null default 'custom',
  status text not null default 'planned',
  start_date date not null,
  end_date date not null,
  duration_weeks int not null,
  intensity text,
  trainings_per_week int,
  active_sport_ids uuid[] not null default '{}',
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.training_cycles drop constraint if exists training_cycles_status_chk;
alter table public.training_cycles
  add constraint training_cycles_status_chk
  check (status in ('planned', 'active', 'paused', 'completed', 'archived'));

alter table public.training_cycles enable row level security;

drop policy if exists training_cycles_select_own on public.training_cycles;
create policy training_cycles_select_own on public.training_cycles for select using (auth.uid() = user_id);
drop policy if exists training_cycles_insert_own on public.training_cycles;
create policy training_cycles_insert_own on public.training_cycles for insert with check (auth.uid() = user_id);
drop policy if exists training_cycles_update_own on public.training_cycles;
create policy training_cycles_update_own on public.training_cycles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_cycles_delete_own on public.training_cycles;
create policy training_cycles_delete_own on public.training_cycles for delete using (auth.uid() = user_id);

create index if not exists training_cycles_user_idx on public.training_cycles (user_id);
-- Only one active cycle per user at a time.
drop index if exists training_cycles_one_active_idx;
create unique index training_cycles_one_active_idx on public.training_cycles (user_id) where (status = 'active');

drop trigger if exists trg_training_cycles_updated on public.training_cycles;
create trigger trg_training_cycles_updated before update on public.training_cycles
  for each row execute function public.set_updated_at();

-- ---------- training_cycle_phases (mezocykle) ----------
create table if not exists public.training_cycle_phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid not null references public.training_cycles (id) on delete cascade,
  block_id uuid references public.training_blocks (id) on delete set null,

  name text not null,
  goal text,
  order_index int not null default 0,
  start_date date not null,
  end_date date not null,
  duration_weeks int not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.training_cycle_phases enable row level security;

drop policy if exists training_cycle_phases_select_own on public.training_cycle_phases;
create policy training_cycle_phases_select_own on public.training_cycle_phases for select using (auth.uid() = user_id);
drop policy if exists training_cycle_phases_insert_own on public.training_cycle_phases;
create policy training_cycle_phases_insert_own on public.training_cycle_phases for insert with check (auth.uid() = user_id);
drop policy if exists training_cycle_phases_update_own on public.training_cycle_phases;
create policy training_cycle_phases_update_own on public.training_cycle_phases for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_cycle_phases_delete_own on public.training_cycle_phases;
create policy training_cycle_phases_delete_own on public.training_cycle_phases for delete using (auth.uid() = user_id);

create index if not exists training_cycle_phases_user_idx on public.training_cycle_phases (user_id);
create index if not exists training_cycle_phases_cycle_idx on public.training_cycle_phases (cycle_id, order_index);
create index if not exists training_cycle_phases_block_idx on public.training_cycle_phases (block_id);

drop trigger if exists trg_training_cycle_phases_updated on public.training_cycle_phases;
create trigger trg_training_cycle_phases_updated before update on public.training_cycle_phases
  for each row execute function public.set_updated_at();

-- ---------- training_cycle_weeks (mikrocykle) ----------
create table if not exists public.training_cycle_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid not null references public.training_cycles (id) on delete cascade,

  week_number int not null,
  start_date date not null,
  end_date date not null,
  week_type text not null default 'standard',
  goal text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (cycle_id, week_number)
);

alter table public.training_cycle_weeks drop constraint if exists training_cycle_weeks_type_chk;
alter table public.training_cycle_weeks
  add constraint training_cycle_weeks_type_chk
  check (week_type in ('standard', 'deload', 'test', 'special'));

alter table public.training_cycle_weeks enable row level security;

drop policy if exists training_cycle_weeks_select_own on public.training_cycle_weeks;
create policy training_cycle_weeks_select_own on public.training_cycle_weeks for select using (auth.uid() = user_id);
drop policy if exists training_cycle_weeks_insert_own on public.training_cycle_weeks;
create policy training_cycle_weeks_insert_own on public.training_cycle_weeks for insert with check (auth.uid() = user_id);
drop policy if exists training_cycle_weeks_update_own on public.training_cycle_weeks;
create policy training_cycle_weeks_update_own on public.training_cycle_weeks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_cycle_weeks_delete_own on public.training_cycle_weeks;
create policy training_cycle_weeks_delete_own on public.training_cycle_weeks for delete using (auth.uid() = user_id);

create index if not exists training_cycle_weeks_user_idx on public.training_cycle_weeks (user_id);
create index if not exists training_cycle_weeks_cycle_idx on public.training_cycle_weeks (cycle_id, week_number);

drop trigger if exists trg_training_cycle_weeks_updated on public.training_cycle_weeks;
create trigger trg_training_cycle_weeks_updated before update on public.training_cycle_weeks
  for each row execute function public.set_updated_at();
