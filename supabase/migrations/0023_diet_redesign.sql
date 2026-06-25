-- 0023_diet_redesign.sql - Dieta: configurable meal categories, custom meals,
-- hydration log and user-level nutrition targets.

create table if not exists public.meal_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  icon text not null default 'utensils',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  is_default boolean not null default false,
  default_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meal_categories enable row level security;
create policy "meal_categories_select" on public.meal_categories for select using (auth.uid() = user_id);
create policy "meal_categories_insert" on public.meal_categories for insert with check (auth.uid() = user_id);
create policy "meal_categories_update" on public.meal_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_categories_delete" on public.meal_categories for delete using (auth.uid() = user_id);
create index if not exists meal_categories_user_order_idx on public.meal_categories(user_id, sort_order);
create unique index if not exists meal_categories_user_name_idx on public.meal_categories(user_id, lower(name));
drop trigger if exists set_meal_categories_updated_at on public.meal_categories;
create trigger set_meal_categories_updated_at before update on public.meal_categories
  for each row execute procedure public.set_updated_at();

create table if not exists public.custom_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  kcal numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carb numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  default_quantity numeric(8,2) not null default 100,
  default_unit text not null default 'g',
  image_url text,
  is_favorite boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_meals enable row level security;
create policy "custom_meals_select" on public.custom_meals for select using (auth.uid() = user_id);
create policy "custom_meals_insert" on public.custom_meals for insert with check (auth.uid() = user_id);
create policy "custom_meals_update" on public.custom_meals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "custom_meals_delete" on public.custom_meals for delete using (auth.uid() = user_id);
create index if not exists custom_meals_user_name_idx on public.custom_meals(user_id, name);
create index if not exists custom_meals_user_last_used_idx on public.custom_meals(user_id, last_used_at desc nulls last);
drop trigger if exists set_custom_meals_updated_at on public.custom_meals;
create trigger set_custom_meals_updated_at before update on public.custom_meals
  for each row execute procedure public.set_updated_at();

alter table public.meals
  add column if not exists meal_category_id uuid references public.meal_categories on delete set null;
create index if not exists meals_category_date_idx on public.meals(user_id, meal_category_id, date);

alter table public.meal_items
  add column if not exists custom_meal_id uuid references public.custom_meals on delete set null,
  add column if not exists unit text not null default 'g',
  add column if not exists consumed_at timestamptz;

update public.meal_items
set consumed_at = created_at
where consumed_at is null;

create index if not exists meal_items_user_consumed_idx on public.meal_items(user_id, consumed_at);
create index if not exists meal_items_custom_meal_idx on public.meal_items(custom_meal_id);

create table if not exists public.hydration_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  amount_ml int not null check (amount_ml > 0),
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.hydration_entries enable row level security;
create policy "hydration_entries_select" on public.hydration_entries for select using (auth.uid() = user_id);
create policy "hydration_entries_insert" on public.hydration_entries for insert with check (auth.uid() = user_id);
create policy "hydration_entries_update" on public.hydration_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hydration_entries_delete" on public.hydration_entries for delete using (auth.uid() = user_id);
create index if not exists hydration_entries_user_consumed_idx on public.hydration_entries(user_id, consumed_at);

create table if not exists public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kcal_target numeric(8,2) not null default 2500,
  protein_target numeric(8,2) not null default 180,
  carb_target numeric(8,2) not null default 240,
  fat_target numeric(8,2) not null default 70,
  water_target_ml int not null default 2500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.nutrition_targets enable row level security;
create policy "nutrition_targets_select" on public.nutrition_targets for select using (auth.uid() = user_id);
create policy "nutrition_targets_insert" on public.nutrition_targets for insert with check (auth.uid() = user_id);
create policy "nutrition_targets_update" on public.nutrition_targets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nutrition_targets_delete" on public.nutrition_targets for delete using (auth.uid() = user_id);
drop trigger if exists set_nutrition_targets_updated_at on public.nutrition_targets;
create trigger set_nutrition_targets_updated_at before update on public.nutrition_targets
  for each row execute procedure public.set_updated_at();
