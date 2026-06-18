import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, insertTask, patchTask, deleteTask } from './api';
import type { Task, NewTaskInput } from './types';

export const TASKS_KEY = ['tasks'] as const;

export function useTasks() {
  return useQuery({ queryKey: TASKS_KEY, queryFn: fetchTasks });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTaskInput) => insertTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => patchTask(id, { done }),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData<Task[]>(TASKS_KEY);
      qc.setQueryData<Task[]>(TASKS_KEY, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(TASKS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) => patchTask(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData<Task[]>(TASKS_KEY);
      qc.setQueryData<Task[]>(TASKS_KEY, (old) => (old ?? []).filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(TASKS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
