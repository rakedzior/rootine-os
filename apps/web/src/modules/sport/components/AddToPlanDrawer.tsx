import { useEffect, useMemo, useState } from 'react';
import { EmptyState, Modal, SubTabs, Field } from '@/components/common';
import { computeLinearProgressionTable, type ProgressionWeekRow } from '@/features/sport/services/progressionService';
import { WEEKDAY_LABELS_LONG } from '@/features/sport/services/sportPlannerService';
import type {
  ConflictPolicy, Exercise, LinearProgressionParams, NewManualWorkoutInput, NewTrainingBlockInput,
  NewWorkoutFromTemplateInput, ProgressionType, Sport, WorkoutTemplate,
} from '@/features/sport/types';
import { SportField } from './SportField';

interface AddToPlanDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  templates: WorkoutTemplate[];
  sports: Sport[];
  exercises: Exercise[];
  initialMode?: 'template' | 'manual' | 'block';
  onCreateManual: (input: NewManualWorkoutInput) => unknown;
  onCreateFromTemplate: (input: NewWorkoutFromTemplateInput, templateName: string) => unknown;
  onCreateBlock: (input: NewTrainingBlockInput) => unknown;
}

const CONFLICT_OPTIONS: { value: ConflictPolicy; label: string }[] = [
  { value: 'skip_existing', label: 'Pomiń dni z istniejącym treningiem' },
  { value: 'overwrite_existing', label: 'Nadpisz istniejące treningi' },
  { value: 'append', label: 'Dodaj jako drugi trening w tym dniu' },
];

export function AddToPlanDrawer({ open, onClose, defaultDate, templates, sports, exercises, initialMode = 'template', onCreateManual, onCreateFromTemplate, onCreateBlock }: AddToPlanDrawerProps) {
  const [mode, setMode] = useState<'template' | 'manual' | 'block'>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [initialMode, open]);

  return (
    <Modal open={open} onClose={onClose} title="Dodaj do planu" size="lg">
      <SubTabs
        tabs={[
          { id: 'template', label: 'Z szablonu' },
          { id: 'manual', label: 'Ręcznie' },
          { id: 'block', label: 'Blok / cykl' },
        ]}
        active={mode}
        onChange={(id) => setMode(id as typeof mode)}
      />
      <div className="sport-drawer-body">
        {mode === 'template' && (
          <FromTemplateForm defaultDate={defaultDate} templates={templates} onSubmit={async (input, name) => { await onCreateFromTemplate(input, name); onClose(); }} />
        )}
        {mode === 'manual' && (
          <ManualForm defaultDate={defaultDate} sports={sports} onSubmit={async (input) => { await onCreateManual(input); onClose(); }} />
        )}
        {mode === 'block' && (
          <BlockForm defaultDate={defaultDate} templates={templates} sports={sports} exercises={exercises} onSubmit={async (input) => { await onCreateBlock(input); onClose(); }} />
        )}
      </div>
    </Modal>
  );
}

// ── Z szablonu ───────────────────────────────────────────────

function FromTemplateForm({ defaultDate, templates, onSubmit }: {
  defaultDate: string; templates: WorkoutTemplate[];
  onSubmit: (input: NewWorkoutFromTemplateInput, templateName: string) => void;
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [startDate, setStartDate] = useState(defaultDate);
  const [recurrence, setRecurrence] = useState<NewWorkoutFromTemplateInput['recurrence']>('once');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [interval, setInterval_] = useState(2);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('append');

  const template = templates.find(t => t.id === templateId);

  if (templates.length === 0) {
    return (
      <EmptyState
        title="Brak szablonów treningowych"
        desc="Najpierw utwórz szablon w panelu Szablony i planowanie, a potem dodaj go do planu."
      />
    );
  }

  function toggleWeekday(iso: number) {
    setWeekdays(d => d.includes(iso) ? d.filter(x => x !== iso) : [...d, iso]);
  }

  return (
    <div className="sport-form">
      <Field label="Szablon treningu">
        <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Data startu"><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
      <Field label="Cykliczność">
        <select className="select" value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}>
          <option value="once">Tylko raz</option>
          <option value="weekly">Co tydzień</option>
          <option value="biweekly">Co 2 tygodnie</option>
          <option value="every_n_weeks">Co X tygodni</option>
        </select>
      </Field>
      {recurrence !== 'once' && (
        <>
          {recurrence === 'every_n_weeks' && (
            <Field label="Co ile tygodni"><input className="input" type="number" min={1} value={interval} onChange={(e) => setInterval_(Math.max(1, +e.target.value))} /></Field>
          )}
          <Field label="Dni tygodnia">
            <div className="sport-weekday-picker">
              {WEEKDAY_LABELS_LONG.map((label, i) => (
                <button key={label} type="button" className={weekdays.includes(i + 1) ? 'active' : ''} onClick={() => toggleWeekday(i + 1)}>{label.slice(0, 2)}</button>
              ))}
            </div>
          </Field>
          <Field label="Czas trwania (tygodnie)"><input className="input" type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(Math.max(1, +e.target.value))} /></Field>
        </>
      )}
      <Field label="Konflikty">
        <div className="sport-radio-group">
          {CONFLICT_OPTIONS.map(o => (
            <label key={o.value}><input type="radio" name="conflict-tpl" checked={conflictPolicy === o.value} onChange={() => setConflictPolicy(o.value)} /> {o.label}</label>
          ))}
        </div>
      </Field>
      <div className="sport-form-actions">
        <button className="btn btn-primary" disabled={!template} onClick={() => template && onSubmit({
          template_id: template.id, sport_id: template.sport_id, start_date: startDate,
          weekdays: recurrence === 'once' ? undefined : weekdays, recurrence,
          recurrence_interval: interval, duration_weeks: durationWeeks, conflict_policy: conflictPolicy,
        }, template.name)}>Dodaj do planu</button>
      </div>
    </div>
  );
}

// ── Ręcznie ──────────────────────────────────────────────────

function ManualForm({ defaultDate, sports, onSubmit }: { defaultDate: string; sports: Sport[]; onSubmit: (input: NewManualWorkoutInput) => void }) {
  const [title, setTitle] = useState('');
  const [sportId, setSportId] = useState(sports[0]?.id ?? '');
  const [date, setDate] = useState(defaultDate);
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');

  return (
    <div className="sport-form">
      <Field label="Nazwa treningu"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Bieganie easy" /></Field>
      <Field label="Sport"><SportField sports={sports} value={sportId} onChange={setSportId} /></Field>
      <Field label="Data"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Planowany czas (min)"><input className="input" type="number" min={0} value={duration} onChange={(e) => setDuration(Math.max(0, +e.target.value))} /></Field>
      <Field label="Opis / notatka"><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></Field>
      <div className="sport-form-actions">
        <button className="btn btn-primary" disabled={!title.trim()} onClick={() => onSubmit({
          scheduled_date: date, sport_id: sportId || null, title: title.trim(), planned_duration_min: duration || null, notes: notes || null,
        })}>Dodaj do planu</button>
      </div>
    </div>
  );
}

// ── Blok / cykl ──────────────────────────────────────────────

interface DayRow { weekday: number; active: boolean; templateId: string; manualTitle: string; }
interface ProgressionRow { exerciseId: string; exerciseName: string; method: ProgressionType; params: LinearProgressionParams; rows: ProgressionWeekRow[]; }

export interface BlockFormProps {
  defaultDate: string; templates: WorkoutTemplate[]; sports: Sport[]; exercises: Exercise[];
  onSubmit: (input: NewTrainingBlockInput) => void;
  nameLabel?: string; submitLabel?: string; initialName?: string;
}

export function BlockForm({ defaultDate, templates, sports, exercises, onSubmit, nameLabel = 'Nazwa bloku', submitLabel = 'Zaplanuj blok', initialName = 'Nowy blok treningowy' }: BlockFormProps) {
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(defaultDate);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('append');
  const [days, setDays] = useState<DayRow[]>(() => WEEKDAY_LABELS_LONG.map((_, i) => ({ weekday: i + 1, active: i < 5, templateId: '', manualTitle: '' })));
  const [progressionRows, setProgressionRows] = useState<ProgressionRow[]>([]);

  function patchDay(weekday: number, patch: Partial<DayRow>) {
    setDays(ds => ds.map(d => d.weekday === weekday ? { ...d, ...patch } : d));
  }

  function addProgressionRow() {
    const ex = exercises[0];
    if (!ex) return;
    const params: LinearProgressionParams = { starting_weight_kg: 60, weekly_increment_kg: 2.5, sets: 5, reps: 5, deload_every_weeks: 4, deload_percent: 20 };
    setProgressionRows(rows => [...rows, { exerciseId: ex.id, exerciseName: ex.name, method: 'linear', params, rows: computeLinearProgressionTable(params, durationWeeks) }]);
  }

  function recomputeRow(idx: number, params: LinearProgressionParams) {
    setProgressionRows(rows => rows.map((r, i) => i === idx ? { ...r, params, rows: computeLinearProgressionTable(params, durationWeeks) } : r));
  }

  function editCell(idx: number, week: number, field: 'weight' | 'reps', value: number) {
    setProgressionRows(rows => rows.map((r, i) => i === idx ? { ...r, rows: r.rows.map(w => w.week === week ? { ...w, [field]: value } : w) } : r));
  }

  return (
    <div className="sport-form">
      <Field label={nameLabel}><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="sport-form-row">
        <Field label="Start"><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="Czas trwania (tyg.)"><input className="input" type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(Math.max(1, +e.target.value))} /></Field>
      </div>

      <Field label="Plan tygodniowy">
        <div className="sport-block-days">
          {days.map((d, i) => (
            <div key={d.weekday} className="sport-block-day-row">
              <label><input type="checkbox" checked={d.active} onChange={(e) => patchDay(d.weekday, { active: e.target.checked })} /> {WEEKDAY_LABELS_LONG[i].slice(0, 3)}</label>
              <select className="select" disabled={!d.active} value={d.templateId} onChange={(e) => patchDay(d.weekday, { templateId: e.target.value })}>
                <option value="">— Brak treningu —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {!d.templateId && d.active && (
                <input className="input" placeholder="Własna nazwa" value={d.manualTitle} onChange={(e) => patchDay(d.weekday, { manualTitle: e.target.value })} />
              )}
            </div>
          ))}
        </div>
      </Field>

      <Field label="Konflikty">
        <div className="sport-radio-group">
          {CONFLICT_OPTIONS.map(o => (
            <label key={o.value}><input type="radio" name="conflict-block" checked={conflictPolicy === o.value} onChange={() => setConflictPolicy(o.value)} /> {o.label}</label>
          ))}
        </div>
      </Field>

      <Field label="Progresja obciążenia">
        <div className="sport-progression-rows">
          {progressionRows.map((row, idx) => (
            <ProgressionRowEditor key={idx} exercises={exercises} row={row} weeks={durationWeeks}
              onChangeExercise={(exerciseId, exerciseName) => setProgressionRows(rs => rs.map((r, i) => i === idx ? { ...r, exerciseId, exerciseName } : r))}
              onChangeMethod={(method) => setProgressionRows(rs => rs.map((r, i) => i === idx ? { ...r, method } : r))}
              onChangeParams={(params) => recomputeRow(idx, params)}
              onEditCell={(week, field, value) => editCell(idx, week, field, value)}
              onRemove={() => setProgressionRows(rs => rs.filter((_, i) => i !== idx))}
            />
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addProgressionRow} disabled={!exercises.length}>+ Dodaj progresję</button>
        </div>
      </Field>

      <div className="sport-form-actions">
        <button className="btn btn-primary" disabled={!name.trim()} onClick={() => onSubmit({
          name: name.trim(), start_date: startDate, duration_weeks: durationWeeks, conflict_policy: conflictPolicy,
          days: days.map(d => ({
            weekday: d.weekday, is_active: d.active,
            assignments: d.active && (d.templateId || d.manualTitle) ? [{
              template_id: d.templateId || null,
              sport_id: d.templateId ? templates.find(t => t.id === d.templateId)?.sport_id ?? null : sports[0]?.id ?? null,
              manual_title: d.templateId ? null : d.manualTitle || null,
            }] : [],
          })),
          progression: progressionRows.map(r => ({
            exercise_id: r.exerciseId, exercise_name: r.exerciseName, progression_type: r.method, params: r.params, rows: r.rows,
          })),
        })}>{submitLabel}</button>
      </div>
    </div>
  );
}

function ProgressionRowEditor({ exercises, row, weeks, onChangeExercise, onChangeMethod, onChangeParams, onEditCell, onRemove }: {
  exercises: Exercise[]; row: ProgressionRow; weeks: number;
  onChangeExercise: (id: string, name: string) => void;
  onChangeMethod: (m: ProgressionType) => void;
  onChangeParams: (p: LinearProgressionParams) => void;
  onEditCell: (week: number, field: 'weight' | 'reps', value: number) => void;
  onRemove: () => void;
}) {
  const weekCols = useMemo(() => Array.from({ length: Math.min(weeks, row.rows.length) }, (_, i) => i + 1), [weeks, row.rows.length]);
  return (
    <div className="sport-progression-row">
      <div className="sport-progression-row-head">
        <select className="select" value={row.exerciseId} onChange={(e) => {
          const ex = exercises.find(x => x.id === e.target.value);
          if (ex) onChangeExercise(ex.id, ex.name);
        }}>
          {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select className="select" value={row.method} onChange={(e) => onChangeMethod(e.target.value as ProgressionType)}>
          <option value="none">Brak</option>
          <option value="manual">Ręczna</option>
          <option value="linear">Liniowa</option>
        </select>
        <button type="button" className="icon-btn" onClick={onRemove}>×</button>
      </div>
      {row.method === 'linear' && (
        <div className="sport-form-row">
          <Field label="Start (kg)"><input className="input" type="number" value={row.params.starting_weight_kg} onChange={(e) => onChangeParams({ ...row.params, starting_weight_kg: +e.target.value })} /></Field>
          <Field label="Przyrost/tydz. (kg)"><input className="input" type="number" step={0.5} value={row.params.weekly_increment_kg} onChange={(e) => onChangeParams({ ...row.params, weekly_increment_kg: +e.target.value })} /></Field>
          <Field label="Powt."><input className="input" type="number" value={row.params.reps} onChange={(e) => onChangeParams({ ...row.params, reps: +e.target.value })} /></Field>
          <Field label="Lżejszy tydz. co"><input className="input" type="number" value={row.params.deload_every_weeks ?? 0} onChange={(e) => onChangeParams({ ...row.params, deload_every_weeks: +e.target.value })} /></Field>
        </div>
      )}
      {row.method !== 'none' && (
        <table className="sport-progression-table">
          <thead><tr><th>Tydz.</th>{weekCols.map(w => <th key={w}>{w}{row.rows.find(r => r.week === w)?.isDeload ? ' (lżej)' : ''}</th>)}</tr></thead>
          <tbody>
            <tr>
              <td>kg</td>
              {weekCols.map(w => {
                const cell = row.rows.find(r => r.week === w);
                return <td key={w}><input className="input sport-progression-cell" type="number" value={cell?.weight ?? ''} onChange={(e) => onEditCell(w, 'weight', +e.target.value)} /></td>;
              })}
            </tr>
            <tr>
              <td>powt.</td>
              {weekCols.map(w => {
                const cell = row.rows.find(r => r.week === w);
                return <td key={w}><input className="input sport-progression-cell" type="number" value={cell?.reps ?? ''} onChange={(e) => onEditCell(w, 'reps', +e.target.value)} /></td>;
              })}
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
