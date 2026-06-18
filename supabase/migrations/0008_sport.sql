-- 0008_sport.sql — Sport: exercises, workouts, workout_sets, body_measurements,
--                         readiness_daily, runs, rehab_sessions, mobility_sessions

-- ── exercises ─────────────────────────────────────────────────────────────────
create table if not exists exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  category    text,
  created_at  timestamptz not null default now()
);
alter table exercises enable row level security;
create policy "ex_select" on exercises for select using (auth.uid() = user_id);
create policy "ex_insert" on exercises for insert with check (auth.uid() = user_id);
create policy "ex_update" on exercises for update using (auth.uid() = user_id);
create policy "ex_delete" on exercises for delete using (auth.uid() = user_id);
create index if not exists exercises_user_idx on exercises(user_id);

-- ── workouts ──────────────────────────────────────────────────────────────────
create table if not exists workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  date        date not null default current_date,
  name        text not null,
  type        text,
  status      text not null default 'planned', -- planned | active | done
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table workouts enable row level security;
create policy "wo_select" on workouts for select using (auth.uid() = user_id);
create policy "wo_insert" on workouts for insert with check (auth.uid() = user_id);
create policy "wo_update" on workouts for update using (auth.uid() = user_id);
create policy "wo_delete" on workouts for delete using (auth.uid() = user_id);
create index if not exists workouts_user_date_idx on workouts(user_id, date);
create trigger set_workouts_updated_at before update on workouts
  for each row execute procedure set_updated_at();

-- ── workout_sets ──────────────────────────────────────────────────────────────
create table if not exists workout_sets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  workout_id      uuid references workouts on delete cascade,
  exercise_id     uuid references exercises on delete set null,
  exercise_name   text not null,
  weight          numeric(7,2) not null default 0,
  reps            int not null default 0,
  set_no          int not null default 1,
  rir             int,
  rpe             numeric(4,1),
  notes           text,
  created_at      timestamptz not null default now()
);
alter table workout_sets enable row level security;
create policy "ws_select" on workout_sets for select using (auth.uid() = user_id);
create policy "ws_insert" on workout_sets for insert with check (auth.uid() = user_id);
create policy "ws_update" on workout_sets for update using (auth.uid() = user_id);
create policy "ws_delete" on workout_sets for delete using (auth.uid() = user_id);
create index if not exists workout_sets_user_idx on workout_sets(user_id);
create index if not exists workout_sets_workout_idx on workout_sets(workout_id);

-- ── body_measurements ─────────────────────────────────────────────────────────
create table if not exists body_measurements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  date            date not null default current_date,
  weight          numeric(5,2),
  body_fat        numeric(5,2),
  lean_mass       numeric(5,2),
  circumferences  jsonb,
  created_at      timestamptz not null default now()
);
alter table body_measurements enable row level security;
create policy "bm_select" on body_measurements for select using (auth.uid() = user_id);
create policy "bm_insert" on body_measurements for insert with check (auth.uid() = user_id);
create policy "bm_update" on body_measurements for update using (auth.uid() = user_id);
create policy "bm_delete" on body_measurements for delete using (auth.uid() = user_id);
create index if not exists body_measurements_user_date_idx on body_measurements(user_id, date);

-- ── readiness_daily ───────────────────────────────────────────────────────────
create table if not exists readiness_daily (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  date        date not null default current_date,
  sleep_h     numeric(4,2),
  hrv_ms      int,
  resting_hr  int,
  soreness    int, -- 0-5
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);
alter table readiness_daily enable row level security;
create policy "rd_select" on readiness_daily for select using (auth.uid() = user_id);
create policy "rd_insert" on readiness_daily for insert with check (auth.uid() = user_id);
create policy "rd_update" on readiness_daily for update using (auth.uid() = user_id);
create policy "rd_delete" on readiness_daily for delete using (auth.uid() = user_id);
create index if not exists readiness_daily_user_date_idx on readiness_daily(user_id, date);
create trigger set_readiness_daily_updated_at before update on readiness_daily
  for each row execute procedure set_updated_at();

-- ── runs ──────────────────────────────────────────────────────────────────────
create table if not exists runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  date          date not null default current_date,
  distance_km   numeric(7,3) not null default 0,
  duration_s    int not null default 0,
  source        text default 'manual',
  created_at    timestamptz not null default now()
);
alter table runs enable row level security;
create policy "runs_select" on runs for select using (auth.uid() = user_id);
create policy "runs_insert" on runs for insert with check (auth.uid() = user_id);
create policy "runs_update" on runs for update using (auth.uid() = user_id);
create policy "runs_delete" on runs for delete using (auth.uid() = user_id);
create index if not exists runs_user_date_idx on runs(user_id, date);

-- ── rehab_sessions ────────────────────────────────────────────────────────────
create table if not exists rehab_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  date        date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);
alter table rehab_sessions enable row level security;
create policy "rs_select" on rehab_sessions for select using (auth.uid() = user_id);
create policy "rs_insert" on rehab_sessions for insert with check (auth.uid() = user_id);
create policy "rs_update" on rehab_sessions for update using (auth.uid() = user_id);
create policy "rs_delete" on rehab_sessions for delete using (auth.uid() = user_id);
create index if not exists rehab_sessions_user_idx on rehab_sessions(user_id);

-- ── mobility_sessions ─────────────────────────────────────────────────────────
create table if not exists mobility_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  date        date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);
alter table mobility_sessions enable row level security;
create policy "ms_select" on mobility_sessions for select using (auth.uid() = user_id);
create policy "ms_insert" on mobility_sessions for insert with check (auth.uid() = user_id);
create policy "ms_update" on mobility_sessions for update using (auth.uid() = user_id);
create policy "ms_delete" on mobility_sessions for delete using (auth.uid() = user_id);
create index if not exists mobility_sessions_user_idx on mobility_sessions(user_id);
