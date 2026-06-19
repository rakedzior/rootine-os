export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  done: boolean;
  due_date: string | null;
  category: string | null;
  scheduled_time: string | null;
  priority: TaskPriority;
  recurrence: string | null;
  favorite: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewTaskInput {
  title: string;
  description?: string | null;
  category?: string | null;
  due_date?: string | null;
  scheduled_time?: string | null;
  priority?: TaskPriority;
  recurrence?: string | null;
}
