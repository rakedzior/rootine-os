import { supabase } from '@/lib/supabase';
import type { Task, NewTaskInput } from './types';

const COLUMNS = '*';

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(COLUMNS)
    .is('deleted_at', null)
    .order('done', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function insertTask(input: NewTaskInput): Promise<Task> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Brak sesji użytkownika');
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      due_date: input.due_date ?? null,
      scheduled_time: input.scheduled_time ?? null,
      priority: input.priority ?? 'normal',
      recurrence: input.recurrence ?? null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as Task;
}

export async function patchTask(id: string, patch: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
