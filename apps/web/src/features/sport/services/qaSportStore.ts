import { QA_USER_ID } from '@/features/auth/qaAuth';
import { SPORTS } from '../catalog';
import type {
  Exercise, NewCycleInput, ScheduledWorkout, Sport, TrainingCycle, TrainingCyclePhase, TrainingCycleWeek,
  TrainingPlanSeries,
  WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateFull, WorkoutTemplateSet,
} from '../types';
import type { TemplateExerciseInput } from './sportRepository';

interface QaTemplateExercise extends WorkoutTemplateExercise {
  sets: WorkoutTemplateSet[];
}

interface QaSportStore {
  sports: Sport[];
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  templateExercises: Record<string, QaTemplateExercise[]>;
  cycles: TrainingCycle[];
  cycleWeeks: Record<string, TrainingCycleWeek[]>;
  cyclePhases: Record<string, TrainingCyclePhase[]>;
  scheduledWorkouts: ScheduledWorkout[];
  trainingPlanSeries: TrainingPlanSeries[];
}

const STORE_KEY = 'rootine.qa.sport.v1';
let memoryStore: QaSportStore | null = null;

function now(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const cryptoId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `qa-${prefix}-${cryptoId}`;
}

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function defaultSports(): Sport[] {
  return SPORTS.map((sport, index) => ({
    id: `qa-sport-${index + 1}`,
    user_id: QA_USER_ID,
    name: sport.key,
    icon_key: sport.emoji,
    color_token: 'blue',
    sort_order: index,
    is_archived: false,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
    deleted_at: null,
  }));
}

function emptyStore(): QaSportStore {
  return {
    sports: defaultSports(),
    exercises: [],
    templates: [],
    templateExercises: {},
    cycles: [],
    cycleWeeks: {},
    cyclePhases: {},
    scheduledWorkouts: [],
    trainingPlanSeries: [],
  };
}

function readStore(): QaSportStore {
  const localStorage = storage();
  if (!localStorage) {
    memoryStore ??= emptyStore();
    return memoryStore;
  }

  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return emptyStore();

  try {
    const parsed = JSON.parse(raw) as Partial<QaSportStore>;
    return {
      sports: parsed.sports?.length ? parsed.sports : defaultSports(),
      exercises: parsed.exercises ?? [],
      templates: parsed.templates ?? [],
      templateExercises: parsed.templateExercises ?? {},
      cycles: parsed.cycles ?? [],
      cycleWeeks: parsed.cycleWeeks ?? {},
      cyclePhases: parsed.cyclePhases ?? {},
      scheduledWorkouts: parsed.scheduledWorkouts ?? [],
      trainingPlanSeries: parsed.trainingPlanSeries ?? [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: QaSportStore): void {
  const localStorage = storage();
  if (!localStorage) {
    memoryStore = store;
    return;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function listQaSports(): Sport[] {
  return readStore().sports.filter((sport) => !sport.deleted_at && !sport.is_archived);
}

export function createQaSport(name: string, opts: { icon_key?: string; color_token?: string } = {}): Sport {
  const store = readStore();
  const row: Sport = {
    id: makeId('sport'),
    user_id: QA_USER_ID,
    name,
    icon_key: opts.icon_key ?? null,
    color_token: opts.color_token ?? null,
    sort_order: store.sports.length,
    is_archived: false,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
  store.sports.push(row);
  writeStore(store);
  return row;
}

export function listQaExercises(): Exercise[] {
  return readStore().exercises.filter((exercise) => !exercise.deleted_at && !exercise.is_archived);
}

export function createQaExercise(input: Partial<Exercise> & { name: string }): Exercise {
  const store = readStore();
  const row: Exercise = {
    id: makeId('exercise'),
    user_id: QA_USER_ID,
    sport_id: input.sport_id ?? null,
    name: input.name,
    category: input.category ?? null,
    primary_muscle_group: input.primary_muscle_group ?? null,
    secondary_muscle_groups: input.secondary_muscle_groups ?? null,
    equipment: input.equipment ?? null,
    notes: input.notes ?? null,
    is_archived: false,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
  store.exercises.push(row);
  writeStore(store);
  return row;
}

export function listQaTemplates(): WorkoutTemplate[] {
  return readStore().templates.filter((template) => !template.deleted_at && !template.is_archived);
}

export function createQaTemplate(input: Partial<WorkoutTemplate> & { name: string }): WorkoutTemplate {
  const store = readStore();
  const row: WorkoutTemplate = {
    id: makeId('template'),
    user_id: QA_USER_ID,
    sport_id: input.sport_id ?? null,
    name: input.name,
    subtitle: input.subtitle ?? null,
    description: input.description ?? null,
    estimated_duration_min: input.estimated_duration_min ?? null,
    color_token: input.color_token ?? null,
    sort_order: store.templates.length,
    is_favorite: input.is_favorite ?? false,
    is_archived: false,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
  store.templates.push(row);
  writeStore(store);
  return row;
}

export function updateQaTemplate(id: string, patch: Partial<WorkoutTemplate>): WorkoutTemplate {
  const store = readStore();
  const index = store.templates.findIndex((template) => template.id === id);
  if (index < 0) throw new Error('Nie znaleziono szablonu QA');
  const row = { ...store.templates[index], ...patch, updated_at: now() };
  store.templates[index] = row;
  writeStore(store);
  return row;
}

export function deleteQaTemplate(id: string): void {
  const store = readStore();
  store.templates = store.templates.map((template) => template.id === id ? { ...template, deleted_at: now() } : template);
  writeStore(store);
}

export function getQaTemplateFull(id: string): WorkoutTemplateFull {
  const template = readStore().templates.find((row) => row.id === id && !row.deleted_at);
  if (!template) throw new Error('Nie znaleziono szablonu QA');
  return { ...template, exercises: readStore().templateExercises[id] ?? [] };
}

export function replaceQaTemplateExercises(templateId: string, exercises: TemplateExerciseInput[]): void {
  const store = readStore();
  store.templateExercises[templateId] = exercises.map((exercise) => {
    const templateExerciseId = makeId('template-exercise');
    return {
      id: templateExerciseId,
      user_id: QA_USER_ID,
      template_id: templateId,
      exercise_id: exercise.exercise_id ?? null,
      name_snapshot: exercise.name_snapshot,
      order_index: exercise.order_index,
      rest_seconds: exercise.rest_seconds ?? null,
      notes: exercise.notes ?? null,
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
      sets: exercise.sets.map((set, setIndex) => ({
        id: makeId('template-set'),
        user_id: QA_USER_ID,
        template_exercise_id: templateExerciseId,
        set_index: set.set_index ?? setIndex + 1,
        set_type: set.set_type,
        target_reps_min: set.target_reps_min ?? null,
        target_reps_max: set.target_reps_max ?? null,
        target_weight_kg: set.target_weight_kg ?? null,
        target_rir: set.target_rir ?? null,
        target_rpe: set.target_rpe ?? null,
        tempo: set.tempo ?? null,
        rest_seconds: set.rest_seconds ?? null,
        notes: set.notes ?? null,
        created_at: now(),
        updated_at: now(),
        deleted_at: null,
      })),
    } satisfies QaTemplateExercise;
  });
  const templateIndex = store.templates.findIndex((template) => template.id === templateId);
  if (templateIndex >= 0) store.templates[templateIndex] = { ...store.templates[templateIndex], updated_at: now() };
  writeStore(store);
}

function addDaysStr(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function listQaCycles(): TrainingCycle[] {
  return readStore().cycles.filter((cycle) => cycle.status !== 'archived');
}

export function getQaCycle(id: string): TrainingCycle {
  const cycle = readStore().cycles.find((row) => row.id === id);
  if (!cycle) throw new Error('Nie znaleziono cyklu QA');
  return cycle;
}

export function createQaCycle(input: NewCycleInput): TrainingCycle {
  const store = readStore();
  const cycle: TrainingCycle = {
    id: makeId('cycle'),
    user_id: QA_USER_ID,
    name: input.name,
    goal: input.goal,
    status: 'planned',
    start_date: input.start_date,
    end_date: addDaysStr(input.start_date, input.duration_weeks * 7 - 1),
    duration_weeks: input.duration_weeks,
    intensity: input.intensity ?? null,
    trainings_per_week: input.trainings_per_week ?? null,
    active_sport_ids: input.active_sport_ids ?? [],
    notes: input.notes ?? null,
    created_at: now(),
    updated_at: now(),
    archived_at: null,
  };
  store.cycles.push(cycle);
  writeStore(store);
  return cycle;
}

export function updateQaCycle(id: string, patch: Partial<TrainingCycle>): TrainingCycle {
  const store = readStore();
  const index = store.cycles.findIndex((cycle) => cycle.id === id);
  if (index < 0) throw new Error('Nie znaleziono cyklu QA');
  const cycle = { ...store.cycles[index], ...patch, updated_at: now() };
  store.cycles[index] = cycle;
  writeStore(store);
  return cycle;
}

export function deleteQaCycle(id: string): void {
  const store = readStore();
  store.cycles = store.cycles.filter((cycle) => cycle.id !== id);
  delete store.cycleWeeks[id];
  delete store.cyclePhases[id];
  writeStore(store);
}

export function listQaCyclePhases(cycleId: string): TrainingCyclePhase[] {
  return readStore().cyclePhases[cycleId] ?? [];
}

export function createQaCyclePhase(input: Omit<TrainingCyclePhase, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>): TrainingCyclePhase {
  const store = readStore();
  const phase: TrainingCyclePhase = {
    id: makeId('cycle-phase'),
    user_id: QA_USER_ID,
    ...input,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
  store.cyclePhases[input.cycle_id] = [...(store.cyclePhases[input.cycle_id] ?? []), phase];
  writeStore(store);
  return phase;
}

export function deleteQaCyclePhase(id: string): void {
  const store = readStore();
  for (const cycleId of Object.keys(store.cyclePhases)) {
    store.cyclePhases[cycleId] = store.cyclePhases[cycleId].map((phase) =>
      phase.id === id ? { ...phase, deleted_at: now() } : phase,
    );
  }
  writeStore(store);
}

export function listQaCycleWeeks(cycleId: string): TrainingCycleWeek[] {
  return readStore().cycleWeeks[cycleId] ?? [];
}

export function createQaCycleWeeks(rows: Omit<TrainingCycleWeek, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): TrainingCycleWeek[] {
  if (!rows.length) return [];
  const store = readStore();
  const weeks = rows.map((row) => ({
    id: makeId('cycle-week'),
    user_id: QA_USER_ID,
    ...row,
    created_at: now(),
    updated_at: now(),
  }));
  const cycleId = rows[0].cycle_id;
  store.cycleWeeks[cycleId] = [...(store.cycleWeeks[cycleId] ?? []), ...weeks];
  writeStore(store);
  return weeks;
}

export function updateQaCycleWeek(id: string, patch: Partial<TrainingCycleWeek>): TrainingCycleWeek {
  const store = readStore();
  for (const cycleId of Object.keys(store.cycleWeeks)) {
    const index = store.cycleWeeks[cycleId].findIndex((week) => week.id === id);
    if (index >= 0) {
      const week = { ...store.cycleWeeks[cycleId][index], ...patch, updated_at: now() };
      store.cycleWeeks[cycleId][index] = week;
      writeStore(store);
      return week;
    }
  }
  throw new Error('Nie znaleziono tygodnia cyklu QA');
}

export function listQaScheduledWorkouts(startDate: string, endDate: string): ScheduledWorkout[] {
  return readStore().scheduledWorkouts
    .filter((workout) => !workout.deleted_at && workout.scheduled_date >= startDate && workout.scheduled_date <= endDate)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || a.order_index - b.order_index);
}

export function createQaScheduledWorkout(input: Partial<Omit<ScheduledWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { scheduled_date: string; title: string }): ScheduledWorkout {
  const store = readStore();
  const row: ScheduledWorkout = {
    id: makeId('scheduled-workout'),
    user_id: QA_USER_ID,
    scheduled_date: input.scheduled_date,
    order_index: input.order_index ?? store.scheduledWorkouts.filter((workout) => workout.scheduled_date === input.scheduled_date && !workout.deleted_at).length,
    sport_id: input.sport_id ?? null,
    template_id: input.template_id ?? null,
    block_id: input.block_id ?? null,
    block_assignment_id: input.block_assignment_id ?? null,
    series_id: input.series_id ?? null,
    source_type: input.source_type ?? 'manual',
    title: input.title,
    subtitle: input.subtitle ?? null,
    planned_duration_min: input.planned_duration_min ?? null,
    color_token: input.color_token ?? null,
    status: input.status ?? 'planned',
    is_override: input.is_override ?? false,
    original_scheduled_date: input.original_scheduled_date ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
  store.scheduledWorkouts.push(row);
  writeStore(store);
  return row;
}

export function createQaScheduledWorkouts(inputs: (Partial<Omit<ScheduledWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { scheduled_date: string; title: string })[]): ScheduledWorkout[] {
  return inputs.map((input) => createQaScheduledWorkout(input));
}

export function updateQaScheduledWorkout(id: string, patch: Partial<ScheduledWorkout>): ScheduledWorkout {
  const store = readStore();
  const index = store.scheduledWorkouts.findIndex((workout) => workout.id === id);
  if (index < 0) throw new Error('Nie znaleziono treningu QA');
  const row = { ...store.scheduledWorkouts[index], ...patch, updated_at: now() };
  store.scheduledWorkouts[index] = row;
  writeStore(store);
  return row;
}

export function deleteQaScheduledWorkout(id: string): void {
  const store = readStore();
  store.scheduledWorkouts = store.scheduledWorkouts.map((workout) => workout.id === id ? { ...workout, deleted_at: now() } : workout);
  writeStore(store);
}

export function findQaScheduledWorkoutsOnDate(scheduledDate: string): ScheduledWorkout[] {
  return readStore().scheduledWorkouts.filter((workout) => !workout.deleted_at && workout.scheduled_date === scheduledDate);
}

export function listQaTrainingPlanSeries(): TrainingPlanSeries[] {
  return readStore().trainingPlanSeries.filter((series) => !series.deleted_at);
}

export function createQaTrainingPlanSeries(input: Partial<TrainingPlanSeries> & { name: string; start_date: string; end_date: string }): TrainingPlanSeries {
  const store = readStore();
  const row: TrainingPlanSeries = {
    id: makeId('training-plan-series'),
    user_id: QA_USER_ID,
    name: input.name,
    source_type: input.source_type ?? 'template',
    template_id: input.template_id ?? null,
    sport_id: input.sport_id ?? null,
    manual_title: input.manual_title ?? null,
    start_date: input.start_date,
    end_date: input.end_date,
    recurrence_type: input.recurrence_type ?? 'weekly',
    recurrence_interval: input.recurrence_interval ?? 1,
    days_of_week: input.days_of_week ?? [],
    planned_duration_min: input.planned_duration_min ?? null,
    conflict_policy: input.conflict_policy ?? 'append',
    status: input.status ?? 'active',
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
  store.trainingPlanSeries.push(row);
  writeStore(store);
  return row;
}

export function deleteQaTrainingPlanSeries(id: string, scope: 'futureOnly' | 'all'): void {
  const store = readStore();
  const today = new Date().toISOString().split('T')[0];
  store.scheduledWorkouts = store.scheduledWorkouts.map((workout) => {
    if (workout.series_id !== id) return workout;
    if (scope === 'futureOnly' && workout.scheduled_date < today) return workout;
    return { ...workout, deleted_at: now() };
  });
  store.trainingPlanSeries = store.trainingPlanSeries.map((series) => series.id === id ? { ...series, deleted_at: now() } : series);
  writeStore(store);
}
