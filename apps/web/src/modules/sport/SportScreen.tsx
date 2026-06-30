import { useState } from 'react';
import '@/styles/sport.css';
import { PageHeader, ConfirmDelete, MoreMenu, StatusBadge } from '@/components/common';
import { ModuleCard, PageContainer, PageLayout } from '@/components/layout/primitives';
import {
  useWeekWorkouts, useSports, useTemplates, useExercises, useCreateScheduledWorkout,
  useCreateFromTemplate, useCreateTrainingBlock, useMoveScheduledWorkout, useDeleteScheduledWorkout,
  useUpdateScheduledWorkout, useStartSessionFromTemplate, useStartManualSession, useSeedSportDefaults,
} from '@/features/sport/hooks';
import { getTemplateFull } from '@/features/sport/services/sportRepository';
import { startOfWeekStr, todayStr, addDaysStr } from '@/features/sport/services/sportPlannerService';
import type { EditScope, ScheduledWorkout, Sport } from '@/features/sport/types';
import { WeekStrip } from './components/WeekStrip';
import { AddToPlanDrawer } from './components/AddToPlanDrawer';
import { WorkoutEditModal } from './components/WorkoutEditModal';
import { TemplatesPanel } from './components/TemplatesPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ActiveSessionScreen } from './components/ActiveSessionScreen';
import { ActiveCycleBanner } from './components/ActiveCycleBanner';
import { CycleManagerModal } from './components/CycleManagerModal';
import { CycleDetailModal } from './components/CycleDetailModal';
import { IcoChevronDown, IcoDumbbell, IcoPlay, IcoSliders } from './components/icons';

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
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useSeedSportDefaults();
  const { data: workouts = [] } = useWeekWorkouts(weekStart);
  const { data: sports = [] } = useSports();
  const { data: templates = [] } = useTemplates();
  const { data: exercises = [] } = useExercises();
  const today = todayStr();
  const todaysWorkouts = workouts
    .filter(w => w.scheduled_date === today)
    .sort((a, b) => a.order_index - b.order_index);
  const nextWorkout = workouts
    .filter(w => w.status === 'planned' && w.scheduled_date >= today)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date) || a.order_index - b.order_index)[0] ?? null;
  const selectedWorkout = selectedWorkoutId ? workouts.find(w => w.id === selectedWorkoutId) ?? null : null;

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

  function handleToggleWorkoutComplete(workout: ScheduledWorkout) {
    updateWorkout.mutate({
      workout,
      patch: { status: workout.status === 'completed' ? 'planned' : 'completed' },
      scope: 'this',
    });
  }

  return (
    <PageLayout
      className="sport-os"
      header={<PageHeader icon={<SportIcon />} title="Sport" desc="Planuj, analizuj i poprawiaj swoje treningi."
        actions={<>
          <button className="btn btn-primary" onClick={() => setAddDrawer({ open: true, date: today, mode: 'template' })}>+ Nowy trening</button>
        </>}
      />}
    >

    <PageContainer className="sport-cockpit">
        <div className="sport-dashboard-layout">
          <div className="sport-dashboard-left">
            <TodayTrainingCard
              workouts={todaysWorkouts}
              weekWorkouts={workouts}
              nextWorkout={nextWorkout}
              selectedWorkout={selectedWorkout}
              onAddToday={() => setAddDrawer({ open: true, date: today, mode: 'manual' })}
              onPickTemplate={() => setAddDrawer({ open: true, date: today, mode: 'template' })}
              onSelectWorkout={(workout) => setSelectedWorkoutId(workout.id)}
              onOpenWorkout={setEditingWorkout}
              onStartSession={handleStartSession}
              onToggleComplete={handleToggleWorkoutComplete}
            />
            <ActiveCycleBanner
              onOpenManager={() => setCycleManagerOpen(true)}
              onOpenDetail={(id) => setCycleDetailId(id)}
            />
            <TemplatesPanel />
          </div>

          <div className="sport-dashboard-week">
            <WeekStrip
              weekStart={weekStart}
              workouts={workouts}
              onNavigateWeek={(delta) => setWeekStart(w => addDaysStr(w, delta * 7))}
              onPickWeek={(date) => setWeekStart(startOfWeekStr(date))}
              onAddForDay={(date) => setAddDrawer({ open: true, date, mode: 'template' })}
              selectedWorkoutId={selectedWorkout?.id ?? null}
              onSelectWorkout={(workout) => setSelectedWorkoutId(workout.id)}
              onOpenWorkout={setEditingWorkout}
              onStartSession={handleStartSession}
              onToggleComplete={handleToggleWorkoutComplete}
              onCopyWorkout={handleCopyWorkout}
              onDeleteWorkout={setPendingDelete}
              onMoveWorkout={(id, date, orderIndex) => moveWorkout.mutate({ id, date, orderIndex })}
            />
          </div>

          <div className="sport-dashboard-history">
            <HistoryPanel />
          </div>

          <WeeklyGoalsPanel workouts={workouts} sports={sports} />
        </div>
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
    </PageLayout>
  );
}

const SPORT_STATUS_LABEL: Record<ScheduledWorkout['status'], string> = {
  planned: 'todo',
  in_progress: 'active',
  completed: 'done',
  skipped: 'cancelled',
  cancelled: 'cancelled',
};

function formatSportDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function TodayTrainingCard({
  workouts,
  weekWorkouts,
  nextWorkout,
  selectedWorkout,
  onAddToday,
  onPickTemplate,
  onSelectWorkout,
  onOpenWorkout,
  onStartSession,
  onToggleComplete,
}: {
  workouts: ScheduledWorkout[];
  weekWorkouts: ScheduledWorkout[];
  nextWorkout: ScheduledWorkout | null;
  selectedWorkout: ScheduledWorkout | null;
  onAddToday: () => void;
  onPickTemplate: () => void;
  onSelectWorkout: (workout: ScheduledWorkout) => void;
  onOpenWorkout: (workout: ScheduledWorkout) => void;
  onStartSession: (workout: ScheduledWorkout) => void;
  onToggleComplete: (workout: ScheduledWorkout) => void;
}) {
  const leadWorkout = workouts.find(w => w.status === 'in_progress') ?? workouts.find(w => w.status === 'planned') ?? workouts[0] ?? nextWorkout;
  const displayWorkout = selectedWorkout ?? leadWorkout;
  const displayDate = selectedWorkout?.scheduled_date ?? displayWorkout?.scheduled_date ?? todayStr();
  const visibleWorkouts = weekWorkouts
    .filter(w => w.scheduled_date === displayDate)
    .sort((a, b) => a.order_index - b.order_index);
  const hasVisibleWorkouts = visibleWorkouts.length > 0;
  const isTodayContext = displayDate === todayStr();

  return (
    <ModuleCard className="sport-today-card">
      <div className="sport-today-kicker">Dzisiaj</div>
      <div className="sport-today-head">
        <div>
          <h2 className="sport-today-title">{displayWorkout ? displayWorkout.title : 'Zaplanuj dzisiejszy ruch'}</h2>
          <p className="sport-today-subtitle">
            {displayWorkout
              ? `${selectedWorkout ? `Wybrany trening ${formatSportDate(displayWorkout.scheduled_date)}` : displayWorkout.scheduled_date === todayStr() ? 'Następny trening' : `Najbliższy trening ${formatSportDate(displayWorkout.scheduled_date)}`}${displayWorkout.planned_duration_min ? ` · ${displayWorkout.planned_duration_min} min` : ''}`
              : 'Dodaj trening albo wybierz gotowy plan na dziś.'}
          </p>
        </div>
        {displayWorkout && <StatusBadge status={SPORT_STATUS_LABEL[displayWorkout.status]} />}
      </div>

      {displayWorkout ? (
        <div className="sport-today-actions">
          {displayWorkout.status === 'planned' && (
            <button className="btn btn-primary sport-action-start" onClick={() => onStartSession(displayWorkout)}><IcoPlay /> Start treningu</button>
          )}
          <button className="btn btn-secondary sport-status-action" onClick={() => onToggleComplete(displayWorkout)}>
            {displayWorkout.status === 'completed' ? 'Zrobione' : 'Do zrobienia'} <IcoChevronDown />
          </button>
          <button className="icon-btn sport-filter-action" onClick={() => onOpenWorkout(displayWorkout)} aria-label="Szczegoly treningu"><IcoSliders /></button>
        </div>
      ) : (
        <div className="sport-today-actions">
          <button className="btn btn-primary" onClick={onAddToday}>+ Dodaj trening</button>
          <button className="btn btn-secondary" onClick={onPickTemplate}>Wybierz szablon</button>
          <button className="icon-btn sport-filter-action" onClick={onPickTemplate} aria-label="Opcje planowania"><IcoSliders /></button>
        </div>
      )}

      <div className="sport-today-list" aria-label={isTodayContext ? 'Dzisiejsze treningi' : 'Treningi wybranego dnia'}>
        {hasVisibleWorkouts ? visibleWorkouts.map(w => (
          <div key={w.id} className={`sport-today-row${selectedWorkout?.id === w.id ? ' is-selected' : ''}`}>
            <button className="sport-today-row-main" onClick={() => onSelectWorkout(w)}>
              <span className="sport-today-row-icon" aria-hidden="true"><IcoDumbbell /></span>
              <span>
                <strong>{w.title}</strong>
                <small>{w.planned_duration_min ? `${w.planned_duration_min} min` : 'Bez czasu'}{w.subtitle ? ` · ${w.subtitle}` : ''}</small>
              </span>
            </button>
            <StatusBadge status={SPORT_STATUS_LABEL[w.status]} />
            <MoreMenu items={[
              ...(w.status === 'planned' ? [{ label: 'Start treningu', onClick: () => onStartSession(w) }] : []),
              { label: w.status === 'completed' ? 'Cofnij wykonanie' : 'Oznacz wykonany', onClick: () => onToggleComplete(w) },
              { label: 'Szczegóły', onClick: () => onOpenWorkout(w) },
            ]} />
          </div>
        )) : (
          <div className="sport-today-empty">{isTodayContext ? 'Nie zaplanowano treningu na dziś.' : 'Brak treningów w wybranym dniu.'}</div>
        )}
      </div>
    </ModuleCard>
  );
}

function WeeklyGoalsPanel({ workouts, sports }: { workouts: ScheduledWorkout[]; sports: Sport[] }) {
  const goals = buildWeeklyGoals(workouts, sports);
  return (
    <ModuleCard className="sport-week-goals-card">
      <div className="sport-week-goals-head">
        <h3>Cele tygodnia</h3>
      </div>
      <div className="sport-week-goals-list">
        {goals.map(goal => {
          const percent = goal.target ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
          return (
            <div key={goal.label} className="sport-week-goal-row">
              <span>{goal.label}</span>
              <div className="sport-week-goal-bar" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
              <strong>{goal.value} / {goal.target}</strong>
            </div>
          );
        })}
      </div>
      <div className="sport-week-goals-note">Auto z planu tygodnia</div>
    </ModuleCard>
  );
}

function buildWeeklyGoals(workouts: ScheduledWorkout[], sports: Sport[]) {
  const activeWorkouts = workouts.filter(workout => workout.status !== 'cancelled' && workout.status !== 'skipped');
  const completedWorkouts = activeWorkouts.filter(workout => workout.status === 'completed');
  const sportById = new Map(sports.map(sport => [sport.id, sport.name]));
  const grouped = new Map<string, { label: string; value: number; target: number }>();

  for (const workout of activeWorkouts) {
    const label = resolveGoalLabel(workout, sportById);
    const current = grouped.get(label) ?? { label, value: 0, target: 0 };
    current.target += 1;
    if (workout.status === 'completed') current.value += 1;
    grouped.set(label, current);
  }

  return [
    { label: 'Treningi', value: completedWorkouts.length, target: activeWorkouts.length },
    ...Array.from(grouped.values())
      .filter(goal => goal.target > 0)
      .sort((a, b) => b.target - a.target || a.label.localeCompare(b.label, 'pl')),
  ];
}

function resolveGoalLabel(workout: ScheduledWorkout, sportById: Map<string, string>): string {
  const sportName = workout.sport_id ? sportById.get(workout.sport_id) : null;
  if (sportName) return sportName;

  const text = `${workout.title} ${workout.subtitle ?? ''}`.toLocaleLowerCase('pl-PL');
  if (/bieg|run|interwa/.test(text)) return 'Bieganie';
  if (/mobil|stretch|joga|yoga|rozci/.test(text)) return 'Mobilnosc';
  if (/rehab|fizjo|regener|recovery/.test(text)) return 'Regeneracja';
  if (/upper|lower|push|pull|legs|fbw|sil|gym/.test(text)) return 'Silownia';
  return 'Inne';
}
