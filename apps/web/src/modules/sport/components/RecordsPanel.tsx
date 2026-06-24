import { useState } from 'react';
import { ModuleCard, ModuleHeader } from '@/components/layout/primitives';
import { EmptyState, Modal, Field, MoreMenu, ConfirmDelete } from '@/components/common';
import { useRecords, useCreateRecord, useUpdateRecord, useDeleteRecord, useExercises, useSports } from '@/features/sport/hooks';
import type { MetricType, PersonalRecord } from '@/features/sport/types';

const METRIC_LABEL: Record<MetricType, string> = {
  one_rep_max_estimated: '1RM (szac.)', max_weight: 'Maks. ciężar', max_reps: 'Maks. powt.', max_volume: 'Maks. objętość',
  best_5k_time: 'Najlepszy czas 5 km', best_10k_time: 'Najlepszy czas 10 km', longest_distance: 'Najdłuższy dystans', custom: 'Inny',
};

export function RecordsPanel() {
  const { data: top = [] } = useRecords({ limit: 4 });
  const [fullOpen, setFullOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalRecord | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <ModuleCard className="sport-panel">
      <ModuleHeader title="Rekordy" actions={<button className="btn btn-ghost btn-sm" onClick={() => setFullOpen(true)}>Zobacz wszystkie rekordy</button>} />
      {top.length === 0 ? (
        <EmptyState title="Rekordy pojawią się po zapisaniu treningów" desc="Możesz też dodać je ręcznie." cta="+ Dodaj rekord" onCta={() => setCreating(true)} />
      ) : (
        <div className="sport-records-list">
          {top.map(r => <RecordRow key={r.id} record={r} onEdit={() => setEditing(r)} />)}
        </div>
      )}
      <RecordFormModal open={creating} onClose={() => setCreating(false)} />
      <RecordFormModal open={!!editing} onClose={() => setEditing(null)} existing={editing} />
      <FullRecordsModal open={fullOpen} onClose={() => setFullOpen(false)} onAdd={() => setCreating(true)} onEdit={setEditing} />
    </ModuleCard>
  );
}

function RecordRow({ record, onEdit }: { record: PersonalRecord; onEdit: () => void }) {
  const deleteRecord = useDeleteRecord();
  return (
    <div className="sport-record-row">
      <div>
        <div className="sport-record-title">{record.title}</div>
        <div className="sport-record-date">{record.occurred_on}</div>
      </div>
      <div className="sport-record-value">{record.value_numeric ?? record.value_text}{record.unit ? ` ${record.unit}` : ''}</div>
      <MoreMenu items={[{ label: 'Edytuj', onClick: onEdit }, { label: 'Usuń', onClick: () => deleteRecord.mutate(record.id), danger: true }]} />
    </div>
  );
}

function FullRecordsModal({ open, onClose, onAdd, onEdit }: { open: boolean; onClose: () => void; onAdd: () => void; onEdit: (r: PersonalRecord) => void }) {
  const { data: all = [] } = useRecords();
  return (
    <Modal open={open} onClose={onClose} title="Rekordy" size="lg" footer={<button className="btn btn-primary btn-sm" onClick={onAdd}>+ Dodaj rekord</button>}>
      <div className="sport-records-list">
        {all.map(r => <RecordRow key={r.id} record={r} onEdit={() => onEdit(r)} />)}
      </div>
    </Modal>
  );
}

function RecordFormModal({ open, onClose, existing }: { open: boolean; onClose: () => void; existing?: PersonalRecord | null }) {
  const { data: exercises = [] } = useExercises();
  const { data: sports = [] } = useSports();
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteRecord = useDeleteRecord();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [metricType, setMetricType] = useState<MetricType>(existing?.metric_type ?? 'max_weight');
  const [value, setValue] = useState(existing?.value_numeric ?? 0);
  const [unit, setUnit] = useState(existing?.unit ?? 'kg');
  const [occurredOn, setOccurredOn] = useState(existing?.occurred_on ?? new Date().toISOString().split('T')[0]);
  const [exerciseId, setExerciseId] = useState(existing?.exercise_id ?? '');
  const [sportId, setSportId] = useState(existing?.sport_id ?? '');

  if (!open) return null;

  async function save() {
    const payload = { title: title.trim(), metric_type: metricType, value_numeric: value, unit, occurred_on: occurredOn, exercise_id: exerciseId || null, sport_id: sportId || null };
    if (existing) await updateRecord.mutateAsync({ id: existing.id, patch: payload });
    else await createRecord.mutateAsync(payload);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edytuj rekord' : 'Dodaj rekord'} size="sm"
      footer={<>
        {existing && <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Usuń</button>}
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" disabled={!title.trim()} onClick={save}>Zapisz</button>
      </>}>
      <div className="sport-form">
        <Field label="Nazwa"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Przysiad ze sztangą" /></Field>
        <Field label="Typ rekordu">
          <select className="select" value={metricType} onChange={(e) => setMetricType(e.target.value as MetricType)}>
            {Object.entries(METRIC_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </Field>
        <div className="sport-form-row">
          <Field label="Wartość"><input className="input" type="number" value={value} onChange={(e) => setValue(+e.target.value)} /></Field>
          <Field label="Jednostka"><input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} /></Field>
        </div>
        <Field label="Data"><input className="input" type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} /></Field>
        <Field label="Ćwiczenie (opcjonalnie)">
          <select className="select" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            <option value="">—</option>
            {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
        <Field label="Sport (opcjonalnie)">
          <select className="select" value={sportId} onChange={(e) => setSportId(e.target.value)}>
            <option value="">—</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      </div>
      {existing && (
        <ConfirmDelete open={confirmDelete} onClose={() => setConfirmDelete(false)} label={`rekord "${existing.title}"`} onConfirm={() => { deleteRecord.mutate(existing.id); onClose(); }} />
      )}
    </Modal>
  );
}
