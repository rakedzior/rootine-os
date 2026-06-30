import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { MoreMenu, StatusBadge } from '@/components/common';
import { addDaysStr, todayStr, WEEKDAY_LABELS_LONG } from '@/features/sport/services/sportPlannerService';
import type { ScheduledWorkout } from '@/features/sport/types';
import { IcoCalendar, IcoChevLeft, IcoChevRightLg, IcoDumbbell, IcoEdit, IcoTrash } from './icons';

const MONTHS_PL = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

function formatRange(weekStart: string): string {
  const end = addDaysStr(weekStart, 6);
  const s = new Date(`${weekStart}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  if (s.getMonth() === e.getMonth()) return `${s.getDate()} – ${e.getDate()} ${MONTHS_PL[e.getMonth()]} ${e.getFullYear()}`;
  return `${s.getDate()} ${MONTHS_PL[s.getMonth()]} – ${e.getDate()} ${MONTHS_PL[e.getMonth()]} ${e.getFullYear()}`;
}

interface WeekStripProps {
  weekStart: string;
  workouts: ScheduledWorkout[];
  onNavigateWeek: (deltaWeeks: number) => void;
  onPickWeek: (date: string) => void;
  onAddForDay: (date: string) => void;
  selectedWorkoutId: string | null;
  onSelectWorkout: (workout: ScheduledWorkout) => void;
  onOpenWorkout: (workout: ScheduledWorkout) => void;
  onStartSession: (workout: ScheduledWorkout) => void;
  onToggleComplete: (workout: ScheduledWorkout) => void;
  onCopyWorkout: (workout: ScheduledWorkout) => void;
  onDeleteWorkout: (workout: ScheduledWorkout) => void;
  onMoveWorkout: (id: string, date: string, orderIndex: number) => void;
}

export function WeekStrip({
  weekStart, workouts, onNavigateWeek, onPickWeek, onAddForDay, onOpenWorkout,
  selectedWorkoutId, onSelectWorkout, onStartSession, onToggleComplete, onCopyWorkout, onDeleteWorkout, onMoveWorkout,
}: WeekStripProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const days = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));
  const today = todayStr();

  function handleDragEnd(e: DragEndEvent) {
    const workoutId = e.active.id as string;
    const targetDate = e.over?.id as string | undefined;
    if (!targetDate) return;
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout || workout.scheduled_date === targetDate) return;
    const orderIndex = workouts.filter(w => w.scheduled_date === targetDate).length;
    onMoveWorkout(workoutId, targetDate, orderIndex);
  }

  return (
    <div className="sport-week-card">
      <div className="sport-week-head">
        <div>
          <div className="sport-week-title">Ten tydzień</div>
          <div className="sport-week-range">{formatRange(weekStart)}</div>
        </div>
        <div className="sport-week-nav">
          <button className="icon-btn" onClick={() => onNavigateWeek(-1)} aria-label="Poprzedni tydzień"><IcoChevLeft /></button>
          <button className="icon-btn" onClick={() => onNavigateWeek(1)} aria-label="Następny tydzień"><IcoChevRightLg /></button>
          <span className="sport-week-datepick-wrap">
            <span className="icon-btn"><IcoCalendar /></span>
            <input
              type="date" className="sport-week-datepick" value={weekStart}
              onChange={(e) => e.target.value && onPickWeek(e.target.value)}
              aria-label="Wybierz tydzień"
            />
          </span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="sport-week-grid-v2">
          {days.map(date => (
            <DayColumn
              key={date}
              date={date}
              isToday={date === today}
              workouts={workouts.filter(w => w.scheduled_date === date).sort((a, b) => a.order_index - b.order_index)}
              onAdd={() => onAddForDay(date)}
              selectedWorkoutId={selectedWorkoutId}
              onSelectWorkout={onSelectWorkout}
              onOpenWorkout={onOpenWorkout}
              onStartSession={onStartSession}
              onToggleComplete={onToggleComplete}
              onCopyWorkout={onCopyWorkout}
              onDeleteWorkout={onDeleteWorkout}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function DayColumn({ date, isToday, workouts, onAdd, selectedWorkoutId, onSelectWorkout, onOpenWorkout, onStartSession, onToggleComplete, onCopyWorkout, onDeleteWorkout }: {
  date: string; isToday: boolean; workouts: ScheduledWorkout[]; onAdd: () => void;
  selectedWorkoutId: string | null; onSelectWorkout: (w: ScheduledWorkout) => void;
  onOpenWorkout: (w: ScheduledWorkout) => void; onStartSession: (w: ScheduledWorkout) => void;
  onToggleComplete: (w: ScheduledWorkout) => void;
  onCopyWorkout: (w: ScheduledWorkout) => void; onDeleteWorkout: (w: ScheduledWorkout) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const d = new Date(`${date}T12:00:00`);
  const weekdayShort = WEEKDAY_LABELS_LONG[(d.getDay() + 6) % 7].slice(0, 3).toUpperCase();

  return (
    <div ref={setNodeRef} className={`sport-day-col${isToday ? ' is-today' : ''}${isOver ? ' is-drop-target' : ''}`}>
      <div className="sport-day-head">
        <span className="sport-day-name">{weekdayShort}</span>
        <span className="sport-day-date">{d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}</span>
        {isToday && <span className="sport-day-today-tag">DZIŚ</span>}
      </div>
      <div className="sport-day-cards">
        {workouts.length ? workouts.map(w => (
          <WorkoutCard key={w.id} workout={w} selected={selectedWorkoutId === w.id} onSelect={() => onSelectWorkout(w)} onOpen={() => onOpenWorkout(w)} onStart={() => onStartSession(w)} onToggleComplete={() => onToggleComplete(w)} onCopy={() => onCopyWorkout(w)} onDelete={() => onDeleteWorkout(w)} />
        )) : (
          <div className="sport-day-empty">
            <IcoCalendar />
            <span>Brak treningu</span>
          </div>
        )}
      </div>
      <button className="sport-day-add" onClick={onAdd}>+</button>
    </div>
  );
}

const STATUS_LABEL: Record<ScheduledWorkout['status'], string> = {
  planned: 'todo', in_progress: 'active', completed: 'done', skipped: 'cancelled', cancelled: 'cancelled',
};

function WorkoutCard({ workout, selected, onSelect, onOpen, onStart, onToggleComplete, onCopy, onDelete }: {
  workout: ScheduledWorkout; selected: boolean; onSelect: () => void; onOpen: () => void; onStart: () => void; onToggleComplete: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: workout.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 5 } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={`sport-workout-card${isDragging ? ' is-dragging' : ''}${selected ? ' is-selected' : ''}${workout.status === 'completed' ? ' is-completed' : ''}`} onClick={onSelect}>
      <button className="sport-workout-kind" {...attributes} {...listeners} aria-label="Przenies trening" onClick={(e) => e.stopPropagation()}><IcoDumbbell /></button>
      <div className="sport-workout-main">
        <div className="sport-workout-title">{workout.title}</div>
        {workout.subtitle && <div className="sport-workout-subtitle">{workout.subtitle}</div>}
        <div className="sport-workout-meta">
          {workout.planned_duration_min ? <span>{workout.planned_duration_min} min</span> : null}
          <StatusBadge status={STATUS_LABEL[workout.status]} />
        </div>
      </div>
      <div className="sport-workout-actions" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn" title="Edytuj" aria-label="Edytuj trening" onClick={onOpen}>
          <IcoEdit />
        </button>
        <button className="icon-btn" title="Usuń" aria-label="Usun trening" onClick={onDelete}>
          <IcoTrash />
        </button>
        <MoreMenu items={[
          ...(workout.status === 'planned' ? [{ label: 'Start treningu', onClick: onStart }] : []),
          { label: workout.status === 'completed' ? 'Cofnij wykonanie' : 'Oznacz wykonany', onClick: onToggleComplete },
          { label: 'Duplikuj', onClick: onCopy },
          { label: 'Usuń', onClick: onDelete, danger: true },
        ]} />
      </div>
    </div>
  );
}
