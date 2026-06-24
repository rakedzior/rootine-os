import { useEffect, useState } from 'react';
import { Modal, Field } from '@/components/common';
import { useCreateCycle, useUpdateCycle } from '@/features/sport/cycleHooks';
import type { Sport, TrainingCycle } from '@/features/sport/types';
import { CYCLE_GOAL_PRESETS } from './cycleConstants';

interface CycleEditorModalProps {
  open: boolean;
  onClose: () => void;
  sports: Sport[];
  existing?: TrainingCycle | null;
  onCreated?: (cycle: TrainingCycle) => void;
}

export function CycleEditorModal({ open, onClose, sports, existing, onCreated }: CycleEditorModalProps) {
  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState<string>('hipertrofia');
  const [customGoal, setCustomGoal] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [intensity, setIntensity] = useState('moderate');
  const [trainingsPerWeek, setTrainingsPerWeek] = useState(4);
  const [activeSportIds, setActiveSportIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    const isPreset = CYCLE_GOAL_PRESETS.some(p => p.value === existing?.goal);
    setGoal(existing ? (isPreset ? existing.goal : 'custom') : 'hipertrofia');
    setCustomGoal(existing && !isPreset ? existing.goal : '');
    setStartDate(existing?.start_date ?? new Date().toISOString().split('T')[0]);
    setDurationWeeks(existing?.duration_weeks ?? 8);
    setIntensity(existing?.intensity ?? 'moderate');
    setTrainingsPerWeek(existing?.trainings_per_week ?? 4);
    setActiveSportIds(existing?.active_sport_ids ?? []);
    setNotes(existing?.notes ?? '');
  }, [open, existing]);

  function toggleSport(id: string) {
    setActiveSportIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  async function save() {
    const resolvedGoal = goal === 'custom' ? (customGoal.trim() || 'custom') : goal;
    const fields = {
      name: name.trim(), goal: resolvedGoal, start_date: startDate, duration_weeks: durationWeeks,
      intensity, trainings_per_week: trainingsPerWeek, active_sport_ids: activeSportIds, notes: notes || null,
    };
    if (existing) {
      // Keep end_date consistent with start/duration. Note: this does NOT regenerate the
      // week list (training_cycle_weeks) — changing duration after creation won't add/remove
      // week rows, to avoid silently wiping any deload/test/special tags already set.
      const end = new Date(`${startDate}T12:00:00`);
      end.setDate(end.getDate() + durationWeeks * 7 - 1);
      const end_date = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      await updateCycle.mutateAsync({ id: existing.id, patch: { ...fields, end_date } });
      onClose();
    } else {
      const cycle = await createCycle.mutateAsync(fields);
      onClose();
      onCreated?.(cycle);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edytuj cykl' : 'Nowy cykl treningowy'} size="md"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={save}>Zapisz</button>
      </>}>
      <div className="sport-form">
        <Field label="Nazwa cyklu"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder='np. "Hipertrofia — 8 tygodni"' /></Field>
        <div className="sport-form-row">
          <Field label="Cel cyklu">
            <select className="select" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {CYCLE_GOAL_PRESETS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          {goal === 'custom' && (
            <Field label="Własny cel"><input className="input" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} /></Field>
          )}
        </div>
        <div className="sport-form-row">
          <Field label="Data rozpoczęcia"><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Liczba tygodni"><input className="input" type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(Math.max(1, +e.target.value))} /></Field>
        </div>
        <div className="sport-form-row">
          <Field label="Intensywność">
            <select className="select" value={intensity} onChange={(e) => setIntensity(e.target.value)}>
              <option value="easy">Niska</option>
              <option value="moderate">Średnia</option>
              <option value="hard">Wysoka</option>
            </select>
          </Field>
          <Field label="Treningów / tydzień"><input className="input" type="number" min={1} max={14} value={trainingsPerWeek} onChange={(e) => setTrainingsPerWeek(Math.max(1, +e.target.value))} /></Field>
        </div>
        <Field label="Aktywne sporty w cyklu">
          <div className="sport-chip-group">
            {sports.map(s => (
              <button key={s.id} type="button" className={`sport-chip${activeSportIds.includes(s.id) ? ' is-active' : ''}`} onClick={() => toggleSport(s.id)}>{s.name}</button>
            ))}
          </div>
        </Field>
        <Field label="Notatki"><textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
