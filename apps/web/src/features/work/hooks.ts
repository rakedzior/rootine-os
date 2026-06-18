import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCompanies, insertCompany, deleteCompany,
  fetchProjects, insertProject, deleteProject,
  fetchWorkTasks, insertWorkTask, patchWorkTask, deleteWorkTask,
  fetchSubtasks, insertSubtask, patchSubtask, deleteSubtask,
} from './api';
import type { WorkTask, WorkSubtask, NewWorkTaskInput, CompanyType } from './types';

const COMPANIES_KEY = ['work_companies'] as const;
const PROJECTS_KEY = ['work_projects'] as const;
const TASKS_KEY = ['work_tasks'] as const;

export function useWorkCompanies() {
  return useQuery({ queryKey: COMPANIES_KEY, queryFn: fetchCompanies });
}

export function useAddCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type?: CompanyType }) => insertCompany(name, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

export function useWorkProjects() {
  return useQuery({ queryKey: PROJECTS_KEY, queryFn: fetchProjects });
}

export function useAddProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, companyId }: { name: string; companyId?: string | null }) => insertProject(name, companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useWorkTasks() {
  return useQuery({ queryKey: TASKS_KEY, queryFn: fetchWorkTasks });
}

export function useAddWorkTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkTaskInput) => insertWorkTask(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useMoveWorkTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'todo' | 'doing' | 'done' }) => patchWorkTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData<WorkTask[]>(TASKS_KEY);
      qc.setQueryData<WorkTask[]>(TASKS_KEY, (old) => (old ?? []).map((t) => (t.id === id ? { ...t, status } : t)));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(TASKS_KEY, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteWorkTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkTask(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData<WorkTask[]>(TASKS_KEY);
      qc.setQueryData<WorkTask[]>(TASKS_KEY, (old) => (old ?? []).filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(TASKS_KEY, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useSubtasks(taskId: string | null) {
  return useQuery({
    queryKey: ['work_subtasks', taskId],
    queryFn: () => fetchSubtasks(taskId!),
    enabled: !!taskId,
  });
}

export function useAddSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) => insertSubtask(taskId, title),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['work_subtasks', v.taskId] }),
  });
}

export function useToggleSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean; taskId: string }) => patchSubtask(id, done),
    onMutate: async ({ id, done, taskId }) => {
      const key = ['work_subtasks', taskId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WorkSubtask[]>(key);
      qc.setQueryData<WorkSubtask[]>(key, (old) => (old ?? []).map((s) => (s.id === id ? { ...s, done } : s)));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev); },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: ['work_subtasks', v.taskId] }),
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; taskId: string }) => deleteSubtask(id),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['work_subtasks', v.taskId] }),
  });
}
