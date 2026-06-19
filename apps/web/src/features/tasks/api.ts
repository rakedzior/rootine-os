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
      category: input.category ?? null,
      priority: input.priority ?? 'mid',
      due_date: input.due_date ?? null,
      scheduled_time: input.scheduled_time ?? null,
      note: input.note ?? '',
      series_id: input.series_id ?? null,
      repeat_mode: input.repeat_mode ?? 'none',
      repeat_until: input.repeat_until ?? null,
      repeat_weekdays: input.repeat_weekdays ?? null,
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
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteTasks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('tasks').delete().in('id', ids);
  if (error) throw error;
}
