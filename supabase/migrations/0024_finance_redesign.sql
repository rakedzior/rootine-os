-- 0024_finance_redesign.sql - Finanse: monthly dashboard, payments,
-- budget categories, savings goals, JDG checklist and activity history.

create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text not null default 'main_account',
  balance_minor bigint not null default 0,
  currency text not null default 'PLN',
  institution text,
  color text,
  archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  target_amount_minor bigint not null default 0,
  current_amount_minor bigint not null default 0,
  deadline date,
  icon text,
  notes text,
  archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  savings_goal_id uuid not null references public.finance_savings_goals on delete cascade,
  amount_minor bigint not null,
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_budget_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  month text not null,
  planned_amount_minor bigint not null default 0,
  actual_amount_minor bigint not null default 0,
  color text,
  sort_order int not null default 0,
  archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_budget_categories_month_format check (month ~ '^\d{4}-\d{2}$')
);

create table if not exists public.finance_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text not null default 'Inne',
  amount_minor bigint not null default 0,
  payment_type text not null default 'monthly',
  due_day int check (due_day between 1 and 31),
  frequency text not null default 'monthly',
  reminder_days_before int,
  show_in_planner boolean not null default false,
  notes text,
  archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_payment_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  payment_id uuid references public.finance_payments on delete cascade,
  name text not null,
  category text not null default 'Inne',
  amount_minor bigint not null default 0,
  due_date date not null,
  status text not null default 'due',
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_payment_occurrences_status check (status in ('due', 'paid', 'overdue', 'cancelled'))
);

create table if not exists public.finance_month_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  month text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_month_notes_month_format check (month ~ '^\d{4}-\d{2}$'),
  constraint finance_month_notes_user_month_unique unique (user_id, month)
);

create table if not exists public.finance_jdg_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text not null,
  description text,
  due_day int check (due_day between 1 and 31),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_jdg_month_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  jdg_item_id uuid not null references public.finance_jdg_items on delete cascade,
  month text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_jdg_month_items_month_format check (month ~ '^\d{4}-\d{2}$'),
  constraint finance_jdg_month_items_unique unique (user_id, jdg_item_id, month)
);

create table if not exists public.finance_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  amount_minor bigint,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.finance_accounts enable row level security;
alter table public.finance_savings_goals enable row level security;
alter table public.finance_savings_contributions enable row level security;
alter table public.finance_budget_categories enable row level security;
alter table public.finance_payments enable row level security;
alter table public.finance_payment_occurrences enable row level security;
alter table public.finance_month_notes enable row level security;
alter table public.finance_jdg_items enable row level security;
alter table public.finance_jdg_month_items enable row level security;
alter table public.finance_activity_log enable row level security;

drop policy if exists finance_accounts_select_own on public.finance_accounts;
drop policy if exists finance_accounts_insert_own on public.finance_accounts;
drop policy if exists finance_accounts_update_own on public.finance_accounts;
drop policy if exists finance_accounts_delete_own on public.finance_accounts;
create policy finance_accounts_select_own on public.finance_accounts for select using (auth.uid() = user_id);
create policy finance_accounts_insert_own on public.finance_accounts for insert with check (auth.uid() = user_id);
create policy finance_accounts_update_own on public.finance_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_accounts_delete_own on public.finance_accounts for delete using (auth.uid() = user_id);

drop policy if exists finance_savings_goals_select_own on public.finance_savings_goals;
drop policy if exists finance_savings_goals_insert_own on public.finance_savings_goals;
drop policy if exists finance_savings_goals_update_own on public.finance_savings_goals;
drop policy if exists finance_savings_goals_delete_own on public.finance_savings_goals;
create policy finance_savings_goals_select_own on public.finance_savings_goals for select using (auth.uid() = user_id);
create policy finance_savings_goals_insert_own on public.finance_savings_goals for insert with check (auth.uid() = user_id);
create policy finance_savings_goals_update_own on public.finance_savings_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_savings_goals_delete_own on public.finance_savings_goals for delete using (auth.uid() = user_id);

drop policy if exists finance_savings_contributions_select_own on public.finance_savings_contributions;
drop policy if exists finance_savings_contributions_insert_own on public.finance_savings_contributions;
drop policy if exists finance_savings_contributions_update_own on public.finance_savings_contributions;
drop policy if exists finance_savings_contributions_delete_own on public.finance_savings_contributions;
create policy finance_savings_contributions_select_own on public.finance_savings_contributions for select using (auth.uid() = user_id);
create policy finance_savings_contributions_insert_own on public.finance_savings_contributions for insert with check (auth.uid() = user_id);
create policy finance_savings_contributions_update_own on public.finance_savings_contributions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_savings_contributions_delete_own on public.finance_savings_contributions for delete using (auth.uid() = user_id);

drop policy if exists finance_budget_categories_select_own on public.finance_budget_categories;
drop policy if exists finance_budget_categories_insert_own on public.finance_budget_categories;
drop policy if exists finance_budget_categories_update_own on public.finance_budget_categories;
drop policy if exists finance_budget_categories_delete_own on public.finance_budget_categories;
create policy finance_budget_categories_select_own on public.finance_budget_categories for select using (auth.uid() = user_id);
create policy finance_budget_categories_insert_own on public.finance_budget_categories for insert with check (auth.uid() = user_id);
create policy finance_budget_categories_update_own on public.finance_budget_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_budget_categories_delete_own on public.finance_budget_categories for delete using (auth.uid() = user_id);

drop policy if exists finance_payments_select_own on public.finance_payments;
drop policy if exists finance_payments_insert_own on public.finance_payments;
drop policy if exists finance_payments_update_own on public.finance_payments;
drop policy if exists finance_payments_delete_own on public.finance_payments;
create policy finance_payments_select_own on public.finance_payments for select using (auth.uid() = user_id);
create policy finance_payments_insert_own on public.finance_payments for insert with check (auth.uid() = user_id);
create policy finance_payments_update_own on public.finance_payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_payments_delete_own on public.finance_payments for delete using (auth.uid() = user_id);

drop policy if exists finance_payment_occurrences_select_own on public.finance_payment_occurrences;
drop policy if exists finance_payment_occurrences_insert_own on public.finance_payment_occurrences;
drop policy if exists finance_payment_occurrences_update_own on public.finance_payment_occurrences;
drop policy if exists finance_payment_occurrences_delete_own on public.finance_payment_occurrences;
create policy finance_payment_occurrences_select_own on public.finance_payment_occurrences for select using (auth.uid() = user_id);
create policy finance_payment_occurrences_insert_own on public.finance_payment_occurrences for insert with check (auth.uid() = user_id);
create policy finance_payment_occurrences_update_own on public.finance_payment_occurrences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_payment_occurrences_delete_own on public.finance_payment_occurrences for delete using (auth.uid() = user_id);

drop policy if exists finance_month_notes_select_own on public.finance_month_notes;
drop policy if exists finance_month_notes_insert_own on public.finance_month_notes;
drop policy if exists finance_month_notes_update_own on public.finance_month_notes;
drop policy if exists finance_month_notes_delete_own on public.finance_month_notes;
create policy finance_month_notes_select_own on public.finance_month_notes for select using (auth.uid() = user_id);
create policy finance_month_notes_insert_own on public.finance_month_notes for insert with check (auth.uid() = user_id);
create policy finance_month_notes_update_own on public.finance_month_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_month_notes_delete_own on public.finance_month_notes for delete using (auth.uid() = user_id);

drop policy if exists finance_jdg_items_select_own on public.finance_jdg_items;
drop policy if exists finance_jdg_items_insert_own on public.finance_jdg_items;
drop policy if exists finance_jdg_items_update_own on public.finance_jdg_items;
drop policy if exists finance_jdg_items_delete_own on public.finance_jdg_items;
create policy finance_jdg_items_select_own on public.finance_jdg_items for select using (auth.uid() = user_id);
create policy finance_jdg_items_insert_own on public.finance_jdg_items for insert with check (auth.uid() = user_id);
create policy finance_jdg_items_update_own on public.finance_jdg_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_jdg_items_delete_own on public.finance_jdg_items for delete using (auth.uid() = user_id);

drop policy if exists finance_jdg_month_items_select_own on public.finance_jdg_month_items;
drop policy if exists finance_jdg_month_items_insert_own on public.finance_jdg_month_items;
drop policy if exists finance_jdg_month_items_update_own on public.finance_jdg_month_items;
drop policy if exists finance_jdg_month_items_delete_own on public.finance_jdg_month_items;
create policy finance_jdg_month_items_select_own on public.finance_jdg_month_items for select using (auth.uid() = user_id);
create policy finance_jdg_month_items_insert_own on public.finance_jdg_month_items for insert with check (auth.uid() = user_id);
create policy finance_jdg_month_items_update_own on public.finance_jdg_month_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_jdg_month_items_delete_own on public.finance_jdg_month_items for delete using (auth.uid() = user_id);

drop policy if exists finance_activity_log_select_own on public.finance_activity_log;
drop policy if exists finance_activity_log_insert_own on public.finance_activity_log;
drop policy if exists finance_activity_log_update_own on public.finance_activity_log;
drop policy if exists finance_activity_log_delete_own on public.finance_activity_log;
create policy finance_activity_log_select_own on public.finance_activity_log for select using (auth.uid() = user_id);
create policy finance_activity_log_insert_own on public.finance_activity_log for insert with check (auth.uid() = user_id);
create policy finance_activity_log_update_own on public.finance_activity_log for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy finance_activity_log_delete_own on public.finance_activity_log for delete using (auth.uid() = user_id);

create index if not exists finance_accounts_user_active_idx on public.finance_accounts(user_id, archived, deleted_at);
create index if not exists finance_savings_goals_user_active_idx on public.finance_savings_goals(user_id, archived, deleted_at);
create index if not exists finance_savings_contributions_goal_date_idx on public.finance_savings_contributions(user_id, savings_goal_id, occurred_on desc);
create index if not exists finance_budget_categories_user_month_idx on public.finance_budget_categories(user_id, month, sort_order);
create index if not exists finance_payments_user_active_idx on public.finance_payments(user_id, archived, deleted_at);
create index if not exists finance_payment_occurrences_user_due_idx on public.finance_payment_occurrences(user_id, due_date, status);
create index if not exists finance_jdg_items_user_order_idx on public.finance_jdg_items(user_id, sort_order);
create index if not exists finance_jdg_month_items_user_month_idx on public.finance_jdg_month_items(user_id, month);
create index if not exists finance_activity_log_user_time_idx on public.finance_activity_log(user_id, occurred_at desc);

drop trigger if exists trg_finance_accounts_updated on public.finance_accounts;
create trigger trg_finance_accounts_updated before update on public.finance_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_savings_goals_updated on public.finance_savings_goals;
create trigger trg_finance_savings_goals_updated before update on public.finance_savings_goals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_budget_categories_updated on public.finance_budget_categories;
create trigger trg_finance_budget_categories_updated before update on public.finance_budget_categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_payments_updated on public.finance_payments;
create trigger trg_finance_payments_updated before update on public.finance_payments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_payment_occurrences_updated on public.finance_payment_occurrences;
create trigger trg_finance_payment_occurrences_updated before update on public.finance_payment_occurrences
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_month_notes_updated on public.finance_month_notes;
create trigger trg_finance_month_notes_updated before update on public.finance_month_notes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_jdg_items_updated on public.finance_jdg_items;
create trigger trg_finance_jdg_items_updated before update on public.finance_jdg_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_finance_jdg_month_items_updated on public.finance_jdg_month_items;
create trigger trg_finance_jdg_month_items_updated before update on public.finance_jdg_month_items
  for each row execute function public.set_updated_at();
