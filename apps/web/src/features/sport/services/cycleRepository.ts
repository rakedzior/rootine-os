import { supabase } from '@/lib/supabase';
import { QA_AUTH_ENABLED } from '@/features/auth/qaAuth';
import { uid } from './sportRepository';
import {
  createQaCycle, createQaCyclePhase, createQaCycleWeeks, deleteQaCycle, deleteQaCyclePhase,
  getQaCycle, listQaCyclePhases, listQaCycles, listQaCycleWeeks, updateQaCycle, updateQaCycleWeek,
} from './qaSportStore';
import type { TrainingCycle, TrainingCyclePhase, TrainingCycleWeek, NewCycleInput } from '../types';

// ── cycles ───────────────────────────────────────────────────

export async function listCycles(): Promise<TrainingCycle[]> {
  if (QA_AUTH_ENABLED) return listQaCycles();
  const { data, error } = await supabase.from('training_cycles').select('*').order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingCycle[];
}

export async function getCycle(id: string): Promise<TrainingCycle> {
  if (QA_AUTH_ENABLED) return getQaCycle(id);
  const { data, error } = await supabase.from('training_cycles').select('*').eq('id', id).single();
  if (error) throw error;
  return data as TrainingCycle;
}

export async function createCycle(input: NewCycleInput): Promise<TrainingCycle> {
  if (QA_AUTH_ENABLED) return createQaCycle(input);
  const user_id = await uid();
  const end_date = addDaysStr(input.start_date, input.duration_weeks * 7 - 1);
  const { data, error } = await supabase.from('training_cycles').insert({
    user_id, name: input.name, goal: input.goal, status: 'planned',
    start_date: input.start_date, end_date, duration_weeks: input.duration_weeks,
    intensity: input.intensity ?? null, trainings_per_week: input.trainings_per_week ?? null,
    active_sport_ids: input.active_sport_ids ?? [], notes: input.notes ?? null,
  }).select('*').single();
  if (error) throw error;
  return data as TrainingCycle;
}

export async function updateCycle(id: string, patch: Partial<TrainingCycle>): Promise<TrainingCycle> {
  if (QA_AUTH_ENABLED) return updateQaCycle(id, patch);
  const { data, error } = await supabase.from('training_cycles').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as TrainingCycle;
}

export async function deleteCycle(id: string): Promise<void> {
  if (QA_AUTH_ENABLED) return deleteQaCycle(id);
  const { error } = await supabase.from('training_cycles').delete().eq('id', id);
  if (error) throw error;
}

function addDaysStr(s: string, n: number): string {
  const d = new Date(`${s}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── phases (mezocykle) ────────────────────────────────────────

export async function listPhases(cycleId: string): Promise<TrainingCyclePhase[]> {
  if (QA_AUTH_ENABLED) return listQaCyclePhases(cycleId).filter((phase) => !phase.deleted_at);
  const { data, error } = await supabase
    .from('training_cycle_phases').select('*').eq('cycle_id', cycleId).is('deleted_at', null).order('order_index');
  if (error) throw error;
  return (data ?? []) as TrainingCyclePhase[];
}

export async function listPhasesForCycles(cycleIds: string[]): Promise<TrainingCyclePhase[]> {
  if (!cycleIds.length) return [];
  if (QA_AUTH_ENABLED) return cycleIds.flatMap((cycleId) => listQaCyclePhases(cycleId)).filter((phase) => !phase.deleted_at);
  const { data, error } = await supabase
    .from('training_cycle_phases').select('*').in('cycle_id', cycleIds).is('deleted_at', null).order('order_index');
  if (error) throw error;
  return (data ?? []) as TrainingCyclePhase[];
}

export async function createPhase(input: Omit<TrainingCyclePhase, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<TrainingCyclePhase> {
  if (QA_AUTH_ENABLED) return createQaCyclePhase(input);
  const user_id = await uid();
  const { data, error } = await supabase.from('training_cycle_phases').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as TrainingCyclePhase;
}

export async function deletePhase(id: string): Promise<void> {
  if (QA_AUTH_ENABLED) return deleteQaCyclePhase(id);
  const { error } = await supabase.from('training_cycle_phases').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ── weeks (mikrocykle) ────────────────────────────────────────

export async function listWeeks(cycleId: string): Promise<TrainingCycleWeek[]> {
  if (QA_AUTH_ENABLED) return listQaCycleWeeks(cycleId);
  const { data, error } = await supabase
    .from('training_cycle_weeks').select('*').eq('cycle_id', cycleId).order('week_number');
  if (error) throw error;
  return (data ?? []) as TrainingCycleWeek[];
}

export async function createWeeks(rows: Omit<TrainingCycleWeek, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<TrainingCycleWeek[]> {
  if (!rows.length) return [];
  if (QA_AUTH_ENABLED) return createQaCycleWeeks(rows);
  const user_id = await uid();
  const { data, error } = await supabase.from('training_cycle_weeks').insert(rows.map(r => ({ user_id, ...r }))).select('*');
  if (error) throw error;
  return (data ?? []) as TrainingCycleWeek[];
}

export async function updateWeek(id: string, patch: Partial<TrainingCycleWeek>): Promise<TrainingCycleWeek> {
  if (QA_AUTH_ENABLED) return updateQaCycleWeek(id, patch);
  const { data, error } = await supabase.from('training_cycle_weeks').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as TrainingCycleWeek;
}

export { addDaysStr as cycleAddDaysStr };
