-- ============================================================
-- 0021_sport_redesign
-- Full Supabase-backed rebuild of the Sport module: sports catalog,
-- workout templates (+ exercises/sets), training blocks/cycles,
-- recurring plan series, scheduled workouts, progression rules/targets,
-- training sessions (+ exercises/sets with rest-timer state), personal
-- records. Extends the existing `exercises` table in place instead of
-- creating a duplicate. Old 0008_sport.sql tables (workouts, workout_sets,
-- body_measurements, readiness_daily, runs, rehab_sessions,
-- mobility_sessions) are intentionally left untouched and unused.
-- ============================================================

-- ---------- sports ----------
create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  icon_key text,
  color_token text,
  sort_order int not null default 0,
  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.sports enable row level security;

drop policy if exists sports_select_own on public.sports;
create policy sports_select_own on public.sports for select using (auth.uid() = user_id);
drop policy if exists sports_insert_own on public.sports;
create policy sports_insert_own on public.sports for insert with check (auth.uid() = user_id);
drop policy if exists sports_update_own on public.sports;
create policy sports_update_own on public.sports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists sports_delete_own on public.sports;
create policy sports_delete_own on public.sports for delete using (auth.uid() = user_id);

create index if not exists sports_user_idx on public.sports (user_id);

drop trigger if exists trg_sports_updated on public.sports;
create trigger trg_sports_updated before update on public.sports
  for each row execute function public.set_updated_at();

-- ---------- exercises: extend existing table in place ----------
alter table public.exercises
  add column if not exists sport_id uuid references public.sports (id) on delete set null,
  add column if not exists primary_muscle_group text,
  add column if not exists secondary_muscle_groups text[],
  add column if not exists equipment text,
  add column if not exists notes text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create index if not exists exercises_sport_idx on public.exercises (sport_id);

drop trigger if exists trg_exercises_updated on public.exercises;
create trigger trg_exercises_updated before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------- workout_templates ----------
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sport_id uuid references public.sports (id) on delete set null,

  name text not null,
  subtitle text,
  description text,
  estimated_duration_min int,
  color_token text,
  sort_order int not null default 0,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.workout_templates enable row level security;

drop policy if exists workout_templates_select_own on public.workout_templates;
create policy workout_templates_select_own on public.workout_templates for select using (auth.uid() = user_id);
drop policy if exists workout_templates_insert_own on public.workout_templates;
create policy workout_templates_insert_own on public.workout_templates for insert with check (auth.uid() = user_id);
drop policy if exists workout_templates_update_own on public.workout_templates;
create policy workout_templates_update_own on public.workout_templates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists workout_templates_delete_own on public.workout_templates;
create policy workout_templates_delete_own on public.workout_templates for delete using (auth.uid() = user_id);

create index if not exists workout_templates_user_idx on public.workout_templates (user_id);
create index if not exists workout_templates_sport_idx on public.workout_templates (sport_id);

drop trigger if exists trg_workout_templates_updated on public.workout_templates;
create trigger trg_workout_templates_updated before update on public.workout_templates
  for each row execute function public.set_updated_at();

-- ---------- workout_template_exercises ----------
create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,

  name_snapshot text not null,
  order_index int not null default 0,
  rest_seconds int,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.workout_template_exercises enable row level security;

drop policy if exists workout_template_exercises_select_own on public.workout_template_exercises;
create policy workout_template_exercises_select_own on public.workout_template_exercises for select using (auth.uid() = user_id);
drop policy if exists workout_template_exercises_insert_own on public.workout_template_exercises;
create policy workout_template_exercises_insert_own on public.workout_template_exercises for insert with check (auth.uid() = user_id);
drop policy if exists workout_template_exercises_update_own on public.workout_template_exercises;
create policy workout_template_exercises_update_own on public.workout_template_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists workout_template_exercises_delete_own on public.workout_template_exercises;
create policy workout_template_exercises_delete_own on public.workout_template_exercises for delete using (auth.uid() = user_id);

create index if not exists workout_template_exercises_user_idx on public.workout_template_exercises (user_id);
create index if not exists workout_template_exercises_template_idx on public.workout_template_exercises (template_id, order_index);

drop trigger if exists trg_workout_template_exercises_updated on public.workout_template_exercises;
create trigger trg_workout_template_exercises_updated before update on public.workout_template_exercises
  for each row execute function public.set_updated_at();

-- ---------- workout_template_sets ----------
create table if not exists public.workout_template_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_exercise_id uuid not null references public.workout_template_exercises (id) on delete cascade,

  set_index int not null,
  set_type text not null default 'working',
  target_reps_min int,
  target_reps_max int,
  target_weight_kg numeric(8,2),
  target_rir numeric(4,1),
  target_rpe numeric(4,1),
  tempo text,
  rest_seconds int,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.workout_template_sets drop constraint if exists workout_template_sets_set_type_chk;
alter table public.workout_template_sets
  add constraint workout_template_sets_set_type_chk
  check (set_type in ('working', 'warmup', 'dropset'));

alter table public.workout_template_sets enable row level security;

drop policy if exists workout_template_sets_select_own on public.workout_template_sets;
create policy workout_template_sets_select_own on public.workout_template_sets for select using (auth.uid() = user_id);
drop policy if exists workout_template_sets_insert_own on public.workout_template_sets;
create policy workout_template_sets_insert_own on public.workout_template_sets for insert with check (auth.uid() = user_id);
drop policy if exists workout_template_sets_update_own on public.workout_template_sets;
create policy workout_template_sets_update_own on public.workout_template_sets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists workout_template_sets_delete_own on public.workout_template_sets;
create policy workout_template_sets_delete_own on public.workout_template_sets for delete using (auth.uid() = user_id);

create index if not exists workout_template_sets_user_idx on public.workout_template_sets (user_id);
create index if not exists workout_template_sets_exercise_idx on public.workout_template_sets (template_exercise_id, set_index);

drop trigger if exists trg_workout_template_sets_updated on public.workout_template_sets;
create trigger trg_workout_template_sets_updated before update on public.workout_template_sets
  for each row execute function public.set_updated_at();

-- ---------- training_blocks ----------
create table if not exists public.training_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  duration_weeks int not null,
  recurrence_type text not null default 'weekly',
  recurrence_interval int not null default 1,
  status text not null default 'planned',
  conflict_policy text not null default 'append',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.training_blocks drop constraint if exists training_blocks_status_chk;
alter table public.training_blocks
  add constraint training_blocks_status_chk
  check (status in ('planned', 'active', 'completed', 'cancelled'));

alter table public.training_blocks drop constraint if exists training_blocks_conflict_policy_chk;
alter table public.training_blocks
  add constraint training_blocks_conflict_policy_chk
  check (conflict_policy in ('skip_existing', 'overwrite_existing', 'append'));

alter table public.training_blocks enable row level security;

drop policy if exists training_blocks_select_own on public.training_blocks;
create policy training_blocks_select_own on public.training_blocks for select using (auth.uid() = user_id);
drop policy if exists training_blocks_insert_own on public.training_blocks;
create policy training_blocks_insert_own on public.training_blocks for insert with check (auth.uid() = user_id);
drop policy if exists training_blocks_update_own on public.training_blocks;
create policy training_blocks_update_own on public.training_blocks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_blocks_delete_own on public.training_blocks;
create policy training_blocks_delete_own on public.training_blocks for delete using (auth.uid() = user_id);

create index if not exists training_blocks_user_idx on public.training_blocks (user_id);
create index if not exists training_blocks_user_dates_idx on public.training_blocks (user_id, start_date, end_date);

drop trigger if exists trg_training_blocks_updated on public.training_blocks;
create trigger trg_training_blocks_updated before update on public.training_blocks
  for each row execute function public.set_updated_at();

-- ---------- training_block_day_assignments ----------
create table if not exists public.training_block_day_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  block_id uuid not null references public.training_blocks (id) on delete cascade,

  weekday int not null,
  order_index int not null default 0,
  template_id uuid references public.workout_templates (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  manual_title text,
  planned_duration_min int,
  notes text,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.training_block_day_assignments drop constraint if exists training_block_day_assignments_weekday_chk;
alter table public.training_block_day_assignments
  add constraint training_block_day_assignments_weekday_chk
  check (weekday between 1 and 7);

alter table public.training_block_day_assignments enable row level security;

drop policy if exists training_block_day_assignments_select_own on public.training_block_day_assignments;
create policy training_block_day_assignments_select_own on public.training_block_day_assignments for select using (auth.uid() = user_id);
drop policy if exists training_block_day_assignments_insert_own on public.training_block_day_assignments;
create policy training_block_day_assignments_insert_own on public.training_block_day_assignments for insert with check (auth.uid() = user_id);
drop policy if exists training_block_day_assignments_update_own on public.training_block_day_assignments;
create policy training_block_day_assignments_update_own on public.training_block_day_assignments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_block_day_assignments_delete_own on public.training_block_day_assignments;
create policy training_block_day_assignments_delete_own on public.training_block_day_assignments for delete using (auth.uid() = user_id);

create index if not exists training_block_day_assignments_user_idx on public.training_block_day_assignments (user_id);
create index if not exists training_block_day_assignments_block_idx on public.training_block_day_assignments (block_id, weekday, order_index);

drop trigger if exists trg_training_block_day_assignments_updated on public.training_block_day_assignments;
create trigger trg_training_block_day_assignments_updated before update on public.training_block_day_assignments
  for each row execute function public.set_updated_at();

-- ---------- training_plan_series ----------
create table if not exists public.training_plan_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  source_type text not null default 'template',
  template_id uuid references public.workout_templates (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  manual_title text,
  start_date date not null,
  end_date date not null,
  recurrence_type text not null default 'weekly',
  recurrence_interval int not null default 1,
  days_of_week int[] not null default '{}',
  planned_duration_min int,
  conflict_policy text not null default 'append',
  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.training_plan_series drop constraint if exists training_plan_series_source_type_chk;
alter table public.training_plan_series
  add constraint training_plan_series_source_type_chk
  check (source_type in ('template', 'manual'));

alter table public.training_plan_series drop constraint if exists training_plan_series_conflict_policy_chk;
alter table public.training_plan_series
  add constraint training_plan_series_conflict_policy_chk
  check (conflict_policy in ('skip_existing', 'overwrite_existing', 'append'));

alter table public.training_plan_series drop constraint if exists training_plan_series_status_chk;
alter table public.training_plan_series
  add constraint training_plan_series_status_chk
  check (status in ('active', 'completed', 'cancelled'));

alter table public.training_plan_series enable row level security;

drop policy if exists training_plan_series_select_own on public.training_plan_series;
create policy training_plan_series_select_own on public.training_plan_series for select using (auth.uid() = user_id);
drop policy if exists training_plan_series_insert_own on public.training_plan_series;
create policy training_plan_series_insert_own on public.training_plan_series for insert with check (auth.uid() = user_id);
drop policy if exists training_plan_series_update_own on public.training_plan_series;
create policy training_plan_series_update_own on public.training_plan_series for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_plan_series_delete_own on public.training_plan_series;
create policy training_plan_series_delete_own on public.training_plan_series for delete using (auth.uid() = user_id);

create index if not exists training_plan_series_user_idx on public.training_plan_series (user_id);

drop trigger if exists trg_training_plan_series_updated on public.training_plan_series;
create trigger trg_training_plan_series_updated before update on public.training_plan_series
  for each row execute function public.set_updated_at();

-- ---------- scheduled_workouts ----------
create table if not exists public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  scheduled_date date not null,
  order_index int not null default 0,

  sport_id uuid references public.sports (id) on delete set null,
  template_id uuid references public.workout_templates (id) on delete set null,
  block_id uuid references public.training_blocks (id) on delete set null,
  block_assignment_id uuid references public.training_block_day_assignments (id) on delete set null,
  series_id uuid references public.training_plan_series (id) on delete set null,

  source_type text not null default 'manual',
  title text not null,
  subtitle text,
  planned_duration_min int,
  color_token text,
  status text not null default 'planned',

  is_override boolean not null default false,
  original_scheduled_date date,
  notes text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.scheduled_workouts drop constraint if exists scheduled_workouts_source_type_chk;
alter table public.scheduled_workouts
  add constraint scheduled_workouts_source_type_chk
  check (source_type in ('manual', 'template', 'block', 'series', 'copied', 'history'));

alter table public.scheduled_workouts drop constraint if exists scheduled_workouts_status_chk;
alter table public.scheduled_workouts
  add constraint scheduled_workouts_status_chk
  check (status in ('planned', 'in_progress', 'completed', 'skipped', 'cancelled'));

alter table public.scheduled_workouts enable row level security;

drop policy if exists scheduled_workouts_select_own on public.scheduled_workouts;
create policy scheduled_workouts_select_own on public.scheduled_workouts for select using (auth.uid() = user_id);
drop policy if exists scheduled_workouts_insert_own on public.scheduled_workouts;
create policy scheduled_workouts_insert_own on public.scheduled_workouts for insert with check (auth.uid() = user_id);
drop policy if exists scheduled_workouts_update_own on public.scheduled_workouts;
create policy scheduled_workouts_update_own on public.scheduled_workouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists scheduled_workouts_delete_own on public.scheduled_workouts;
create policy scheduled_workouts_delete_own on public.scheduled_workouts for delete using (auth.uid() = user_id);

create index if not exists scheduled_workouts_user_idx on public.scheduled_workouts (user_id);
create index if not exists scheduled_workouts_user_date_idx on public.scheduled_workouts (user_id, scheduled_date, order_index);
create index if not exists scheduled_workouts_block_idx on public.scheduled_workouts (block_id);
create index if not exists scheduled_workouts_series_idx on public.scheduled_workouts (series_id);

drop trigger if exists trg_scheduled_workouts_updated on public.scheduled_workouts;
create trigger trg_scheduled_workouts_updated before update on public.scheduled_workouts
  for each row execute function public.set_updated_at();

-- ---------- progression_rules ----------
create table if not exists public.progression_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid references public.workout_templates (id) on delete cascade,
  block_id uuid references public.training_blocks (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,

  progression_type text not null default 'none',
  duration_weeks int,
  params jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.progression_rules drop constraint if exists progression_rules_type_chk;
alter table public.progression_rules
  add constraint progression_rules_type_chk
  check (progression_type in ('none', 'manual', 'linear', 'percentage', 'double_progression', 'rpe_rir', 'deload', 'custom'));

alter table public.progression_rules enable row level security;

drop policy if exists progression_rules_select_own on public.progression_rules;
create policy progression_rules_select_own on public.progression_rules for select using (auth.uid() = user_id);
drop policy if exists progression_rules_insert_own on public.progression_rules;
create policy progression_rules_insert_own on public.progression_rules for insert with check (auth.uid() = user_id);
drop policy if exists progression_rules_update_own on public.progression_rules;
create policy progression_rules_update_own on public.progression_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists progression_rules_delete_own on public.progression_rules;
create policy progression_rules_delete_own on public.progression_rules for delete using (auth.uid() = user_id);

create index if not exists progression_rules_user_idx on public.progression_rules (user_id);
create index if not exists progression_rules_template_idx on public.progression_rules (template_id);
create index if not exists progression_rules_block_idx on public.progression_rules (block_id);

drop trigger if exists trg_progression_rules_updated on public.progression_rules;
create trigger trg_progression_rules_updated before update on public.progression_rules
  for each row execute function public.set_updated_at();

-- ---------- progression_targets ----------
create table if not exists public.progression_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  progression_rule_id uuid references public.progression_rules (id) on delete cascade,
  template_id uuid references public.workout_templates (id) on delete cascade,
  block_id uuid references public.training_blocks (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,

  week_number int not null,
  set_index int,
  target_weight_kg numeric(8,2),
  target_reps_min int,
  target_reps_max int,
  target_rir numeric(4,1),
  target_rpe numeric(4,1),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.progression_targets enable row level security;

drop policy if exists progression_targets_select_own on public.progression_targets;
create policy progression_targets_select_own on public.progression_targets for select using (auth.uid() = user_id);
drop policy if exists progression_targets_insert_own on public.progression_targets;
create policy progression_targets_insert_own on public.progression_targets for insert with check (auth.uid() = user_id);
drop policy if exists progression_targets_update_own on public.progression_targets;
create policy progression_targets_update_own on public.progression_targets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists progression_targets_delete_own on public.progression_targets;
create policy progression_targets_delete_own on public.progression_targets for delete using (auth.uid() = user_id);

create index if not exists progression_targets_user_idx on public.progression_targets (user_id);
create index if not exists progression_targets_rule_week_idx on public.progression_targets (progression_rule_id, week_number);
create index if not exists progression_targets_block_idx on public.progression_targets (block_id, exercise_id, week_number);

drop trigger if exists trg_progression_targets_updated on public.progression_targets;
create trigger trg_progression_targets_updated before update on public.progression_targets
  for each row execute function public.set_updated_at();

-- ---------- training_sessions ----------
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scheduled_workout_id uuid references public.scheduled_workouts (id) on delete set null,
  template_id uuid references public.workout_templates (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,

  title text not null,
  started_at timestamptz,
  ended_at timestamptz,
  duration_min int,
  status text not null default 'in_progress',

  total_volume_kg numeric(12,2),
  total_distance_km numeric(8,2),
  avg_pace_sec_per_km int,

  notes text,
  perceived_effort int,
  energy_before int,
  energy_during int,
  motivation int,
  soreness int,
  wellbeing int,
  sleep_hours numeric(4,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.training_sessions drop constraint if exists training_sessions_status_chk;
alter table public.training_sessions
  add constraint training_sessions_status_chk
  check (status in ('in_progress', 'completed', 'cancelled'));

alter table public.training_sessions enable row level security;

drop policy if exists training_sessions_select_own on public.training_sessions;
create policy training_sessions_select_own on public.training_sessions for select using (auth.uid() = user_id);
drop policy if exists training_sessions_insert_own on public.training_sessions;
create policy training_sessions_insert_own on public.training_sessions for insert with check (auth.uid() = user_id);
drop policy if exists training_sessions_update_own on public.training_sessions;
create policy training_sessions_update_own on public.training_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists training_sessions_delete_own on public.training_sessions;
create policy training_sessions_delete_own on public.training_sessions for delete using (auth.uid() = user_id);

create index if not exists training_sessions_user_idx on public.training_sessions (user_id);
create index if not exists training_sessions_user_started_idx on public.training_sessions (user_id, started_at desc);
create index if not exists training_sessions_scheduled_idx on public.training_sessions (scheduled_workout_id);

drop trigger if exists trg_training_sessions_updated on public.training_sessions;
create trigger trg_training_sessions_updated before update on public.training_sessions
  for each row execute function public.set_updated_at();

-- ---------- session_exercises ----------
create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,

  name_snapshot text not null,
  order_index int not null default 0,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.session_exercises enable row level security;

drop policy if exists session_exercises_select_own on public.session_exercises;
create policy session_exercises_select_own on public.session_exercises for select using (auth.uid() = user_id);
drop policy if exists session_exercises_insert_own on public.session_exercises;
create policy session_exercises_insert_own on public.session_exercises for insert with check (auth.uid() = user_id);
drop policy if exists session_exercises_update_own on public.session_exercises;
create policy session_exercises_update_own on public.session_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists session_exercises_delete_own on public.session_exercises;
create policy session_exercises_delete_own on public.session_exercises for delete using (auth.uid() = user_id);

create index if not exists session_exercises_user_idx on public.session_exercises (user_id);
create index if not exists session_exercises_session_idx on public.session_exercises (session_id, order_index);

drop trigger if exists trg_session_exercises_updated on public.session_exercises;
create trigger trg_session_exercises_updated before update on public.session_exercises
  for each row execute function public.set_updated_at();

-- ---------- session_sets (incl. rest-timer state) ----------
create table if not exists public.session_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises (id) on delete cascade,

  set_index int not null,
  set_type text not null default 'working',

  target_weight_kg numeric(8,2),
  target_reps_min int,
  target_reps_max int,
  target_rir numeric(4,1),
  target_rpe numeric(4,1),

  actual_weight_kg numeric(8,2),
  actual_reps int,
  actual_rir numeric(4,1),
  actual_rpe numeric(4,1),
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,

  rest_started_at timestamptz,
  rest_duration_seconds int,
  rest_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.session_sets drop constraint if exists session_sets_set_type_chk;
alter table public.session_sets
  add constraint session_sets_set_type_chk
  check (set_type in ('working', 'warmup', 'dropset'));

alter table public.session_sets enable row level security;

drop policy if exists session_sets_select_own on public.session_sets;
create policy session_sets_select_own on public.session_sets for select using (auth.uid() = user_id);
drop policy if exists session_sets_insert_own on public.session_sets;
create policy session_sets_insert_own on public.session_sets for insert with check (auth.uid() = user_id);
drop policy if exists session_sets_update_own on public.session_sets;
create policy session_sets_update_own on public.session_sets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists session_sets_delete_own on public.session_sets;
create policy session_sets_delete_own on public.session_sets for delete using (auth.uid() = user_id);

create index if not exists session_sets_user_idx on public.session_sets (user_id);
create index if not exists session_sets_exercise_idx on public.session_sets (session_exercise_id, set_index);

drop trigger if exists trg_session_sets_updated on public.session_sets;
create trigger trg_session_sets_updated before update on public.session_sets
  for each row execute function public.set_updated_at();

-- ---------- personal_records ----------
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sport_id uuid references public.sports (id) on delete set null,
  exercise_id uuid references public.exercises (id) on delete set null,
  session_id uuid references public.training_sessions (id) on delete set null,

  title text not null,
  metric_type text not null,
  value_numeric numeric(12,3),
  value_text text,
  unit text,
  occurred_on date not null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.personal_records drop constraint if exists personal_records_metric_type_chk;
alter table public.personal_records
  add constraint personal_records_metric_type_chk
  check (metric_type in ('one_rep_max_estimated', 'max_weight', 'max_reps', 'max_volume', 'best_5k_time', 'best_10k_time', 'longest_distance', 'custom'));

alter table public.personal_records enable row level security;

drop policy if exists personal_records_select_own on public.personal_records;
create policy personal_records_select_own on public.personal_records for select using (auth.uid() = user_id);
drop policy if exists personal_records_insert_own on public.personal_records;
create policy personal_records_insert_own on public.personal_records for insert with check (auth.uid() = user_id);
drop policy if exists personal_records_update_own on public.personal_records;
create policy personal_records_update_own on public.personal_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists personal_records_delete_own on public.personal_records;
create policy personal_records_delete_own on public.personal_records for delete using (auth.uid() = user_id);

create index if not exists personal_records_user_idx on public.personal_records (user_id);
create index if not exists personal_records_user_exercise_idx on public.personal_records (user_id, exercise_id, metric_type);
create index if not exists personal_records_session_idx on public.personal_records (session_id);

drop trigger if exists trg_personal_records_updated on public.personal_records;
create trigger trg_personal_records_updated before update on public.personal_records
  for each row execute function public.set_updated_at();
