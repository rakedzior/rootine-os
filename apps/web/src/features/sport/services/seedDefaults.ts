/** Sport — one-time per-user seeding of the sports/exercises catalog from
 * features/sport/catalog.ts, so the template/exercise pickers aren't empty
 * on a fresh account. Idempotent: only inserts names that don't exist yet. */
import { supabase } from '@/lib/supabase';
import { QA_AUTH_ENABLED } from '@/features/auth/qaAuth';
import * as repo from './sportRepository';
import { EXERCISE_CATALOG, MUSCLE_LABEL, SPORTS } from '../catalog';

export async function ensureDefaultSports(): Promise<void> {
  const existing = await repo.listSports();
  const known = new Set(existing.map(s => s.name.toLowerCase()));
  const missing = SPORTS.filter(s => !known.has(s.key.toLowerCase()));
  if (!missing.length) return;
  const user_id = await repo.uid();
  const { error } = await supabase.from('sports').insert(missing.map((s, i) => ({ user_id, name: s.key, sort_order: i })));
  if (error) throw error;
}

export async function ensureDefaultExercises(): Promise<void> {
  const [sports, existingExercises] = await Promise.all([repo.listSports(), repo.listExercises()]);
  const sportIdByName = new Map(sports.map(s => [s.name.toLowerCase(), s.id]));
  const knownExerciseNames = new Set(existingExercises.map(e => e.name.toLowerCase()));
  const missing = EXERCISE_CATALOG.filter(e => !knownExerciseNames.has(e.name.toLowerCase()));
  if (!missing.length) return;
  const user_id = await repo.uid();
  const { error } = await supabase.from('exercises').insert(missing.map(def => ({
    user_id,
    name: def.name,
    sport_id: sportIdByName.get(def.sport.toLowerCase()) ?? null,
    category: def.category,
    primary_muscle_group: def.primaryMuscles[0] ? MUSCLE_LABEL[def.primaryMuscles[0]] : null,
    secondary_muscle_groups: def.secondaryMuscles.map(m => MUSCLE_LABEL[m]),
    equipment: def.equipment.join(', '),
    notes: def.instructions || null,
  })));
  if (error) throw error;
}

export async function ensureSportDefaults(): Promise<true> {
  if (QA_AUTH_ENABLED) return true;
  await ensureDefaultSports();
  await ensureDefaultExercises();
  return true;
}
