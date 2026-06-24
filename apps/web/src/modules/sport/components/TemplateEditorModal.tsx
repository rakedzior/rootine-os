import { useEffect, useState } from 'react';
import { Modal, Field, IcoTrash, IcoPlus, IcoChevRight, IconBtn } from '@/components/common';
import { useCreateExercise } from '@/features/sport/hooks';
import type { Exercise, Sport, WorkoutTemplateFull } from '@/features/sport/types';
import type { TemplateExerciseInput } from '@/features/sport/services/sportRepository';
import { SportField } from './SportField';
import { ExercisePicker } from './ExercisePicker';

interface EditableSet {
  set_index: number; target_reps_min: number | null; target_reps_max: number | null;
  target_weight_kg: number | null; target_rir: number | null; rest_seconds: number | null; notes: string | null;
}
interface EditableExercise { exercise_id: string | null; name_snapshot: string; order_index: number; rest_seconds: number | null; sets: EditableSet[]; }

function numberOrNull(value: string): number | null {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function MoveIcon({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {dir === 'up' ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  );
}

interface TemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  sports: Sport[];
  exercises: Exercise[];
  existing?: WorkoutTemplateFull | null;
  onSave: (fields: { name: string; sport_id: string | null; subtitle: string | null; estimated_duration_min: number | null }, exercises: TemplateExerciseInput[]) => void | Promise<void>;
}

export function TemplateEditorModal({ open, onClose, sports, exercises, existing, onSave }: TemplateEditorModalProps) {
  const createExercise = useCreateExercise();
  const [name, setName] = useState('');
  const [sportId, setSportId] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [items, setItems] = useState<EditableExercise[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setSportId(existing?.sport_id ?? sports[0]?.id ?? '');
    setSubtitle(existing?.subtitle ?? '');
    setDuration(existing?.estimated_duration_min ?? 60);
    setItems((existing?.exercises ?? []).map(e => ({
      exercise_id: e.exercise_id, name_snapshot: e.name_snapshot, order_index: e.order_index, rest_seconds: e.rest_seconds,
      sets: e.sets.map(s => ({ set_index: s.set_index, target_reps_min: s.target_reps_min, target_reps_max: s.target_reps_max, target_weight_kg: s.target_weight_kg, target_rir: s.target_rir, rest_seconds: s.rest_seconds, notes: s.notes })),
    })));
    setExpanded(new Set()); // existing exercises start collapsed; freshly-added ones expand themselves
    setFormError(null);
  }, [open, existing, sports]);

  function toggleExpanded(idx: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function pushExercise(exerciseId: string | null, exerciseName: string) {
    setItems(list => {
      setExpanded(prev => new Set(prev).add(list.length));
      return [...list, {
        exercise_id: exerciseId, name_snapshot: exerciseName, order_index: list.length, rest_seconds: 90,
        sets: [{ set_index: 1, target_reps_min: 8, target_reps_max: 8, target_weight_kg: null, target_rir: null, rest_seconds: 90, notes: null }],
      }];
    });
  }

  function addExistingExercise(exercise: Exercise) {
    pushExercise(exercise.id, exercise.name);
  }

  async function addNewExercise(typedName: string) {
    const created = await createExercise.mutateAsync({ name: typedName, sport_id: sportId || null });
    pushExercise(created.id, created.name);
  }

  function removeExercise(idx: number) {
    setItems(list => list.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const next = new Set<number>();
      for (const i of prev) { if (i < idx) next.add(i); else if (i > idx) next.add(i - 1); }
      return next;
    });
  }
  function moveExercise(idx: number, dir: -1 | 1) {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= items.length) return;
    setItems(list => {
      const next = [...list];
      [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
      return next.map((item, i) => ({ ...item, order_index: i }));
    });
    setExpanded(prev => {
      const next = new Set<number>();
      for (const i of prev) {
        if (i === idx) next.add(nextIdx);
        else if (i === nextIdx) next.add(idx);
        else next.add(i);
      }
      return next;
    });
  }
  function addSet(idx: number) {
    setItems(list => list.map((e, i) => i === idx ? { ...e, sets: [...e.sets, { set_index: e.sets.length + 1, target_reps_min: e.sets.at(-1)?.target_reps_min ?? 8, target_reps_max: e.sets.at(-1)?.target_reps_max ?? 8, target_weight_kg: e.sets.at(-1)?.target_weight_kg ?? null, target_rir: e.sets.at(-1)?.target_rir ?? null, rest_seconds: e.rest_seconds, notes: null }] } : e));
  }
  function removeSet(idx: number, setIdx: number) {
    setItems(list => list.map((e, i) => i === idx ? { ...e, sets: e.sets.filter((_, si) => si !== setIdx).map((s, si) => ({ ...s, set_index: si + 1 })) } : e));
  }
  function patchSet(idx: number, setIdx: number, patch: Partial<EditableSet>) {
    setItems(list => list.map((e, i) => i === idx ? { ...e, sets: e.sets.map((s, si) => si === setIdx ? { ...s, ...patch } : s) } : e));
  }

  function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Podaj nazwę szablonu.');
      return;
    }
    if (items.length === 0) {
      setFormError('Dodaj przynajmniej jedno ćwiczenie do szablonu.');
      return;
    }
    const emptySetExercise = items.find(it => it.sets.length === 0);
    if (emptySetExercise) {
      setFormError(`Ćwiczenie "${emptySetExercise.name_snapshot}" musi mieć przynajmniej jedną serię.`);
      return;
    }
    const invalidSet = items.some(it => it.sets.some(s =>
      (s.target_reps_min !== null && s.target_reps_min < 0) ||
      (s.target_reps_max !== null && s.target_reps_max < 0) ||
      (s.target_weight_kg !== null && s.target_weight_kg < 0) ||
      (s.target_rir !== null && (s.target_rir < 0 || s.target_rir > 10)) ||
      (s.rest_seconds !== null && s.rest_seconds < 0)
    ));
    if (invalidSet) {
      setFormError('Sprawdź wartości serii: liczby nie mogą być ujemne, a RIR powinien mieścić się w zakresie 0-10.');
      return;
    }
    const exercisesPayload: TemplateExerciseInput[] = items.map((it, i) => ({
      exercise_id: it.exercise_id, name_snapshot: it.name_snapshot, order_index: i, rest_seconds: it.rest_seconds,
      sets: it.sets.map(s => ({ set_index: s.set_index, set_type: 'working', target_reps_min: s.target_reps_min, target_reps_max: s.target_reps_max, target_weight_kg: s.target_weight_kg, target_rir: s.target_rir, target_rpe: null, tempo: null, rest_seconds: s.rest_seconds, notes: s.notes })),
    }));
    setFormError(null);
    onSave({ name: trimmedName, sport_id: sportId || null, subtitle: subtitle.trim() || null, estimated_duration_min: duration || null }, exercisesPayload);
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edytuj szablon' : 'Nowy szablon'} size="lg"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={save}>Zapisz szablon</button>
      </>}>
      <div className="sport-form">
        <div className="sport-form-row">
          <Field label="Nazwa szablonu"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Sport"><SportField sports={sports} value={sportId} onChange={setSportId} /></Field>
        </div>
        <div className="sport-form-row">
          <Field label="Podtytuł"><input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
          <Field label="Czas (min)"><input className="input" type="number" value={duration} onChange={(e) => setDuration(+e.target.value)} /></Field>
        </div>
        {formError && <div className="sport-form-error" role="alert">{formError}</div>}

        <Field label="Ćwiczenia">
          <div className="sport-template-exercises">
            {items.map((it, idx) => {
              const isOpen = expanded.has(idx);
              const setCount = it.sets.length;
              const repsSummary = it.sets[0] ? `${it.sets[0].target_reps_min ?? '?'}–${it.sets[0].target_reps_max ?? '?'} powt.` : '';
              return (
                <div key={idx} className="sport-template-exercise">
                  <div className="sport-template-exercise-head">
                    <button type="button" className="sport-template-exercise-toggle" onClick={() => toggleExpanded(idx)}>
                      <span className={`sport-exercise-chevron${isOpen ? ' is-open' : ''}`}><IcoChevRight /></span>
                      <strong>{it.name_snapshot}</strong>
                      <span className="sport-template-exercise-summary">{setCount} {setCount === 1 ? 'seria' : 'serie'} · {repsSummary}</span>
                    </button>
                    <div className="sport-template-exercise-actions">
                      <IconBtn icon={<MoveIcon dir="up" />} onClick={() => moveExercise(idx, -1)} title="Przenieś wyżej" />
                      <IconBtn icon={<MoveIcon dir="down" />} onClick={() => moveExercise(idx, 1)} title="Przenieś niżej" />
                      <IconBtn icon={<IcoTrash />} danger onClick={() => removeExercise(idx)} title="Usuń ćwiczenie" />
                    </div>
                  </div>
                  {isOpen && (
                    <>
                      <div className="sport-table-scroll">
                      <table className="sport-sets-table">
                        <thead><tr><th>Seria</th><th>Powt. min</th><th>Powt. max</th><th>Ciężar (kg)</th><th>RIR</th><th>Przerwa (s)</th><th>Notatka</th><th /></tr></thead>
                        <tbody>
                          {it.sets.map((s, si) => (
                            <tr key={si}>
                              <td>{s.set_index}</td>
                              <td><input className="input sport-set-cell" type="number" min={0} value={s.target_reps_min ?? ''} onChange={(e) => patchSet(idx, si, { target_reps_min: numberOrNull(e.target.value) })} /></td>
                              <td><input className="input sport-set-cell" type="number" min={0} value={s.target_reps_max ?? ''} onChange={(e) => patchSet(idx, si, { target_reps_max: numberOrNull(e.target.value) })} /></td>
                              <td><input className="input sport-set-cell" type="number" min={0} step={0.5} value={s.target_weight_kg ?? ''} onChange={(e) => patchSet(idx, si, { target_weight_kg: numberOrNull(e.target.value) })} /></td>
                              <td><input className="input sport-set-cell" type="number" min={0} max={10} value={s.target_rir ?? ''} onChange={(e) => patchSet(idx, si, { target_rir: numberOrNull(e.target.value) })} /></td>
                              <td><input className="input sport-set-cell" type="number" min={0} value={s.rest_seconds ?? ''} onChange={(e) => patchSet(idx, si, { rest_seconds: numberOrNull(e.target.value) })} /></td>
                              <td><input className="input sport-set-cell" value={s.notes ?? ''} onChange={(e) => patchSet(idx, si, { notes: e.target.value || null })} placeholder="—" /></td>
                              <td><IconBtn icon={<IcoTrash />} onClick={() => removeSet(idx, si)} title="Usuń serię" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSet(idx)}><IcoPlus /> Dodaj serię</button>
                    </>
                  )}
                </div>
              );
            })}

            <ExercisePicker exercises={exercises} onPickExisting={addExistingExercise} onCreateNew={addNewExercise} />
          </div>
        </Field>
      </div>
    </Modal>
  );
}
