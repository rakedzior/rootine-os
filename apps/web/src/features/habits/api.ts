import { supabase } from '@/lib/supabase';
import type { Habit, HabitLog, NewHabitInput } from './types';
import { addDays, todayStr } from './dates';

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

/** Logs for the trailing window used to compute streaks + 7-day dots. */
export async function fetchHabitLogs(windowDays = 60): Promise<HabitLog[]> {
  const since = addDays(todayStr(), -(windowDays - 1));
  const { data, error } = await supabase
    .from('habit_logs')
    .select('habit_id, log_date')
    .gte('log_date', since);
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

export async function insertHabit(input: NewHabitInput): Promise<Habit> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Brak sesji użytkownika');
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, name: input.name, category: input.category ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

export async function setHabitLog(habitId: string, date: string, done: boolean): Promise<void> {
  if (done) {
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) throw new Error('Brak sesji użytkownika');
    const { error } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: userId, habit_id: habitId, log_date: date },
        { onConflict: 'user_id,habit_id,log_date', ignoreDuplicates: true },
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('log_date', date);
    if (error) throw error;
  }
}
