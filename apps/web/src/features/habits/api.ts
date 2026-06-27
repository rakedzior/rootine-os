import { supabase } from '@/lib/supabase';
import type { Habit, HabitEntry, HabitEntryStatus, HabitLog, NewHabitInput, UpdateHabitInput } from './types';
import { ALL_WEEKDAYS, addDays, todayStr } from './dates';

type HabitRow = Omit<Habit, 'schedule_days'> & {
  habit_schedule_days?: Array<{ weekday: number }> | null;
};

function normalizeHabit(row: HabitRow): Habit {
  const scheduleDays = (row.habit_schedule_days ?? []).map((d) => d.weekday).sort((a, b) => a - b);
  const fallbackDays = Array.isArray(row.weekdays) && row.weekdays.length ? row.weekdays : ALL_WEEKDAYS;
  return {
    ...row,
    description: row.description ?? null,
    status: row.status ?? 'active',
    visible_on_dashboard: row.visible_on_dashboard ?? true,
    schedule_type: row.schedule_type ?? (row.recurrence_type === 'weekly' ? 'selected_weekdays' : 'daily'),
    interval_value: row.interval_value ?? 1,
    end_mode: row.end_mode ?? (row.end_date ? 'on_date' : 'forever'),
    end_after_cycles: row.end_after_cycles ?? null,
    schedule_days: scheduleDays.length ? scheduleDays : fallbackDays,
    weekdays: fallbackDays,
    time_of_day: null,
  };
}

function toLegacyLog(entry: HabitEntry): HabitLog {
  return { ...entry, log_date: entry.entry_date };
}

function recurrenceFromSchedule(scheduleType: NewHabitInput['schedule_type']): 'daily' | 'weekly' {
  return scheduleType === 'daily' || scheduleType === 'every_n_months' ? 'daily' : 'weekly';
}

function normalizedDays(input: NewHabitInput): number[] {
  if (input.schedule_type === 'daily' || input.schedule_type === 'every_n_months') return ALL_WEEKDAYS;
  const days = input.weekdays?.filter((day) => day >= 1 && day <= 7) ?? [];
  return days.length ? [...new Set(days)].sort((a, b) => a - b) : [];
}

function validateHabit(input: NewHabitInput) {
  const name = input.name.trim();
  if (!name || name.length > 80) throw new Error('Nazwa nawyku musi mieć 1-80 znaków.');
  const scheduleType = input.schedule_type ?? 'daily';
  const interval = Math.max(1, input.interval_value ?? 1);
  if ((scheduleType === 'selected_weekdays' || scheduleType === 'every_n_weeks') && normalizedDays(input).length === 0) {
    throw new Error('Wybierz przynajmniej jeden dzień tygodnia.');
  }
  if (scheduleType === 'every_n_weeks' && interval > 52) throw new Error('Powtarzanie tygodniowe może wynosić maksymalnie 52.');
  if (scheduleType === 'every_n_months' && interval > 24) throw new Error('Powtarzanie miesięczne może wynosić maksymalnie 24.');
  if (input.end_mode === 'after_cycles' && (!input.end_after_cycles || input.end_after_cycles < 1)) {
    throw new Error('Podaj liczbę cykli większą od zera.');
  }
  if (input.end_mode === 'on_date' && !input.end_date) {
    throw new Error('Wybierz datę zakończenia.');
  }
}

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*, habit_schedule_days(weekday)')
    .is('deleted_at', null)
    .neq('status', 'archived')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as HabitRow[]).map(normalizeHabit);
}

export async function fetchHabitEntries(windowDays = 120): Promise<HabitLog[]> {
  const since = addDays(todayStr(), -(windowDays - 1));
  const { data, error } = await supabase
    .from('habit_entries')
    .select('*')
    .gte('entry_date', since);
  if (error) throw error;
  return ((data ?? []) as HabitEntry[]).map(toLegacyLog);
}

export const fetchHabitLogs = fetchHabitEntries;

async function replaceScheduleDays(habitId: string, weekdays: number[]) {
  await supabase.from('habit_schedule_days').delete().eq('habit_id', habitId);
  if (weekdays.length === 0) return;
  const { error } = await supabase
    .from('habit_schedule_days')
    .insert(weekdays.map((weekday) => ({ habit_id: habitId, weekday })));
  if (error) throw error;
}

function habitPayload(input: NewHabitInput) {
  const scheduleType = input.schedule_type ?? 'daily';
  const endMode = input.end_mode ?? (input.end_date ? 'on_date' : 'forever');
  const weekdays = normalizedDays({ ...input, schedule_type: scheduleType });
  return {
    scheduleType,
    weekdays: weekdays.length ? weekdays : ALL_WEEKDAYS,
    values: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category ?? null,
      status: input.status ?? 'active',
      visible_on_dashboard: input.visible_on_dashboard ?? true,
      schedule_type: scheduleType,
      interval_value: Math.max(1, input.interval_value ?? 1),
      recurrence_type: recurrenceFromSchedule(scheduleType),
      weekdays: weekdays.length ? weekdays : ALL_WEEKDAYS,
      start_date: input.start_date ?? todayStr(),
      end_mode: endMode,
      end_after_cycles: endMode === 'after_cycles' ? Math.max(1, input.end_after_cycles ?? 1) : null,
      end_date: endMode === 'on_date' ? input.end_date || null : null,
      time_of_day: null,
    },
  };
}

export async function insertHabit(input: NewHabitInput): Promise<Habit> {
  validateHabit(input);
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Brak sesji użytkownika.');
  const payload = habitPayload(input);
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, ...payload.values })
    .select('*, habit_schedule_days(weekday)')
    .single();
  if (error) throw error;
  await replaceScheduleDays(data.id, payload.weekdays);
  return normalizeHabit({ ...(data as HabitRow), habit_schedule_days: payload.weekdays.map((weekday) => ({ weekday })) });
}

export async function updateHabit(input: UpdateHabitInput): Promise<void> {
  validateHabit(input);
  const payload = habitPayload(input);
  const { error } = await supabase
    .from('habits')
    .update(payload.values)
    .eq('id', input.id);
  if (error) throw error;
  await replaceScheduleDays(input.id, payload.weekdays);
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ status: 'archived', visible_on_dashboard: false, deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function setHabitStatus(id: string, status: 'active' | 'paused'): Promise<void> {
  const patch = status === 'paused' ? { status, visible_on_dashboard: false } : { status };
  const { error } = await supabase.from('habits').update(patch).eq('id', id);
  if (error) throw error;
}

export async function setHabitVisibility(id: string, visible: boolean): Promise<void> {
  const { error } = await supabase.from('habits').update({ visible_on_dashboard: visible }).eq('id', id);
  if (error) throw error;
}

export async function setHabitEntry(habitId: string, date: string, status: HabitEntryStatus | null): Promise<void> {
  if (!status) {
    const { error } = await supabase
      .from('habit_entries')
      .delete()
      .eq('habit_id', habitId)
      .eq('entry_date', date);
    if (error) throw error;
    return;
  }
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Brak sesji użytkownika.');
  const { error } = await supabase
    .from('habit_entries')
    .upsert(
      { user_id: userId, habit_id: habitId, entry_date: date, status },
      { onConflict: 'habit_id,entry_date' },
    );
  if (error) throw error;
}

export async function setHabitLog(habitId: string, date: string, done: boolean): Promise<void> {
  await setHabitEntry(habitId, date, done ? 'completed' : null);
}
