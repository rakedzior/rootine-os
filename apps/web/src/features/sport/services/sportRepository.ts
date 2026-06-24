import { supabase } from '@/lib/supabase';
import type {
  Sport, Exercise, WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateSet, WorkoutTemplateFull,
  TrainingBlock, TrainingBlockDayAssignment, TrainingPlanSeries, ScheduledWorkout,
  ProgressionRule, ProgressionTarget, TrainingSession, SessionExercise, SessionSet, TrainingSessionFull,
  PersonalRecord,
} from '../types';

export async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ── sports ───────────────────────────────────────────────────

export async function listSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from('sports').select('*').is('deleted_at', null).order('sort_order');
  if (error) throw error;
  return (data ?? []) as Sport[];
}

export async function createSport(name: string, opts: { icon_key?: string; color_token?: string } = {}): Promise<Sport> {
  const user_id = await uid();
  const { data, error } = await supabase.from('sports').insert({ user_id, name, ...opts }).select('*').single();
  if (error) throw error;
  return data as Sport;
}

export async function ensureSport(name: string): Promise<Sport> {
  const existing = (await listSports()).find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  return createSport(name);
}

export async function updateSport(id: string, patch: Partial<Sport>): Promise<Sport> {
  const { data, error } = await supabase.from('sports').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Sport;
}

export async function deleteSport(id: string): Promise<void> {
  const { error } = await supabase.from('sports').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ── exercises ────────────────────────────────────────────────

export async function listExercises(opts: { sportId?: string; search?: string } = {}): Promise<Exercise[]> {
  let q = supabase.from('exercises').select('*').is('deleted_at', null).eq('is_archived', false).order('name');
  if (opts.sportId) q = q.eq('sport_id', opts.sportId);
  if (opts.search) q = q.ilike('name', `%${opts.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Exercise[];
}

export async function createExercise(input: Partial<Exercise> & { name: string }): Promise<Exercise> {
  const user_id = await uid();
  const { data, error } = await supabase.from('exercises').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as Exercise;
}

export async function updateExercise(id: string, patch: Partial<Exercise>): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Exercise;
}

// ── workout templates ───────────────────────────────────────

export async function listTemplates(): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates').select('*').is('deleted_at', null).eq('is_archived', false)
    .order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkoutTemplate[];
}

export async function getTemplateFull(id: string): Promise<WorkoutTemplateFull> {
  const { data: template, error: tErr } = await supabase.from('workout_templates').select('*').eq('id', id).single();
  if (tErr) throw tErr;
  const { data: exs, error: eErr } = await supabase
    .from('workout_template_exercises').select('*').eq('template_id', id).is('deleted_at', null).order('order_index');
  if (eErr) throw eErr;
  const exercises = (exs ?? []) as WorkoutTemplateExercise[];
  const exerciseIds = exercises.map(e => e.id);
  let sets: WorkoutTemplateSet[] = [];
  if (exerciseIds.length) {
    const { data: setRows, error: sErr } = await supabase
      .from('workout_template_sets').select('*').in('template_exercise_id', exerciseIds).is('deleted_at', null).order('set_index');
    if (sErr) throw sErr;
    sets = (setRows ?? []) as WorkoutTemplateSet[];
  }
  return {
    ...(template as WorkoutTemplate),
    exercises: exercises.map(e => ({ ...e, sets: sets.filter(s => s.template_exercise_id === e.id) })),
  };
}

export async function createTemplate(input: Partial<WorkoutTemplate> & { name: string }): Promise<WorkoutTemplate> {
  const user_id = await uid();
  const { data, error } = await supabase.from('workout_templates').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as WorkoutTemplate;
}

export async function updateTemplate(id: string, patch: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> {
  const { data, error } = await supabase.from('workout_templates').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as WorkoutTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('workout_templates').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function duplicateTemplate(id: string): Promise<WorkoutTemplate> {
  const full = await getTemplateFull(id);
  const copy = await createTemplate({
    sport_id: full.sport_id, name: `${full.name} (kopia)`, subtitle: full.subtitle, description: full.description,
    estimated_duration_min: full.estimated_duration_min, color_token: full.color_token,
  });
  await replaceTemplateExercises(copy.id, full.exercises.map(e => ({
    exercise_id: e.exercise_id, name_snapshot: e.name_snapshot, order_index: e.order_index,
    rest_seconds: e.rest_seconds, notes: e.notes, sets: e.sets,
  })));
  return copy;
}

export interface TemplateExerciseInput {
  exercise_id?: string | null;
  name_snapshot: string;
  order_index: number;
  rest_seconds?: number | null;
  notes?: string | null;
  sets: Omit<WorkoutTemplateSet, 'id' | 'user_id' | 'template_exercise_id' | 'created_at' | 'updated_at' | 'deleted_at'>[];
}

/** Replaces every exercise/set on a template — simplest consistent model for a template editor "save". */
export async function replaceTemplateExercises(templateId: string, exercises: TemplateExerciseInput[]): Promise<void> {
  const user_id = await uid();
  const { data: oldExs, error: oldErr } = await supabase.from('workout_template_exercises').select('id').eq('template_id', templateId);
  if (oldErr) throw oldErr;
  const oldIds = (oldExs ?? []).map(e => e.id);
  if (oldIds.length) {
    const { error: delSetsErr } = await supabase.from('workout_template_sets').delete().in('template_exercise_id', oldIds);
    if (delSetsErr) throw delSetsErr;
    const { error: delExErr } = await supabase.from('workout_template_exercises').delete().eq('template_id', templateId);
    if (delExErr) throw delExErr;
  }
  for (const ex of exercises) {
    const { data: created, error: createErr } = await supabase
      .from('workout_template_exercises')
      .insert({ user_id, template_id: templateId, exercise_id: ex.exercise_id ?? null, name_snapshot: ex.name_snapshot, order_index: ex.order_index, rest_seconds: ex.rest_seconds ?? null, notes: ex.notes ?? null })
      .select('*').single();
    if (createErr) throw createErr;
    if (ex.sets.length) {
      const { error: setsErr } = await supabase.from('workout_template_sets').insert(
        ex.sets.map(s => ({ ...s, user_id, template_exercise_id: (created as WorkoutTemplateExercise).id }))
      );
      if (setsErr) throw setsErr;
    }
  }
}

// ── scheduled workouts ───────────────────────────────────────

export async function listScheduledWorkouts(startDate: string, endDate: string): Promise<ScheduledWorkout[]> {
  const { data, error } = await supabase
    .from('scheduled_workouts').select('*').is('deleted_at', null)
    .gte('scheduled_date', startDate).lte('scheduled_date', endDate)
    .order('scheduled_date').order('order_index');
  if (error) throw error;
  return (data ?? []) as ScheduledWorkout[];
}

export type NewScheduledWorkoutRow = Omit<ScheduledWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>;

export async function createScheduledWorkout(input: Partial<NewScheduledWorkoutRow> & { scheduled_date: string; title: string }): Promise<ScheduledWorkout> {
  const user_id = await uid();
  const { data, error } = await supabase.from('scheduled_workouts').insert({ user_id, source_type: 'manual', status: 'planned', order_index: 0, is_override: false, metadata: {}, ...input }).select('*').single();
  if (error) throw error;
  return data as ScheduledWorkout;
}

export async function createScheduledWorkouts(inputs: (Partial<NewScheduledWorkoutRow> & { scheduled_date: string; title: string })[]): Promise<ScheduledWorkout[]> {
  if (!inputs.length) return [];
  const user_id = await uid();
  const { data, error } = await supabase
    .from('scheduled_workouts')
    .insert(inputs.map(i => ({ user_id, source_type: 'manual', status: 'planned', order_index: 0, is_override: false, metadata: {}, ...i })))
    .select('*');
  if (error) throw error;
  return (data ?? []) as ScheduledWorkout[];
}

export async function updateScheduledWorkout(id: string, patch: Partial<ScheduledWorkout>): Promise<ScheduledWorkout> {
  const { data, error } = await supabase.from('scheduled_workouts').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as ScheduledWorkout;
}

export async function moveScheduledWorkout(id: string, scheduledDate: string, orderIndex: number): Promise<ScheduledWorkout> {
  return updateScheduledWorkout(id, { scheduled_date: scheduledDate, order_index: orderIndex, is_override: true });
}

export async function deleteScheduledWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('scheduled_workouts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteScheduledWorkoutsByBlock(blockId: string, fromDate?: string): Promise<void> {
  let q = supabase.from('scheduled_workouts').update({ deleted_at: new Date().toISOString() }).eq('block_id', blockId).eq('status', 'planned');
  if (fromDate) q = q.gte('scheduled_date', fromDate);
  const { error } = await q;
  if (error) throw error;
}

export async function findExistingOnDate(scheduledDate: string): Promise<ScheduledWorkout[]> {
  const { data, error } = await supabase.from('scheduled_workouts').select('*').is('deleted_at', null).eq('scheduled_date', scheduledDate);
  if (error) throw error;
  return (data ?? []) as ScheduledWorkout[];
}

// ── training blocks ──────────────────────────────────────────

export async function listTrainingBlocks(): Promise<TrainingBlock[]> {
  const { data, error } = await supabase.from('training_blocks').select('*').is('deleted_at', null).order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingBlock[];
}

export async function getTrainingBlock(id: string): Promise<TrainingBlock> {
  const { data, error } = await supabase.from('training_blocks').select('*').eq('id', id).single();
  if (error) throw error;
  return data as TrainingBlock;
}

export async function createTrainingBlock(input: Partial<TrainingBlock> & { name: string; start_date: string; end_date: string; duration_weeks: number }): Promise<TrainingBlock> {
  const user_id = await uid();
  const { data, error } = await supabase.from('training_blocks').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as TrainingBlock;
}

export async function updateTrainingBlock(id: string, patch: Partial<TrainingBlock>): Promise<TrainingBlock> {
  const { data, error } = await supabase.from('training_blocks').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as TrainingBlock;
}

export async function deleteTrainingBlock(id: string): Promise<void> {
  const { error } = await supabase.from('training_blocks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function listDayAssignments(blockId: string): Promise<TrainingBlockDayAssignment[]> {
  const { data, error } = await supabase
    .from('training_block_day_assignments').select('*').eq('block_id', blockId).is('deleted_at', null)
    .order('weekday').order('order_index');
  if (error) throw error;
  return (data ?? []) as TrainingBlockDayAssignment[];
}

export async function createDayAssignments(blockId: string, rows: Omit<TrainingBlockDayAssignment, 'id' | 'user_id' | 'block_id' | 'created_at' | 'updated_at' | 'deleted_at'>[]): Promise<TrainingBlockDayAssignment[]> {
  if (!rows.length) return [];
  const user_id = await uid();
  const { data, error } = await supabase
    .from('training_block_day_assignments').insert(rows.map(r => ({ user_id, block_id: blockId, ...r }))).select('*');
  if (error) throw error;
  return (data ?? []) as TrainingBlockDayAssignment[];
}

// ── training plan series ─────────────────────────────────────

export async function listTrainingPlanSeries(): Promise<TrainingPlanSeries[]> {
  const { data, error } = await supabase.from('training_plan_series').select('*').is('deleted_at', null).order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingPlanSeries[];
}

export async function createTrainingPlanSeries(input: Partial<TrainingPlanSeries> & { name: string; start_date: string; end_date: string }): Promise<TrainingPlanSeries> {
  const user_id = await uid();
  const { data, error } = await supabase.from('training_plan_series').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as TrainingPlanSeries;
}

export async function deleteTrainingPlanSeries(id: string, scope: 'futureOnly' | 'all'): Promise<void> {
  const nowIso = new Date().toISOString();
  if (scope === 'all') {
    const { error } = await supabase.from('scheduled_workouts').update({ deleted_at: nowIso }).eq('series_id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('scheduled_workouts').update({ deleted_at: nowIso }).eq('series_id', id).eq('status', 'planned').gte('scheduled_date', today());
    if (error) throw error;
  }
  const { error: seriesErr } = await supabase.from('training_plan_series').update({ deleted_at: nowIso }).eq('id', id);
  if (seriesErr) throw seriesErr;
}

// ── progression ──────────────────────────────────────────────

export async function createProgressionRule(input: Partial<ProgressionRule> & { progression_type: ProgressionRule['progression_type'] }): Promise<ProgressionRule> {
  const user_id = await uid();
  const { data, error } = await supabase.from('progression_rules').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as ProgressionRule;
}

export async function listProgressionRulesForBlock(blockId: string): Promise<ProgressionRule[]> {
  const { data, error } = await supabase.from('progression_rules').select('*').eq('block_id', blockId).is('deleted_at', null);
  if (error) throw error;
  return (data ?? []) as ProgressionRule[];
}

export async function createProgressionTargets(rows: Omit<ProgressionTarget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>[]): Promise<ProgressionTarget[]> {
  if (!rows.length) return [];
  const user_id = await uid();
  const { data, error } = await supabase.from('progression_targets').insert(rows.map(r => ({ user_id, ...r }))).select('*');
  if (error) throw error;
  return (data ?? []) as ProgressionTarget[];
}

export async function updateProgressionTarget(id: string, patch: Partial<ProgressionTarget>): Promise<ProgressionTarget> {
  const { data, error } = await supabase.from('progression_targets').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as ProgressionTarget;
}

export async function listProgressionTargets(blockId: string, exerciseId: string): Promise<ProgressionTarget[]> {
  const { data, error } = await supabase
    .from('progression_targets').select('*').eq('block_id', blockId).eq('exercise_id', exerciseId).is('deleted_at', null).order('week_number');
  if (error) throw error;
  return (data ?? []) as ProgressionTarget[];
}

// ── training sessions ────────────────────────────────────────

export async function createSession(input: Partial<TrainingSession> & { title: string }): Promise<TrainingSession> {
  const user_id = await uid();
  const { data, error } = await supabase.from('training_sessions').insert({ user_id, status: 'in_progress', started_at: new Date().toISOString(), ...input }).select('*').single();
  if (error) throw error;
  return data as TrainingSession;
}

export async function getSessionFull(id: string): Promise<TrainingSessionFull> {
  const { data: session, error: sErr } = await supabase.from('training_sessions').select('*').eq('id', id).single();
  if (sErr) throw sErr;
  const { data: exs, error: eErr } = await supabase.from('session_exercises').select('*').eq('session_id', id).is('deleted_at', null).order('order_index');
  if (eErr) throw eErr;
  const exercises = (exs ?? []) as SessionExercise[];
  const exerciseIds = exercises.map(e => e.id);
  let sets: SessionSet[] = [];
  if (exerciseIds.length) {
    const { data: setRows, error: setErr } = await supabase.from('session_sets').select('*').in('session_exercise_id', exerciseIds).is('deleted_at', null).order('set_index');
    if (setErr) throw setErr;
    sets = (setRows ?? []) as SessionSet[];
  }
  return { ...(session as TrainingSession), exercises: exercises.map(e => ({ ...e, sets: sets.filter(s => s.session_exercise_id === e.id) })) };
}

export async function updateSession(id: string, patch: Partial<TrainingSession>): Promise<TrainingSession> {
  const { data, error } = await supabase.from('training_sessions').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as TrainingSession;
}

export async function listSessions(opts: { limit?: number; sportId?: string; templateId?: string; from?: string; to?: string } = {}): Promise<TrainingSession[]> {
  let q = supabase.from('training_sessions').select('*').is('deleted_at', null).order('started_at', { ascending: false });
  if (opts.sportId) q = q.eq('sport_id', opts.sportId);
  if (opts.templateId) q = q.eq('template_id', opts.templateId);
  if (opts.from) q = q.gte('started_at', opts.from);
  if (opts.to) q = q.lte('started_at', opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TrainingSession[];
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('training_sessions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function createSessionExercises(sessionId: string, exercises: { exercise_id?: string | null; name_snapshot: string; order_index: number; notes?: string | null }[]): Promise<SessionExercise[]> {
  if (!exercises.length) return [];
  const user_id = await uid();
  const { data, error } = await supabase.from('session_exercises').insert(exercises.map(e => ({ user_id, session_id: sessionId, exercise_id: e.exercise_id ?? null, name_snapshot: e.name_snapshot, order_index: e.order_index, notes: e.notes ?? null }))).select('*');
  if (error) throw error;
  return (data ?? []) as SessionExercise[];
}

export async function createSessionSets(sets: Omit<SessionSet, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>[]): Promise<SessionSet[]> {
  if (!sets.length) return [];
  const user_id = await uid();
  const { data, error } = await supabase.from('session_sets').insert(sets.map(s => ({ user_id, ...s }))).select('*');
  if (error) throw error;
  return (data ?? []) as SessionSet[];
}

export async function updateSessionSet(id: string, patch: Partial<SessionSet>): Promise<SessionSet> {
  const { data, error } = await supabase.from('session_sets').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as SessionSet;
}

// ── personal records ─────────────────────────────────────────

export async function listPersonalRecords(opts: { limit?: number; exerciseId?: string; sportId?: string } = {}): Promise<PersonalRecord[]> {
  let q = supabase.from('personal_records').select('*').is('deleted_at', null).order('occurred_on', { ascending: false });
  if (opts.exerciseId) q = q.eq('exercise_id', opts.exerciseId);
  if (opts.sportId) q = q.eq('sport_id', opts.sportId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PersonalRecord[];
}

export async function createPersonalRecord(input: Partial<PersonalRecord> & { title: string; metric_type: PersonalRecord['metric_type']; occurred_on: string }): Promise<PersonalRecord> {
  const user_id = await uid();
  const { data, error } = await supabase.from('personal_records').insert({ user_id, ...input }).select('*').single();
  if (error) throw error;
  return data as PersonalRecord;
}

export async function updatePersonalRecord(id: string, patch: Partial<PersonalRecord>): Promise<PersonalRecord> {
  const { data, error } = await supabase.from('personal_records').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as PersonalRecord;
}

export async function deletePersonalRecord(id: string): Promise<void> {
  const { error } = await supabase.from('personal_records').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
