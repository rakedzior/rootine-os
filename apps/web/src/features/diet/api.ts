import { supabase } from '@/lib/supabase';
import type {
  CustomMeal,
  FoodItem,
  FoodSearchResult,
  HydrationEntry,
  Meal,
  MealCategory,
  MealItem,
  NewCustomMealInput,
  NewFoodItemInput,
  NewMealCategoryInput,
  NewMealItemInput,
  NutritionDaily,
  NutritionDailyPatch,
  NutritionTarget,
  NutritionTargetPatch,
} from './types';

export const DEFAULT_MEAL_CATEGORIES: Array<Required<Pick<NewMealCategoryInput, 'name' | 'icon' | 'sort_order' | 'is_visible' | 'is_default'>> & { default_time: string }> = [
  { name: 'Sniadanie', icon: 'sun', sort_order: 10, is_visible: true, is_default: false, default_time: '08:00' },
  { name: 'Obiad', icon: 'soup', sort_order: 20, is_visible: true, is_default: false, default_time: '13:00' },
  { name: 'Kolacja', icon: 'moon', sort_order: 30, is_visible: true, is_default: false, default_time: '19:00' },
  { name: 'Przekaski', icon: 'coffee', sort_order: 40, is_visible: true, is_default: false, default_time: '16:00' },
];

function normalizeCategoryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function today() {
  return toDateStr(new Date());
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateStr(d);
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji uzytkownika');
  return id;
}

function normItem(r: MealItem): MealItem {
  return {
    ...r,
    custom_meal_id: r.custom_meal_id ?? null,
    unit: r.unit ?? 'g',
    consumed_at: r.consumed_at ?? r.created_at,
    kcal: Number(r.kcal),
    protein: Number(r.protein),
    carb: Number(r.carb),
    fat: Number(r.fat),
    amount: Number(r.amount),
  };
}

function normCategory(r: MealCategory): MealCategory {
  return { ...r, sort_order: Number(r.sort_order), is_visible: Boolean(r.is_visible), is_default: Boolean(r.is_default) };
}

function normCustomMeal(r: CustomMeal): CustomMeal {
  return {
    ...r,
    kcal: Number(r.kcal),
    protein: Number(r.protein),
    carb: Number(r.carb),
    fat: Number(r.fat),
    default_quantity: Number(r.default_quantity),
  };
}

function normTarget(r: NutritionTarget): NutritionTarget {
  return {
    ...r,
    kcal_target: Number(r.kcal_target),
    protein_target: Number(r.protein_target),
    carb_target: Number(r.carb_target),
    fat_target: Number(r.fat_target),
    water_target_ml: Number(r.water_target_ml),
  };
}

function dayBounds(date?: string) {
  const d = date ?? today();
  return { from: `${d}T00:00:00`, to: `${d}T23:59:59.999` };
}

function consumedAtFor(date?: string, time?: string | null) {
  const d = date ?? today();
  const t = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : '12:00';
  return new Date(`${d}T${t}:00`).toISOString();
}

// ── meal_items ────────────────────────────────────────────────────────────────

export async function fetchTodayMealItems(date?: string): Promise<MealItem[]> {
  const d = date ?? today();
  const meals = await fetchTodayMeals(d);
  const mealIds = meals.map((meal) => meal.id);
  if (mealIds.length === 0) return [];
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .in('meal_id', mealIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MealItem[]).map(normItem);
}

export async function fetchMealItemsHistory(days = 30): Promise<MealItem[]> {
  const from = daysAgo(days);
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .gte('consumed_at', `${from}T00:00:00`)
    .order('consumed_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as MealItem[]).map(normItem);
}

export async function insertMealItem(input: NewMealItemInput): Promise<MealItem> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('meal_items')
    .insert({
      user_id: userId,
      meal_id: input.meal_id ?? null,
      food_item_id: input.food_item_id ?? null,
      name: input.name,
      kcal: input.kcal,
      protein: input.protein ?? 0,
      carb: input.carb ?? 0,
      fat: input.fat ?? 0,
      amount: input.amount ?? 100,
      unit: input.unit ?? 'g',
      custom_meal_id: input.custom_meal_id ?? null,
      consumed_at: input.consumed_at ?? new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return normItem(data as MealItem);
}

export async function deleteMealItem(id: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', id);
  if (error) throw error;
}

export async function updateMealItem(id: string, patch: Partial<Pick<MealItem, 'name' | 'kcal' | 'protein' | 'carb' | 'fat' | 'amount' | 'unit' | 'consumed_at'>>): Promise<MealItem> {
  const { data, error } = await supabase
    .from('meal_items')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return normItem(data as MealItem);
}

// ── meals ─────────────────────────────────────────────────────────────────────

export async function fetchTodayMeals(date?: string): Promise<Meal[]> {
  const d = date ?? today();
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('date', d)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Meal[];
}

export async function upsertMeal(name: string, date?: string): Promise<Meal> {
  const userId = await uid();
  const d = date ?? today();
  const { data: existing } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', d)
    .eq('name', name)
    .maybeSingle();
  if (existing) return existing as Meal;
  const { data, error } = await supabase
    .from('meals')
    .insert({ user_id: userId, date: d, name })
    .select('*')
    .single();
  if (error) throw error;
  return data as Meal;
}

export async function upsertMealForCategory(category: MealCategory, date?: string): Promise<Meal> {
  const userId = await uid();
  const d = date ?? today();
  let categoryForMeal = category;

  if (!isUuid(category.id)) {
    const restored = await restoreDefaultMealCategories();
    const realCategory = restored.find((item) => normalizeCategoryName(item.name) === normalizeCategoryName(category.name));
    if (!realCategory) throw new Error(`Nie udało się utworzyć kategorii ${category.name}`);
    categoryForMeal = realCategory;
  }

  const { data: existing } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .eq('date', d)
    .eq('meal_category_id', categoryForMeal.id)
    .maybeSingle();
  if (existing) return existing as Meal;
  const { data, error } = await supabase
    .from('meals')
    .insert({ user_id: userId, date: d, name: categoryForMeal.name, meal_category_id: categoryForMeal.id })
    .select('*')
    .single();
  if (error) throw error;
  return data as Meal;
}

// ── meal_categories ─────────────────────────────────────────────────────────

export async function fetchMealCategories(): Promise<MealCategory[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('meal_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;

  const existing = ((data ?? []) as MealCategory[]).map(normCategory);
  if (existing.length === 0) {
    const rows = DEFAULT_MEAL_CATEGORIES.map((cat) => ({ ...cat, user_id: userId }));
    const { error: insertError } = await supabase.from('meal_categories').insert(rows);
    if (insertError && insertError.code !== '23505') throw insertError;
    const { data: refreshed, error: refreshError } = await supabase
      .from('meal_categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (refreshError) throw refreshError;
    return ((refreshed ?? []) as MealCategory[]).map(normCategory);
  }

  return existing;
}

export async function restoreDefaultMealCategories(): Promise<MealCategory[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('meal_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;

  const existing = ((data ?? []) as MealCategory[]).map(normCategory);
  const byName = new Map(existing.map((category) => [normalizeCategoryName(category.name), category]));

  for (const def of DEFAULT_MEAL_CATEGORIES) {
    const current = byName.get(normalizeCategoryName(def.name));
    if (current) {
      const { error: updateError } = await supabase
        .from('meal_categories')
        .update({
          name: def.name,
          icon: def.icon,
          sort_order: def.sort_order,
          is_visible: true,
          is_default: false,
          default_time: def.default_time,
        })
        .eq('id', current.id);
      if (updateError?.code === '23505') {
        const { error: fallbackError } = await supabase
          .from('meal_categories')
          .update({ icon: def.icon, sort_order: def.sort_order, is_visible: true, is_default: false, default_time: def.default_time })
          .eq('id', current.id);
        if (fallbackError) throw fallbackError;
      } else if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('meal_categories')
        .insert({ ...def, user_id: userId, is_visible: true });
      if (insertError && insertError.code !== '23505') throw insertError;
    }
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from('meal_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (refreshError) throw refreshError;
  return ((refreshed ?? []) as MealCategory[]).map(normCategory);
}

export async function insertMealCategory(input: NewMealCategoryInput): Promise<MealCategory> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('meal_categories')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      icon: input.icon || 'utensils',
      sort_order: input.sort_order ?? 999,
      is_visible: input.is_visible ?? true,
      is_default: input.is_default ?? false,
      default_time: input.default_time ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return normCategory(data as MealCategory);
}

export async function updateMealCategory(id: string, patch: Partial<NewMealCategoryInput>): Promise<MealCategory> {
  const { data, error } = await supabase
    .from('meal_categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return normCategory(data as MealCategory);
}

export async function reorderMealCategories(rows: Pick<MealCategory, 'id' | 'sort_order'>[]): Promise<void> {
  for (const row of rows) {
    const { error } = await supabase.from('meal_categories').update({ sort_order: row.sort_order }).eq('id', row.id);
    if (error) throw error;
  }
}

export async function deleteMealCategory(id: string): Promise<void> {
  const { error } = await supabase.from('meal_categories').delete().eq('id', id);
  if (error) throw error;
}

export async function countMealCategoryItems(categoryId: string): Promise<number> {
  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('id')
    .eq('meal_category_id', categoryId);
  if (mealsError) throw mealsError;
  const mealIds = (meals ?? []).map((meal) => meal.id);
  if (!mealIds.length) return 0;
  const { count, error } = await supabase
    .from('meal_items')
    .select('id', { count: 'exact', head: true })
    .in('meal_id', mealIds);
  if (error) throw error;
  return count ?? 0;
}

export async function moveCategoryEntries(categoryId: string, targetCategoryId: string): Promise<void> {
  const { data: sourceMeals, error: sourceError } = await supabase.from('meals').select('*').eq('meal_category_id', categoryId);
  if (sourceError) throw sourceError;
  const { data: targetMeals, error: targetError } = await supabase.from('meals').select('*').eq('meal_category_id', targetCategoryId);
  if (targetError) throw targetError;
  const targetsByDate = new Map((targetMeals ?? []).map((meal) => [meal.date, meal as Meal]));

  for (const source of (sourceMeals ?? []) as Meal[]) {
    let target = targetsByDate.get(source.date);
    if (!target) {
      const { data: targetCategory, error: catError } = await supabase.from('meal_categories').select('*').eq('id', targetCategoryId).single();
      if (catError) throw catError;
      target = await upsertMealForCategory(normCategory(targetCategory as MealCategory), source.date);
      targetsByDate.set(source.date, target);
    }
    const { error: itemsError } = await supabase.from('meal_items').update({ meal_id: target.id }).eq('meal_id', source.id);
    if (itemsError) throw itemsError;
  }
}

export async function deleteCategoryEntries(categoryId: string): Promise<void> {
  const { data: meals, error: mealsError } = await supabase.from('meals').select('id').eq('meal_category_id', categoryId);
  if (mealsError) throw mealsError;
  const mealIds = (meals ?? []).map((meal) => meal.id);
  if (mealIds.length) {
    const { error: itemsError } = await supabase.from('meal_items').delete().in('meal_id', mealIds);
    if (itemsError) throw itemsError;
  }
}

// ── food_items ────────────────────────────────────────────────────────────────

function normFood(r: FoodItem): FoodItem {
  return { ...r, kcal: Number(r.kcal), protein: Number(r.protein), carb: Number(r.carb), fat: Number(r.fat), per_amount: Number(r.per_amount) };
}

export async function fetchFoodItems(): Promise<FoodItem[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as FoodItem[]).map(normFood);
}

export async function insertFoodItem(input: NewFoodItemInput): Promise<FoodItem> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('food_items')
    .insert({
      user_id: userId,
      name: input.name,
      kcal: input.kcal,
      protein: input.protein ?? 0,
      carb: input.carb ?? 0,
      fat: input.fat ?? 0,
      per_amount: input.per_amount ?? 100,
      unit: input.unit ?? 'g',
    })
    .select('*')
    .single();
  if (error) throw error;
  return normFood(data as FoodItem);
}

export async function updateFoodItem(id: string, patch: Partial<NewFoodItemInput>): Promise<FoodItem> {
  const { data, error } = await supabase
    .from('food_items')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return normFood(data as FoodItem);
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', id);
  if (error) throw error;
}

// ── custom_meals ────────────────────────────────────────────────────────────

export async function fetchCustomMeals(): Promise<CustomMeal[]> {
  const { data, error } = await supabase
    .from('custom_meals')
    .select('*')
    .order('is_favorite', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CustomMeal[]).map(normCustomMeal);
}

export async function insertCustomMeal(input: NewCustomMealInput): Promise<CustomMeal> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('custom_meals')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      kcal: input.kcal,
      protein: input.protein ?? 0,
      carb: input.carb ?? 0,
      fat: input.fat ?? 0,
      default_quantity: input.default_quantity ?? 100,
      default_unit: input.default_unit ?? 'g',
      image_url: input.image_url ?? null,
      is_favorite: input.is_favorite ?? false,
      last_used_at: input.last_used_at ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return normCustomMeal(data as CustomMeal);
}

export async function updateCustomMeal(id: string, patch: Partial<NewCustomMealInput>): Promise<CustomMeal> {
  const { data, error } = await supabase
    .from('custom_meals')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return normCustomMeal(data as CustomMeal);
}

export async function deleteCustomMeal(id: string): Promise<void> {
  const { error } = await supabase.from('custom_meals').delete().eq('id', id);
  if (error) throw error;
}

// ── nutrition_daily ───────────────────────────────────────────────────────────

function normNutrition(r: NutritionDaily): NutritionDaily {
  return {
    ...r,
    kcal_target: Number(r.kcal_target),
    protein_target: Number(r.protein_target),
    carb_target: Number(r.carb_target),
    fat_target: Number(r.fat_target),
    water_ml: Number(r.water_ml),
    weight_kg: r.weight_kg != null ? Number(r.weight_kg) : null,
  };
}

export async function fetchNutritionDaily(date?: string): Promise<NutritionDaily | null> {
  const d = date ?? today();
  const { data, error } = await supabase
    .from('nutrition_daily')
    .select('*')
    .eq('date', d)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normNutrition(data as NutritionDaily);
}

export async function upsertNutritionDaily(patch: NutritionDailyPatch, date?: string): Promise<NutritionDaily> {
  const userId = await uid();
  const d = date ?? today();
  const { data, error } = await supabase
    .from('nutrition_daily')
    .upsert({ user_id: userId, date: d, ...patch }, { onConflict: 'user_id,date' })
    .select('*')
    .single();
  if (error) throw error;
  return normNutrition(data as NutritionDaily);
}

export async function fetchHydrationEntries(date?: string): Promise<HydrationEntry[]> {
  const { from, to } = dayBounds(date);
  const { data, error } = await supabase
    .from('hydration_entries')
    .select('*')
    .gte('consumed_at', from)
    .lte('consumed_at', to)
    .order('consumed_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HydrationEntry[];
}

export async function insertHydrationEntry(amountMl: number, date?: string): Promise<HydrationEntry> {
  const userId = await uid();
  const consumed_at = consumedAtFor(date);
  const { data, error } = await supabase
    .from('hydration_entries')
    .insert({ user_id: userId, amount_ml: amountMl, consumed_at })
    .select('*')
    .single();
  if (error) throw error;
  const current = await fetchNutritionDaily(date);
  await upsertNutritionDaily({ water_ml: (current?.water_ml ?? 0) + amountMl }, date);
  return data as HydrationEntry;
}

// ── nutrition_targets ───────────────────────────────────────────────────────

export async function fetchNutritionTarget(): Promise<NutritionTarget> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return normTarget(data as NutritionTarget);

  const { data: created, error: createError } = await supabase
    .from('nutrition_targets')
    .insert({ user_id: userId })
    .select('*')
    .single();
  if (createError) throw createError;
  return normTarget(created as NutritionTarget);
}

export async function upsertNutritionTarget(patch: NutritionTargetPatch): Promise<NutritionTarget> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('nutrition_targets')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return normTarget(data as NutritionTarget);
}

export async function fetchNutritionDailyHistory(days = 30): Promise<NutritionDaily[]> {
  const from = daysAgo(days);
  const { data, error } = await supabase
    .from('nutrition_daily')
    .select('*')
    .gte('date', from)
    .order('date', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as NutritionDaily[]).map(normNutrition);
}

// ── external food search — Open Food Facts (no key, no IP restrictions, CORS ok) ──
//
// Docs: https://wiki.openfoodfacts.org/API
// Polish products: search on world.openfoodfacts.org with lc=pl
// Called directly from the browser — no Edge Function needed.

interface OFFProduct {
  product_name?: string;
  product_name_pl?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface OFFResponse {
  products: OFFProduct[];
  count: number;
}

export async function searchFoodExternal(query: string, _lang = 'pl'): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    // Filter to products that have nutritional data
    fields: 'product_name,product_name_pl,brands,nutriments',
  });

  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`);
  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);

  const json = await res.json() as OFFResponse;
  const products = json.products ?? [];

  return products
    .map((p): FoodSearchResult | null => {
      const name = (p.product_name_pl || p.product_name || '').trim();
      if (!name) return null;
      const n = p.nutriments ?? {};
      const kcal = n['energy-kcal_100g'] ?? 0;
      // Skip products with no nutrition data at all
      if (kcal === 0 && !n.proteins_100g && !n.carbohydrates_100g && !n.fat_100g) return null;
      return {
        external_id: `off_${encodeURIComponent(name)}`,
        name: p.brands ? `${name} (${p.brands})` : name,
        kcal: Math.round(kcal),
        protein: Number((n.proteins_100g ?? 0).toFixed(1)),
        carb: Number((n.carbohydrates_100g ?? 0).toFixed(1)),
        fat: Number((n.fat_100g ?? 0).toFixed(1)),
        per_amount: 100,
        unit: 'g',
      };
    })
    .filter((p): p is FoodSearchResult => p !== null);
}

// ── barcode lookup — Open Food Facts by EAN/UPC ───────────────────────────────

export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  if (!res.ok) return null;
  const json = await res.json() as { status: number; product?: OFFProduct & { product_name_pl?: string; product_name?: string; brands?: string; nutriments?: OFFProduct['nutriments'] } };
  if (json.status !== 1 || !json.product) return null;
  const p = json.product;
  const name = (p.product_name_pl || p.product_name || '').trim();
  if (!name) return null;
  const n = p.nutriments ?? {};
  const kcal = n['energy-kcal_100g'] ?? 0;
  return {
    external_id: `off_barcode_${barcode}`,
    name: p.brands ? `${name} (${p.brands})` : name,
    kcal: Math.round(kcal),
    protein: Number((n.proteins_100g ?? 0).toFixed(1)),
    carb: Number((n.carbohydrates_100g ?? 0).toFixed(1)),
    fat: Number((n.fat_100g ?? 0).toFixed(1)),
    per_amount: 100,
    unit: 'g',
  };
}
