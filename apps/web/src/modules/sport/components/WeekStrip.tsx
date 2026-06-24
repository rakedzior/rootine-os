import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { MoreMenu, StatusBadge } from '@/components/common';
import { addDaysStr, todayStr, WEEKDAY_LABELS_LONG } from '@/features/sport/services/sportPlannerService';
import type { ScheduledWorkout } from '@/features/sport/types';
import { IcoGrip, IcoCopy, IcoCalendar, IcoChevLeft, IcoChevRightLg, IcoPlay } from './icons';

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
  onOpenWorkout: (workout: ScheduledWorkout) => void;
  onStartSession: (workout: ScheduledWorkout) => void;
  onCopyWorkout: (workout: ScheduledWorkout) => void;
  onDeleteWorkout: (workout: ScheduledWorkout) => void;
  onMoveWorkout: (id: string, date: string, orderIndex: number) => void;
}

export function WeekStrip({
  weekStart, workouts, onNavigateWeek, onPickWeek, onAddForDay, onOpenWorkout,
  onStartSession, onCopyWorkout, onDeleteWorkout, onMoveWorkout,
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
              onOpenWorkout={onOpenWorkout}
              onStartSession={onStartSession}
              onCopyWorkout={onCopyWorkout}
              onDeleteWorkout={onDeleteWorkout}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function DayColumn({ date, isToday, workouts, onAdd, onOpenWorkout, onStartSession, onCopyWorkout, onDeleteWorkout }: {
  date: string; isToday: boolean; workouts: ScheduledWorkout[]; onAdd: () => void;
  onOpenWorkout: (w: ScheduledWorkout) => void; onStartSession: (w: ScheduledWorkout) => void;
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
        {workouts.map(w => (
          <WorkoutCard key={w.id} workout={w} onOpen={() => onOpenWorkout(w)} onStart={() => onStartSession(w)} onCopy={() => onCopyWorkout(w)} onDelete={() => onDeleteWorkout(w)} />
        ))}
      </div>
      <button className="sport-day-add" onClick={onAdd}>+</button>
    </div>
  );
}

const STATUS_LABEL: Record<ScheduledWorkout['status'], string> = {
  planned: 'todo', in_progress: 'active', completed: 'done', skipped: 'cancelled', cancelled: 'cancelled',
};

function WorkoutCard({ workout, onOpen, onStart, onCopy, onDelete }: {
  workout: ScheduledWorkout; onOpen: () => void; onStart: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: workout.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 5 } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={`sport-workout-card${isDragging ? ' is-dragging' : ''}`} onClick={onOpen}>
      <button className="sport-drag-handle" {...attributes} {...listeners} aria-label="Przenieś" onClick={(e) => e.stopPropagation()}><IcoGrip /></button>
      <div className="sport-workout-main">
        <div className="sport-workout-title">{workout.title}</div>
        {workout.subtitle && <div className="sport-workout-subtitle">{workout.subtitle}</div>}
        <div className="sport-workout-meta">
          {workout.planned_duration_min ? <span>{workout.planned_duration_min} min</span> : null}
          <StatusBadge status={STATUS_LABEL[workout.status]} />
        </div>
      </div>
      <div className="sport-workout-actions" onClick={(e) => e.stopPropagation()}>
        {workout.status === 'planned' && (
          <button className="icon-btn" title="Rozpocznij" onClick={onStart}><IcoPlay /></button>
        )}
        <button className="icon-btn" title="Kopiuj" onClick={onCopy}><IcoCopy /></button>
        <MoreMenu items={[
          { label: 'Edytuj', onClick: onOpen },
          { label: 'Usuń', onClick: onDelete, danger: true },
        ]} />
      </div>
    </div>
  );
}
