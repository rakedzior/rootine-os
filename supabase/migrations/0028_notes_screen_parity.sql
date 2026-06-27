-- ============================================================
-- 0028_notes_screen_parity
-- Extends Notes so the current Notatki screen can move from
-- localStore to Supabase without losing UI fields.
-- ============================================================

alter table public.notes
  add column if not exists color text not null default '#1b2b33',
  add column if not exists category text not null default 'Pomysly',
  add column if not exists tags text[] not null default '{}',
  add column if not exists archived boolean not null default false,
  add column if not exists checklist_items jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'notes_checklist_items_array_chk') then
    alter table public.notes
      add constraint notes_checklist_items_array_chk check (jsonb_typeof(checklist_items) = 'array');
  end if;
end $$;

create index if not exists notes_user_archived_idx
  on public.notes(user_id, archived, updated_at desc);

create index if not exists notes_user_category_idx
  on public.notes(user_id, category);

create index if not exists notes_tags_gin_idx
  on public.notes using gin(tags);
