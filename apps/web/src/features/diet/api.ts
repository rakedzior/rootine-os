import { supabase } from '@/lib/supabase';
import type {
  FoodItem, FoodSearchResult, Meal, MealItem, NutritionDaily,
  NewMealItemInput, NewFoodItemInput, NutritionDailyPatch,
} from './types';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji uzytkownika');
  return id;
}

function normItem(r: MealItem): MealItem {
  return { ...r, kcal: Number(r.kcal), protein: Number(r.protein), carb: Number(r.carb), fat: Number(r.fat), amount: Number(r.amount) };
}

// ── meal_items ────────────────────────────────────────────────────────────────

export async function fetchTodayMealItems(): Promise<MealItem[]> {
  const d = today();
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .gte('created_at', `${d}T00:00:00`)
    .lt('created_at', `${d}T23:59:59.999`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as MealItem[]).map(normItem);
}

export async function fetchMealItemsHistory(days = 30): Promise<MealItem[]> {
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('meal_items')
    .select('*')
    .gte('created_at', `${from}T00:00:00`)
    .order('created_at', { ascending: false });
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

export async function fetchNutritionDailyHistory(days = 30): Promise<NutritionDaily[]> {
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('nutrition_daily')
    .select('*')
    .gte('date', from)
    .order('date', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as NutritionDaily[]).map(normNutrition);
}

// ── external food search (FatSecret via Edge Function) ────────────────────────

export async function searchFoodExternal(query: string, lang = 'pl'): Promise<FoodSearchResult[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fatsecret-search?q=${encodeURIComponent(query)}&lang=${lang}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Food search failed: ${res.status}`);
  const json = await res.json() as { foods?: FoodSearchResult[]; error?: string };
  if (json.error) throw new Error(json.error);
  return json.foods ?? [];
}
