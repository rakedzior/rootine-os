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
  meal_category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  user_id: string;
  meal_id: string | null;
  food_item_id: string | null;
  custom_meal_id: string | null;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  amount: number;
  unit: string;
  consumed_at: string | null;
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

export interface MealCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_visible: boolean;
  is_default: boolean;
  default_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomMeal {
  id: string;
  user_id: string;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  default_quantity: number;
  default_unit: string;
  image_url: string | null;
  is_favorite: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HydrationEntry {
  id: string;
  user_id: string;
  amount_ml: number;
  consumed_at: string;
  created_at: string;
}

export interface NutritionTarget {
  id: string;
  user_id: string;
  kcal_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  water_target_ml: number;
  created_at: string;
  updated_at: string;
}

export interface NewMealItemInput {
  name: string;
  kcal: number;
  protein?: number;
  carb?: number;
  fat?: number;
  amount?: number;
  unit?: string;
  consumed_at?: string;
  meal_id?: string | null;
  food_item_id?: string | null;
  custom_meal_id?: string | null;
}

export interface NewFoodItemInput {
  name: string;
  kcal: number;
  protein?: number;
  carb?: number;
  fat?: number;
  per_amount?: number;
  unit?: string;
}

export interface NutritionDailyPatch {
  kcal_target?: number;
  protein_target?: number;
  carb_target?: number;
  fat_target?: number;
  water_ml?: number;
  weight_kg?: number | null;
}

export interface FoodSearchResult {
  external_id: string;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  per_amount: number;
  unit: string;
}

export interface NewMealCategoryInput {
  name: string;
  icon?: string;
  sort_order?: number;
  is_visible?: boolean;
  is_default?: boolean;
  default_time?: string | null;
}

export interface NewCustomMealInput {
  name: string;
  kcal: number;
  protein?: number;
  carb?: number;
  fat?: number;
  default_quantity?: number;
  default_unit?: string;
  image_url?: string | null;
  is_favorite?: boolean;
  last_used_at?: string | null;
}

export interface NutritionTargetPatch {
  kcal_target?: number;
  protein_target?: number;
  carb_target?: number;
  fat_target?: number;
  water_target_ml?: number;
}
