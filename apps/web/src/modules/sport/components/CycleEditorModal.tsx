import { useEffect, useState } from 'react';
import { Modal, Field } from '@/components/common';
import { useCreateCycle, useUpdateCycle } from '@/features/sport/cycleHooks';
import type { Sport, TrainingCycle } from '@/features/sport/types';
import { CYCLE_GOAL_PRESETS, cycleGoalLabel } from './cycleConstants';

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
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
  }, [open, existing]);

  function toggleSport(id: string) {
    setActiveSportIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  async function save() {
    const resolvedGoal = goal === 'custom' ? (customGoal.trim() || 'custom') : goal;
    const fallbackName = `${cycleGoalLabel(resolvedGoal)} · ${durationWeeks} tyg.`;
    const fields = {
      name: name.trim() || fallbackName, goal: resolvedGoal, start_date: startDate, duration_weeks: durationWeeks,
      intensity, trainings_per_week: trainingsPerWeek, active_sport_ids: activeSportIds, notes: notes || null,
    };
    try {
      if (existing) {
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
    } catch {
      setFormError('Nie udało się zapisać cyklu. Spróbuj ponownie.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edytuj cykl' : 'Nowy cykl'} size="md" className="sport-cycle-editor-modal"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={save}>{existing ? 'Zapisz zmiany' : 'Utwórz cykl'}</button>
      </>}>
      <div className="sport-form sport-cycle-editor-form">
        <p className="sport-cycle-editor-intro">Wybierz cel i ramy czasowe. Mezocykle oraz konkretne treningi dodasz po utworzeniu cyklu.</p>

        <Field label="Cel">
          <div className="sport-cycle-goal-grid">
            {CYCLE_GOAL_PRESETS.map(g => (
              <button key={g.value} type="button" className={`sport-cycle-goal-option${goal === g.value ? ' is-active' : ''}`} onClick={() => setGoal(g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        </Field>

        {goal === 'custom' && (
          <Field label="Własny cel"><input className="input" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder="np. przygotowanie do zawodów" /></Field>
        )}

        <div className="sport-cycle-quick-row">
          <Field label="Start"><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Długość">
            <div className="sport-cycle-duration-options">
              {[4, 6, 8, 12].map(weeks => (
                <button key={weeks} type="button" className={durationWeeks === weeks ? 'is-active' : ''} onClick={() => setDurationWeeks(weeks)}>{weeks} tyg.</button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Treningów tygodniowo">
          <div className="sport-cycle-frequency-options">
            {[2, 3, 4, 5, 6].map(count => (
              <button key={count} type="button" className={trainingsPerWeek === count ? 'is-active' : ''} onClick={() => setTrainingsPerWeek(count)}>{count}</button>
            ))}
          </div>
        </Field>

        <Field label="Nazwa">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`${cycleGoalLabel(goal === 'custom' ? customGoal || 'custom' : goal)} · ${durationWeeks} tyg.`} />
        </Field>

        <details className="sport-cycle-advanced" open={!!existing}>
          <summary>Opcje zaawansowane</summary>
          <div className="sport-cycle-advanced-body">
            <div className="sport-form-row">
              <Field label="Intensywność">
                <select className="select" value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                  <option value="easy">Niska</option>
                  <option value="moderate">Średnia</option>
                  <option value="hard">Wysoka</option>
                </select>
              </Field>
              <Field label="Inna liczba tygodni"><input className="input" type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(Math.max(1, +e.target.value))} /></Field>
            </div>
            <Field label="Aktywne sporty">
              <div className="sport-chip-group">
                {sports.map(s => (
                  <button key={s.id} type="button" className={`sport-chip${activeSportIds.includes(s.id) ? ' is-active' : ''}`} onClick={() => toggleSport(s.id)}>{s.name}</button>
                ))}
              </div>
            </Field>
            <Field label="Notatki"><textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>
        </details>

        {formError && <div className="sport-form-error" role="alert">{formError}</div>}
      </div>
    </Modal>
  );
}
