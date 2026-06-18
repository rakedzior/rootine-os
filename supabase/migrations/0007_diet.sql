-- 0007_diet.sql — Dieta: food_items, meals, meal_items, nutrition_daily

-- ── food_items ────────────────────────────────────────────────────────────────
create table if not exists food_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  kcal         numeric(8,2) not null default 0,
  protein      numeric(8,2) not null default 0,
  carb         numeric(8,2) not null default 0,
  fat          numeric(8,2) not null default 0,
  per_amount   numeric(8,2) not null default 100,
  unit         text not null default 'g',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table food_items enable row level security;
create policy "fi_select" on food_items for select using (auth.uid() = user_id);
create policy "fi_insert" on food_items for insert with check (auth.uid() = user_id);
create policy "fi_update" on food_items for update using (auth.uid() = user_id);
create policy "fi_delete" on food_items for delete using (auth.uid() = user_id);
create index if not exists food_items_user_idx on food_items(user_id);
create trigger set_food_items_updated_at before update on food_items
  for each row execute procedure set_updated_at();

-- ── meals ─────────────────────────────────────────────────────────────────────
create table if not exists meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  date         date not null default current_date,
  name         text not null default 'Posiłek',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table meals enable row level security;
create policy "meals_select" on meals for select using (auth.uid() = user_id);
create policy "meals_insert" on meals for insert with check (auth.uid() = user_id);
create policy "meals_update" on meals for update using (auth.uid() = user_id);
create policy "meals_delete" on meals for delete using (auth.uid() = user_id);
create index if not exists meals_user_date_idx on meals(user_id, date);
create trigger set_meals_updated_at before update on meals
  for each row execute procedure set_updated_at();

-- ── meal_items ────────────────────────────────────────────────────────────────
create table if not exists meal_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  meal_id        uuid references meals on delete cascade,
  food_item_id   uuid references food_items on delete set null,
  name           text not null,
  kcal           numeric(8,2) not null default 0,
  protein        numeric(8,2) not null default 0,
  carb           numeric(8,2) not null default 0,
  fat            numeric(8,2) not null default 0,
  amount         numeric(8,2) not null default 100,
  created_at     timestamptz not null default now()
);
alter table meal_items enable row level security;
create policy "mi_select" on meal_items for select using (auth.uid() = user_id);
create policy "mi_insert" on meal_items for insert with check (auth.uid() = user_id);
create policy "mi_update" on meal_items for update using (auth.uid() = user_id);
create policy "mi_delete" on meal_items for delete using (auth.uid() = user_id);
create index if not exists meal_items_user_idx on meal_items(user_id);
create index if not exists meal_items_meal_idx on meal_items(meal_id);

-- ── nutrition_daily ───────────────────────────────────────────────────────────
create table if not exists nutrition_daily (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  date            date not null default current_date,
  kcal_target     numeric(8,2) not null default 2500,
  protein_target  numeric(8,2) not null default 180,
  carb_target     numeric(8,2) not null default 240,
  fat_target      numeric(8,2) not null default 70,
  water_ml        numeric(8,0) not null default 0,
  weight_kg       numeric(5,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, date)
);
alter table nutrition_daily enable row level security;
create policy "nd_select" on nutrition_daily for select using (auth.uid() = user_id);
create policy "nd_insert" on nutrition_daily for insert with check (auth.uid() = user_id);
create policy "nd_update" on nutrition_daily for update using (auth.uid() = user_id);
create policy "nd_delete" on nutrition_daily for delete using (auth.uid() = user_id);
create index if not exists nutrition_daily_user_date_idx on nutrition_daily(user_id, date);
create trigger set_nutrition_daily_updated_at before update on nutrition_daily
  for each row execute procedure set_updated_at();
