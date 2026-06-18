-- ============================================================
-- ROOTINE OS — 0006 Finance
-- financial_categories, accounts, transactions, budgets,
-- recurring_expenses. RLS on every table. Amounts numeric(14,2);
-- transaction.amount is signed (positive = wpływ, negative = wydatek).
-- ============================================================

-- ---------- financial_categories ----------
create table public.financial_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default '',
  kind        text not null default 'expense',   -- 'income' | 'expense'
  color       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.financial_categories enable row level security;
create policy "fin_cat_select" on public.financial_categories for select using (auth.uid() = user_id);
create policy "fin_cat_insert" on public.financial_categories for insert with check (auth.uid() = user_id);
create policy "fin_cat_update" on public.financial_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fin_cat_delete" on public.financial_categories for delete using (auth.uid() = user_id);
create index on public.financial_categories (user_id);
create trigger trg_fin_cat_updated before update on public.financial_categories
  for each row execute function public.set_updated_at();

-- ---------- accounts ----------
create table public.accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null default '',
  kind             text not null default 'checking', -- checking | savings | cash | card
  starting_balance numeric(14,2) not null default 0,
  currency         text not null default 'PLN',
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
alter table public.accounts enable row level security;
create policy "accounts_select" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update" on public.accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_delete" on public.accounts for delete using (auth.uid() = user_id);
create index on public.accounts (user_id);
create trigger trg_accounts_updated before update on public.accounts
  for each row execute function public.set_updated_at();

-- ---------- transactions ----------
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  account_id   uuid references public.accounts (id) on delete set null,
  category_id  uuid references public.financial_categories (id) on delete set null,
  amount       numeric(14,2) not null,            -- signed: + wpływ, - wydatek
  note         text,
  occurred_on  date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
alter table public.transactions enable row level security;
create policy "transactions_select" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete" on public.transactions for delete using (auth.uid() = user_id);
create index on public.transactions (user_id, occurred_on desc);
create index on public.transactions (account_id);
create trigger trg_transactions_updated before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------- budgets ----------
create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid references public.financial_categories (id) on delete set null,
  name         text not null default '',
  period       text not null default 'monthly',
  limit_amount numeric(14,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.budgets enable row level security;
create policy "budgets_select" on public.budgets for select using (auth.uid() = user_id);
create policy "budgets_insert" on public.budgets for insert with check (auth.uid() = user_id);
create policy "budgets_update" on public.budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete" on public.budgets for delete using (auth.uid() = user_id);
create index on public.budgets (user_id);
create trigger trg_budgets_updated before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------- recurring_expenses ----------
create table public.recurring_expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default '',
  amount        numeric(14,2) not null default 0,
  day_of_month  int,
  category_id   uuid references public.financial_categories (id) on delete set null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.recurring_expenses enable row level security;
create policy "recurring_select" on public.recurring_expenses for select using (auth.uid() = user_id);
create policy "recurring_insert" on public.recurring_expenses for insert with check (auth.uid() = user_id);
create policy "recurring_update" on public.recurring_expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_delete" on public.recurring_expenses for delete using (auth.uid() = user_id);
create index on public.recurring_expenses (user_id);
create trigger trg_recurring_updated before update on public.recurring_expenses
  for each row execute function public.set_updated_at();
