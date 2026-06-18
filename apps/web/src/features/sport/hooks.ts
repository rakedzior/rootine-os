import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkouts, fetchTodayWorkout, insertWorkout, patchWorkout, deleteWorkout,
  fetchWorkoutSets, insertWorkoutSet, deleteWorkoutSet,
  fetchBodyMeasurements, insertBodyMeasurement,
  fetchReadinessToday, upsertReadinessToday,
} from './api';
import type {
  Workout, WorkoutSet, BodyMeasurement,
  NewWorkoutInput, NewWorkoutSetInput, NewBodyMeasurementInput, ReadinessPatch,
} from './types';

const WORKOUTS_KEY = ['workouts'] as const;
const TODAY_WORKOUT_KEY = ['workouts', 'today'] as const;
const BODY_KEY = ['body_measurements'] as const;
const READINESS_KEY = ['readiness_daily', 'today'] as const;

export function useWorkouts() {
  return useQuery({ queryKey: WORKOUTS_KEY, queryFn: fetchWorkouts });
}

export function useTodayWorkout() {
  return useQuery({ queryKey: TODAY_WORKOUT_KEY, queryFn: fetchTodayWorkout });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkoutInput) => insertWorkout(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WORKOUTS_KEY }); qc.invalidateQueries({ queryKey: TODAY_WORKOUT_KEY }); },
  });
}

export function usePatchWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Workout> }) => patchWorkout(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: WORKOUTS_KEY }); qc.invalidateQueries({ queryKey: TODAY_WORKOUT_KEY }); },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkout(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: WORKOUTS_KEY });
      const prev = qc.getQueryData<Workout[]>(WORKOUTS_KEY);
      qc.setQueryData<Workout[]>(WORKOUTS_KEY, (old) => (old ?? []).filter((w) => w.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(WORKOUTS_KEY, ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: WORKOUTS_KEY }); qc.invalidateQueries({ queryKey: TODAY_WORKOUT_KEY }); },
  });
}

export function useWorkoutSets(workoutId: string | null | undefined) {
  return useQuery({
    queryKey: ['workout_sets', workoutId],
    queryFn: () => fetchWorkoutSets(workoutId!),
    enabled: !!workoutId,
  });
}

export function useAddWorkoutSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkoutSetInput) => insertWorkoutSet(input),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['workout_sets', v.workout_id] }),
  });
}

export function useDeleteWorkoutSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workoutId }: { id: string; workoutId: string | null }) => deleteWorkoutSet(id),
    onMutate: async ({ id, workoutId }) => {
      const key = ['workout_sets', workoutId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WorkoutSet[]>(key);
      qc.setQueryData<WorkoutSet[]>(key, (old) => (old ?? []).filter((s) => s.id !== id));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev); },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: ['workout_sets', v.workoutId] }),
  });
}

export function useBodyMeasurements() {
  return useQuery({ queryKey: BODY_KEY, queryFn: fetchBodyMeasurements });
}

export function useAddBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBodyMeasurementInput) => insertBodyMeasurement(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: BODY_KEY });
      const prev = qc.getQueryData<BodyMeasurement[]>(BODY_KEY);
      qc.setQueryData<BodyMeasurement[]>(BODY_KEY, (old) => [
        { id: 'opt', user_id: '', date: input.date ?? new Date().toISOString().split('T')[0], weight: input.weight ?? null, body_fat: input.body_fat ?? null, lean_mass: input.lean_mass ?? null, circumferences: null, created_at: new Date().toISOString() },
        ...(old ?? []),
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(BODY_KEY, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: BODY_KEY }),
  });
}

export function useReadinessToday() {
  return useQuery({ queryKey: READINESS_KEY, queryFn: fetchReadinessToday });
}

export function useUpsertReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ReadinessPatch) => upsertReadinessToday(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: READINESS_KEY }),
  });
}
