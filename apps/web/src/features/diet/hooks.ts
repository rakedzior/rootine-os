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
    onSuccess: () => qc.invalidateQueries({ queryKey: TODAY_ITEMS_KEY }),
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
    onSettled: () => qc.invalidateQueries({ queryKey: TODAY_ITEMS_KEY }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: NUTRITION_TODAY_KEY }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: NUTRITION_TODAY_KEY }),
  });
}

/**
 * Debounced food search: merges local food_items (instant) with FatSecret results.
 * Returns { results, isSearching } where results is combined + deduplicated by name.
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

  // Local matches (instant, filtered by query)
  const localMatches = useMemo(() => {
    if (!query.trim()) return localFoods;
    const q = query.toLowerCase();
    return localFoods.filter(f => f.name.toLowerCase().includes(q));
  }, [localFoods, query]);

  // Merge: local first, then external (skip names already in local)
  const localNames = useMemo(() => new Set(localFoods.map(f => f.name.toLowerCase())), [localFoods]);
  const combined: Array<{ source: 'local'; item: FoodItem } | { source: 'external'; item: FoodSearchResult }> = useMemo(() => {
    const result: Array<{ source: 'local'; item: FoodItem } | { source: 'external'; item: FoodSearchResult }> = [
      ...localMatches.map(item => ({ source: 'local' as const, item })),
      ...externalResults
        .filter(f => !localNames.has(f.name.toLowerCase()))
        .map(item => ({ source: 'external' as const, item })),
    ];
    return result;
  }, [localMatches, externalResults, localNames]);

  return { results: combined, isSearching, error };
}
