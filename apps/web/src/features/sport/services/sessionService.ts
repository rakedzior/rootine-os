/** Sport — active session lifecycle: start (from template or manual), per-set checkoff with a
 * DB-persisted rest timer (resumable after a page reload), and completion (spec §10/"Aktywna sesja"). */
import * as repo from './sportRepository';
import * as records from './recordsService';
import type { ScheduledWorkout, SessionSet, TrainingSession, TrainingSessionFull, WorkoutTemplateFull } from '../types';

export const DEFAULT_REST_SECONDS = 90;

export function resolveRestSeconds(setRest?: number | null, exerciseRest?: number | null): number {
  return setRest ?? exerciseRest ?? DEFAULT_REST_SECONDS;
}

export async function startSessionFromTemplate(template: WorkoutTemplateFull, scheduledWorkout: ScheduledWorkout | null): Promise<TrainingSessionFull> {
  const session = await repo.createSession({
    scheduled_workout_id: scheduledWorkout?.id ?? null,
    template_id: template.id,
    sport_id: template.sport_id,
    title: template.name,
  });
  if (scheduledWorkout) {
    await repo.updateScheduledWorkout(scheduledWorkout.id, { status: 'in_progress' });
  }
  const exerciseRows = await repo.createSessionExercises(
    session.id,
    template.exercises.map((e, i) => ({ exercise_id: e.exercise_id, name_snapshot: e.name_snapshot, order_index: e.order_index ?? i, notes: e.notes })),
  );
  const setInputs: Omit<SessionSet, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>[] = [];
  template.exercises.forEach((e, ei) => {
    const sessionExercise = exerciseRows[ei];
    e.sets.forEach(s => setInputs.push({
      session_exercise_id: sessionExercise.id, set_index: s.set_index, set_type: s.set_type,
      target_weight_kg: s.target_weight_kg, target_reps_min: s.target_reps_min, target_reps_max: s.target_reps_max,
      target_rir: s.target_rir, target_rpe: s.target_rpe,
      actual_weight_kg: null, actual_reps: null, actual_rir: null, actual_rpe: null,
      completed: false, completed_at: null, notes: null,
      rest_started_at: null, rest_duration_seconds: s.rest_seconds, rest_completed: false,
    }));
  });
  await repo.createSessionSets(setInputs);
  return repo.getSessionFull(session.id);
}

export async function startManualSession(title: string, sportId: string | null, scheduledWorkout: ScheduledWorkout | null): Promise<TrainingSessionFull> {
  const session = await repo.createSession({
    scheduled_workout_id: scheduledWorkout?.id ?? null, sport_id: sportId, title,
  });
  if (scheduledWorkout) {
    await repo.updateScheduledWorkout(scheduledWorkout.id, { status: 'in_progress' });
  }
  return repo.getSessionFull(session.id);
}

export async function addManualExercise(sessionId: string, name: string, orderIndex: number): Promise<void> {
  await repo.createSessionExercises(sessionId, [{ name_snapshot: name, order_index: orderIndex }]);
}

export async function addManualSet(sessionExerciseId: string, setIndex: number): Promise<SessionSet> {
  const [created] = await repo.createSessionSets([{
    session_exercise_id: sessionExerciseId, set_index: setIndex, set_type: 'working',
    target_weight_kg: null, target_reps_min: null, target_reps_max: null, target_rir: null, target_rpe: null,
    actual_weight_kg: null, actual_reps: null, actual_rir: null, actual_rpe: null,
    completed: false, completed_at: null, notes: null,
    rest_started_at: null, rest_duration_seconds: null, rest_completed: false,
  }]);
  return created;
}

/** Checks a set off: persists the actual values + starts its rest timer. */
export async function checkSet(
  setId: string,
  values: { weight?: number | null; reps?: number | null; rir?: number | null; rpe?: number | null },
  restSeconds: number,
): Promise<SessionSet> {
  return repo.updateSessionSet(setId, {
    completed: true, completed_at: new Date().toISOString(),
    actual_weight_kg: values.weight ?? null, actual_reps: values.reps ?? null,
    actual_rir: values.rir ?? null, actual_rpe: values.rpe ?? null,
    rest_started_at: new Date().toISOString(), rest_duration_seconds: restSeconds, rest_completed: false,
  });
}

/** Unchecks a set — per spec, this only stops the rest timer if it belonged to this set (caller already knows that). */
export async function uncheckSet(setId: string): Promise<SessionSet> {
  return repo.updateSessionSet(setId, { completed: false, completed_at: null, rest_started_at: null, rest_completed: true });
}

export async function editSetValues(setId: string, patch: Partial<Pick<SessionSet, 'actual_weight_kg' | 'actual_reps' | 'actual_rir' | 'actual_rpe' | 'notes'>>): Promise<SessionSet> {
  return repo.updateSessionSet(setId, patch);
}

export function skipRest(setId: string): Promise<SessionSet> {
  return repo.updateSessionSet(setId, { rest_completed: true });
}

export function adjustRest(set: SessionSet, deltaSeconds: number): Promise<SessionSet> {
  const next = Math.max(0, (set.rest_duration_seconds ?? DEFAULT_REST_SECONDS) + deltaSeconds);
  return repo.updateSessionSet(set.id, { rest_duration_seconds: next });
}

/** Seconds left on a set's rest timer right now (0 once elapsed or never started). */
export function remainingRestSeconds(set: SessionSet): number {
  if (!set.rest_started_at || set.rest_completed || !set.rest_duration_seconds) return 0;
  const elapsed = (Date.now() - new Date(set.rest_started_at).getTime()) / 1000;
  return Math.max(0, Math.round(set.rest_duration_seconds - elapsed));
}

export interface SessionSummaryInput {
  notes?: string | null;
  perceived_effort?: number | null;
  energy_before?: number | null;
  energy_during?: number | null;
  motivation?: number | null;
  soreness?: number | null;
  wellbeing?: number | null;
  sleep_hours?: number | null;
  total_distance_km?: number | null;
  avg_pace_sec_per_km?: number | null;
}

export async function completeSession(sessionId: string, summary: SessionSummaryInput): Promise<TrainingSession> {
  const full = await repo.getSessionFull(sessionId);
  const startedAt = full.started_at ? new Date(full.started_at).getTime() : Date.now();
  const endedAt = Date.now();
  const totalVolumeKg = full.exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) =>
    s + (set.completed ? (set.actual_weight_kg ?? 0) * (set.actual_reps ?? 0) : 0), 0), 0);

  const updated = await repo.updateSession(sessionId, {
    status: 'completed',
    ended_at: new Date(endedAt).toISOString(),
    duration_min: Math.max(1, Math.round((endedAt - startedAt) / 60000)),
    total_volume_kg: totalVolumeKg || null,
    ...summary,
  });

  if (full.scheduled_workout_id) {
    await repo.updateScheduledWorkout(full.scheduled_workout_id, { status: 'completed' });
  }

  await records.checkAndUpdateRecordsForSession(full);
  return updated;
}

export async function cancelSession(sessionId: string): Promise<void> {
  const full = await repo.getSessionFull(sessionId);
  await repo.updateSession(sessionId, { status: 'cancelled', ended_at: new Date().toISOString() });
  if (full.scheduled_workout_id) {
    await repo.updateScheduledWorkout(full.scheduled_workout_id, { status: 'planned' });
  }
}
