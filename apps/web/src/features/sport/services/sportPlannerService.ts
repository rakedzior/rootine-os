/** Sport — date/week helpers + block/series generation, conflict-policy application and edit-scope resolution. */
import * as repo from './sportRepository';
import { createBlockProgression } from './progressionService';
import type {
  ConflictPolicy, EditScope, NewTrainingBlockInput, NewWorkoutFromTemplateInput, ScheduledWorkout, TrainingBlock,
} from '../types';

// ── date / week helpers (Monday-first, matches the rest of the app) ──────────

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function todayStr(): string {
  return toDateStr(new Date());
}
export function parseDateStr(s: string): Date {
  return new Date(`${s}T12:00:00`);
}
export function addDaysStr(s: string, n: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
/** 1 = Monday .. 7 = Sunday, matching training_block_day_assignments.weekday. */
export function isoWeekdayOf(s: string): number {
  const jsDay = parseDateStr(s).getDay(); // 0 = Sunday .. 6 = Saturday
  return jsDay === 0 ? 7 : jsDay;
}
export function startOfWeekStr(s: string): string {
  const iso = isoWeekdayOf(s);
  return addDaysStr(s, -(iso - 1));
}
export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));
}

export const WEEKDAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
export const WEEKDAY_LABELS_LONG = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

// ── conflict policy ───────────────────────────────────────────

export type ConflictAction = 'insert' | 'skip' | 'overwriteThenInsert';

export function resolveConflict(existingCount: number, policy: ConflictPolicy): ConflictAction {
  if (existingCount === 0) return 'insert';
  if (policy === 'skip_existing') return 'skip';
  if (policy === 'overwrite_existing') return 'overwriteThenInsert';
  return 'insert'; // append
}

// ── training block generation (spec §7.5/§7.6) ───────────────

export interface BlockOccurrenceDraft {
  scheduled_date: string;
  weekday: number;
  block_assignment_id: string;
  template_id: string | null;
  sport_id: string | null;
  title: string;
  planned_duration_min: number | null;
}

/** Every concrete occurrence a block's day assignments produce across its full duration. */
export function generateBlockOccurrences(
  block: Pick<TrainingBlock, 'start_date' | 'duration_weeks'>,
  assignments: { id: string; weekday: number; is_active: boolean; template_id: string | null; sport_id: string | null; manual_title: string | null; planned_duration_min: number | null; order_index: number }[],
  templateNameById: Map<string, string>,
): BlockOccurrenceDraft[] {
  const weekStart = startOfWeekStr(block.start_date);
  const active = assignments.filter(a => a.is_active);
  const drafts: BlockOccurrenceDraft[] = [];
  for (let week = 0; week < block.duration_weeks; week++) {
    const thisWeekStart = addDaysStr(weekStart, week * 7);
    for (const a of active) {
      const date = addDaysStr(thisWeekStart, a.weekday - 1);
      if (date < block.start_date) continue;
      drafts.push({
        scheduled_date: date,
        weekday: a.weekday,
        block_assignment_id: a.id,
        template_id: a.template_id,
        sport_id: a.sport_id,
        title: a.manual_title ?? (a.template_id ? templateNameById.get(a.template_id) ?? 'Trening' : 'Trening'),
        planned_duration_min: a.planned_duration_min,
      });
    }
  }
  return drafts;
}

/** Creates the block, its day assignments, and materializes scheduled_workouts honoring the conflict policy. */
export async function createBlockWithSchedule(input: NewTrainingBlockInput): Promise<TrainingBlock> {
  const endDate = addDaysStr(input.start_date, input.duration_weeks * 7 - 1);
  const block = await repo.createTrainingBlock({
    name: input.name, description: input.description ?? null,
    start_date: input.start_date, end_date: endDate, duration_weeks: input.duration_weeks,
    conflict_policy: input.conflict_policy, status: 'active',
  });

  const assignmentRows = input.days
    .filter(d => d.is_active && d.assignments.length > 0)
    .flatMap(d => d.assignments.map((a, idx) => ({
      weekday: d.weekday, order_index: idx, is_active: true,
      template_id: a.template_id ?? null, sport_id: a.sport_id ?? null,
      manual_title: a.manual_title ?? null, planned_duration_min: a.planned_duration_min ?? null,
      notes: null,
    })));
  const assignments = await repo.createDayAssignments(block.id, assignmentRows);

  const templateIds = [...new Set(assignments.map(a => a.template_id).filter((v): v is string => !!v))];
  const templateNameById = new Map<string, string>();
  for (const id of templateIds) {
    try {
      const t = await repo.getTemplateFull(id);
      templateNameById.set(id, t.name);
    } catch { /* deleted/inaccessible template — fall back to generic title */ }
  }

  const drafts = generateBlockOccurrences(block, assignments, templateNameById);
  await materializeOccurrences(drafts.map(d => ({
    scheduled_date: d.scheduled_date,
    sport_id: d.sport_id,
    template_id: d.template_id,
    block_id: block.id,
    block_assignment_id: d.block_assignment_id,
    source_type: 'block' as const,
    title: d.title,
    planned_duration_min: d.planned_duration_min,
  })), input.conflict_policy);

  for (const p of input.progression ?? []) {
    await createBlockProgression(block.id, p.exercise_id, p.progression_type, input.duration_weeks, p.params, p.rows);
  }

  return block;
}

interface OccurrenceDraft {
  scheduled_date: string;
  sport_id?: string | null;
  template_id?: string | null;
  block_id?: string | null;
  block_assignment_id?: string | null;
  series_id?: string | null;
  source_type: ScheduledWorkout['source_type'];
  title: string;
  planned_duration_min?: number | null;
}

/** Inserts a batch of draft occurrences, applying the conflict policy per date. */
export async function materializeOccurrences(drafts: OccurrenceDraft[], policy: ConflictPolicy): Promise<void> {
  const byDate = new Map<string, OccurrenceDraft[]>();
  for (const d of drafts) byDate.set(d.scheduled_date, [...(byDate.get(d.scheduled_date) ?? []), d]);

  const toInsert: OccurrenceDraft[] = [];
  for (const [date, ds] of byDate) {
    const existing = await repo.findExistingOnDate(date);
    const action = resolveConflict(existing.length, policy);
    if (action === 'skip') continue;
    if (action === 'overwriteThenInsert') {
      for (const ex of existing) await repo.deleteScheduledWorkout(ex.id);
    }
    toInsert.push(...ds);
  }
  if (toInsert.length) {
    await repo.createScheduledWorkouts(toInsert.map((d, i) => ({ ...d, order_index: i })));
  }
}

// ── single template → scheduled occurrences (spec §5) ────────

function recurrenceIntervalWeeks(input: NewWorkoutFromTemplateInput): number {
  if (input.recurrence === 'biweekly') return 2;
  if (input.recurrence === 'every_n_weeks') return Math.max(1, input.recurrence_interval ?? 1);
  return 1;
}

/** Creates a (optionally recurring) scheduled occurrence from a template, honoring the conflict policy. */
export async function createFromTemplateWithSchedule(input: NewWorkoutFromTemplateInput, templateName: string): Promise<void> {
  if (input.recurrence === 'once' || !input.weekdays?.length) {
    await materializeOccurrences([{
      scheduled_date: input.start_date, sport_id: input.sport_id ?? null, template_id: input.template_id,
      source_type: 'template', title: templateName,
    }], input.conflict_policy);
    return;
  }

  const endDate = input.end_date ?? addDaysStr(input.start_date, (input.duration_weeks ?? 1) * 7 - 1);
  const intervalWeeks = recurrenceIntervalWeeks(input);
  const series = await repo.createTrainingPlanSeries({
    name: templateName, source_type: 'template', template_id: input.template_id, sport_id: input.sport_id ?? null,
    start_date: input.start_date, end_date: endDate, recurrence_interval: intervalWeeks,
    days_of_week: input.weekdays, conflict_policy: input.conflict_policy,
  });

  const startWeek = startOfWeekStr(input.start_date);
  const drafts: { scheduled_date: string; sport_id: string | null; template_id: string; series_id: string; source_type: 'series'; title: string }[] = [];
  let cursor = startWeek;
  let weekOffset = 0;
  while (cursor <= endDate) {
    for (const weekday of input.weekdays) {
      const date = addDaysStr(cursor, weekday - 1);
      if (date >= input.start_date && date <= endDate) {
        drafts.push({ scheduled_date: date, sport_id: input.sport_id ?? null, template_id: input.template_id, series_id: series.id, source_type: 'series', title: templateName });
      }
    }
    weekOffset += intervalWeeks;
    cursor = addDaysStr(startWeek, weekOffset * 7);
  }
  await materializeOccurrences(drafts, input.conflict_policy);
}

// ── edit / move / delete scope (spec §3.4/§7.7/§17.4/§17.5) ──

export async function moveOccurrence(id: string, newDate: string, orderIndex: number): Promise<ScheduledWorkout> {
  // Drag & drop always moves a single occurrence (v1 per spec §3.4) and flags it as an override.
  return repo.moveScheduledWorkout(id, newDate, orderIndex);
}

export async function deleteOccurrence(workout: ScheduledWorkout, scope: EditScope): Promise<void> {
  if (scope === 'this' || (!workout.block_id && !workout.series_id)) {
    await repo.deleteScheduledWorkout(workout.id);
    return;
  }
  if (workout.block_id) {
    if (scope === 'all') {
      await repo.deleteScheduledWorkoutsByBlock(workout.block_id);
      await repo.deleteTrainingBlock(workout.block_id);
    } else {
      await repo.deleteScheduledWorkoutsByBlock(workout.block_id, workout.scheduled_date);
    }
    return;
  }
  if (workout.series_id) {
    await repo.deleteTrainingPlanSeries(workout.series_id, scope === 'all' ? 'all' : 'futureOnly');
  }
}

export async function updateOccurrence(workout: ScheduledWorkout, patch: Partial<ScheduledWorkout>, scope: EditScope): Promise<void> {
  if (scope === 'this' || (!workout.block_id && !workout.series_id)) {
    await repo.updateScheduledWorkout(workout.id, { ...patch, is_override: true });
    return;
  }
  // "Ten i przyszłe" / "Cały blok" — apply the same patch to every not-yet-completed
  // occurrence in the block/series, optionally restricted to today-or-later.
  const fromDate = scope === 'all' ? undefined : workout.scheduled_date;
  const horizon = addDaysStr(todayStr(), 365);
  const start = fromDate ?? workout.scheduled_date;
  const all = await repo.listScheduledWorkouts(start, horizon);
  const targets = all.filter(w =>
    w.status === 'planned' &&
    (workout.block_id ? w.block_id === workout.block_id : w.series_id === workout.series_id)
  );
  for (const t of targets) {
    await repo.updateScheduledWorkout(t.id, patch);
  }
}
