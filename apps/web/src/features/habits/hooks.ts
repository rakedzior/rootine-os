import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, fetchHabitLogs, insertHabit, deleteHabit, setHabitLog } from './api';
import type { Habit, HabitLog, NewHabitInput } from './types';

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
          if (list.some((l) => l.habit_id === habitId && l.log_date === date)) return list;
          return [...list, { habit_id: habitId, log_date: date }];
        }
        return list.filter((l) => !(l.habit_id === habitId && l.log_date === date));
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABIT_LOGS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABIT_LOGS_KEY }),
  });
}
