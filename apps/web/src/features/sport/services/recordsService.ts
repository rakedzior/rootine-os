/** Sport — personal records: manual CRUD (delegates to the repository) + automatic
 * detection on session completion (spec §12.3). */
import * as repo from './sportRepository';
import type { MetricType, PersonalRecord, TrainingSessionFull } from '../types';

export const listRecords = repo.listPersonalRecords;
export const createRecord = repo.createPersonalRecord;
export const updateRecord = repo.updatePersonalRecord;
export const deleteRecord = repo.deletePersonalRecord;

/** Epley estimated 1RM. */
function estimateOneRepMax(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

interface Candidate { exerciseId: string; title: string; metricType: MetricType; value: number; unit: string; }

export async function checkAndUpdateRecordsForSession(session: TrainingSessionFull): Promise<PersonalRecord[]> {
  const candidatesByKey = new Map<string, Candidate>();

  for (const exercise of session.exercises) {
    const completedSets = exercise.sets.filter(s => s.completed && s.actual_weight_kg != null && s.actual_reps != null);
    if (!completedSets.length || !exercise.exercise_id) continue;

    let maxWeight = 0;
    let maxReps = 0;
    let maxVolume = 0;
    let bestOneRm = 0;
    for (const s of completedSets) {
      const weight = s.actual_weight_kg ?? 0;
      const reps = s.actual_reps ?? 0;
      maxWeight = Math.max(maxWeight, weight);
      maxReps = Math.max(maxReps, reps);
      maxVolume += weight * reps;
      bestOneRm = Math.max(bestOneRm, estimateOneRepMax(weight, reps));
    }

    const upsert = (metricType: MetricType, value: number, unit: string) => {
      if (value <= 0) return;
      candidatesByKey.set(`${exercise.exercise_id}|${metricType}`, { exerciseId: exercise.exercise_id!, title: exercise.name_snapshot, metricType, value, unit });
    };
    upsert('max_weight', maxWeight, 'kg');
    upsert('max_reps', maxReps, 'powt.');
    upsert('max_volume', maxVolume, 'kg');
    upsert('one_rep_max_estimated', Math.round(bestOneRm * 10) / 10, 'kg');
  }

  if (!candidatesByKey.size) return [];

  const updated: PersonalRecord[] = [];
  for (const candidate of candidatesByKey.values()) {
    const existing = await repo.listPersonalRecords({ exerciseId: candidate.exerciseId });
    const current = existing.find(r => r.metric_type === candidate.metricType);
    if (current && (current.value_numeric ?? 0) >= candidate.value) continue;

    const occurred_on = new Date().toISOString().split('T')[0];
    const record = current
      ? await repo.updatePersonalRecord(current.id, { value_numeric: candidate.value, session_id: session.id, occurred_on })
      : await repo.createPersonalRecord({
          exercise_id: candidate.exerciseId, sport_id: session.sport_id, session_id: session.id,
          title: candidate.title, metric_type: candidate.metricType,
          value_numeric: candidate.value, unit: candidate.unit, occurred_on,
        });
    updated.push(record);
  }
  return updated;
}
