import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGoals, insertGoal, patchGoal, deleteGoal,
  fetchMilestones, insertMilestone, patchMilestone, deleteMilestone,
  fetchGoalTasks, insertGoalTask, patchGoalTask, deleteGoalTask,
} from './api';
import type { Goal, GoalTask, Milestone, NewGoalInput, NewGoalTaskInput } from './types';

export const GOALS_KEY = ['goals'] as const;
export const MILESTONES_KEY = ['milestones'] as const;
export const GOAL_TASKS_KEY = ['goal_tasks'] as const;

export function useGoals() {
  return useQuery({ queryKey: GOALS_KEY, queryFn: fetchGoals });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewGoalInput) => insertGoal(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Goal> }) => patchGoal(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: GOALS_KEY });
      const prev = qc.getQueryData<Goal[]>(GOALS_KEY);
      qc.setQueryData<Goal[]>(GOALS_KEY, (old) =>
        (old ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(GOALS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: GOALS_KEY });
      const prev = qc.getQueryData<Goal[]>(GOALS_KEY);
      qc.setQueryData<Goal[]>(GOALS_KEY, (old) => (old ?? []).filter((g) => g.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(GOALS_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.invalidateQueries({ queryKey: MILESTONES_KEY });
    },
  });
}

export function useMilestones() {
  return useQuery({ queryKey: MILESTONES_KEY, queryFn: fetchMilestones });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, title }: { goalId: string; title: string }) => insertMilestone(goalId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: MILESTONES_KEY }),
  });
}

export function useToggleMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => patchMilestone(id, { done }),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: MILESTONES_KEY });
      const prev = qc.getQueryData<Milestone[]>(MILESTONES_KEY);
      qc.setQueryData<Milestone[]>(MILESTONES_KEY, (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, done } : m)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(MILESTONES_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MILESTONES_KEY }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Milestone> }) => patchMilestone(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: MILESTONES_KEY });
      const prev = qc.getQueryData<Milestone[]>(MILESTONES_KEY);
      qc.setQueryData<Milestone[]>(MILESTONES_KEY, (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(MILESTONES_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MILESTONES_KEY }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: MILESTONES_KEY });
      const prev = qc.getQueryData<Milestone[]>(MILESTONES_KEY);
      qc.setQueryData<Milestone[]>(MILESTONES_KEY, (old) => (old ?? []).filter((m) => m.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(MILESTONES_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MILESTONES_KEY }),
  });
}

export function useGoalTasks() {
  return useQuery({ queryKey: GOAL_TASKS_KEY, queryFn: fetchGoalTasks });
}

export function useCreateGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewGoalTaskInput) => insertGoalTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOAL_TASKS_KEY }),
  });
}

export function useUpdateGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<GoalTask> }) => patchGoalTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: GOAL_TASKS_KEY });
      const prev = qc.getQueryData<GoalTask[]>(GOAL_TASKS_KEY);
      qc.setQueryData<GoalTask[]>(GOAL_TASKS_KEY, (old) =>
        (old ?? []).map((task) => (task.id === id ? { ...task, ...patch } : task)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(GOAL_TASKS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: GOAL_TASKS_KEY }),
  });
}

export function useDeleteGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoalTask(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: GOAL_TASKS_KEY });
      const prev = qc.getQueryData<GoalTask[]>(GOAL_TASKS_KEY);
      qc.setQueryData<GoalTask[]>(GOAL_TASKS_KEY, (old) => (old ?? []).filter((task) => task.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(GOAL_TASKS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: GOAL_TASKS_KEY }),
  });
}
