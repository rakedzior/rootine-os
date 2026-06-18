import { supabase } from '@/lib/supabase';
import type {
  WorkCompany, WorkProject, WorkTask, WorkSubtask,
  NewWorkTaskInput, CompanyType, ProjectStatus,
} from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ── companies ─────────────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<WorkCompany[]> {
  const { data, error } = await supabase.from('work_companies').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as WorkCompany[];
}

export async function insertCompany(name: string, type: CompanyType = 'client'): Promise<WorkCompany> {
  const userId = await uid();
  const { data, error } = await supabase.from('work_companies').insert({ user_id: userId, name, type }).select('*').single();
  if (error) throw error;
  return data as WorkCompany;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('work_companies').delete().eq('id', id);
  if (error) throw error;
}

// ── projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<WorkProject[]> {
  const { data, error } = await supabase.from('work_projects').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as WorkProject[];
}

export async function insertProject(name: string, companyId?: string | null, status: ProjectStatus = 'active'): Promise<WorkProject> {
  const userId = await uid();
  const { data, error } = await supabase.from('work_projects').insert({ user_id: userId, name, company_id: companyId ?? null, status }).select('*').single();
  if (error) throw error;
  return data as WorkProject;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('work_projects').delete().eq('id', id);
  if (error) throw error;
}

// ── tasks ─────────────────────────────────────────────────────────────────────

export async function fetchWorkTasks(): Promise<WorkTask[]> {
  const { data, error } = await supabase
    .from('work_tasks')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkTask[];
}

export async function insertWorkTask(input: NewWorkTaskInput): Promise<WorkTask> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('work_tasks')
    .insert({ user_id: userId, title: input.title, project_id: input.project_id ?? null, status: input.status ?? 'todo', due_date: input.due_date ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as WorkTask;
}

export async function patchWorkTask(id: string, patch: Partial<WorkTask>): Promise<WorkTask> {
  const { data, error } = await supabase.from('work_tasks').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as WorkTask;
}

export async function deleteWorkTask(id: string): Promise<void> {
  const { error } = await supabase.from('work_tasks').delete().eq('id', id);
  if (error) throw error;
}

// ── subtasks ──────────────────────────────────────────────────────────────────

export async function fetchSubtasks(taskId: string): Promise<WorkSubtask[]> {
  const { data, error } = await supabase.from('work_subtasks').select('*').eq('task_id', taskId).order('created_at');
  if (error) throw error;
  return (data ?? []) as WorkSubtask[];
}

export async function insertSubtask(taskId: string, title: string): Promise<WorkSubtask> {
  const userId = await uid();
  const { data, error } = await supabase.from('work_subtasks').insert({ user_id: userId, task_id: taskId, title }).select('*').single();
  if (error) throw error;
  return data as WorkSubtask;
}

export async function patchSubtask(id: string, done: boolean): Promise<WorkSubtask> {
  const { data, error } = await supabase.from('work_subtasks').update({ done }).eq('id', id).select('*').single();
  if (error) throw error;
  return data as WorkSubtask;
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('work_subtasks').delete().eq('id', id);
  if (error) throw error;
}
