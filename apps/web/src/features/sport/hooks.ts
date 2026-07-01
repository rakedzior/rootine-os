import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as repo from './services/sportRepository';
import * as planner from './services/sportPlannerService';
import * as session from './services/sessionService';
import * as records from './services/recordsService';
import { ensureSportDefaults } from './services/seedDefaults';
import type {
  EditScope, NewTrainingBlockInput, NewWorkoutFromTemplateInput, ScheduledWorkout, WorkoutTemplate, WorkoutTemplateFull,
} from './types';
import type { TemplateExerciseInput } from './services/sportRepository';

export const sportKeys = {
  sports: ['sport', 'sports'] as const,
  exercises: (search?: string) => ['sport', 'exercises', search ?? ''] as const,
  templates: ['sport', 'templates'] as const,
  template: (id: string) => ['sport', 'template', id] as const,
  week: (start: string, end: string) => ['sport', 'week', start, end] as const,
  blocks: ['sport', 'blocks'] as const,
  history: (filters: Record<string, unknown>) => ['sport', 'history', filters] as const,
  session: (id: string) => ['sport', 'session', id] as const,
  records: (limit?: number) => ['sport', 'records', limit ?? 0] as const,
};

function invalidatePlannerWorkoutSignals(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sport', 'week'] });
  qc.invalidateQueries({ queryKey: ['sport', 'today-workouts'] });
  qc.invalidateQueries({ queryKey: ['sport', 'next-workout'] });
}

// ── sports / exercises ───────────────────────────────────────

export function useSports() {
  return useQuery({ queryKey: sportKeys.sports, queryFn: repo.listSports });
}

export function useExercises(opts: { sportId?: string; search?: string } = {}) {
  return useQuery({ queryKey: sportKeys.exercises(opts.search), queryFn: () => repo.listExercises(opts) });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.createExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'exercises'] }),
  });
}

export function useCreateSport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) => repo.ensureSport(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: sportKeys.sports }),
  });
}

/** Seeds the sports/exercises catalog from features/sport/catalog.ts on first use (idempotent, runs once per session). */
export function useSeedSportDefaults() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['sport', 'seed-defaults'],
    queryFn: async () => {
      await ensureSportDefaults();
      qc.invalidateQueries({ queryKey: sportKeys.sports });
      qc.invalidateQueries({ queryKey: ['sport', 'exercises'] });
      return true;
    },
    staleTime: Infinity,
    retry: false,
  });
}

// ── templates ────────────────────────────────────────────────

export function useTemplates() {
  return useQuery({ queryKey: sportKeys.templates, queryFn: repo.listTemplates });
}

export function useTemplateFull(id: string | null) {
  return useQuery({ queryKey: sportKeys.template(id ?? ''), queryFn: () => repo.getTemplateFull(id!), enabled: !!id });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<WorkoutTemplate> & { name: string }) => repo.createTemplate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: sportKeys.templates }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<WorkoutTemplate> }) => repo.updateTemplate(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: sportKeys.templates }),
  });
}

export function useSaveTemplateExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, exercises }: { templateId: string; exercises: TemplateExerciseInput[] }) =>
      repo.replaceTemplateExercises(templateId, exercises),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: sportKeys.template(vars.templateId) }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: sportKeys.templates }),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.duplicateTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: sportKeys.templates }),
  });
}

// ── week view / scheduled workouts ───────────────────────────

export function useWeekWorkouts(weekStart: string) {
  const end = planner.addDaysStr(weekStart, 6);
  return useQuery({ queryKey: sportKeys.week(weekStart, end), queryFn: () => repo.listScheduledWorkouts(weekStart, end) });
}

/** Next upcoming planned/in-progress workout within the next two weeks (for the Start dashboard signal). */
export function useNextWorkout() {
  const today = planner.todayStr();
  const end = planner.addDaysStr(today, 14);
  return useQuery({
    queryKey: ['sport', 'next-workout', today],
    queryFn: async () => {
      const list = await repo.listScheduledWorkouts(today, end);
      return (
        list
          .filter((w) => (w.status === 'planned' || w.status === 'in_progress') && w.scheduled_date >= today)
          .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] ?? null
      );
    },
  });
}

/** Today's planned/in-progress workouts for the Start dashboard signal carousel. */
export function useTodayWorkouts() {
  const today = planner.todayStr();
  return useQuery({
    queryKey: ['sport', 'today-workouts', today],
    queryFn: async () => {
      const list = await repo.listScheduledWorkouts(today, today);
      return list
        .filter((w) => w.status === 'planned' || w.status === 'in_progress')
        .sort((a, b) => a.order_index - b.order_index);
    },
  });
}

export function useCreateScheduledWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.createScheduledWorkout,
    onSuccess: () => invalidatePlannerWorkoutSignals(qc),
  });
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, templateName }: { input: NewWorkoutFromTemplateInput; templateName: string }) =>
      planner.createFromTemplateWithSchedule(input, templateName),
    onSuccess: () => invalidatePlannerWorkoutSignals(qc),
  });
}

/** Drag & drop move with optimistic update + rollback on failure (spec §17.1). */
export function useMoveScheduledWorkout(weekStart: string) {
  const qc = useQueryClient();
  const end = planner.addDaysStr(weekStart, 6);
  const key = sportKeys.week(weekStart, end);
  return useMutation({
    mutationFn: ({ id, date, orderIndex }: { id: string; date: string; orderIndex: number }) =>
      planner.moveOccurrence(id, date, orderIndex),
    onMutate: async ({ id, date, orderIndex }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ScheduledWorkout[]>(key);
      if (previous) {
        qc.setQueryData<ScheduledWorkout[]>(key, previous.map(w =>
          w.id === id ? { ...w, scheduled_date: date, order_index: orderIndex, is_override: true } : w));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => invalidatePlannerWorkoutSignals(qc),
  });
}

export function useUpdateScheduledWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workout, patch, scope }: { workout: ScheduledWorkout; patch: Partial<ScheduledWorkout>; scope: EditScope }) =>
      planner.updateOccurrence(workout, patch, scope),
    onSuccess: () => invalidatePlannerWorkoutSignals(qc),
  });
}

export function useDeleteScheduledWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workout, scope }: { workout: ScheduledWorkout; scope: EditScope }) =>
      planner.deleteOccurrence(workout, scope),
    onSuccess: () => invalidatePlannerWorkoutSignals(qc),
  });
}

// ── blocks / progression ─────────────────────────────────────

export function useTrainingBlocks() {
  return useQuery({ queryKey: sportKeys.blocks, queryFn: repo.listTrainingBlocks });
}

export function useCreateTrainingBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTrainingBlockInput) => planner.createBlockWithSchedule(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sportKeys.blocks });
      qc.invalidateQueries({ queryKey: ['sport', 'week'] });
    },
  });
}

// ── history / sessions ───────────────────────────────────────

export function useHistory(filters: { limit?: number; sportId?: string; templateId?: string } = {}) {
  return useQuery({ queryKey: sportKeys.history(filters), queryFn: () => repo.listSessions(filters) });
}

export function useSessionFull(id: string | null) {
  return useQuery({ queryKey: sportKeys.session(id ?? ''), queryFn: () => repo.getSessionFull(id!), enabled: !!id });
}

export function useStartSessionFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ template, scheduledWorkout }: { template: WorkoutTemplateFull; scheduledWorkout: ScheduledWorkout | null }) =>
      session.startSessionFromTemplate(template, scheduledWorkout),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'week'] }),
  });
}

export function useStartManualSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, sportId, scheduledWorkout }: { title: string; sportId: string | null; scheduledWorkout: ScheduledWorkout | null }) =>
      session.startManualSession(title, sportId, scheduledWorkout),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'week'] }),
  });
}

function useSessionMutation<TArgs extends unknown[], TResult>(
  sessionId: string,
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: () => qc.invalidateQueries({ queryKey: sportKeys.session(sessionId) }),
  });
}

export function useCheckSet(sessionId: string) {
  return useSessionMutation(sessionId, session.checkSet);
}
export function useUncheckSet(sessionId: string) {
  return useSessionMutation(sessionId, session.uncheckSet);
}
export function useEditSetValues(sessionId: string) {
  return useSessionMutation(sessionId, session.editSetValues);
}
export function useSkipRest(sessionId: string) {
  return useSessionMutation(sessionId, session.skipRest);
}
export function useAdjustRest(sessionId: string) {
  return useSessionMutation(sessionId, session.adjustRest);
}
export function useAddManualSet(sessionId: string) {
  return useSessionMutation(sessionId, session.addManualSet);
}
export function useAddManualExercise(sessionId: string) {
  return useSessionMutation(sessionId, (name: string, orderIndex: number) => session.addManualExercise(sessionId, name, orderIndex));
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, summary }: { sessionId: string; summary: session.SessionSummaryInput }) =>
      session.completeSession(sessionId, summary),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sport', 'week'] });
      qc.invalidateQueries({ queryKey: ['sport', 'history'] });
      qc.invalidateQueries({ queryKey: ['sport', 'records'] });
    },
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: session.cancelSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'week'] }),
  });
}

// ── records ──────────────────────────────────────────────────

export function useRecords(opts: { limit?: number; exerciseId?: string; sportId?: string } = {}) {
  return useQuery({ queryKey: sportKeys.records(opts.limit), queryFn: () => records.listRecords(opts) });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: records.createRecord,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'records'] }),
  });
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof records.updateRecord>[1] }) => records.updateRecord(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'records'] }),
  });
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: records.deleteRecord,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sport', 'records'] }),
  });
}
