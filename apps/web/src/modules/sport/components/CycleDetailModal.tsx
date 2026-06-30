import { useEffect, useState } from 'react';
import { Modal, StatusBadge, ConfirmDelete, MoreMenu } from '@/components/common';
import { useCreateScheduledWorkout } from '@/features/sport/hooks';
import {
  useCycle, useCycleWeeks, useSetActiveCycle, usePauseCycle, useEndCycle,
  useArchiveCycle, useDuplicateCycle, useDeleteCycle, useUpdateCycleWeek,
} from '@/features/sport/cycleHooks';
import { addDaysStr, WEEKDAY_LABELS } from '@/features/sport/services/sportPlannerService';
import type { Sport, TrainingCycleWeek, WorkoutTemplate } from '@/features/sport/types';
import { CYCLE_STATUS_BADGE_KEY, CYCLE_STATUS_LABEL, cycleGoalLabel } from './cycleConstants';
import { CycleEditorModal } from './CycleEditorModal';

interface CycleDetailModalProps {
  cycleId: string | null;
  onClose: () => void;
  templates: WorkoutTemplate[];
  sports: Sport[];
  exercises?: unknown[];
}

type WeekPlanSource = 'template' | 'manual';

export function CycleDetailModal({ cycleId, onClose, templates, sports }: CycleDetailModalProps) {
  const { data: cycle } = useCycle(cycleId);
  const { data: weeks = [] } = useCycleWeeks(cycleId);

  const setActive = useSetActiveCycle();
  const pause = usePauseCycle();
  const end = useEndCycle();
  const archive = useArchiveCycle();
  const duplicate = useDuplicateCycle();
  const deleteCycle = useDeleteCycle();
  const updateWeek = useUpdateCycleWeek(cycleId ?? '');
  const createManual = useCreateScheduledWorkout();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [planSource, setPlanSource] = useState<WeekPlanSource>(templates.length > 0 ? 'template' : 'manual');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const [manualTitle, setManualTitle] = useState('');
  const [selectedWeekday, setSelectedWeekday] = useState(1);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!selectedWeekId && weeks.length > 0) setSelectedWeekId(weeks[0].id);
  }, [selectedWeekId, weeks]);

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
      setPlanSource('template');
    }
  }, [selectedTemplateId, templates]);

  if (!cycle) return null;

  const selectedWeek = weeks.find(w => w.id === selectedWeekId) ?? weeks[0] ?? null;
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) ?? null;
  const planTitle = planSource === 'template' ? selectedTemplate?.name.trim() : manualTitle.trim();
  const selectedDate = selectedWeek ? addDaysStr(selectedWeek.start_date, selectedWeekday - 1) : '';

  function weekPlanMeta(week: TrainingCycleWeek): string {
    if (!week.goal) return 'Kliknij i zastosuj plan z panelu po lewej.';
    try {
      const meta = week.notes ? JSON.parse(week.notes) as { source?: string; templateId?: string; weekday?: number } : null;
      const dayLabel = typeof meta?.weekday === 'number' ? `${WEEKDAY_LABELS[meta.weekday - 1]} · ` : '';
      if (meta?.source === 'template') {
        const template = templates.find(t => t.id === meta.templateId);
        return template?.estimated_duration_min ? `${dayLabel}Szablon · ${template.estimated_duration_min} min` : `${dayLabel}Szablon`;
      }
      if (meta?.source === 'manual') return `${dayLabel}Wpis ręczny`;
    } catch {
      return 'Plan tygodnia';
    }
    return 'Plan tygodnia';
  }

  function planPatch(): Pick<TrainingCycleWeek, 'goal' | 'notes'> | null {
    if (!planTitle) return null;
    return {
      goal: planTitle,
      notes: planSource === 'template'
        ? JSON.stringify({ source: 'template', templateId: selectedTemplateId, weekday: selectedWeekday })
        : JSON.stringify({ source: 'manual', weekday: selectedWeekday }),
    };
  }

  async function applyPlan(scope: 'selected' | 'all') {
    const patch = planPatch();
    if (!patch) return;
    const targetWeeks = scope === 'all' ? weeks : weeks.filter(w => w.id === selectedWeek?.id);
    if (targetWeeks.length === 0) return;
    setIsApplying(true);
    try {
      await Promise.all(targetWeeks.map(w => createManual.mutateAsync({
        scheduled_date: addDaysStr(w.start_date, selectedWeekday - 1),
        sport_id: planSource === 'template' && selectedTemplate ? selectedTemplate.sport_id : sports[0]?.id ?? null,
        template_id: planSource === 'template' && selectedTemplate ? selectedTemplate.id : null,
        title: patch.goal ?? 'Trening',
        source_type: planSource === 'template' ? 'template' : 'manual',
      })));
      await Promise.all(targetWeeks.map(w => updateWeek.mutateAsync({ id: w.id, patch })));
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <>
      <Modal open={!!cycleId} onClose={onClose} title={cycle.name} size="lg" className="sport-cycle-detail-modal">
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

          {cycle.notes && <p className="sport-cycle-notes">{cycle.notes}</p>}

          <div className="sport-cycle-week-planner">
            <div className="sport-cycle-plan-composer">
              <div>
                <h4>Plan tygodni</h4>
                <p>Wybierz szablon albo wpisz plan ręcznie, wskaż dzień i dodaj go do jednego tygodnia albo całego cyklu.</p>
              </div>

              <div className="sport-cycle-plan-mode" role="group" aria-label="Źródło planu">
                <button type="button" className={planSource === 'template' ? 'is-active' : ''} disabled={templates.length === 0} onClick={() => setPlanSource('template')}>Szablon</button>
                <button type="button" className={planSource === 'manual' ? 'is-active' : ''} onClick={() => setPlanSource('manual')}>Ręcznie</button>
              </div>

              {planSource === 'template' ? (
                <select className="select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  {templates.length === 0 && <option value="">Brak szablonów</option>}
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              ) : (
                <input className="input" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="np. Upper A / Bieg 45 min / Mobilność" />
              )}

              <div className="sport-cycle-day-picker" role="group" aria-label="Dzień treningu">
                {WEEKDAY_LABELS.map((label, index) => {
                  const weekday = index + 1;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={selectedWeekday === weekday ? 'is-active' : ''}
                      onClick={() => setSelectedWeekday(weekday)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedDate && <div className="sport-cycle-selected-date">Wybrany dzień: {selectedDate}</div>}

              <div className="sport-cycle-plan-actions">
                <button className="btn btn-secondary btn-sm" disabled={!planTitle || !selectedWeek || isApplying} onClick={() => applyPlan('selected')}>
                  Do tygodnia {selectedWeek?.week_number ?? ''}
                </button>
                <button className="btn btn-primary btn-sm" disabled={!planTitle || weeks.length === 0 || isApplying} onClick={() => applyPlan('all')}>
                  Do wszystkich tygodni
                </button>
              </div>
            </div>

            <div className="sport-cycle-week-grid" aria-label="Tygodnie cyklu">
              {weeks.map(w => (
                <button
                  key={w.id}
                  type="button"
                  className={`sport-cycle-week-card${selectedWeek?.id === w.id ? ' is-selected' : ''}${w.goal ? ' has-plan' : ''}`}
                  onClick={() => setSelectedWeekId(w.id)}
                >
                  <span className="sport-cycle-week-number">Tydzień {w.week_number}</span>
                  <span className="sport-cycle-week-dates">{w.start_date} – {w.end_date}</span>
                  <strong>{w.goal || 'Bez planu'}</strong>
                  <span>{weekPlanMeta(w)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <CycleEditorModal open={editOpen} onClose={() => setEditOpen(false)} sports={sports} existing={cycle} />
      <ConfirmDelete open={confirmDelete} onClose={() => setConfirmDelete(false)} label={`cykl "${cycle.name}"`} onConfirm={() => { deleteCycle.mutate(cycle.id); onClose(); }} />
    </>
  );
}
