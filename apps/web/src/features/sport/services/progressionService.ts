/** Sport — progression rule/target generation (spec §9). Linear gets a computed table;
 * every other mode falls back to an editable manual per-week grid (see plan non-goals). */
import * as repo from './sportRepository';
import type { LinearProgressionParams, ProgressionTarget, ProgressionType } from '../types';

export interface ProgressionWeekRow {
  week: number;
  weight: number | null;
  reps: number | null;
  isDeload: boolean;
}

export function computeLinearProgressionTable(params: LinearProgressionParams, weeks: number): ProgressionWeekRow[] {
  const rows: ProgressionWeekRow[] = [];
  for (let week = 1; week <= weeks; week++) {
    const isDeload = !!params.deload_every_weeks && week % params.deload_every_weeks === 0;
    const rawWeight = params.starting_weight_kg + params.weekly_increment_kg * (week - 1);
    const weight = isDeload
      ? Math.round(rawWeight * (1 - (params.deload_percent ?? 20) / 100) * 2) / 2
      : Math.round(rawWeight * 2) / 2; // round to nearest 0.5kg
    rows.push({ week, weight, reps: params.reps, isDeload });
  }
  return rows;
}

/** Creates a progression_rule (+ its week-by-week progression_targets) for one exercise in a block.
 * Pass `explicitRows` to persist user-edited cells instead of the auto-computed linear table. */
export async function createBlockProgression(
  blockId: string,
  exerciseId: string,
  progressionType: ProgressionType,
  durationWeeks: number,
  params: LinearProgressionParams | Record<string, unknown>,
  explicitRows?: ProgressionWeekRow[],
): Promise<void> {
  const rule = await repo.createProgressionRule({
    block_id: blockId, exercise_id: exerciseId, progression_type: progressionType,
    duration_weeks: durationWeeks, params: params as Record<string, unknown>,
  });

  const rows: ProgressionWeekRow[] = explicitRows ?? (progressionType === 'linear'
    ? computeLinearProgressionTable(params as LinearProgressionParams, durationWeeks)
    : Array.from({ length: durationWeeks }, (_, i) => ({ week: i + 1, weight: null, reps: null, isDeload: false })));

  await repo.createProgressionTargets(rows.map(r => ({
    progression_rule_id: rule.id, block_id: blockId, exercise_id: exerciseId, template_id: null,
    week_number: r.week, set_index: null,
    target_weight_kg: r.weight, target_reps_min: r.reps, target_reps_max: r.reps,
    target_rir: null, target_rpe: null, notes: r.isDeload ? 'deload' : null,
  })));
}

export async function getWeekTarget(blockId: string, exerciseId: string, weekNumber: number): Promise<ProgressionTarget | null> {
  const targets = await repo.listProgressionTargets(blockId, exerciseId);
  return targets.find(t => t.week_number === weekNumber) ?? null;
}

/** Which week of a block a given calendar date falls in (1-based), given the block's start date. */
export function weekNumberForDate(blockStartDate: string, date: string): number {
  const start = new Date(`${blockStartDate}T12:00:00`).getTime();
  const d = new Date(`${date}T12:00:00`).getTime();
  return Math.floor((d - start) / (7 * 86400000)) + 1;
}

export async function updateProgressionTarget(id: string, patch: Partial<ProgressionTarget>): Promise<ProgressionTarget> {
  return repo.updateProgressionTarget(id, patch);
}
