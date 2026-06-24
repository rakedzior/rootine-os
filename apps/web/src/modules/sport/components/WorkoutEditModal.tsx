import { useEffect, useState } from 'react';
import { Modal, Field, ConfirmDelete } from '@/components/common';
import type { EditScope, ScheduledWorkout } from '@/features/sport/types';
import { ScopeChoiceModal } from './ScopeChoiceModal';

interface WorkoutEditModalProps {
  workout: ScheduledWorkout | null;
  onClose: () => void;
  onSave: (patch: Partial<ScheduledWorkout>, scope: EditScope) => void;
  onDelete: (scope: EditScope) => void;
}

/** Edit/delete drawer for a single scheduled workout card — spec §17.4/§17.5. */
export function WorkoutEditModal({ workout, onClose, onSave, onDelete }: WorkoutEditModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [scopeFor, setScopeFor] = useState<'save' | 'delete' | null>(null);
  const [confirmPlainDelete, setConfirmPlainDelete] = useState(false);

  useEffect(() => {
    if (!workout) return;
    setTitle(workout.title);
    setDate(workout.scheduled_date);
    setDuration(workout.planned_duration_min ?? '');
    setNotes(workout.notes ?? '');
  }, [workout]);

  if (!workout) return null;
  const isRecurring = !!(workout.block_id || workout.series_id);

  function requestSave() {
    if (isRecurring) { setScopeFor('save'); return; }
    onSave({ title: title.trim(), scheduled_date: date, planned_duration_min: duration === '' ? null : duration, notes: notes || null }, 'this');
  }
  function requestDelete() {
    if (isRecurring) { setScopeFor('delete'); return; }
    setConfirmPlainDelete(true);
  }

  return (
    <>
      <Modal open={!!workout} onClose={onClose} title="Edytuj trening" size="sm"
        footer={<>
          <button className="btn btn-danger btn-sm" onClick={requestDelete}>Usuń</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary btn-sm" disabled={!title.trim()} onClick={requestSave}>Zapisz</button>
        </>}>
        <div className="sport-form">
          <Field label="Nazwa"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Data"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Czas (min)"><input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : +e.target.value)} /></Field>
          <Field label="Notatka"><textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
      </Modal>
      <ConfirmDelete open={confirmPlainDelete} onClose={() => setConfirmPlainDelete(false)} label={`trening "${workout.title}"`} onConfirm={() => onDelete('this')} />
      <ScopeChoiceModal
        open={!!scopeFor} onClose={() => setScopeFor(null)} title={scopeFor === 'delete' ? 'Co usunąć?' : 'Co zmienić?'}
        onChoose={(scope) => scopeFor === 'delete'
          ? onDelete(scope)
          : onSave({ title: title.trim(), scheduled_date: date, planned_duration_min: duration === '' ? null : duration, notes: notes || null }, scope)}
      />
    </>
  );
}
