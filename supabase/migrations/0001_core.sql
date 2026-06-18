-- ============================================================
-- ROOTINE OS — 0001 Core schema
-- Multi-user, RLS-from-day-one. Region: eu-central-1 (Frankfurt).
-- Convention: every user table has id, user_id -> auth.users,
-- created_at, updated_at; RLS enabled with deny-all default and
-- explicit per-operation policies (auth.uid() = user_id).
-- ============================================================

-- ---------- shared helpers ----------

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles (1:1 with auth.users; PK == auth.users.id)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_label  text default 'YOU',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete" on public.profiles for delete using (auth.uid() = id);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_preferences (theme / palette / font / radius / locale)
-- mirrors the prototype Tweaks panel; drives <html> data-* attrs.
-- ============================================================
create table public.user_preferences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  theme       text not null default 'light',     -- light | dark
  palette     text not null default 'celadon',   -- celadon | sage | misty | blush
  font        text not null default 'serif',     -- serif | sans (headings)
  radius      int  not null default 20,
  locale      text not null default 'pl',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);
alter table public.user_preferences enable row level security;
create policy "user_preferences_select" on public.user_preferences for select using (auth.uid() = user_id);
create policy "user_preferences_insert" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "user_preferences_update" on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_preferences_delete" on public.user_preferences for delete using (auth.uid() = user_id);
create index on public.user_preferences (user_id);
create trigger trg_user_preferences_updated before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_module_settings — per module visibility + nav order
-- Seeded for all 9 modules on signup (ordering needs concrete rows).
-- ============================================================
create table public.user_module_settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  module_key  text not null,   -- start | sport | diet | finance | goals | office | travel | notes | work
  visible     boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, module_key)
);
alter table public.user_module_settings enable row level security;
create policy "user_module_settings_select" on public.user_module_settings for select using (auth.uid() = user_id);
create policy "user_module_settings_insert" on public.user_module_settings for insert with check (auth.uid() = user_id);
create policy "user_module_settings_update" on public.user_module_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_module_settings_delete" on public.user_module_settings for delete using (auth.uid() = user_id);
create index on public.user_module_settings (user_id);
create trigger trg_user_module_settings_updated before update on public.user_module_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_feature_settings — per feature_key visibility (override model)
-- Absence of a row == visible. We only store explicit hides/shows, so
-- SQL never needs to enumerate the full feature catalog (lives in the
-- frontend registry). feature_key example: 'start.finance_pulse'.
-- ============================================================
create table public.user_feature_settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  feature_key text not null,
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, feature_key)
);
alter table public.user_feature_settings enable row level security;
create policy "user_feature_settings_select" on public.user_feature_settings for select using (auth.uid() = user_id);
create policy "user_feature_settings_insert" on public.user_feature_settings for insert with check (auth.uid() = user_id);
create policy "user_feature_settings_update" on public.user_feature_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_feature_settings_delete" on public.user_feature_settings for delete using (auth.uid() = user_id);
create index on public.user_feature_settings (user_id);
create trigger trg_user_feature_settings_updated before update on public.user_feature_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- user_dashboard_layouts — widget order within a screen
-- widget_order is an ordered array of feature_keys for that screen.
-- ============================================================
create table public.user_dashboard_layouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  screen        text not null,        -- e.g. 'start', 'sport'
  widget_order  text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, screen)
);
alter table public.user_dashboard_layouts enable row level security;
create policy "user_dashboard_layouts_select" on public.user_dashboard_layouts for select using (auth.uid() = user_id);
create policy "user_dashboard_layouts_insert" on public.user_dashboard_layouts for insert with check (auth.uid() = user_id);
create policy "user_dashboard_layouts_update" on public.user_dashboard_layouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_dashboard_layouts_delete" on public.user_dashboard_layouts for delete using (auth.uid() = user_id);
create index on public.user_dashboard_layouts (user_id);
create trigger trg_user_dashboard_layouts_updated before update on public.user_dashboard_layouts
  for each row execute function public.set_updated_at();

-- ============================================================
-- audit_log — append-only security/event trail
-- Insert own rows; select own rows. No update/delete policies =>
-- immutable from the client. Privileged inserts (failed logins, etc.)
-- come from Edge Functions with elevated rights.
-- ============================================================
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  action      text not null,         -- 'login', 'login_failed', 'finance_change', 'document_access', 'export', 'account_delete', 'integration_connect', 'integration_disconnect'
  entity      text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "audit_log_select" on public.audit_log for select using (auth.uid() = user_id);
create policy "audit_log_insert" on public.audit_log for insert with check (auth.uid() = user_id);
create index on public.audit_log (user_id, created_at desc);

-- ============================================================
-- sync_log — integration sync runs (Phase 3)
-- ============================================================
create table public.sync_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  provider    text not null,         -- 'google_calendar' | 'strava'
  status      text not null,         -- 'ok' | 'error'
  detail      text,
  created_at  timestamptz not null default now()
);
alter table public.sync_log enable row level security;
create policy "sync_log_select" on public.sync_log for select using (auth.uid() = user_id);
create policy "sync_log_insert" on public.sync_log for insert with check (auth.uid() = user_id);
create index on public.sync_log (user_id, created_at desc);

-- ============================================================
-- New-user bootstrap: profile + preferences + 9 module rows.
-- SECURITY DEFINER so it can write on behalf of the new user.
-- Feature visibility uses the override model (no rows needed).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.user_preferences (user_id) values (new.id);

  insert into public.user_module_settings (user_id, module_key, visible, sort_order)
  values
    (new.id, 'start',   true, 0),
    (new.id, 'sport',   true, 1),
    (new.id, 'diet',    true, 2),
    (new.id, 'finance', true, 3),
    (new.id, 'goals',   true, 4),
    (new.id, 'office',  true, 5),
    (new.id, 'travel',  true, 6),
    (new.id, 'notes',   true, 7),
    (new.id, 'work',    true, 8);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
