-- 0030_office_screen_parity.sql
-- Completes Office screen parity for Supabase-backed UI state.

create table if not exists office_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);
alter table office_categories enable row level security;
drop policy if exists "office_categories_select" on office_categories;
drop policy if exists "office_categories_insert" on office_categories;
drop policy if exists "office_categories_update" on office_categories;
drop policy if exists "office_categories_delete" on office_categories;
create policy "office_categories_select" on office_categories for select using (auth.uid() = user_id);
create policy "office_categories_insert" on office_categories for insert with check (auth.uid() = user_id);
create policy "office_categories_update" on office_categories for update using (auth.uid() = user_id);
create policy "office_categories_delete" on office_categories for delete using (auth.uid() = user_id);
create index if not exists office_categories_user_idx on office_categories(user_id);

create table if not exists office_tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  title         text not null,
  due_date      date,
  priority      text not null default 'mid' check (priority in ('low', 'mid', 'high')),
  institution   text not null default '',
  category      text not null default 'Administracja',
  status        text not null default 'todo' check (status in ('todo', 'active', 'waiting', 'done', 'blocked')),
  notes         text not null default '',
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table office_tasks enable row level security;
drop policy if exists "office_tasks_select" on office_tasks;
drop policy if exists "office_tasks_insert" on office_tasks;
drop policy if exists "office_tasks_update" on office_tasks;
drop policy if exists "office_tasks_delete" on office_tasks;
create policy "office_tasks_select" on office_tasks for select using (auth.uid() = user_id);
create policy "office_tasks_insert" on office_tasks for insert with check (auth.uid() = user_id);
create policy "office_tasks_update" on office_tasks for update using (auth.uid() = user_id);
create policy "office_tasks_delete" on office_tasks for delete using (auth.uid() = user_id);
create index if not exists office_tasks_user_idx on office_tasks(user_id);
create index if not exists office_tasks_due_date_idx on office_tasks(user_id, due_date);
drop trigger if exists set_office_tasks_updated_at on office_tasks;
create trigger set_office_tasks_updated_at before update on office_tasks
  for each row execute procedure set_updated_at();

alter table documents add column if not exists category text not null default 'Dokumenty';
alter table documents add column if not exists issue_date date;
alter table documents add column if not exists reminder_enabled boolean not null default false;
alter table documents add column if not exists notes text not null default '';
alter table documents add column if not exists is_archived boolean not null default false;

alter table insurance_policies add column if not exists name text;
alter table insurance_policies add column if not exists expiry_date date;
alter table insurance_policies add column if not exists frequency text not null default 'rocznie';
alter table insurance_policies add column if not exists notes text not null default '';

alter table vehicles add column if not exists mileage int not null default 0;
alter table vehicles add column if not exists insurance_expiry date;
alter table vehicles add column if not exists inspection_date date;
alter table vehicles add column if not exists oil_change_date date;
alter table vehicles add column if not exists tire_change_date date;

alter table vacations add column if not exists status text not null default 'planned';
alter table vacations add column if not exists notes text not null default '';
