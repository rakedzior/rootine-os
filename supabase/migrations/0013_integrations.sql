-- ============================================================
-- 0013_integrations  ·  Faza 3
-- Integrations (Google Calendar, Strava), calendar_events,
-- strava_activities, audit_log_entries reference
-- ============================================================

-- ── integrations ─────────────────────────────────────────────
create table public.integrations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  provider      text not null,   -- 'google_calendar' | 'strava'
  status        text not null default 'disconnected',  -- 'connected' | 'disconnected'
  scope         text,
  connected_at  timestamptz,
  disconnected_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, provider)
);
alter table public.integrations enable row level security;
create policy "integrations_select" on public.integrations for select using (auth.uid() = user_id);
create policy "integrations_insert" on public.integrations for insert with check (auth.uid() = user_id);
create policy "integrations_update" on public.integrations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "integrations_delete" on public.integrations for delete using (auth.uid() = user_id);
create index on public.integrations (user_id);
create trigger trg_integrations_updated before update on public.integrations
  for each row execute function public.set_updated_at();

-- ── integration_tokens ───────────────────────────────────────
-- Tokens stored encrypted via pgp_sym_encrypt (Vault preferred in prod)
create table public.integration_tokens (
  id               uuid primary key default gen_random_uuid(),
  integration_id   uuid not null references public.integrations on delete cascade,
  user_id          uuid not null references auth.users on delete cascade,
  access_token_enc text not null,   -- pgp_sym_encrypt(token, secret)
  refresh_token_enc text,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (integration_id)
);
alter table public.integration_tokens enable row level security;
create policy "tokens_select" on public.integration_tokens for select using (auth.uid() = user_id);
create policy "tokens_insert" on public.integration_tokens for insert with check (auth.uid() = user_id);
create policy "tokens_update" on public.integration_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tokens_delete" on public.integration_tokens for delete using (auth.uid() = user_id);
create index on public.integration_tokens (user_id);
create trigger trg_integration_tokens_updated before update on public.integration_tokens
  for each row execute function public.set_updated_at();

-- ── calendar_events ───────────────────────────────────────────
create table public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  external_id  text,              -- Google event id
  title        text not null,
  start_ts     timestamptz not null,
  end_ts       timestamptz not null,
  all_day      boolean not null default false,
  calendar_id  text,
  color        text,
  location     text,
  description  text,
  url          text,
  source       text not null default 'manual',  -- 'manual' | 'google_calendar'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.calendar_events enable row level security;
create policy "calendar_events_select" on public.calendar_events for select using (auth.uid() = user_id);
create policy "calendar_events_insert" on public.calendar_events for insert with check (auth.uid() = user_id);
create policy "calendar_events_update" on public.calendar_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_events_delete" on public.calendar_events for delete using (auth.uid() = user_id);
create index on public.calendar_events (user_id, start_ts);
create trigger trg_calendar_events_updated before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ── strava_activities ────────────────────────────────────────
create table public.strava_activities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  external_id    bigint,           -- Strava activity id
  name           text not null,
  type           text,             -- 'Run' | 'Ride' | etc.
  distance_m     numeric(10,1),
  duration_s     integer,
  elevation_m    numeric(8,1),
  start_date     date not null,
  avg_hr         integer,
  max_hr         integer,
  avg_pace_s     integer,          -- seconds per km
  polyline       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, external_id)
);
alter table public.strava_activities enable row level security;
create policy "strava_activities_select" on public.strava_activities for select using (auth.uid() = user_id);
create policy "strava_activities_insert" on public.strava_activities for insert with check (auth.uid() = user_id);
create policy "strava_activities_update" on public.strava_activities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "strava_activities_delete" on public.strava_activities for delete using (auth.uid() = user_id);
create index on public.strava_activities (user_id, start_date desc);
create trigger trg_strava_activities_updated before update on public.strava_activities
  for each row execute function public.set_updated_at();
