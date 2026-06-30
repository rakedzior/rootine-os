import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as repo from './services/cycleRepository';
import * as cycleService from './services/cycleService';
import type { NewCycleInput, NewTrainingBlockInput, TrainingCycle, TrainingCycleWeek } from './types';

const cycleKeys = {
  cycles: ['sport', 'cycles'] as const,
  cycle: (id: string) => ['sport', 'cycle', id] as const,
  phases: (cycleId: string) => ['sport', 'cycle-phases', cycleId] as const,
  weeks: (cycleId: string) => ['sport', 'cycle-weeks', cycleId] as const,
  progress: (cycleId: string) => ['sport', 'cycle-progress', cycleId] as const,
  workouts: (cycleId: string, from: string, to: string) => ['sport', 'cycle-workouts', cycleId, from, to] as const,
  summary: (cycleId: string) => ['sport', 'cycle-summary', cycleId] as const,
};

export function useCycles() {
  return useQuery({ queryKey: cycleKeys.cycles, queryFn: repo.listCycles });
}

export function useCycle(id: string | null) {
  return useQuery({ queryKey: cycleKeys.cycle(id ?? ''), queryFn: () => repo.getCycle(id!), enabled: !!id });
}

function useInvalidateCycles() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['sport', 'cycle'] });
    qc.invalidateQueries({ queryKey: cycleKeys.cycles });
  };
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCycleInput) => cycleService.createCycleWithWeeks(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.cycles }),
  });
}

export function useUpdateCycle() {
  const invalidate = useInvalidateCycles();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TrainingCycle> }) => repo.updateCycle(id, patch),
    onSuccess: invalidate,
  });
}

export function useSetActiveCycle() {
  const invalidate = useInvalidateCycles();
  return useMutation({ mutationFn: cycleService.setActiveCycle, onSuccess: invalidate });
}
export function usePauseCycle() {
  const invalidate = useInvalidateCycles();
  return useMutation({ mutationFn: cycleService.pauseCycle, onSuccess: invalidate });
}
export function useEndCycle() {
  const invalidate = useInvalidateCycles();
  return useMutation({ mutationFn: cycleService.endCycle, onSuccess: invalidate });
}
export function useArchiveCycle() {
  const invalidate = useInvalidateCycles();
  return useMutation({ mutationFn: cycleService.archiveCycle, onSuccess: invalidate });
}
export function useDuplicateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cycleService.duplicateCycle,
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.cycles }),
  });
}
export function useDeleteCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.deleteCycle,
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.cycles }),
  });
}

export function useCyclePhases(cycleId: string | null) {
  return useQuery({ queryKey: cycleKeys.phases(cycleId ?? ''), queryFn: () => repo.listPhases(cycleId!), enabled: !!cycleId });
}

export function useCreatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, phase, blockInput }: { cycleId: string; phase: { name: string; goal: string | null; orderIndex: number }; blockInput: NewTrainingBlockInput }) =>
      cycleService.createPhaseWithBlock(cycleId, phase, blockInput),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: cycleKeys.phases(vars.cycleId) });
      qc.invalidateQueries({ queryKey: cycleKeys.progress(vars.cycleId) });
      qc.invalidateQueries({ queryKey: ['sport', 'cycle-workouts', vars.cycleId] });
      qc.invalidateQueries({ queryKey: ['sport', 'week'] });
    },
  });
}

export function useDeletePhase(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.deletePhase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cycleKeys.phases(cycleId) });
      qc.invalidateQueries({ queryKey: ['sport', 'cycle-workouts', cycleId] });
    },
  });
}

export function useCycleWeeks(cycleId: string | null) {
  return useQuery({ queryKey: cycleKeys.weeks(cycleId ?? ''), queryFn: () => repo.listWeeks(cycleId!), enabled: !!cycleId });
}

export function useUpdateCycleWeek(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TrainingCycleWeek> }) => repo.updateWeek(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.weeks(cycleId) }),
  });
}

export function useCycleProgress(cycleId: string | null) {
  return useQuery({ queryKey: cycleKeys.progress(cycleId ?? ''), queryFn: () => cycleService.getCycleProgress(cycleId!), enabled: !!cycleId });
}

export function useCycleWorkouts(cycleId: string | null, fromDate: string | null, toDate: string | null) {
  return useQuery({
    queryKey: cycleKeys.workouts(cycleId ?? '', fromDate ?? '', toDate ?? ''),
    queryFn: () => cycleService.scheduledWorkoutsForCycle(cycleId!, fromDate!, toDate!),
    enabled: !!cycleId && !!fromDate && !!toDate,
  });
}

/** Everything the top-of-page "active cycle" banner needs in one query. */
export function useActiveCycleSummary() {
  const { data: cycles = [] } = useCycles();
  const activeCycle = cycles.find(c => c.status === 'active') ?? null;

  const summary = useQuery({
    queryKey: cycleKeys.summary(activeCycle?.id ?? ''),
    queryFn: async () => {
      const [weeks, progress, adjacent] = await Promise.all([
        repo.listWeeks(activeCycle!.id),
        cycleService.getCycleProgress(activeCycle!.id),
        cycleService.getAdjacentWorkouts(activeCycle!.id),
      ]);
      return { weeks, currentWeek: cycleService.currentWeekFor(weeks), progress, ...adjacent };
    },
    enabled: !!activeCycle,
  });

  return { activeCycle, ...summary.data, isLoading: summary.isLoading };
}
