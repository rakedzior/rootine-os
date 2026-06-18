import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodayMealItems,
  insertMealItem,
  deleteMealItem,
  fetchNutritionDaily,
  upsertNutritionDaily,
} from './api';
import type { MealItem, NewMealItemInput, NutritionDailyPatch } from './types';

const TODAY_ITEMS_KEY = ['meal_items', 'today'] as const;
const NUTRITION_TODAY_KEY = ['nutrition_daily', 'today'] as const;

export function useTodayMealItems() {
  return useQuery({ queryKey: TODAY_ITEMS_KEY, queryFn: fetchTodayMealItems });
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
