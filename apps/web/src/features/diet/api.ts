import { supabase } from '@/lib/supabase';
import type { MealItem, NutritionDaily, NewMealItemInput, NutritionDailyPatch } from './types';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
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
  return ((data ?? []) as MealItem[]).map((r) => ({
    ...r,
    kcal: Number(r.kcal),
    protein: Number(r.protein),
    carb: Number(r.carb),
    fat: Number(r.fat),
    amount: Number(r.amount),
  }));
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
      meal_type: input.meal_type ?? 'other',
    })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as MealItem;
  return { ...r, kcal: Number(r.kcal), protein: Number(r.protein), carb: Number(r.carb), fat: Number(r.fat), amount: Number(r.amount) };
}

export async function deleteMealItem(id: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', id);
  if (error) throw error;
}

// ── nutrition_daily ───────────────────────────────────────────────────────────

export async function fetchNutritionDaily(date?: string): Promise<NutritionDaily | null> {
  const d = date ?? today();
  const { data, error } = await supabase
    .from('nutrition_daily')
    .select('*')
    .eq('date', d)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as NutritionDaily;
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

export async function upsertNutritionDaily(patch: NutritionDailyPatch, date?: string): Promise<NutritionDaily> {
  const userId = await uid();
  const d = date ?? today();
  const { data, error } = await supabase
    .from('nutrition_daily')
    .upsert({ user_id: userId, date: d, ...patch }, { onConflict: 'user_id,date' })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as NutritionDaily;
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
