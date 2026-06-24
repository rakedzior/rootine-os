-- ============================================================
-- 0020_graphite_default_theme
-- Set Graphite (dark) as global default theme for all users.
-- 1) New preference rows default to 'dark'
-- 2) Existing users are backfilled to 'dark'
-- ============================================================

alter table public.user_preferences
  alter column theme set default 'dark';

update public.user_preferences
set theme = 'dark'
where theme is distinct from 'dark';
