import { useState, useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Field, Modal } from '@/components/common';
import { useHabits, useHabitLogs, useToggleHabitLog } from '@/features/habits/hooks';
import { habitOccursOn, habitScheduleLabel, habitStats, todayStr as habitsTodayStr } from '@/features/habits/dates';
import type { HabitLog } from '@/features/habits/types';
import { useLocalStore } from '@/store/localStore';
import { useCreateTask, useDeleteTask, useDeleteTasks, useTasks, useToggleTask, useUpdateTask } from '@/features/tasks/hooks';
import type { Task as SupabaseTask } from '@/features/tasks/types';
import { useNutritionToday, useTodayMealItems } from '@/features/diet/hooks';

const MONTH_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const MONTH_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

// ─── MOCK HABITS ──────────────────────────────────────────────
const MOCK_EVENTS: Record<number, { label: string; cls: string }[]> = {
  3:  [{ label: 'Standup', cls: 'blue' }],
  7:  [{ label: 'Trening A', cls: 'clay' }],
  11: [{ label: 'Spotkanie Krzysi', cls: 'blue' }],
  13: [{ label: 'Festiwal', cls: 'green' }],
  16: [{ label: 'Barcelona', cls: 'green' }],
  17: [{ label: 'Taniec 19:00', cls: 'lav' }],
  18: [{ label: 'Masa: Dawid', cls: 'blue' }],
  19: [{ label: 'Kaszki – punkt', cls: 'clay' }],
  21: [{ label: 'Trening B', cls: 'clay' }],
  23: [{ label: 'Dzień Ojca', cls: 'green' }],
  26: [{ label: 'Wizyta u ks.', cls: 'lav' }],
};

// ─── ADD TASK MODAL ───────────────────────────────────────────

const CAT_OPTIONS = ['Rutyna', 'Trening', 'Praca', 'Regeneracja', 'Cel', 'Inne'];
const PRIO_OPTIONS: { value: 'high' | 'mid' | 'low'; label: string }[] = [
  { value: 'high', label: 'Wysoki' },
  { value: 'mid',  label: 'Średni' },
  { value: 'low',  label: 'Niski'  },
];

const TASK_WEEKDAYS = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Śr' },
  { value: 4, label: 'Czw' },
  { value: 5, label: 'Pt' },
  { value: 6, label: 'Sob' },
  { value: 7, label: 'Ndz' },
] as const;
const DEFAULT_REPEAT_DAYS = 84;
const MAX_TASK_OCCURRENCES = 120;

type RepeatMode = 'none' | 'daily' | 'weekly';

interface NewTask {
  title: string;
  category: string;
  priority: 'high' | 'mid' | 'low';
  dueDates: string[];
  repeatMode: RepeatMode;
  repeatWeekdays: number[];
  repeatUntil: string;
  note: string;
}

interface TaskModalPayload extends NewTask {
  editingId?: string;
}

function parseDateStr(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isDateStr(value: string): boolean {
  return parseDateStr(value) !== null;
}

function addDaysStr(value: string, days: number): string {
  const dt = parseDateStr(value);
  if (!dt) return value;
  dt.setDate(dt.getDate() + days);
  return toDateStr(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function weekdayFromDateStr(value: string): number {
  const dt = parseDateStr(value);
  if (!dt) return 1;
  const day = dt.getDay();
  return day === 0 ? 7 : day;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function makeClientId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateRangeInclusive(start: string, end: string): string[] {
  if (!isDateStr(start) || !isDateStr(end)) return [];
  const [from, to] = start <= end ? [start, end] : [end, start];
  const dates: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDaysStr(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

function expandTaskDates(task: Pick<NewTask, 'dueDates' | 'repeatMode' | 'repeatWeekdays' | 'repeatUntil'>): string[] {
  const baseDates = uniqueSorted(task.dueDates.filter(isDateStr));
  if (baseDates.length === 0) return [];
  if (task.repeatMode === 'none') return baseDates;

  const start = baseDates[0];
  const end = task.repeatUntil && isDateStr(task.repeatUntil) && task.repeatUntil >= start
    ? task.repeatUntil
    : addDaysStr(start, DEFAULT_REPEAT_DAYS);
  const dates = new Set(baseDates);

  if (task.repeatMode === 'daily') {
    for (let cursor = start; cursor <= end && dates.size < MAX_TASK_OCCURRENCES; cursor = addDaysStr(cursor, 1)) {
      dates.add(cursor);
    }
  }

  if (task.repeatMode === 'weekly') {
    const weekdays = task.repeatWeekdays.length
      ? task.repeatWeekdays
      : [...new Set(baseDates.map(weekdayFromDateStr))];
    for (let cursor = start; cursor <= end && dates.size < MAX_TASK_OCCURRENCES; cursor = addDaysStr(cursor, 1)) {
      if (weekdays.includes(weekdayFromDateStr(cursor))) dates.add(cursor);
    }
  }

  return uniqueSorted([...dates]).slice(0, MAX_TASK_OCCURRENCES);
}

interface AddTaskModalProps {
  open: boolean;
  defaultDate: string;
  task?: SupabaseTask | null;
  seriesCount?: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (task: TaskModalPayload) => Promise<void> | void;
  onDeleteSingle?: (task: SupabaseTask) => Promise<void> | void;
  onDeleteSeries?: (task: SupabaseTask) => Promise<void> | void;
}

function AddTaskModal({
  open,
  defaultDate,
  task = null,
  seriesCount = 0,
  saving = false,
  onClose,
  onSave,
  onDeleteSingle,
  onDeleteSeries,
}: AddTaskModalProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Praca');
  const [priority, setPriority] = useState<'high' | 'mid' | 'low'>('mid');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([defaultDate]));
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([weekdayFromDateStr(defaultDate)]);
  const [repeatUntil, setRepeatUntil] = useState('');
  const [pickerYear, setPickerYear] = useState(() => parseDateStr(defaultDate)?.getFullYear() ?? new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => parseDateStr(defaultDate)?.getMonth() ?? new Date().getMonth());
  const [note, setNote] = useState('');
  const [dragRange, setDragRange] = useState<{ start: string; end: string } | null>(null);
  const dragMovedRef = useRef(false);

  function focusDate(date: string) {
    const dt = parseDateStr(date) ?? new Date();
    setPickerYear(dt.getFullYear());
    setPickerMonth(dt.getMonth());
    setSelectedDates(new Set([date]));
    setRepeatWeekdays([weekdayFromDateStr(date)]);
  }

  useEffect(() => {
    if (!open) return;
    if (task) {
      const date = task.due_date ?? defaultDate;
      setTitle(task.title);
      setCategory(task.category ?? 'Praca');
      setPriority(task.priority ?? 'mid');
      setRepeatMode('none');
      setRepeatWeekdays([weekdayFromDateStr(date)]);
      setRepeatUntil('');
      setNote(task.note ?? '');
      focusDate(date);
      return;
    }
    setTitle('');
    setCategory('Praca');
    setPriority('mid');
    setRepeatMode('none');
    setRepeatUntil('');
    setNote('');
    focusDate(defaultDate);
  }, [defaultDate, open, task]);

  const reset = () => {
    setTitle('');
    setCategory('Praca');
    setPriority('mid');
    setRepeatMode('none');
    setRepeatUntil('');
    setNote('');
    focusDate(defaultDate);
  };

  const selectedDateList = uniqueSorted([...selectedDates]);
  const displayedDateSet = dragRange ? new Set(dateRangeInclusive(dragRange.start, dragRange.end)) : selectedDates;
  const repeatUntilClean = repeatUntil.trim();
  const repeatUntilInvalid = repeatUntilClean !== '' && !isDateStr(repeatUntilClean);
  const previewCount = isEditing ? 1 : expandTaskDates({
    dueDates: selectedDateList,
    repeatMode,
    repeatWeekdays,
    repeatUntil: repeatUntilClean,
  }).length;

  async function handleSave() {
    if (!title.trim() || selectedDateList.length === 0 || repeatUntilInvalid || saving) return;
    try {
      await onSave({
        editingId: task?.id,
        title: title.trim(),
        category,
        priority,
        dueDates: isEditing ? selectedDateList.slice(0, 1) : selectedDateList,
        repeatMode: isEditing ? 'none' : repeatMode,
        repeatWeekdays,
        repeatUntil: isEditing ? '' : repeatUntilClean,
        note,
      });
      reset();
      onClose();
    } catch {
      // Global React Query mutation handling shows the toast.
    }
  }

  function handleClose() { reset(); onClose(); }

  function toggleDate(date: string) {
    if (isEditing) {
      setSelectedDates(new Set([date]));
      return;
    }
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date) && next.size > 1) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function selectDateRange(start: string, end: string) {
    if (isEditing) {
      setSelectedDates(new Set([end]));
      return;
    }
    const range = dateRangeInclusive(start, end);
    if (range.length === 0) return;
    setSelectedDates(new Set(range));
    if (repeatMode === 'weekly') {
      setRepeatWeekdays([...new Set(range.map(weekdayFromDateStr))].sort((a, b) => a - b));
    }
  }

  function beginDateDrag(date: string, event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    dragMovedRef.current = false;
    setDragRange({ start: date, end: date });
  }

  function hoverDateDrag(date: string) {
    setDragRange((current) => {
      if (!current) return current;
      if (current.end !== date) dragMovedRef.current = true;
      return { ...current, end: date };
    });
  }

  useEffect(() => {
    if (!dragRange) return;
    const finishDrag = () => {
      if (dragMovedRef.current) selectDateRange(dragRange.start, dragRange.end);
      else toggleDate(dragRange.start);
      dragMovedRef.current = false;
      setDragRange(null);
    };
    window.addEventListener('mouseup', finishDrag);
    return () => window.removeEventListener('mouseup', finishDrag);
  }, [dragRange, repeatMode]);

  function prevMonth() {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  }

  const first = new Date(pickerYear, pickerMonth, 1);
  const last = new Date(pickerYear, pickerMonth + 1, 0);
  let startDow = first.getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edytuj zadanie' : 'Dodaj zadanie'}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, width: '100%', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {task && (
              <button className="btn btn-danger btn-sm" onClick={() => onDeleteSingle?.(task)} disabled={saving}>
                Usuń zdarzenie
              </button>
            )}
            {task?.series_id && seriesCount > 1 && (
              <button className="btn btn-secondary btn-sm" onClick={() => onDeleteSeries?.(task)} disabled={saving}>
                Usuń serię
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleClose}>Anuluj</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={!title.trim() || selectedDateList.length === 0 || repeatUntilInvalid || saving}
            >
              {saving ? 'Zapisywanie...' : isEditing ? 'Zapisz' : `Dodaj ${previewCount > 1 ? previewCount : ''}`.trim()}
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18, width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <Field label="Tytuł zadania" required>
            <input
              autoFocus
              className="input"
              placeholder="Wpisz zadanie..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </Field>

          <Field label="Kategoria">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CAT_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: '.14s',
                    background: category === c ? 'var(--acc-a-soft)' : 'var(--surface)',
                    color: category === c ? 'var(--acc-a-ink)' : 'var(--ink-2)',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: !isEditing && repeatMode !== 'none' ? '1fr 1fr' : '1fr', gap: 10 }}>
            <Field label="Priorytet">
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as 'high' | 'mid' | 'low')} style={{ width: '100%' }}>
                {PRIO_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            {!isEditing && repeatMode !== 'none' && (
              <Field label="Koniec serii">
                <input
                  className="input"
                  value={repeatUntil}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                  placeholder="Opcjonalnie: RRRR-MM-DD"
                  style={{ width: '100%', borderColor: repeatUntilInvalid ? 'var(--p-high)' : undefined }}
                />
              </Field>
            )}
          </div>

          {!isEditing && (
            <Field label="Powtarzanie">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {([
                  ['none', 'Brak'],
                  ['daily', 'Codziennie'],
                  ['weekly', 'Dni tyg.'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setRepeatMode(value);
                      if (value === 'weekly') {
                        const days = [...new Set(selectedDateList.map(weekdayFromDateStr))];
                        setRepeatWeekdays(days.length ? days : [weekdayFromDateStr(defaultDate)]);
                      }
                    }}
                    style={{
                      minHeight: 36,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: repeatMode === value ? 'var(--acc-b-soft)' : 'var(--surface)',
                      color: repeatMode === value ? 'var(--acc-b-ink)' : 'var(--ink-2)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {!isEditing && repeatMode === 'weekly' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TASK_WEEKDAYS.map((day) => {
                const active = repeatWeekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      setRepeatWeekdays((prev) => {
                        if (prev.includes(day.value)) return prev.length === 1 ? prev : prev.filter((d) => d !== day.value);
                        return [...prev, day.value].sort((a, b) => a - b);
                      });
                    }}
                    style={{
                      width: 42,
                      height: 34,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: active ? 'var(--acc-a-soft)' : 'var(--surface)',
                      color: active ? 'var(--acc-a-ink)' : 'var(--ink-3)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          )}

          <Field label="Notatka">
            <textarea
              className="input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Dodatkowe informacje..."
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </Field>
        </div>

        <div
          style={{
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-mid)',
            background: 'var(--surface-inset)',
            padding: 12,
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} className="icon-btn" aria-label="Poprzedni miesiąc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
            </button>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>
              {MONTH_FULL[pickerMonth]} <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{pickerYear}</span>
            </div>
            <button type="button" onClick={nextMonth} className="icon-btn" aria-label="Następny miesiąc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 5 }}>
            {TASK_WEEKDAYS.map((d) => (
              <div key={d.value} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textAlign: 'center', color: 'var(--ink-3)', fontWeight: 700 }}>{d.label}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 5 }}>
            {cells.map((day, i) => {
              const date = day ? toDateStr(pickerYear, pickerMonth, day) : '';
              const active = day ? displayedDateSet.has(date) : false;
              const today = day && date === toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!day}
                  onMouseDown={(e) => day && beginDateDrag(date, e)}
                  onMouseEnter={() => day && hoverDateDrag(date)}
                  style={{
                    aspectRatio: '1 / 1',
                    minWidth: 0,
                    borderRadius: 10,
                    border: day ? `1px solid ${active ? 'var(--acc-a)' : 'var(--border-soft)'}` : '1px solid transparent',
                    background: active ? 'var(--acc-a)' : today ? 'var(--acc-a-soft)' : 'var(--surface)',
                    color: active ? '#fff' : 'var(--ink-2)',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    cursor: day ? 'pointer' : 'default',
                    opacity: day ? 1 : 0,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, fontSize: 12, color: 'var(--ink-3)' }}>
            <span>Wybrano: <strong style={{ color: 'var(--ink)' }}>{selectedDateList.length}</strong></span>
            {!isEditing && <span>Utworzy: <strong style={{ color: 'var(--ink)' }}>{previewCount}</strong></span>}
          </div>
          {repeatUntilInvalid && (
            <div style={{ marginTop: 8, color: 'var(--p-high)', fontSize: 12 }}>Data końca musi mieć format RRRR-MM-DD.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────

interface CalendarProps {
  tasks: SupabaseTask[];
  onDayClick: (dateStr: string) => void;
  onTaskClick: (task: SupabaseTask) => void;
}

function Calendar({ tasks, onDayClick, onTaskClick }: CalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<'month'|'week'|'day'>('month');

  function prev() { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); }
  function next() { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);
  let startDow = first.getDay(); startDow = startDow===0?6:startDow-1;
  const cells: (number|null)[] = [];
  for (let i=0;i<startDow;i++) cells.push(null);
  for (let d=1;d<=last.getDate();d++) cells.push(d);
  while (cells.length%7!==0) cells.push(null);

  const isToday = (d:number|null) => !!d && d===now.getDate() && month===now.getMonth() && year===now.getFullYear();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight: 0 }}>
      {/* cal head */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:600, letterSpacing:'-.01em' }}>
          {MONTH_FULL[month]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{year}</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ display:'flex', gap:2, background:'var(--surface-inset)', padding:3, borderRadius:10, border:'1px solid var(--border-soft)' }}>
            {(['month','week','day'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{
                fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600,
                padding:'5px 10px', borderRadius:7, border:0, cursor:'pointer', transition:'.14s',
                background: view===v ? 'var(--surface)' : 'transparent',
                color: view===v ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: view===v ? 'var(--sh-1)' : 'none',
              }}>{v==='month'?'Miesiąc':v==='week'?'Tydzień':'Dzień'}</button>
            ))}
          </div>
          <button onClick={prev} style={{ width:28,height:28,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--ink-2)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <button onClick={next} style={{ width:28,height:28,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--ink-2)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <button onClick={goToday} style={{ fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.08em',textTransform:'uppercase',fontWeight:600,padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',cursor:'pointer' }}>
            Dziś
          </button>
        </div>
      </div>

      {/* day names */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:5, flexShrink:0 }}>
        {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map(d => (
          <div key={d} style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)',paddingLeft:4 }}>{d}</div>
        ))}
      </div>

      {/* grid — flex:1 so it fills remaining card height */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:5, flex:1, minHeight:0 }}>
        {cells.map((day,i) => {
          const date = day ? toDateStr(year, month, day) : '';
          const evs = day ? (MOCK_EVENTS[day]??[]) : [];
          const allDayTasks = day
            ? tasks
                .filter(t => t.due_date === date)
                .sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at))
            : [];
          const dayTasks = allDayTasks.slice(0, 3);
          const extraTasks = day
            ? Math.max(0, allDayTasks.length - dayTasks.length)
            : 0;
          return (
            <div key={i}
              onClick={() => { if (day) onDayClick(toDateStr(year, month, day)); }}
              style={{
                minHeight:72, borderRadius:'var(--r-sm)',
                background: isToday(day) ? 'var(--acc-a-soft)' : day ? 'var(--surface-inset)' : 'transparent',
                border: isToday(day) ? '1px solid var(--acc-a)' : day ? '1px solid var(--border-soft)' : '1px solid transparent',
                padding:7, display:'flex', flexDirection:'column', gap:3,
                cursor: day ? 'pointer' : 'default',
                transition:'.14s',
                opacity: !day ? 0 : 1,
              }}
              title={day ? `Dodaj zadanie na ${day} ${MONTH_SHORT[month]}` : undefined}
            >
              {day && <>
                <div style={{
                  fontVariantNumeric:'tabular-nums',
                  ...(isToday(day)
                    ? { color:'#fff', background:'var(--acc-a)', width:22, height:22, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, fontWeight:700 }
                    : { fontSize:12, fontWeight:600, color:'var(--ink-2)' })
                }}>{day}</div>
                {evs.map(e => (
                  <div key={e.label} className={`ev ${e.cls}`} style={{ fontSize:9.5 }}>{e.label}</div>
                ))}
                {dayTasks.map(t => (
                  <div
                    key={t.id}
                    className="ev green"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(t);
                    }}
                    style={{ fontSize:9.5, opacity:t.done ? .75 : 1, textDecoration:t.done?'line-through':'none' }}
                    title="Edytuj zadanie"
                  >
                    {t.title}
                  </div>
                ))}
                {extraTasks > 0 && (
                  <div className="ev" style={{ fontSize:9.5, color:'var(--ink-3)' }}>+{extraTasks}</div>
                )}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BOTTOM STRIP COMPONENTS ──────────────────────────────────

interface WeatherHour {
  time: string;
  temp: number;
  apparent: number;
  rainProbability: number;
  precipitation: number;
  rain: number;
  showers: number;
  wind: number;
  gust: number;
  code: number;
}

interface WeatherData {
  locationLabel: string;
  temp: number;
  apparent: number;
  code: number;
  wind: number;
  gust: number;
  precipitation: number;
  rain: number;
  next24: WeatherHour[];
  minTemp: number;
  maxTemp: number;
  maxRainProbability: number;
  maxWind: number;
  stormLikely: boolean;
  rainLikely: boolean;
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Bezchmurnie';
  if ([1, 2].includes(code)) return 'Częściowe zachmurzenie';
  if (code === 3) return 'Pochmurno';
  if ([45, 48].includes(code)) return 'Mgła';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Mżawka';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Deszcz';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Śnieg';
  if ([95, 96, 99].includes(code)) return 'Burza';
  return 'Pogoda';
}

function WeatherIcon({ code }: { code: number }) {
  const storm = [95, 96, 99].includes(code);
  const rain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
  const cloudy = code > 1;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      {!cloudy && <circle cx="12" cy="12" r="4" />}
      {!cloudy && <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />}
      {cloudy && <path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.3 2A3 3 0 0 0 7 18Z" />}
      {rain && <path d="M8 21l1-2M13 21l1-2M18 21l1-2" />}
      {storm && <path d="M13 13l-2 4h3l-2 4" />}
    </svg>
  );
}

function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load(lat = 52.2297, lon = 21.0122, locationLabel = 'Warszawa') {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          timezone: 'auto',
          forecast_days: '2',
          current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,rain',
          hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m',
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!res.ok) throw new Error('Weather request failed');
        const json = await res.json();
        const hourly = json.hourly;
        const current = json.current;
        const nowMs = Date.now();
        const firstFuture = (hourly.time as string[]).findIndex((t) => new Date(t).getTime() >= nowMs);
        const start = firstFuture >= 0 ? firstFuture : 0;
        const next24: WeatherHour[] = (hourly.time as string[]).slice(start, start + 24).map((time, idx) => {
          const i = start + idx;
          return {
            time,
            temp: Number(hourly.temperature_2m[i] ?? 0),
            apparent: Number(hourly.apparent_temperature[i] ?? 0),
            rainProbability: Number(hourly.precipitation_probability[i] ?? 0),
            precipitation: Number(hourly.precipitation[i] ?? 0),
            rain: Number(hourly.rain[i] ?? 0),
            showers: Number(hourly.showers[i] ?? 0),
            wind: Number(hourly.wind_speed_10m[i] ?? 0),
            gust: Number(hourly.wind_gusts_10m[i] ?? 0),
            code: Number(hourly.weather_code[i] ?? 0),
          };
        });
        const temps = next24.map((h) => h.temp);
        const payload: WeatherData = {
          locationLabel,
          temp: Number(current.temperature_2m ?? 0),
          apparent: Number(current.apparent_temperature ?? 0),
          code: Number(current.weather_code ?? 0),
          wind: Number(current.wind_speed_10m ?? 0),
          gust: Number(current.wind_gusts_10m ?? 0),
          precipitation: Number(current.precipitation ?? 0),
          rain: Number(current.rain ?? 0),
          next24,
          minTemp: temps.length ? Math.min(...temps) : Number(current.temperature_2m ?? 0),
          maxTemp: temps.length ? Math.max(...temps) : Number(current.temperature_2m ?? 0),
          maxRainProbability: next24.length ? Math.max(...next24.map((h) => h.rainProbability)) : 0,
          maxWind: next24.length ? Math.max(...next24.map((h) => h.gust || h.wind)) : Number(current.wind_gusts_10m ?? current.wind_speed_10m ?? 0),
          stormLikely: next24.some((h) => [95, 96, 99].includes(h.code)),
          rainLikely: next24.some((h) => h.rainProbability >= 45 || h.precipitation > 0.2 || h.rain > 0 || h.showers > 0),
        };
        if (!cancelled) {
          setData(payload);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => void load(pos.coords.latitude, pos.coords.longitude, 'Twoja lokalizacja'),
        () => void load(),
        { timeout: 2500, maximumAge: 1000 * 60 * 30 },
      );
    } else {
      void load();
    }

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

function WeatherButton({ weather, loading, onClick }: { weather: WeatherData | null; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 34,
        padding: '6px 10px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--surface-inset)',
        color: 'var(--ink)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--acc-b)' }}>{weather ? <WeatherIcon code={weather.code} /> : <WeatherIcon code={3} />}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800 }}>{loading ? '--' : weather ? `${Math.round(weather.temp)}°` : '--'}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{weather ? weatherLabel(weather.code) : 'Pogoda'}</span>
      </span>
    </button>
  );
}

function WeatherModal({ open, weather, loading, error, onClose }: { open: boolean; weather: WeatherData | null; loading: boolean; error: boolean; onClose: () => void }) {
  const chart = weather?.next24 ?? [];
  const temps = chart.map((h) => h.temp);
  const min = temps.length ? Math.min(...temps) : 0;
  const max = temps.length ? Math.max(...temps) : 1;
  const points = chart.map((h, i) => {
    const x = chart.length <= 1 ? 0 : (i / (chart.length - 1)) * 100;
    const y = 54 - ((h.temp - min) / Math.max(1, max - min)) * 42;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Modal open={open} onClose={onClose} title="Pogoda" size="lg">
      {loading && <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Ładowanie pogody...</div>}
      {error && !weather && <div className="auth-banner warn">Nie udało się pobrać pogody.</div>}
      {weather && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: 'var(--acc-b)', width: 42, height: 42, display: 'grid', placeItems: 'center' }}><WeatherIcon code={weather.code} /></span>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{Math.round(weather.temp)}°C</div>
                <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{weather.locationLabel} · {weatherLabel(weather.code)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(100px, 1fr))', gap: 8 }}>
              {[
                ['Min / max', `${Math.round(weather.minTemp)}° / ${Math.round(weather.maxTemp)}°`],
                ['Odczuwalna', `${Math.round(weather.apparent)}°C`],
                ['Wiatr', `${Math.round(weather.wind)} km/h`],
                ['Porywy', `${Math.round(weather.maxWind)} km/h`],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--surface-inset)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
                  <div style={{ marginTop: 4, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-soft)', background: 'var(--surface-inset)', borderRadius: 'var(--r-mid)', padding: 12 }}>
            <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ width: '100%', height: 160, display: 'block' }}>
              <path d="M0 56H100" stroke="var(--border)" strokeWidth=".5" />
              <polyline points={points} fill="none" stroke="var(--acc-a)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {chart.map((h, i) => {
                const x = chart.length <= 1 ? 0 : (i / (chart.length - 1)) * 100;
                const y = 54 - ((h.temp - min) / Math.max(1, max - min)) * 42;
                return <circle key={h.time} cx={x} cy={y} r="1.2" fill="var(--acc-a)" vectorEffect="non-scaling-stroke" />;
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 10 }}>
              {chart.filter((_, i) => i % 4 === 0).slice(0, 6).map((h) => (
                <span key={h.time}>{new Date(h.time).getHours()}:00</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {[
              ['Deszcz', weather.rainLikely ? `Tak, do ${weather.maxRainProbability}%` : 'Mało prawdopodobny'],
              ['Burza', weather.stormLikely ? 'Możliwa' : 'Nie widać'],
              ['Opad teraz', `${weather.precipitation.toFixed(1)} mm`],
              ['Status wiatru', weather.maxWind >= 55 ? 'Silny wiatr' : weather.maxWind >= 35 ? 'Umiarkowany' : 'Spokojnie'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
                <div style={{ marginTop: 5, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function HabitsStrip() {
  const habitsQ = useHabits();
  const logsQ = useHabitLogs();
  const toggleHabit = useToggleHabitLog();
  const today = habitsTodayStr();

  const datesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of (logsQ.data ?? []) as HabitLog[]) {
      let dates = map.get(l.habit_id);
      if (!dates) {
        dates = new Set();
        map.set(l.habit_id, dates);
      }
      dates.add(l.log_date);
    }
    return map;
  }, [logsQ.data]);

  const habitItems = (habitsQ.data ?? []).map((habit) => {
    const stats = habitStats(datesByHabit.get(habit.id) ?? new Set(), today, habit);
    return { habit, stats, scheduledToday: habitOccursOn(habit, today) };
  });
  const scheduled = habitItems.filter((item) => item.scheduledToday);
  const done = scheduled.filter((item) => item.stats.doneToday).length;
  const total = scheduled.length || habitItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Nawyki</span>
        <span style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-3)' }}>{done} / {total}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
        <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
          <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-inset)" strokeWidth="12"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--acc-a)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray="251.3" strokeDashoffset={251.3-(251.3*pct/100)}/>
          </svg>
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--mono)',fontSize:15,fontWeight:700 }}>{pct}%</div>
        </div>
        <div>
          <div style={{ fontSize:13,fontWeight:600,color:'var(--ink)' }}>{pct>=80?'Świetny rytm!':pct>=50?'Stabilny rytm dziś':'Zacznij od jednego'}</div>
          <div style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--ink-3)',marginTop:3 }}>{scheduled.length} na dziś · {habitItems.length} razem</div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:134, overflowY:'auto', paddingRight:2 }}>
        {(habitsQ.isLoading || logsQ.isLoading) && (
          <div style={{ color:'var(--ink-3)', fontSize:12, padding:'8px 0' }}>Ładowanie nawyków...</div>
        )}
        {!habitsQ.isLoading && habitItems.length === 0 && (
          <div style={{ color:'var(--ink-3)', fontSize:12, padding:'8px 0' }}>Brak nawyków w Celach.</div>
        )}
        {habitItems.map(({ habit, stats, scheduledToday }) => {
          const canToggle = scheduledToday || stats.doneToday;
          return (
            <button
              key={habit.id}
              type="button"
              onClick={() => canToggle && toggleHabit.mutate({ habitId: habit.id, date: today, done: !stats.doneToday })}
              disabled={!canToggle}
              style={{
                display:'grid',
                gridTemplateColumns:'18px 1fr auto',
                alignItems:'center',
                gap:8,
                width:'100%',
                border:0,
                background:'transparent',
                color:'inherit',
                padding:'4px 0',
                textAlign:'left',
                cursor: canToggle ? 'pointer' : 'default',
                opacity: scheduledToday ? 1 : 0.55,
              }}
            >
              <span style={{
                width:16,
                height:16,
                borderRadius:6,
                border:`1.5px solid ${stats.doneToday ? 'var(--acc-a)' : 'var(--border)'}`,
                background: stats.doneToday ? 'var(--acc-a)' : 'transparent',
                display:'grid',
                placeItems:'center',
                color:'#fff',
              }}>
                {stats.doneToday && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </span>
              <span style={{ minWidth:0 }}>
                <span style={{ display:'block', fontSize:12.5, fontWeight:700, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{habit.name}</span>
                <span style={{ display:'block', fontSize:10.5, color:'var(--ink-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{habitScheduleLabel(habit)}</span>
              </span>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)' }}>{stats.streak}d</span>
            </button>
          );
        })}
      </div>
      <Link to="/goals" style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:14, fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--acc-a-ink)', textDecoration:'none', fontWeight:600 }}>
        Zobacz wszystkie
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </Link>
    </div>
  );
}

function TrainingStrip() {
  const { templates, sessions } = useLocalStore();
  const tpl = templates.find(t=>t.isActive) ?? templates[0];
  const lastSess = sessions[0];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Następny trening</span>
        {tpl && <span style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--acc-b-ink)',background:'var(--acc-b-soft)',padding:'4px 9px',borderRadius:999,fontWeight:600 }}>Push A</span>}
      </div>
      {tpl ? (
        <>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:64, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <svg viewBox="0 0 40 80" width="40" height="80" fill="none">
                <ellipse cx="20" cy="9" rx="7" ry="7" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="11" y="17" width="18" height="22" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--acc-a-soft)"/>
                <rect x="3" y="17" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--acc-a-soft)"/>
                <rect x="30" y="17" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--acc-a-soft)"/>
                <rect x="12" y="40" width="7" height="20" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="21" y="40" width="7" height="20" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="12" y="61" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="21" y="61" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>{tpl.name}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:3 }}>
                Ćwiczenie · {tpl.exercises.length > 0 ? tpl.exercises.reduce((s,e)=>s+e.sets.length,0) : 23} serii
              </div>
              <div style={{ display:'flex', gap:18, marginTop:12 }}>
                {[
                  { k:'Czas.',    v: tpl.estimatedDuration + ' min' },
                  { k:'Obj.',     v: lastSess ? '9 240 kg' : '–' },
                  { k:'Top seria',v: 'RIR 2' },
                ].map(s => (
                  <div key={s.k}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--ink-3)' }}>{s.k}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginTop:2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <Link to="/sport" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'var(--ink)', color:'var(--bg-1)', borderRadius:'var(--r-mid)', padding:'11px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Rozpocznij sesję
            </Link>
            <Link to="/sport" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', color:'var(--ink-2)', border:'1px solid var(--border)', borderRadius:'var(--r-mid)', padding:'11px 14px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </Link>
          </div>
        </>
      ) : (
        <div style={{ fontSize:13, color:'var(--ink-3)', textAlign:'center', padding:'20px 0' }}>Brak szablonu</div>
      )}
    </div>
  );
}

function CaloriesStrip() {
  const { data: entries = [] } = useTodayMealItems();
  const { data: nutrition } = useNutritionToday();
  const kcalGoal = nutrition?.kcal_target ?? 2500;
  const proteinGoal = nutrition?.protein_target ?? 180;
  const carbGoal = nutrition?.carb_target ?? 240;
  const fatGoal = nutrition?.fat_target ?? 70;
  const eaten = entries.reduce((s,e)=>s+e.kcal,0);
  const protein = Math.round(entries.reduce((s,e)=>s+e.protein,0));
  const carbs = Math.round(entries.reduce((s,e)=>s+e.carb,0));
  const fat = Math.round(entries.reduce((s,e)=>s+e.fat,0));
  const pct = kcalGoal > 0 ? Math.min(100, Math.round(eaten/kcalGoal*100)) : 0;
  const remaining = Math.round(kcalGoal - eaten);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Podsumowanie kalorii</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'86px minmax(142px, .75fr) minmax(180px, 1fr)', alignItems:'center', gap:14 }}>
        <div style={{ position:'relative', width:82, height:82, flexShrink:0 }}>
          <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="37" fill="none" stroke="var(--surface-inset)" strokeWidth="11"/>
            <circle cx="50" cy="50" r="37" fill="none" stroke="var(--acc-a)" strokeWidth="11" strokeLinecap="round"
              strokeDasharray="232.5" strokeDashoffset={232.5-(232.5*pct/100)}/>
          </svg>
          <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
            <span style={{ fontFamily:'var(--mono)',fontSize:20,fontWeight:800,lineHeight:1 }}>{pct}%</span>
          </div>
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:800, color:'var(--ink)', lineHeight:1.1 }}>
            {Math.round(eaten)} <span style={{ color:'var(--ink-3)', fontWeight:600 }}>/ {kcalGoal}</span>
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:4 }}>kcal</div>
          <div style={{ fontSize:12, color: remaining >= 0 ? 'var(--ink-2)' : 'var(--p-high)', marginTop:10, fontWeight:700 }}>
            {remaining >= 0 ? `Pozostało ${remaining}` : `Przekroczono ${Math.abs(remaining)}`} kcal
          </div>
        </div>
        <div style={{ maxWidth:260, width:'100%', justifySelf:'end' }}>
          {[
            { k:'Białko', v:protein, goal:proteinGoal, color:'var(--acc-a)' },
            { k:'Węglowodany', v:carbs, goal:carbGoal, color:'var(--ev-blue)' },
            { k:'Tłuszcze', v:fat, goal:fatGoal, color:'var(--acc-b)' },
          ].map(m => (
            <div key={m.k} style={{ marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11.5, color:'var(--ink-2)', fontWeight:500 }}>{m.k}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--ink)', fontWeight:600 }}>{m.v} <span style={{ color:'var(--ink-3)', fontWeight:400 }}>/ {m.goal} g</span></span>
              </div>
              <div style={{ height:4, borderRadius:999, background:'var(--surface-inset)', overflow:'hidden', maxWidth:230 }}>
                <div style={{ height:'100%', width:`${m.goal > 0 ? Math.min(100,Math.round(m.v/m.goal*100)) : 0}%`, background:m.color, borderRadius:999 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link to="/diet" style={{ display:'inline-flex',alignItems:'center',gap:5,marginTop:12,fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--acc-a-ink)',textDecoration:'none',fontWeight:600 }}>
        Zobacz szczegóły
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </Link>
    </div>
  );
}

// ─── TODAY PANEL ──────────────────────────────────────────────

const CAT_COLORS: Record<string,string> = {
  Rutyna:'var(--acc-a)', Trening:'var(--acc-b)', Praca:'var(--ev-blue)',
  Regeneracja:'var(--ev-lav)', Cel:'var(--ev-clay)', default:'var(--ink-4)',
};

interface TodayPanelProps {
  tasks: SupabaseTask[];
  isLoading: boolean;
  weather: WeatherData | null;
  weatherLoading: boolean;
  onAddTask: () => void;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
  onDeleteCompleted: (tasks: SupabaseTask[]) => void;
  onWeatherClick: () => void;
}

function TodayPanel({
  tasks,
  isLoading,
  weather,
  weatherLoading,
  onAddTask,
  onTaskClick,
  onToggleTask,
  onDeleteCompleted,
  onWeatherClick,
}: TodayPanelProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id); },[]);

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const displayTasks = tasks
    .filter((t) => (t.done ? (!t.due_date || t.due_date === todayStr) : (!t.due_date || t.due_date <= todayStr)))
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      const aDate = a.due_date ?? todayStr;
      const bDate = b.due_date ?? todayStr;
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return a.created_at.localeCompare(b.created_at);
    });
  const completedVisible = displayTasks.filter((task) => task.done);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:32, fontWeight:600, letterSpacing:'-.02em', lineHeight:1 }}>Zadania</span>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', letterSpacing:'.03em' }}>
              {now.getDate()} {MONTH_SHORT[now.getMonth()]} {now.getFullYear()}
            </span>
            <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--ink)' }}>
              {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
          </div>
          <WeatherButton weather={weather} loading={weatherLoading} onClick={onWeatherClick} />
        </div>
      </div>

      {/* Task list — scrollable */}
      <div style={{ flex:1, overflowY:'auto', minHeight:0, paddingRight:2 }}>
        {isLoading ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>
            Ladowanie zadan...
          </div>
        ) : displayTasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>
            Brak zadań na teraz.
          </div>
        ) : displayTasks.map(task => {
          const isDone = task.done;
          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => onTaskClick(task)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTaskClick(task)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 2px', borderTop:'1px solid var(--border-soft)', cursor:'pointer', opacity:isDone ? .72 : 1 }}
            >
              {/* Checkbox */}
              <div
                role="checkbox"
                aria-checked={isDone}
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(task.id, !task.done);
                }}
                onKeyDown={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.stopPropagation();
                    onToggleTask(task.id, !task.done);
                  }
                }}
                style={{ width:18, height:18, borderRadius:6, border:`1.5px solid ${isDone?'var(--acc-a)':'var(--border)'}`, background:isDone?'var(--acc-a)':'transparent', flexShrink:0, display:'grid', placeItems:'center', color:'#fff', cursor:'pointer', transition:'.15s' }}
              >
                {isDone && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ flex:1, fontSize:13, color:isDone?'var(--ink-3)':'var(--ink)', fontWeight:500, textDecoration:isDone?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {task.title}
              </span>
              {task.category && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', flexShrink:0 }}>
                  <i style={{ width:5, height:5, borderRadius:'50%', background:CAT_COLORS[task.category]??CAT_COLORS.default, display:'block' }}/>
                  {task.category}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Add task row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:12, marginTop:8, borderTop:'1px solid var(--border-soft)', flexShrink:0 }}>
        <button
          onClick={onAddTask}
          style={{ display:'flex', alignItems:'center', gap:7, flex:1, background:'transparent', border:0, color:'var(--ink-3)', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, padding:0, textAlign:'left' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--acc-a)', flexShrink:0 }}><path d="M12 5v14M5 12h14"/></svg>
          Dodaj zadanie
        </button>
        {completedVisible.length > 0 && (
          <button
            type="button"
            onClick={() => onDeleteCompleted(completedVisible)}
            style={{ background:'transparent', border:0, color:'var(--ink-3)', cursor:'pointer', fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.06em', textTransform:'uppercase', fontWeight:700, padding:0, whiteSpace:'nowrap' }}
          >
            Usuń wykonane
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────

export function StartScreen() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const deleteTasks = useDeleteTasks();
  const weather = useWeather();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(todayStr);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [weatherOpen, setWeatherOpen] = useState(false);

  const editingTask = editingTaskId ? tasks.find((task) => task.id === editingTaskId) ?? null : null;
  const editingSeriesCount = editingTask?.series_id
    ? tasks.filter((task) => task.series_id === editingTask.series_id).length
    : 0;
  const taskMutationPending = createTask.isPending || updateTask.isPending || deleteTask.isPending || deleteTasks.isPending;

  function openForToday() {
    setEditingTaskId(null);
    setModalDate(todayStr);
    setModalOpen(true);
  }
  function openForDay(dateStr: string) {
    setEditingTaskId(null);
    setModalDate(dateStr);
    setModalOpen(true);
  }
  function openTask(task: SupabaseTask) {
    setEditingTaskId(task.id);
    setModalDate(task.due_date ?? todayStr);
    setModalOpen(true);
  }
  function closeTaskModal() {
    setModalOpen(false);
    setEditingTaskId(null);
  }
  async function handleSaveTask(task: TaskModalPayload) {
    if (task.editingId) {
      await updateTask.mutateAsync({
        id: task.editingId,
        patch: {
          title: task.title,
          category: task.category,
          priority: task.priority,
          due_date: task.dueDates[0] ?? null,
          note: task.note,
        },
      });
      return;
    }
    const dueDates = expandTaskDates(task);
    const seriesId = dueDates.length > 1 || task.repeatMode !== 'none' ? makeClientId() : null;
    for (const dueDate of dueDates) {
      await createTask.mutateAsync({
        title: task.title,
        category: task.category,
        priority: task.priority,
        due_date: dueDate || null,
        scheduled_time: null,
        note: task.note,
        series_id: seriesId,
        repeat_mode: task.repeatMode,
        repeat_until: task.repeatUntil || null,
        repeat_weekdays: task.repeatMode === 'weekly' ? task.repeatWeekdays : null,
      });
    }
  }
  async function handleDeleteSingle(task: SupabaseTask) {
    await deleteTask.mutateAsync(task.id);
    closeTaskModal();
  }
  async function handleDeleteSeries(task: SupabaseTask) {
    if (!task.series_id) return handleDeleteSingle(task);
    const ids = tasks.filter((item) => item.series_id === task.series_id).map((item) => item.id);
    await deleteTasks.mutateAsync(ids);
    closeTaskModal();
  }
  function handleDeleteCompleted(doneTasks: SupabaseTask[]) {
    deleteTasks.mutate(doneTasks.map((task) => task.id));
  }

  return (
    <div className="module-page">
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: 'var(--gap)', gap: 'var(--gap)',
        maxWidth: 1640, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        {/* TOP ROW: Today + Calendar — fixed min-height, not flex-grow */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 'var(--gap)', minHeight: 480 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TodayPanel
              tasks={tasks}
              isLoading={tasksLoading}
              weather={weather.data}
              weatherLoading={weather.loading}
              onAddTask={openForToday}
              onTaskClick={openTask}
              onToggleTask={(id, done) => toggleTask.mutate({ id, done })}
              onDeleteCompleted={handleDeleteCompleted}
              onWeatherClick={() => setWeatherOpen(true)}
            />
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Calendar tasks={tasks} onDayClick={openForDay} onTaskClick={openTask} />
          </div>
        </div>

        {/* BOTTOM ROW: Habits · Training · Calories — always visible */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)' }}>
          <div className="card"><HabitsStrip /></div>
          <div className="card"><TrainingStrip /></div>
          <div className="card"><CaloriesStrip /></div>
        </div>
      </div>

      <AddTaskModal
        open={modalOpen}
        defaultDate={modalDate}
        task={editingTask}
        seriesCount={editingSeriesCount}
        saving={taskMutationPending}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        onDeleteSingle={handleDeleteSingle}
        onDeleteSeries={handleDeleteSeries}
      />
      <WeatherModal
        open={weatherOpen}
        weather={weather.data}
        loading={weather.loading}
        error={weather.error}
        onClose={() => setWeatherOpen(false)}
      />
    </div>
  );
}
