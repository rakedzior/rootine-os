import { useState } from 'react';
import '@/styles/sport.css';
import { PageHeader, ConfirmDelete } from '@/components/common';
import { PageContainer, PageGrid } from '@/components/layout/primitives';
import {
  useWeekWorkouts, useSports, useTemplates, useExercises, useCreateScheduledWorkout,
  useCreateFromTemplate, useCreateTrainingBlock, useMoveScheduledWorkout, useDeleteScheduledWorkout,
  useUpdateScheduledWorkout, useStartSessionFromTemplate, useStartManualSession, useSeedSportDefaults,
} from '@/features/sport/hooks';
import { getTemplateFull } from '@/features/sport/services/sportRepository';
import { startOfWeekStr, todayStr, addDaysStr } from '@/features/sport/services/sportPlannerService';
import type { EditScope, ScheduledWorkout } from '@/features/sport/types';
import { WeekStrip } from './components/WeekStrip';
import { AddToPlanDrawer } from './components/AddToPlanDrawer';
import { WorkoutEditModal } from './components/WorkoutEditModal';
import { TemplatesPanel } from './components/TemplatesPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { RecordsPanel } from './components/RecordsPanel';
import { ActiveSessionScreen } from './components/ActiveSessionScreen';
import { ActiveCycleBanner } from './components/ActiveCycleBanner';
import { CycleManagerModal } from './components/CycleManagerModal';
import { CycleDetailModal } from './components/CycleDetailModal';

function SportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5 17.5 17.5M4 4l3 3M20 20l-3-3M2 8l2-2M16 18l2 2M9 4 4 9l1.5 1.5L10.5 5.5zM19 14l-5 5 1.5 1.5 5-5z" />
    </svg>
  );
}

export function SportScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekStr(todayStr()));
  const [addDrawer, setAddDrawer] = useState<{ open: boolean; date: string; mode: 'template' | 'manual' | 'block' }>({ open: false, date: todayStr(), mode: 'template' });
  const [editingWorkout, setEditingWorkout] = useState<ScheduledWorkout | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ScheduledWorkout | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [cycleManagerOpen, setCycleManagerOpen] = useState(false);
  const [cycleDetailId, setCycleDetailId] = useState<string | null>(null);

  useSeedSportDefaults();
  const { data: workouts = [] } = useWeekWorkouts(weekStart);
  const { data: sports = [] } = useSports();
  const { data: templates = [] } = useTemplates();
  const { data: exercises = [] } = useExercises();

  const createManual = useCreateScheduledWorkout();
  const createFromTemplate = useCreateFromTemplate();
  const createBlock = useCreateTrainingBlock();
  const moveWorkout = useMoveScheduledWorkout(weekStart);
  const updateWorkout = useUpdateScheduledWorkout();
  const deleteWorkout = useDeleteScheduledWorkout();
  const startFromTemplate = useStartSessionFromTemplate();
  const startManual = useStartManualSession();

  if (activeSessionId) {
    return <ActiveSessionScreen sessionId={activeSessionId} onExit={() => setActiveSessionId(null)} />;
  }

  async function handleStartSession(workout: ScheduledWorkout) {
    if (workout.template_id) {
      const template = await getTemplateFull(workout.template_id);
      const session = await startFromTemplate.mutateAsync({ template, scheduledWorkout: workout });
      setActiveSessionId(session.id);
    } else {
      const session = await startManual.mutateAsync({ title: workout.title, sportId: workout.sport_id, scheduledWorkout: workout });
      setActiveSessionId(session.id);
    }
  }

  function handleCopyWorkout(workout: ScheduledWorkout) {
    const orderIndex = workouts.filter(w => w.scheduled_date === workout.scheduled_date).length;
    createManual.mutate({
      scheduled_date: workout.scheduled_date, sport_id: workout.sport_id, template_id: workout.template_id,
      title: `${workout.title} (kopia)`, subtitle: workout.subtitle, planned_duration_min: workout.planned_duration_min,
      source_type: 'copied', order_index: orderIndex,
    });
  }

  return (
    <div className="module-page sport-os">
      <PageHeader icon={<SportIcon />} title="Sport" desc="Planuj, analizuj i poprawiaj swoje treningi."
        actions={<>
          <button className="btn btn-ghost" onClick={() => setCycleManagerOpen(true)}>Cykle treningowe</button>
          <button className="btn btn-secondary" onClick={() => setAddDrawer({ open: true, date: todayStr(), mode: 'template' })}>+ Dodaj trening</button>
          <button className="btn btn-primary" onClick={() => setAddDrawer({ open: true, date: todayStr(), mode: 'block' })}>+ Zaplanuj blok</button>
        </>}
      />

      <PageContainer>
        <ActiveCycleBanner
          onOpenManager={() => setCycleManagerOpen(true)}
          onOpenDetail={(id) => setCycleDetailId(id)}
        />

        <WeekStrip
          weekStart={weekStart}
          workouts={workouts}
          onNavigateWeek={(delta) => setWeekStart(w => addDaysStr(w, delta * 7))}
          onPickWeek={(date) => setWeekStart(startOfWeekStr(date))}
          onAddForDay={(date) => setAddDrawer({ open: true, date, mode: 'template' })}
          onOpenWorkout={setEditingWorkout}
          onStartSession={handleStartSession}
          onCopyWorkout={handleCopyWorkout}
          onDeleteWorkout={setPendingDelete}
          onMoveWorkout={(id, date, orderIndex) => moveWorkout.mutate({ id, date, orderIndex })}
        />

        <PageGrid columns="repeat(3, 1fr)" className="sport-bottom-grid">
          <TemplatesPanel />
          <HistoryPanel />
          <RecordsPanel />
        </PageGrid>
      </PageContainer>

      <AddToPlanDrawer
        open={addDrawer.open}
        onClose={() => setAddDrawer(s => ({ ...s, open: false }))}
        defaultDate={addDrawer.date}
        initialMode={addDrawer.mode}
        templates={templates}
        sports={sports}
        exercises={exercises}
        onCreateManual={(input) => createManual.mutateAsync(input)}
        onCreateFromTemplate={(input, name) => createFromTemplate.mutateAsync({ input, templateName: name })}
        onCreateBlock={(input) => createBlock.mutateAsync(input)}
      />

      <WorkoutEditModal
        workout={editingWorkout}
        onClose={() => setEditingWorkout(null)}
        onSave={(patch, scope) => { if (editingWorkout) updateWorkout.mutate({ workout: editingWorkout, patch, scope }); setEditingWorkout(null); }}
        onDelete={(scope) => { if (editingWorkout) deleteWorkout.mutate({ workout: editingWorkout, scope }); setEditingWorkout(null); }}
      />

      {pendingDelete && !pendingDelete.block_id && !pendingDelete.series_id && (
        <ConfirmDelete
          open={!!pendingDelete} onClose={() => setPendingDelete(null)} label={`trening "${pendingDelete.title}"`}
          onConfirm={() => { deleteWorkout.mutate({ workout: pendingDelete, scope: 'this' as EditScope }); setPendingDelete(null); }}
        />
      )}
      {pendingDelete && (pendingDelete.block_id || pendingDelete.series_id) && (
        <WorkoutEditModal
          workout={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onSave={() => setPendingDelete(null)}
          onDelete={(scope) => { deleteWorkout.mutate({ workout: pendingDelete, scope }); setPendingDelete(null); }}
        />
      )}

      <CycleManagerModal
        open={cycleManagerOpen}
        onClose={() => setCycleManagerOpen(false)}
        sports={sports}
        onOpenDetail={(id) => { setCycleManagerOpen(false); setCycleDetailId(id); }}
      />
      <CycleDetailModal cycleId={cycleDetailId} onClose={() => setCycleDetailId(null)} templates={templates} sports={sports} exercises={exercises} />
    </div>
  );
}
