export interface FoodItem {
  id: string;
  user_id: string;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  per_amount: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  snack: 'Przekąska',
  other: 'Inne',
};

export interface MealItem {
  id: string;
  user_id: string;
  meal_id: string | null;
  food_item_id: string | null;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  amount: number;
  meal_type: MealType;
  created_at: string;
}

export interface NutritionDaily {
  id: string;
  user_id: string;
  date: string;
  kcal_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  water_ml: number;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewMealItemInput {
  meal_id?: string | null;
  food_item_id?: string | null;
  name: string;
  kcal: number;
  protein?: number;
  carb?: number;
  fat?: number;  amount?: number;
  meal_type?: MealType;
}

export interface NutritionDailyPatch {
  kcal_target?: number;
  protein_target?: number;
  carb_target?: number;
  fat_target?: number;
  water_ml?: number;
  weight_kg?: number | null;
}
