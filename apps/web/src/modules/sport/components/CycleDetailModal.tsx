import { useEffect, useMemo, useState } from 'react';
import { Modal, ProgressBar, StatusBadge, ConfirmDelete, KpiCard, MoreMenu } from '@/components/common';
import {
  useCycle, useCyclePhases, useCycleWeeks, useCycleProgress, useCycleWorkouts, useSetActiveCycle, usePauseCycle,
  useEndCycle, useArchiveCycle, useDuplicateCycle, useDeleteCycle, useDeletePhase, useUpdateCycleWeek,
} from '@/features/sport/cycleHooks';
import { addDaysStr, todayStr, WEEKDAY_LABELS_LONG } from '@/features/sport/services/sportPlannerService';
import type { Exercise, ScheduledWorkout, Sport, WorkoutTemplate } from '@/features/sport/types';
import { CYCLE_STATUS_BADGE_KEY, CYCLE_STATUS_LABEL, CYCLE_WEEK_TYPE_LABEL, cycleGoalLabel } from './cycleConstants';
import { CyclePhaseModal } from './CyclePhaseModal';
import { CycleEditorModal } from './CycleEditorModal';

interface CycleDetailModalProps {
  cycleId: string | null;
  onClose: () => void;
  templates: WorkoutTemplate[];
  sports: Sport[];
  exercises: Exercise[];
}

export function CycleDetailModal({ cycleId, onClose, templates, sports, exercises }: CycleDetailModalProps) {
  const { data: cycle } = useCycle(cycleId);
  const { data: phases = [] } = useCyclePhases(cycleId);
  const { data: weeks = [] } = useCycleWeeks(cycleId);
  const { data: progress } = useCycleProgress(cycleId);

  const setActive = useSetActiveCycle();
  const pause = usePauseCycle();
  const end = useEndCycle();
  const archive = useArchiveCycle();
  const duplicate = useDuplicateCycle();
  const deleteCycle = useDeleteCycle();
  const deletePhase = useDeletePhase(cycleId ?? '');
  const updateWeek = useUpdateCycleWeek(cycleId ?? '');

  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(1);

  useEffect(() => {
    if (!weeks.length) return;
    const today = todayStr();
    const current = weeks.find((week) => week.start_date <= today && today <= week.end_date);
    const fallback = current ?? weeks[0];
    if (!weeks.some((week) => week.week_number === selectedWeekNumber)) {
      setSelectedWeekNumber(fallback.week_number);
    }
  }, [selectedWeekNumber, weeks]);

  const selectedWeek = useMemo(
    () => weeks.find((week) => week.week_number === selectedWeekNumber) ?? weeks[0] ?? null,
    [selectedWeekNumber, weeks],
  );
  const { data: weekWorkouts = [] } = useCycleWorkouts(cycleId, selectedWeek?.start_date ?? null, selectedWeek?.end_date ?? null);
  const selectedWeekDays = useMemo(
    () => selectedWeek ? Array.from({ length: 7 }, (_, index) => addDaysStr(selectedWeek.start_date, index)) : [],
    [selectedWeek],
  );

  if (!cycle) return null;

  return (
    <>
      <Modal open={!!cycleId} onClose={onClose} title={cycle.name} size="lg">
        <div className="sport-cycle-detail">
          <div className="sport-cycle-detail-head">
            <StatusBadge status={CYCLE_STATUS_BADGE_KEY[cycle.status]} label={CYCLE_STATUS_LABEL[cycle.status]} />
            <span className="sport-cycle-detail-meta">{cycleGoalLabel(cycle.goal)} · {cycle.start_date} – {cycle.end_date} · {cycle.duration_weeks} tyg.</span>
            <MoreMenu items={[
              { label: 'Edytuj', onClick: () => setEditOpen(true) },
              { label: 'Duplikuj', onClick: () => duplicate.mutate(cycle.id) },
              ...(cycle.status !== 'archived' ? [{ label: 'Archiwizuj', onClick: () => archive.mutate(cycle.id) }] : []),
              { label: 'Usuń', onClick: () => setConfirmDelete(true), danger: true },
            ]} />
          </div>

          <div className="sport-cycle-detail-status-actions">
            {cycle.status !== 'active' && cycle.status !== 'completed' && cycle.status !== 'archived' && (
              <button className="btn btn-primary btn-sm" onClick={() => setActive.mutate(cycle.id)}>Aktywuj</button>
            )}
            {cycle.status === 'active' && (
              <button className="btn btn-secondary btn-sm" onClick={() => pause.mutate(cycle.id)}>Wstrzymaj</button>
            )}
            {(cycle.status === 'active' || cycle.status === 'paused') && (
              <button className="btn btn-secondary btn-sm" onClick={() => end.mutate(cycle.id)}>Zakończ cykl</button>
            )}
          </div>

          {progress && (
            <div className="sport-cycle-progress">
              <ProgressBar value={progress.completionPercent} />
              <div className="sport-cycle-kpis">
                <KpiCard label="Wykonanie" value={`${progress.completionPercent}%`} tone="blue" />
                <KpiCard label="Wykonane" value={progress.completedCount} sub={`z ${progress.plannedCount}`} tone="green" />
                <KpiCard label="Pominięte" value={progress.skippedCount} tone="amber" />
                <KpiCard label="Objętość" value={`${Math.round(progress.totalVolumeKg)} kg`} tone="violet" />
              </div>
            </div>
          )}

          {cycle.notes && <p className="sport-cycle-notes">{cycle.notes}</p>}

          <div className="sport-cycle-workspace">
            <aside className="sport-cycle-left">
              <div className="sport-cycle-section">
                <div className="sport-cycle-section-head">
                  <h4>Tygodnie</h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPhaseModalOpen(true)}>+ Dodaj plan</button>
                </div>
                <div className="sport-cycle-week-list">
                  {weeks.map((week) => (
                    <button
                      key={week.id}
                      type="button"
                      className={`sport-cycle-week-item${selectedWeek?.id === week.id ? ' is-active' : ''}`}
                      onClick={() => setSelectedWeekNumber(week.week_number)}
                    >
                      <span>Tydzień {week.week_number}</span>
                      <small>{week.start_date} - {week.end_date}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sport-cycle-section">
                <h4>Plany treningów</h4>
                {phases.length === 0 ? (
                  <p className="sport-cycle-empty-hint">Dodaj pierwszy plan, aby wypełnić dni treningami.</p>
                ) : (
                  <div className="sport-cycle-phase-list">
                    {phases.map(p => (
                      <div key={p.id} className="sport-cycle-phase-row">
                        <div>
                          <strong>{p.name}</strong>
                          {p.goal && <span className="sport-cycle-phase-goal"> · {p.goal}</span>}
                          <div className="sport-history-row-meta">{p.start_date} - {p.end_date} · {p.duration_weeks} tyg.</div>
                        </div>
                        <button className="icon-btn" onClick={() => deletePhase.mutate(p.id)} title="Usuń plan">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="sport-cycle-week-main">
              {selectedWeek ? (
                <>
                  <div className="sport-cycle-week-head">
                    <div>
                      <h4>Tydzień {selectedWeek.week_number}</h4>
                      <div className="sport-history-row-meta">{selectedWeek.start_date} - {selectedWeek.end_date}</div>
                    </div>
                    <div className="sport-cycle-week-controls">
                      <select className="select" value={selectedWeek.week_type} onChange={(e) => updateWeek.mutate({ id: selectedWeek.id, patch: { week_type: e.target.value as typeof selectedWeek.week_type } })}>
                        {Object.entries(CYCLE_WEEK_TYPE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                      <input
                        className="input sport-set-cell"
                        defaultValue={selectedWeek.goal ?? ''}
                        placeholder="Cel tygodnia"
                        onBlur={(e) => {
                          if (e.target.value !== (selectedWeek.goal ?? '')) updateWeek.mutate({ id: selectedWeek.id, patch: { goal: e.target.value || null } });
                        }}
                      />
                    </div>
                  </div>

                  <div className="sport-cycle-days-grid">
                    {selectedWeekDays.map((date) => (
                      <CycleDayColumn key={date} date={date} workouts={weekWorkouts.filter((workout) => workout.scheduled_date === date)} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="sport-cycle-empty-hint">Brak tygodni w tym cyklu.</p>
              )}
            </section>

            <aside className="sport-cycle-templates">
              <div className="sport-cycle-section">
                <h4>Szablony</h4>
                {templates.length === 0 ? (
                  <p className="sport-cycle-empty-hint">Brak szablonów treningów.</p>
                ) : (
                  <div className="sport-cycle-template-list">
                    {templates.slice(0, 8).map((template) => (
                      <div key={template.id} className="sport-cycle-template-item">
                        <strong>{template.name}</strong>
                        <small>{template.subtitle || (template.estimated_duration_min ? `${template.estimated_duration_min} min` : 'Szablon treningu')}</small>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setPhaseModalOpen(true)}>Zastosuj plan do tygodni</button>
              </div>
            </aside>
          </div>
        </div>
      </Modal>

      <CyclePhaseModal
        open={phaseModalOpen} onClose={() => setPhaseModalOpen(false)} cycleId={cycle.id} nextOrderIndex={phases.length}
        defaultDate={cycle.start_date} templates={templates} sports={sports} exercises={exercises}
      />
      <CycleEditorModal open={editOpen} onClose={() => setEditOpen(false)} sports={sports} existing={cycle} />
      <ConfirmDelete open={confirmDelete} onClose={() => setConfirmDelete(false)} label={`cykl "${cycle.name}"`} onConfirm={() => { deleteCycle.mutate(cycle.id); onClose(); }} />
    </>
  );
}

function CycleDayColumn({ date, workouts }: { date: string; workouts: ScheduledWorkout[] }) {
  const d = new Date(`${date}T12:00:00`);
  const weekday = WEEKDAY_LABELS_LONG[(d.getDay() + 6) % 7];
  return (
    <div className="sport-cycle-day">
      <div className="sport-day-head">
        <span className="sport-day-name">{weekday}</span>
        <span className="sport-day-date">{d.getDate()}.{String(d.getMonth() + 1).padStart(2, '0')}</span>
      </div>
      <div className="sport-cycle-day-drop">
        {workouts.length === 0 ? (
          <span>Wolny dzień</span>
        ) : workouts.map((workout) => (
          <article key={workout.id} className="sport-cycle-workout-chip">
            <strong>{workout.title}</strong>
            {workout.subtitle && <small>{workout.subtitle}</small>}
          </article>
        ))}
      </div>
    </div>
  );
}
