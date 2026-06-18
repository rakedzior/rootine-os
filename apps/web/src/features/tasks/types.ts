export interface Task {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  category: string | null;
  scheduled_time: string | null;
  favorite: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewTaskInput {
  title: string;
  category?: string | null;
  due_date?: string | null;
  scheduled_time?: string | null;
}
