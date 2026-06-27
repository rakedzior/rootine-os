import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, fetchHabitLogs, insertHabit, updateHabit, deleteHabit, setHabitStatus, setHabitVisibility, setHabitEntry, setHabitLog } from './api';
import type { Habit, HabitEntryStatus, HabitLog, NewHabitInput, UpdateHabitInput } from './types';

export const HABITS_KEY = ['habits'] as const;
export const HABIT_LOGS_KEY = ['habit_logs'] as const;

export function useHabits() {
  return useQuery({ queryKey: HABITS_KEY, queryFn: fetchHabits });
}

export function useHabitLogs() {
  return useQuery({ queryKey: HABIT_LOGS_KEY, queryFn: () => fetchHabitLogs() });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewHabitInput) => insertHabit(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateHabitInput) => updateHabit(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HABITS_KEY });
      qc.invalidateQueries({ queryKey: HABIT_LOGS_KEY });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: HABITS_KEY });
      const prev = qc.getQueryData<Habit[]>(HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old) => (old ?? []).filter((h) => h.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABITS_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: HABITS_KEY });
      qc.invalidateQueries({ queryKey: HABIT_LOGS_KEY });
    },
  });
}

export function useSetHabitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) => setHabitStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: HABITS_KEY });
      const prev = qc.getQueryData<Habit[]>(HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old) => (old ?? []).map((habit) => (
        habit.id === id ? { ...habit, status, visible_on_dashboard: status === 'paused' ? false : habit.visible_on_dashboard } : habit
      )));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABITS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useSetHabitVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => setHabitVisibility(id, visible),
    onMutate: async ({ id, visible }) => {
      await qc.cancelQueries({ queryKey: HABITS_KEY });
      const prev = qc.getQueryData<Habit[]>(HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old) => (old ?? []).map((habit) => (
        habit.id === id ? { ...habit, visible_on_dashboard: visible } : habit
      )));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABITS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useSetHabitEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, status }: { habitId: string; date: string; status: HabitEntryStatus | null }) =>
      setHabitEntry(habitId, date, status),
    onMutate: async ({ habitId, date, status }) => {
      await qc.cancelQueries({ queryKey: HABIT_LOGS_KEY });
      const prev = qc.getQueryData<HabitLog[]>(HABIT_LOGS_KEY);
      qc.setQueryData<HabitLog[]>(HABIT_LOGS_KEY, (old) => {
        const list = (old ?? []).filter((l) => !(l.habit_id === habitId && l.entry_date === date));
        if (!status) return list;
        return [...list, {
          id: `${habitId}-${date}`,
          user_id: '',
          habit_id: habitId,
          entry_date: date,
          log_date: date,
          status,
          note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABIT_LOGS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABIT_LOGS_KEY }),
  });
}

export function useToggleHabitLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, done }: { habitId: string; date: string; done: boolean }) =>
      setHabitLog(habitId, date, done),
    onMutate: async ({ habitId, date, done }) => {
      await qc.cancelQueries({ queryKey: HABIT_LOGS_KEY });
      const prev = qc.getQueryData<HabitLog[]>(HABIT_LOGS_KEY);
      qc.setQueryData<HabitLog[]>(HABIT_LOGS_KEY, (old) => {
        const list = old ?? [];
        if (done) {
          if (list.some((l) => l.habit_id === habitId && l.entry_date === date)) return list;
          return [...list, {
            id: `${habitId}-${date}`,
            user_id: '',
            habit_id: habitId,
            entry_date: date,
            log_date: date,
            status: 'completed',
            note: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }];
        }
        return list.filter((l) => !(l.habit_id === habitId && l.entry_date === date));
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABIT_LOGS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABIT_LOGS_KEY }),
  });
}
