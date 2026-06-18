-- 0012_office.sql — Biuro: document_categories, documents, insurance_policies,
--                          vehicles, vehicle_services, b2b_settlements, employment, vacations

-- ── document_categories ───────────────────────────────────────────────────────
create table if not exists document_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
alter table document_categories enable row level security;
create policy "dc_select" on document_categories for select using (auth.uid() = user_id);
create policy "dc_insert" on document_categories for insert with check (auth.uid() = user_id);
create policy "dc_update" on document_categories for update using (auth.uid() = user_id);
create policy "dc_delete" on document_categories for delete using (auth.uid() = user_id);
create index if not exists document_categories_user_idx on document_categories(user_id);

-- ── documents ─────────────────────────────────────────────────────────────────
-- NOTE: doc_number stored as plaintext for MVP; marked for Vault encryption in Faza 4.
create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  category_id     uuid references document_categories on delete set null,
  name            text not null,
  doc_number      text, -- TODO: encrypt with pgp_sym_encrypt in Faza 4 security review
  file_path       text, -- path in Supabase Storage bucket 'documents'
  expires_on      date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table documents enable row level security;
create policy "docs_select" on documents for select using (auth.uid() = user_id);
create policy "docs_insert" on documents for insert with check (auth.uid() = user_id);
create policy "docs_update" on documents for update using (auth.uid() = user_id);
create policy "docs_delete" on documents for delete using (auth.uid() = user_id);
create index if not exists documents_user_idx on documents(user_id);
create trigger set_documents_updated_at before update on documents
  for each row execute procedure set_updated_at();

-- ── insurance_policies ────────────────────────────────────────────────────────
create table if not exists insurance_policies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  type        text not null, -- OC | AC | health | life | property | travel | other
  insurer     text not null,
  sum_insured numeric(14,2),
  premium     numeric(10,2),
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table insurance_policies enable row level security;
create policy "ip_select" on insurance_policies for select using (auth.uid() = user_id);
create policy "ip_insert" on insurance_policies for insert with check (auth.uid() = user_id);
create policy "ip_update" on insurance_policies for update using (auth.uid() = user_id);
create policy "ip_delete" on insurance_policies for delete using (auth.uid() = user_id);
create index if not exists insurance_policies_user_idx on insurance_policies(user_id);
create trigger set_insurance_policies_updated_at before update on insurance_policies
  for each row execute procedure set_updated_at();

-- ── vehicles ──────────────────────────────────────────────────────────────────
create table if not exists vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  plate       text,
  vin         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table vehicles enable row level security;
create policy "veh_select" on vehicles for select using (auth.uid() = user_id);
create policy "veh_insert" on vehicles for insert with check (auth.uid() = user_id);
create policy "veh_update" on vehicles for update using (auth.uid() = user_id);
create policy "veh_delete" on vehicles for delete using (auth.uid() = user_id);
create index if not exists vehicles_user_idx on vehicles(user_id);
create trigger set_vehicles_updated_at before update on vehicles
  for each row execute procedure set_updated_at();

-- ── vehicle_services ──────────────────────────────────────────────────────────
create table if not exists vehicle_services (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  vehicle_id  uuid references vehicles on delete cascade,
  type        text not null, -- przegląd | OC | AC | serwis | other
  date        date not null default current_date,
  cost        numeric(10,2),
  due_on      date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table vehicle_services enable row level security;
create policy "vs_select" on vehicle_services for select using (auth.uid() = user_id);
create policy "vs_insert" on vehicle_services for insert with check (auth.uid() = user_id);
create policy "vs_update" on vehicle_services for update using (auth.uid() = user_id);
create policy "vs_delete" on vehicle_services for delete using (auth.uid() = user_id);
create index if not exists vehicle_services_user_idx on vehicle_services(user_id);
create index if not exists vehicle_services_vehicle_idx on vehicle_services(vehicle_id);
create trigger set_vehicle_services_updated_at before update on vehicle_services
  for each row execute procedure set_updated_at();

-- ── b2b_settlements ───────────────────────────────────────────────────────────
create table if not exists b2b_settlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  month       text not null, -- YYYY-MM
  zus         numeric(10,2) not null default 0,
  pit         numeric(10,2) not null default 0,
  vat         numeric(10,2) not null default 0,
  status      text not null default 'pending', -- pending | paid
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, month)
);
alter table b2b_settlements enable row level security;
create policy "b2b_select" on b2b_settlements for select using (auth.uid() = user_id);
create policy "b2b_insert" on b2b_settlements for insert with check (auth.uid() = user_id);
create policy "b2b_update" on b2b_settlements for update using (auth.uid() = user_id);
create policy "b2b_delete" on b2b_settlements for delete using (auth.uid() = user_id);
create index if not exists b2b_settlements_user_idx on b2b_settlements(user_id);
create trigger set_b2b_settlements_updated_at before update on b2b_settlements
  for each row execute procedure set_updated_at();

-- ── employment ────────────────────────────────────────────────────────────────
create table if not exists employment (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  employer        text not null,
  position        text,
  start_date      date,
  vacation_pool   int not null default 26, -- days per year
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table employment enable row level security;
create policy "emp_select" on employment for select using (auth.uid() = user_id);
create policy "emp_insert" on employment for insert with check (auth.uid() = user_id);
create policy "emp_update" on employment for update using (auth.uid() = user_id);
create policy "emp_delete" on employment for delete using (auth.uid() = user_id);
create index if not exists employment_user_idx on employment(user_id);
create trigger set_employment_updated_at before update on employment
  for each row execute procedure set_updated_at();

-- ── vacations ─────────────────────────────────────────────────────────────────
create table if not exists vacations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  start_date  date not null,
  end_date    date not null,
  days        int not null default 1,
  type        text not null default 'wypoczynkowy', -- wypoczynkowy | na żądanie | okolicznościowy | bezpłatny
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table vacations enable row level security;
create policy "vac_select" on vacations for select using (auth.uid() = user_id);
create policy "vac_insert" on vacations for insert with check (auth.uid() = user_id);
create policy "vac_update" on vacations for update using (auth.uid() = user_id);
create policy "vac_delete" on vacations for delete using (auth.uid() = user_id);
create index if not exists vacations_user_idx on vacations(user_id);
create trigger set_vacations_updated_at before update on vacations
  for each row execute procedure set_updated_at();
