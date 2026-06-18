export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HabitLog {
  habit_id: string;
  log_date: string; // YYYY-MM-DD
}

export interface NewHabitInput {
  name: string;
  category?: string | null;
}
