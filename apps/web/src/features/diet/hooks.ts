import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayMealItems,
  fetchMealItemsHistory,
  insertMealItem,
  deleteMealItem,
  updateMealItem,
  fetchTodayMeals,
  upsertMeal,
  upsertMealForCategory,
  fetchMealCategories,
  restoreDefaultMealCategories,
  insertMealCategory,
  updateMealCategory,
  reorderMealCategories,
  deleteMealCategory,
  countMealCategoryItems,
  moveCategoryEntries,
  deleteCategoryEntries,
  fetchFoodItems,
  insertFoodItem,
  updateFoodItem,
  deleteFoodItem,
  fetchCustomMeals,
  insertCustomMeal,
  updateCustomMeal,
  deleteCustomMeal,
  fetchHydrationEntries,
  insertHydrationEntry,
  fetchNutritionTarget,
  upsertNutritionTarget,
  searchFoodExternal,
  fetchNutritionDaily,
  upsertNutritionDaily,
  fetchNutritionDailyHistory,
} from './api';
import type {
  CustomMeal,
  FoodItem,
  FoodSearchResult,
  MealCategory,
  MealItem,
  NewCustomMealInput,
  NewFoodItemInput,
  NewMealCategoryInput,
  NewMealItemInput,
  NutritionDailyPatch,
  NutritionTargetPatch,
} from './types';
import { POLISH_FOODS } from './polishFoods';
import { XL_FOODS } from './xlFoods';

// ─── Polish diacritic normalization ──────────────────────────────────────────
// Maps each Polish diacritic to its ASCII equivalent so search works without accents.
const DIACRITIC_MAP: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
};

export function normalizePolish(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => DIACRITIC_MAP[c] ?? c);
}

/**
 * Smart food name matching:
 * - diacritic-insensitive (ą→a, ę→e, etc.)
 * - "amarantus" matches "liście amarantusa" (word-stem: any word in name starts with query)
 * - "kurczak" matches "pierś z kurczaka" (contains)
 */
function foodMatches(name: string, nameEn: string, rawQuery: string): boolean {
  if (!rawQuery.trim()) return true;
  const q = normalizePolish(rawQuery);
  const n = normalizePolish(name);
  const en = normalizePolish(nameEn);

  // Direct contains match
  if (n.includes(q) || en.includes(q)) return true;

  // Word-stem match: any word in the food name starts with query
  // e.g. query "amarantus" → word "amarantusa" starts with "amarantus"
  const words = n.split(/[\s,.()/\\-]+/);
  if (words.some(w => w.startsWith(q))) return true;

  // Also try reversed: any query word is a stem of a name word
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1) {
    return queryWords.every(qw =>
      n.includes(qw) || words.some(w => w.startsWith(qw))
    );
  }

  return false;
}

// ─── Query keys ───────────────────────────────────────────────────────────────
const TODAY_ITEMS_KEY = ['meal_items', 'today'] as const;
const TODAY_MEALS_KEY = ['meals', 'today'] as const;
const FOOD_ITEMS_KEY = ['food_items'] as const;
const MEAL_CATEGORIES_KEY = ['meal_categories'] as const;
const CUSTOM_MEALS_KEY = ['custom_meals'] as const;
const HYDRATION_KEY = ['hydration_entries'] as const;
const NUTRITION_TARGET_KEY = ['nutrition_target'] as const;
const NUTRITION_TODAY_KEY = ['nutrition_daily', 'today'] as const;
const MEAL_ITEMS_HISTORY_KEY = ['meal_items', 'history'] as const;
const NUTRITION_HISTORY_KEY = ['nutrition_daily', 'history'] as const;

function mealItemsKey(date?: string) {
  return date ? ['meal_items', date] as const : TODAY_ITEMS_KEY;
}

function mealsKey(date?: string) {
  return date ? ['meals', date] as const : TODAY_MEALS_KEY;
}

function nutritionKey(date?: string) {
  return date ? ['nutrition_daily', date] as const : NUTRITION_TODAY_KEY;
}

function hydrationKey(date?: string) {
  return date ? ['hydration_entries', date] as const : HYDRATION_KEY;
}

export function useTodayMealItems(date?: string) {
  return useQuery({ queryKey: mealItemsKey(date), queryFn: () => fetchTodayMealItems(date) });
}

export function useTodayMeals(date?: string) {
  return useQuery({ queryKey: mealsKey(date), queryFn: () => fetchTodayMeals(date) });
}

export function useFoodItems() {
  return useQuery({ queryKey: FOOD_ITEMS_KEY, queryFn: fetchFoodItems });
}

export function useMealCategories() {
  return useQuery({ queryKey: MEAL_CATEGORIES_KEY, queryFn: fetchMealCategories });
}

export function useCustomMeals() {
  return useQuery({ queryKey: CUSTOM_MEALS_KEY, queryFn: fetchCustomMeals });
}

export function useHydrationEntries(date?: string) {
  return useQuery({ queryKey: hydrationKey(date), queryFn: () => fetchHydrationEntries(date) });
}

export function useNutritionTarget() {
  return useQuery({ queryKey: NUTRITION_TARGET_KEY, queryFn: fetchNutritionTarget });
}

export function useMealItemsHistory() {
  return useQuery({ queryKey: MEAL_ITEMS_HISTORY_KEY, queryFn: () => fetchMealItemsHistory(30) });
}

export function useNutritionHistory() {
  return useQuery({ queryKey: NUTRITION_HISTORY_KEY, queryFn: () => fetchNutritionDailyHistory(30) });
}

export function useNutritionToday(date?: string) {
  return useQuery({ queryKey: nutritionKey(date), queryFn: () => fetchNutritionDaily(date) });
}

export function useAddMealItem(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewMealItemInput) => insertMealItem(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mealItemsKey(date) });
      qc.invalidateQueries({ queryKey: mealsKey(date) });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useDeleteMealItem(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMealItem(id),
    onMutate: async (id) => {
      const key = mealItemsKey(date);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<MealItem[]>(key);
      qc.setQueryData<MealItem[]>(key, (old) => (old ?? []).filter((m) => m.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(mealItemsKey(date), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: mealItemsKey(date) });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useUpdateMealItem(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateMealItem>[1] }) => updateMealItem(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mealItemsKey(date) });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useUpsertMeal(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => upsertMeal(name, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsKey(date) }),
  });
}

export function useUpsertMealForCategory(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (category: MealCategory) => upsertMealForCategory(category, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEAL_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: mealsKey(date) });
    },
  });
}

export function useCreateMealCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewMealCategoryInput) => insertMealCategory(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEAL_CATEGORIES_KEY }),
  });
}

export function useRestoreDefaultMealCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreDefaultMealCategories,
    onSuccess: (categories) => {
      qc.setQueryData<MealCategory[]>(MEAL_CATEGORIES_KEY, categories);
      qc.invalidateQueries({ queryKey: MEAL_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: TODAY_MEALS_KEY });
    },
  });
}

export function useUpdateMealCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewMealCategoryInput> }) => updateMealCategory(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEAL_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: TODAY_MEALS_KEY });
    },
  });
}

export function useReorderMealCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: Pick<MealCategory, 'id' | 'sort_order'>[]) => reorderMealCategories(rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEAL_CATEGORIES_KEY }),
  });
}

export function useDeleteMealCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMealCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEAL_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: TODAY_MEALS_KEY });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useCountMealCategoryItems() {
  return useMutation({ mutationFn: (categoryId: string) => countMealCategoryItems(categoryId) });
}

export function useMoveCategoryEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, targetCategoryId }: { categoryId: string; targetCategoryId: string }) => moveCategoryEntries(categoryId, targetCategoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['meal_items'] });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useDeleteCategoryEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategoryEntries(categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal_items'] });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useInsertFoodItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFoodItemInput) => insertFoodItem(input),
    onSuccess: (item: FoodItem) => {
      qc.setQueryData<FoodItem[]>(FOOD_ITEMS_KEY, (old) =>
        [...(old ?? []), item].sort((a, b) => a.name.localeCompare(b.name))
      );
    },
  });
}

export function useUpdateFoodItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewFoodItemInput> }) => updateFoodItem(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: FOOD_ITEMS_KEY }),
  });
}

export function useDeleteFoodItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFoodItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FOOD_ITEMS_KEY }),
  });
}

export function useCreateCustomMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCustomMealInput) => insertCustomMeal(input),
    onSuccess: (item: CustomMeal) => {
      qc.setQueryData<CustomMeal[]>(CUSTOM_MEALS_KEY, (old) => [item, ...(old ?? []).filter((m) => m.id !== item.id)]);
      qc.invalidateQueries({ queryKey: CUSTOM_MEALS_KEY });
    },
  });
}

export function useUpdateCustomMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewCustomMealInput> }) => updateCustomMeal(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOM_MEALS_KEY }),
  });
}

export function useDeleteCustomMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomMeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOM_MEALS_KEY }),
  });
}

export function useUpsertNutritionDaily(date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: NutritionDailyPatch) => upsertNutritionDaily(patch, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKey(date) });
      qc.invalidateQueries({ queryKey: NUTRITION_HISTORY_KEY });
    },
  });
}

export function useAddWater(glassML = 250, date?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => insertHydrationEntry(glassML, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKey(date) });
      qc.invalidateQueries({ queryKey: hydrationKey(date) });
      qc.invalidateQueries({ queryKey: NUTRITION_HISTORY_KEY });
    },
  });
}

export function useUpsertNutritionTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: NutritionTargetPatch) => upsertNutritionTarget(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: NUTRITION_TARGET_KEY }),
  });
}

// ─── Food search result types ─────────────────────────────────────────────────
export type FoodSearchEntry =
  | { source: 'local'; item: FoodItem }
  | { source: 'builtin'; item: FoodSearchResult }   // ~90 hardcoded Polish generics (polishFoods.ts)
  | { source: 'xl'; item: FoodSearchResult }         // 810 products from Excel
  | { source: 'external'; item: FoodSearchResult };  // Open Food Facts branded

// Convert POLISH_FOODS / XL_FOODS entries to FoodSearchResult shape
function toSearchResult(name: string, kcal: number, protein: number, carb: number, fat: number, prefix: string): FoodSearchResult {
  return {
    external_id: `${prefix}_${name}`,
    name,
    kcal,
    protein,
    carb,
    fat,
    per_amount: 100,
    unit: 'g',
  };
}

/**
 * Debounced food search combining four sources (priority order):
 * 1. local   — user's personal food_items library (instant)
 * 2. xl      — 810 Polish foods from uploaded Excel (instant)
 * 3. builtin — ~90 hardcoded common Polish generics (instant)
 * 4. external — Open Food Facts branded products (debounced, ~350ms + network)
 *
 * Matching: diacritic-insensitive + word-stem so "amarantus" → "liście amarantusa".
 * All results deduplicated by lowercase normalized name.
 */
export function useFoodSearch(query: string, debounceMs = 350) {
  const { data: localFoods = [] } = useFoodItems();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [externalResults, setExternalResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setExternalResults([]);
      setIsSearching(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsSearching(true);
    setError(null);
    searchFoodExternal(debouncedQuery)
      .then((foods) => { if (!ctrl.signal.aborted) { setExternalResults(foods); setIsSearching(false); } })
      .catch((e) => { if (!ctrl.signal.aborted) { setError(String(e)); setIsSearching(false); } });
    return () => ctrl.abort();
  }, [debouncedQuery]);

  // Local matches (instant, already user-personalised)
  const localMatches = useMemo(() => {
    if (!query.trim()) return localFoods;
    return localFoods.filter(f => foodMatches(f.name, '', query));
  }, [localFoods, query]);

  // XL matches (instant, 810 Polish foods from Excel)
  const xlMatches = useMemo((): FoodSearchResult[] => {
    if (!query.trim()) return [];
    return XL_FOODS
      .filter(f => foodMatches(f.name, f.nameEn, query))
      .map(f => toSearchResult(f.name, f.kcal, f.protein, f.carb, f.fat, 'xl'));
  }, [query]);

  // Builtin matches (instant, ~90 hardcoded generics)
  const builtinMatches = useMemo((): FoodSearchResult[] => {
    if (!query.trim()) return [];
    return POLISH_FOODS
      .filter(f => foodMatches(f.name, '', query))
      .map(f => toSearchResult(f.name, f.kcal, f.protein, f.carb, f.fat, 'builtin'));
  }, [query]);

  // Merge in priority order, dedup by normalized name
  const combined = useMemo((): FoodSearchEntry[] => {
    const seen = new Set<string>();
    const result: FoodSearchEntry[] = [];

    function add<T extends FoodSearchEntry>(entry: T, key: string) {
      const k = normalizePolish(key);
      if (!seen.has(k)) { seen.add(k); result.push(entry); }
    }

    for (const item of localMatches)   add({ source: 'local' as const, item }, item.name);
    for (const item of xlMatches)      add({ source: 'xl' as const, item }, item.name);
    for (const item of builtinMatches) add({ source: 'builtin' as const, item }, item.name);
    for (const item of externalResults) add({ source: 'external' as const, item }, item.name);

    return result;
  }, [localMatches, xlMatches, builtinMatches, externalResults]);

  return { results: combined, isSearching, error };
}
