import { useState } from 'react';
import { Modal, ProgressBar, StatusBadge, ConfirmDelete, KpiCard, MoreMenu } from '@/components/common';
import {
  useCycle, useCyclePhases, useCycleWeeks, useCycleProgress, useSetActiveCycle, usePauseCycle,
  useEndCycle, useArchiveCycle, useDuplicateCycle, useDeleteCycle, useDeletePhase, useUpdateCycleWeek,
} from '@/features/sport/cycleHooks';
import type { Exercise, Sport, WorkoutTemplate } from '@/features/sport/types';
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

          <div className="sport-cycle-section">
            <div className="sport-cycle-section-head">
              <h4>Mezocykle</h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setPhaseModalOpen(true)}>+ Dodaj mezocykl</button>
            </div>
            {phases.length === 0 ? (
              <p className="sport-cycle-empty-hint">Brak mezocykli — dodaj pierwszy, aby zaplanować treningi w tym cyklu.</p>
            ) : (
              <div className="sport-cycle-phase-list">
                {phases.map(p => (
                  <div key={p.id} className="sport-cycle-phase-row">
                    <div>
                      <strong>{p.name}</strong>
                      {p.goal && <span className="sport-cycle-phase-goal"> · {p.goal}</span>}
                      <div className="sport-history-row-meta">{p.start_date} – {p.end_date} · {p.duration_weeks} tyg.</div>
                    </div>
                    <button className="icon-btn" onClick={() => deletePhase.mutate(p.id)} title="Usuń mezocykl">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sport-cycle-section">
            <h4>Tygodnie</h4>
            <table className="sport-cycle-weeks-table">
              <thead><tr><th>Tydz.</th><th>Daty</th><th>Typ</th><th>Cel tygodnia</th></tr></thead>
              <tbody>
                {weeks.map(w => (
                  <tr key={w.id}>
                    <td>{w.week_number}</td>
                    <td className="sport-history-row-meta">{w.start_date} – {w.end_date}</td>
                    <td>
                      <select className="select" value={w.week_type} onChange={(e) => updateWeek.mutate({ id: w.id, patch: { week_type: e.target.value as typeof w.week_type } })}>
                        {Object.entries(CYCLE_WEEK_TYPE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                    </td>
                    <td><input className="input sport-set-cell" defaultValue={w.goal ?? ''} onBlur={(e) => { if (e.target.value !== (w.goal ?? '')) updateWeek.mutate({ id: w.id, patch: { goal: e.target.value || null } }); }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
