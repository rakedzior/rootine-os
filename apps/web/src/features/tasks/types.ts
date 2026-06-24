export interface Task {
  id: string;
  user_id: string;
  title: string;
  tags: string[] | null;
  done: boolean;
  due_date: string | null;
  category: string | null;
  priority: 'high' | 'mid' | 'low' | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  note: string;
  series_id: string | null;
  repeat_mode: 'none' | 'daily' | 'weekly' | null;
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
  category?: string | null;
  priority?: 'high' | 'mid' | 'low' | null;
  due_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  note?: string | null;
  series_id?: string | null;
  repeat_mode?: 'none' | 'daily' | 'weekly' | null;
  repeat_until?: string | null;
  repeat_weekdays?: number[] | null;
}
