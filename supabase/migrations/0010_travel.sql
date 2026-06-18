-- 0010_travel.sql — Podróże: trips, trip_items, trip_documents, trip_budget_items, bucket_list

-- ── trips ─────────────────────────────────────────────────────────────────────
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  dest        text not null,
  country     text,
  start_date  date,
  end_date    date,
  status      text not null default 'planned', -- planned | active | done
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table trips enable row level security;
create policy "trips_select" on trips for select using (auth.uid() = user_id);
create policy "trips_insert" on trips for insert with check (auth.uid() = user_id);
create policy "trips_update" on trips for update using (auth.uid() = user_id);
create policy "trips_delete" on trips for delete using (auth.uid() = user_id);
create index if not exists trips_user_idx on trips(user_id);
create trigger set_trips_updated_at before update on trips
  for each row execute procedure set_updated_at();

-- ── trip_items ────────────────────────────────────────────────────────────────
create table if not exists trip_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  trip_id     uuid references trips on delete cascade,
  type        text not null default 'attraction', -- flight | lodging | transport | attraction | packing
  title       text not null,
  datetime    timestamptz,
  details     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table trip_items enable row level security;
create policy "ti_select" on trip_items for select using (auth.uid() = user_id);
create policy "ti_insert" on trip_items for insert with check (auth.uid() = user_id);
create policy "ti_update" on trip_items for update using (auth.uid() = user_id);
create policy "ti_delete" on trip_items for delete using (auth.uid() = user_id);
create index if not exists trip_items_user_idx on trip_items(user_id);
create index if not exists trip_items_trip_idx on trip_items(trip_id);
create trigger set_trip_items_updated_at before update on trip_items
  for each row execute procedure set_updated_at();

-- ── trip_documents ────────────────────────────────────────────────────────────
create table if not exists trip_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  trip_id     uuid references trips on delete set null,
  name        text not null,
  expires_on  date,
  status      text not null default 'valid', -- valid | expiring | expired
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table trip_documents enable row level security;
create policy "td_select" on trip_documents for select using (auth.uid() = user_id);
create policy "td_insert" on trip_documents for insert with check (auth.uid() = user_id);
create policy "td_update" on trip_documents for update using (auth.uid() = user_id);
create policy "td_delete" on trip_documents for delete using (auth.uid() = user_id);
create index if not exists trip_documents_user_idx on trip_documents(user_id);
create trigger set_trip_documents_updated_at before update on trip_documents
  for each row execute procedure set_updated_at();

-- ── trip_budget_items ─────────────────────────────────────────────────────────
create table if not exists trip_budget_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  trip_id     uuid references trips on delete cascade,
  category    text not null,
  planned     numeric(10,2) not null default 0,
  actual      numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table trip_budget_items enable row level security;
create policy "tbi_select" on trip_budget_items for select using (auth.uid() = user_id);
create policy "tbi_insert" on trip_budget_items for insert with check (auth.uid() = user_id);
create policy "tbi_update" on trip_budget_items for update using (auth.uid() = user_id);
create policy "tbi_delete" on trip_budget_items for delete using (auth.uid() = user_id);
create index if not exists trip_budget_items_user_idx on trip_budget_items(user_id);
create trigger set_trip_budget_items_updated_at before update on trip_budget_items
  for each row execute procedure set_updated_at();

-- ── bucket_list ───────────────────────────────────────────────────────────────
create table if not exists bucket_list (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  note        text,
  status      text not null default 'dream', -- dream | planned | done
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table bucket_list enable row level security;
create policy "bl_select" on bucket_list for select using (auth.uid() = user_id);
create policy "bl_insert" on bucket_list for insert with check (auth.uid() = user_id);
create policy "bl_update" on bucket_list for update using (auth.uid() = user_id);
create policy "bl_delete" on bucket_list for delete using (auth.uid() = user_id);
create index if not exists bucket_list_user_idx on bucket_list(user_id);
create trigger set_bucket_list_updated_at before update on bucket_list
  for each row execute procedure set_updated_at();
