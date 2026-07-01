export interface Task {
  id: string;
  user_id: string;
  title: string;
  tags: string[] | null;
  done: boolean;
  source: 'manual' | 'quick_add' | 'calendar_quick' | 'drag_drop' | 'imported' | null;
  due_date: string | null;
  all_day: boolean;
  start_at: string | null;
  end_at: string | null;
  reminder_at: string | null;
  category: string | null;
  location: string | null;
  priority: 'high' | 'mid' | 'low' | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  note: string;
  series_id: string | null;
  repeat_mode: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  repeat_rule: Record<string, unknown> | null;
  repeat_anchor: 'due_date' | 'completion_date' | null;
  repeat_until: string | null;
  repeat_weekdays: number[] | null;
  favorite: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewTaskInput {
  title: string;
  tags?: string[] | null;
  source?: 'manual' | 'quick_add' | 'calendar_quick' | 'drag_drop' | 'imported' | null;
  category?: string | null;
  location?: string | null;
  priority?: 'high' | 'mid' | 'low' | null;
  due_date?: string | null;
  all_day?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  reminder_at?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  note?: string | null;
  series_id?: string | null;
  repeat_mode?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  repeat_rule?: Record<string, unknown> | null;
  repeat_anchor?: 'due_date' | 'completion_date' | null;
  repeat_until?: string | null;
  repeat_weekdays?: number[] | null;
}
