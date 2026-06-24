/** Sport — training cycle orchestration. A cycle is a thin wrapper around one or more
 * training_blocks (phases) + per-week type/goal tags; all actual scheduling/progression
 * continues to live on scheduled_workouts/training_blocks (see sportPlannerService). */
import { supabase } from '@/lib/supabase';
import * as cycleRepo from './cycleRepository';
import * as planner from './sportPlannerService';
import type {
  CycleProgress, CycleWeekType, NewCycleInput, NewTrainingBlockInput, ScheduledWorkout,
  TrainingCycle, TrainingCyclePhase, TrainingCycleWeek,
} from '../types';

function addDaysStr(s: string, n: number): string {
  const d = new Date(`${s}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function createCycleWithWeeks(input: NewCycleInput): Promise<TrainingCycle> {
  const cycle = await cycleRepo.createCycle(input);
  const weeks = Array.from({ length: input.duration_weeks }, (_, i) => {
    const start = addDaysStr(cycle.start_date, i * 7);
    return {
      cycle_id: cycle.id, week_number: i + 1, start_date: start, end_date: addDaysStr(start, 6),
      week_type: 'standard' as CycleWeekType, goal: null, notes: null,
    };
  });
  await cycleRepo.createWeeks(weeks);
  return cycle;
}

export async function createPhaseWithBlock(
  cycleId: string,
  phase: { name: string; goal: string | null; orderIndex: number },
  blockInput: NewTrainingBlockInput,
): Promise<TrainingCyclePhase> {
  const block = await planner.createBlockWithSchedule(blockInput);
  return cycleRepo.createPhase({
    cycle_id: cycleId, block_id: block.id, name: phase.name, goal: phase.goal, order_index: phase.orderIndex,
    start_date: block.start_date, end_date: block.end_date, duration_weeks: block.duration_weeks,
  });
}

export async function setActiveCycle(id: string): Promise<void> {
  const all = await cycleRepo.listCycles();
  const others = all.filter(c => c.id !== id && c.status === 'active');
  for (const c of others) {
    await cycleRepo.updateCycle(c.id, { status: 'paused' });
  }
  await cycleRepo.updateCycle(id, { status: 'active' });
}

export async function pauseCycle(id: string): Promise<void> {
  await cycleRepo.updateCycle(id, { status: 'paused' });
}

export async function endCycle(id: string): Promise<void> {
  await cycleRepo.updateCycle(id, { status: 'completed' });
}

export async function archiveCycle(id: string): Promise<void> {
  await cycleRepo.updateCycle(id, { status: 'archived', archived_at: new Date().toISOString() });
}

/** Duplicates the cycle's own fields + a fresh (all-standard) week skeleton. Phases/blocks are
 * not cloned — their dates wouldn't make sense without the user re-placing them in time. */
export async function duplicateCycle(id: string): Promise<TrainingCycle> {
  const original = await cycleRepo.getCycle(id);
  return createCycleWithWeeks({
    name: `${original.name} (kopia)`, goal: original.goal, start_date: todayStr(),
    duration_weeks: original.duration_weeks, intensity: original.intensity,
    trainings_per_week: original.trainings_per_week, active_sport_ids: original.active_sport_ids,
    notes: original.notes,
  });
}

async function scheduledWorkoutsForCycle(cycleId: string, fromDate?: string, toDate?: string): Promise<ScheduledWorkout[]> {
  const phases = await cycleRepo.listPhases(cycleId);
  const blockIds = phases.map(p => p.block_id).filter((v): v is string => !!v);
  if (!blockIds.length) return [];
  let q = supabase.from('scheduled_workouts').select('*').is('deleted_at', null).in('block_id', blockIds);
  if (fromDate) q = q.gte('scheduled_date', fromDate);
  if (toDate) q = q.lte('scheduled_date', toDate);
  const { data, error } = await q.order('scheduled_date');
  if (error) throw error;
  return (data ?? []) as ScheduledWorkout[];
}

export async function getCycleProgress(cycleId: string): Promise<CycleProgress> {
  const workouts = await scheduledWorkoutsForCycle(cycleId);
  const plannedCount = workouts.length;
  const completedCount = workouts.filter(w => w.status === 'completed').length;
  const skippedCount = workouts.filter(w => w.status === 'skipped' || w.status === 'cancelled').length;

  const completedIds = workouts.filter(w => w.status === 'completed').map(w => w.id);
  let totalVolumeKg = 0;
  if (completedIds.length) {
    const { data, error } = await supabase.from('training_sessions').select('total_volume_kg').in('scheduled_workout_id', completedIds);
    if (error) throw error;
    totalVolumeKg = (data ?? []).reduce((sum, r) => sum + (Number(r.total_volume_kg) || 0), 0);
  }

  return {
    plannedCount, completedCount, skippedCount, totalVolumeKg,
    completionPercent: plannedCount ? Math.round((completedCount / plannedCount) * 100) : 0,
  };
}

export function currentWeekFor(weeks: TrainingCycleWeek[]): TrainingCycleWeek | null {
  const today = todayStr();
  return weeks.find(w => w.start_date <= today && today <= w.end_date) ?? null;
}

export async function getAdjacentWorkouts(cycleId: string): Promise<{ next: ScheduledWorkout | null; last: ScheduledWorkout | null }> {
  const today = todayStr();
  const [upcoming, past] = await Promise.all([
    scheduledWorkoutsForCycle(cycleId, today),
    scheduledWorkoutsForCycle(cycleId, undefined, today),
  ]);
  const next = upcoming.filter(w => w.status === 'planned').sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] ?? null;
  const last = past.filter(w => w.status === 'completed').sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))[0] ?? null;
  return { next, last };
}
