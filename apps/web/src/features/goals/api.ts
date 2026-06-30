import { supabase } from '@/lib/supabase';
import type { Goal, GoalTask, Milestone, NewGoalInput, NewGoalTaskInput } from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ---- goals ----
export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function insertGoal(input: NewGoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: await uid(),
      name: input.name,
      description: input.description ?? '',
      type: input.type ?? 'project',
      category: input.category ?? null,
      priority: input.priority ?? null,
      deadline: input.deadline ?? null,
      progress: input.progress ?? 0,
      streak: input.streak ?? 0,
      archived: input.archived ?? false,
      emoji: input.emoji ?? '🎯',
      completed_at: input.completed_at ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function patchGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ---- milestones ----
export async function fetchMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Milestone[];
}

export async function insertMilestone(goalId: string, title: string): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .insert({ user_id: await uid(), goal_id: goalId, title })
    .select('*')
    .single();
  if (error) throw error;
  return data as Milestone;
}

export async function patchMilestone(id: string, patch: Partial<Milestone>): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Milestone;
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from('milestones').delete().eq('id', id);
  if (error) throw error;
}

// ---- goal tasks ----
export async function fetchGoalTasks(): Promise<GoalTask[]> {
  const { data, error } = await supabase
    .from('goal_tasks')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as GoalTask[];
}

export async function insertGoalTask(input: NewGoalTaskInput): Promise<GoalTask> {
  const { data, error } = await supabase
    .from('goal_tasks')
    .insert({
      user_id: await uid(),
      goal_id: input.goal_id,
      parent_task_id: input.parent_task_id ?? null,
      title: input.title,
      description: input.description ?? '',
      due_date: input.due_date ?? null,
      priority: input.priority ?? null,
      status: input.status ?? 'todo',
      progress: input.progress ?? 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as GoalTask;
}

export async function patchGoalTask(id: string, patch: Partial<GoalTask>): Promise<GoalTask> {
  const { data, error } = await supabase
    .from('goal_tasks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as GoalTask;
}

export async function deleteGoalTask(id: string): Promise<void> {
  const { error } = await supabase.from('goal_tasks').delete().eq('id', id);
  if (error) throw error;
}
