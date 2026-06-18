-- 0009_notes.sql — Notatki: note_collections, notes, journal_entries

-- ── note_collections ──────────────────────────────────────────────────────────
create table if not exists note_collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  color       text not null default '#888888',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table note_collections enable row level security;
create policy "nc_select" on note_collections for select using (auth.uid() = user_id);
create policy "nc_insert" on note_collections for insert with check (auth.uid() = user_id);
create policy "nc_update" on note_collections for update using (auth.uid() = user_id);
create policy "nc_delete" on note_collections for delete using (auth.uid() = user_id);
create index if not exists note_collections_user_idx on note_collections(user_id);
create trigger set_note_collections_updated_at before update on note_collections
  for each row execute procedure set_updated_at();

-- ── notes ─────────────────────────────────────────────────────────────────────
create table if not exists notes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  collection_id   uuid references note_collections on delete set null,
  type            text not null default 'note', -- note | checklist | quote
  title           text,
  body            text not null default '',
  pinned          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
alter table notes enable row level security;
create policy "notes_select" on notes for select using (auth.uid() = user_id);
create policy "notes_insert" on notes for insert with check (auth.uid() = user_id);
create policy "notes_update" on notes for update using (auth.uid() = user_id);
create policy "notes_delete" on notes for delete using (auth.uid() = user_id);
create index if not exists notes_user_idx on notes(user_id);
create index if not exists notes_collection_idx on notes(collection_id);
create trigger set_notes_updated_at before update on notes
  for each row execute procedure set_updated_at();

-- ── journal_entries ───────────────────────────────────────────────────────────
create table if not exists journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  date        date not null default current_date,
  prompt      text,
  body        text not null default '',
  mood        int, -- 1-5
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);
alter table journal_entries enable row level security;
create policy "je_select" on journal_entries for select using (auth.uid() = user_id);
create policy "je_insert" on journal_entries for insert with check (auth.uid() = user_id);
create policy "je_update" on journal_entries for update using (auth.uid() = user_id);
create policy "je_delete" on journal_entries for delete using (auth.uid() = user_id);
create index if not exists journal_entries_user_date_idx on journal_entries(user_id, date);
create trigger set_journal_entries_updated_at before update on journal_entries
  for each row execute procedure set_updated_at();
