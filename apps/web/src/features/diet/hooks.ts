import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayMealItems,
  fetchMealItemsHistory,
  insertMealItem,
  deleteMealItem,
  fetchTodayMeals,
  upsertMeal,
  fetchFoodItems,
  insertFoodItem,
  searchFoodExternal,
  fetchNutritionDaily,
  upsertNutritionDaily,
  fetchNutritionDailyHistory,
} from './api';
import type { FoodItem, FoodSearchResult, MealItem, NewMealItemInput, NewFoodItemInput, NutritionDailyPatch } from './types';
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
const NUTRITION_TODAY_KEY = ['nutrition_daily', 'today'] as const;
const MEAL_ITEMS_HISTORY_KEY = ['meal_items', 'history'] as const;
const NUTRITION_HISTORY_KEY = ['nutrition_daily', 'history'] as const;

export function useTodayMealItems() {
  return useQuery({ queryKey: TODAY_ITEMS_KEY, queryFn: fetchTodayMealItems });
}

export function useTodayMeals() {
  return useQuery({ queryKey: TODAY_MEALS_KEY, queryFn: () => fetchTodayMeals() });
}

export function useFoodItems() {
  return useQuery({ queryKey: FOOD_ITEMS_KEY, queryFn: fetchFoodItems });
}

export function useMealItemsHistory() {
  return useQuery({ queryKey: MEAL_ITEMS_HISTORY_KEY, queryFn: () => fetchMealItemsHistory(30) });
}

export function useNutritionHistory() {
  return useQuery({ queryKey: NUTRITION_HISTORY_KEY, queryFn: () => fetchNutritionDailyHistory(30) });
}

export function useNutritionToday() {
  return useQuery({ queryKey: NUTRITION_TODAY_KEY, queryFn: () => fetchNutritionDaily() });
}

export function useAddMealItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewMealItemInput) => insertMealItem(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY_ITEMS_KEY });
      qc.invalidateQueries({ queryKey: TODAY_MEALS_KEY });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useDeleteMealItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMealItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TODAY_ITEMS_KEY });
      const prev = qc.getQueryData<MealItem[]>(TODAY_ITEMS_KEY);
      qc.setQueryData<MealItem[]>(TODAY_ITEMS_KEY, (old) => (old ?? []).filter((m) => m.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(TODAY_ITEMS_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TODAY_ITEMS_KEY });
      qc.invalidateQueries({ queryKey: MEAL_ITEMS_HISTORY_KEY });
    },
  });
}

export function useUpsertMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => upsertMeal(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODAY_MEALS_KEY }),
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

export function useUpsertNutritionDaily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: NutritionDailyPatch) => upsertNutritionDaily(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NUTRITION_TODAY_KEY });
      qc.invalidateQueries({ queryKey: NUTRITION_HISTORY_KEY });
    },
  });
}

export function useAddWater(glassML = 250) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const current = await fetchNutritionDaily();
      const curWater = current?.water_ml ?? 0;
      return upsertNutritionDaily({ water_ml: curWater + glassML });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NUTRITION_TODAY_KEY });
      qc.invalidateQueries({ queryKey: NUTRITION_HISTORY_KEY });
    },
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
