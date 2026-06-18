import { supabase } from '@/lib/supabase';
import type {
  Workout, WorkoutSet, BodyMeasurement, ReadinessDaily,
  NewWorkoutInput, NewWorkoutSetInput, NewBodyMeasurementInput, ReadinessPatch,
} from './types';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ── workouts ──────────────────────────────────────────────────────────────────

export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Workout[];
}

export async function fetchTodayWorkout(): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('date', today())
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Workout | null;
}

export async function insertWorkout(input: NewWorkoutInput): Promise<Workout> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, date: input.date ?? today(), name: input.name, type: input.type ?? null, status: input.status ?? 'planned' })
    .select('*')
    .single();
  if (error) throw error;
  return data as Workout;
}

export async function patchWorkout(id: string, patch: Partial<Workout>): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Workout;
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw error;
}

// ── workout_sets ──────────────────────────────────────────────────────────────

export async function fetchWorkoutSets(workoutId: string): Promise<WorkoutSet[]> {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('*')
    .eq('workout_id', workoutId)
    .order('set_no', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as WorkoutSet[]).map((r) => ({ ...r, weight: Number(r.weight), reps: Number(r.reps) }));
}

export async function insertWorkoutSet(input: NewWorkoutSetInput): Promise<WorkoutSet> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('workout_sets')
    .insert({ user_id: userId, ...input })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as WorkoutSet;
  return { ...r, weight: Number(r.weight), reps: Number(r.reps) };
}

export async function deleteWorkoutSet(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sets').delete().eq('id', id);
  if (error) throw error;
}

// ── body_measurements ─────────────────────────────────────────────────────────

export async function fetchBodyMeasurements(): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return ((data ?? []) as BodyMeasurement[]).map((r) => ({
    ...r,
    weight: r.weight != null ? Number(r.weight) : null,
    body_fat: r.body_fat != null ? Number(r.body_fat) : null,
    lean_mass: r.lean_mass != null ? Number(r.lean_mass) : null,
  }));
}

export async function insertBodyMeasurement(input: NewBodyMeasurementInput): Promise<BodyMeasurement> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({ user_id: userId, date: input.date ?? today(), weight: input.weight ?? null, body_fat: input.body_fat ?? null, lean_mass: input.lean_mass ?? null })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as BodyMeasurement;
  return { ...r, weight: r.weight != null ? Number(r.weight) : null, body_fat: r.body_fat != null ? Number(r.body_fat) : null, lean_mass: r.lean_mass != null ? Number(r.lean_mass) : null };
}

// ── readiness_daily ───────────────────────────────────────────────────────────

export async function fetchReadinessToday(): Promise<ReadinessDaily | null> {
  const { data, error } = await supabase
    .from('readiness_daily')
    .select('*')
    .eq('date', today())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as ReadinessDaily;
  return { ...r, sleep_h: r.sleep_h != null ? Number(r.sleep_h) : null, hrv_ms: r.hrv_ms != null ? Number(r.hrv_ms) : null };
}

export async function upsertReadinessToday(patch: ReadinessPatch): Promise<ReadinessDaily> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('readiness_daily')
    .upsert({ user_id: userId, date: today(), ...patch }, { onConflict: 'user_id,date' })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as ReadinessDaily;
  return { ...r, sleep_h: r.sleep_h != null ? Number(r.sleep_h) : null, hrv_ms: r.hrv_ms != null ? Number(r.hrv_ms) : null };
}
