-- ============================================================
-- 0016_profile_prefs
-- Extend profiles + user_preferences so the user profile and
-- settings screens can persist the new fields surfaced in the UI:
--   profiles: first_name, avatar_url, default_city, timezone
--   user_preferences: mode (light|dark|system), notifications, privacy
-- The existing `theme` column now stores the full Rootine theme id
-- (e.g. 'magenta', 'dark', 'white-lotus') and `locale` the language.
-- All columns are nullable / defaulted, so the signup bootstrap and
-- existing rows keep working without backfill.
-- ============================================================

alter table public.profiles
  add column if not exists first_name   text,
  add column if not exists avatar_url   text,
  add column if not exists default_city text,
  add column if not exists timezone     text;

alter table public.user_preferences
  add column if not exists mode          text  not null default 'system',  -- light | dark | system
  add column if not exists notifications jsonb not null default '{}'::jsonb,
  add column if not exists privacy       jsonb not null default '{}'::jsonb;
