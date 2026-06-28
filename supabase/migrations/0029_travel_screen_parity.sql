-- ============================================================
-- 0029_travel_screen_parity
-- Extends Travel so the current Podroze screen can move from
-- localStore to Supabase without losing UI fields.
-- ============================================================

alter table public.trips
  add column if not exists city text,
  add column if not exists budget numeric(12,2),
  add column if not exists cover_emoji text not null default '',
  add column if not exists is_archived boolean not null default false;

update public.trips
set is_archived = true
where status = 'archived';

create index if not exists trips_user_status_idx
  on public.trips(user_id, status, is_archived);

create index if not exists trips_user_dates_idx
  on public.trips(user_id, start_date, end_date);
