export type HabitStatus = 'active' | 'paused' | 'archived';

export type HabitScheduleType =
  | 'daily'
  | 'selected_weekdays'
  | 'every_n_weeks'
  | 'every_n_months';

export type HabitEndMode = 'forever' | 'after_cycles' | 'on_date';

export type HabitEntryStatus = 'completed' | 'skipped';

export type HabitRecurrenceType = 'daily' | 'weekly';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: HabitStatus;
  visible_on_dashboard: boolean;
  schedule_type: HabitScheduleType;
  interval_value: number;
  recurrence_type: HabitRecurrenceType;
  weekdays: number[];
  schedule_days: number[];
  start_date: string;
  end_date: string | null;
  end_mode: HabitEndMode;
  end_after_cycles: number | null;
  time_of_day: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HabitScheduleDay {
  id: string;
  habit_id: string;
  weekday: number;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  user_id: string;
  entry_date: string;
  status: HabitEntryStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog extends HabitEntry {
  log_date: string;
}

export interface NewHabitInput {
  name: string;
  description?: string | null;
  category?: string | null;
  status?: HabitStatus;
  visible_on_dashboard?: boolean;
  schedule_type?: HabitScheduleType;
  interval_value?: number;
  weekdays?: number[];
  start_date?: string | null;
  end_date?: string | null;
  end_mode?: HabitEndMode;
  end_after_cycles?: number | null;
  time_of_day?: string | null;
}

export interface UpdateHabitInput extends NewHabitInput {
  id: string;
}
