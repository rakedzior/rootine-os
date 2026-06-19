import { useState, useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDelete, Field, Modal } from '@/components/common';
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

const WEEKDAY_FULL = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];

function isRecurringTask(task: SupabaseTask): boolean {
  return task.repeat_mode === 'daily' || task.repeat_mode === 'weekly';
}

function RecurringIcon({ size = 9 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Zadanie cykliczne"
      style={{ flexShrink: 0, opacity: 0.85 }}
    >
      <title>Zadanie cykliczne</title>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function addDaysToDate(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function startOfWeekDate(d: Date): Date {
  const copy = new Date(d);
  const dow = copy.getDay(); // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

interface CalendarProps {
  tasks: SupabaseTask[];
  onDayClick: (dateStr: string) => void;
  onTaskClick: (task: SupabaseTask) => void;
}

function Calendar({ tasks, onDayClick, onTaskClick }: CalendarProps) {
  const now = new Date();
  const [view, setView] = useState<'month'|'week'|'day'>('month');
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayDateStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  function prev() {
    if (view === 'month') setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    else if (view === 'week') setCursor(c => addDaysToDate(c, -7));
    else setCursor(c => addDaysToDate(c, -1));
  }
  function next() {
    if (view === 'month') setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    else if (view === 'week') setCursor(c => addDaysToDate(c, 7));
    else setCursor(c => addDaysToDate(c, 1));
  }
  function goToday() { setCursor(new Date(now.getFullYear(), now.getMonth(), now.getDate())); }

  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);
  let startDow = first.getDay(); startDow = startDow===0?6:startDow-1;
  const monthCells: (Date|null)[] = [];
  for (let i=0;i<startDow;i++) monthCells.push(null);
  for (let d=1;d<=last.getDate();d++) monthCells.push(new Date(year, month, d));
  while (monthCells.length%7!==0) monthCells.push(null);

  const weekStart = startOfWeekDate(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysToDate(weekStart, i));
  const weekEnd = weekDays[6];

  function renderDayCell(date: Date, compact: boolean) {
    const dateStr = toDateStr(date.getFullYear(), date.getMonth(), date.getDate());
    const isCellToday = dateStr === todayDateStr;
    const evs = compact ? (MOCK_EVENTS[date.getDate()] ?? []) : [];
    const allDayTasks = tasks
      .filter(t => t.due_date === dateStr)
      .sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at));
    const cap = compact ? 3 : 6;
    const dayTasks = allDayTasks.slice(0, cap);
    const extraTasks = Math.max(0, allDayTasks.length - dayTasks.length);
    return (
      <div key={dateStr}
        className="day-cell"
        onClick={() => onDayClick(dateStr)}
        style={{
          minHeight: compact ? 72 : 150, borderRadius:'var(--r-sm)',
          background: isCellToday ? 'var(--acc-a-soft)' : 'var(--surface-inset)',
          border: isCellToday ? '1px solid var(--acc-a)' : '1px solid var(--border-soft)',
          padding:7, display:'flex', flexDirection:'column', gap:3,
          cursor:'pointer',
          transition:'.14s',
          overflow:'hidden',
        }}
        title={`Dodaj zadanie na ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`}
      >
        <div style={{
          fontVariantNumeric:'tabular-nums',
          ...(isCellToday
            ? { color:'#fff', background:'var(--acc-a)', width:22, height:22, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, fontWeight:700 }
            : { fontSize:12, fontWeight:600, color:'var(--ink-2)' })
        }}>{date.getDate()}</div>
        {evs.map(e => (
          <div key={e.label} className={`ev ${e.cls}`} style={{ fontSize:9.5 }}>{e.label}</div>
        ))}
        {dayTasks.map(t => (
          <div
            key={t.id}
            className="ev green ev-task"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(t);
            }}
            style={{ fontSize:9.5, opacity:t.done ? .75 : 1, textDecoration:t.done?'line-through':'none' }}
            title="Edytuj zadanie"
          >
            {isRecurringTask(t) && <RecurringIcon />}
            <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</span>
          </div>
        ))}
        {extraTasks > 0 && (
          <div className="ev" style={{ fontSize:9.5, color:'var(--ink-3)' }}>+{extraTasks}</div>
        )}
      </div>
    );
  }

  const cursorDateStr = toDateStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  const dayTasksForAgenda = tasks
    .filter(t => t.due_date === cursorDateStr)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at));

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight: 0 }}>
      {/* cal head */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0, flexWrap:'wrap', gap:8 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:600, letterSpacing:'-.01em' }}>
          {view === 'month' && <>{MONTH_FULL[month]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{year}</span></>}
          {view === 'day' && <>{cursor.getDate()} {MONTH_FULL[cursor.getMonth()]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{cursor.getFullYear()}</span></>}
          {view === 'week' && (
            weekStart.getMonth() === weekEnd.getMonth()
              ? <>{weekStart.getDate()}–{weekEnd.getDate()} {MONTH_FULL[weekStart.getMonth()]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{weekEnd.getFullYear()}</span></>
              : <>{weekStart.getDate()} {MONTH_SHORT[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTH_SHORT[weekEnd.getMonth()]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{weekEnd.getFullYear()}</span></>
          )}
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

      {view === 'month' && (
        <>
          {/* day names */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:5, flexShrink:0 }}>
            {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map(d => (
              <div key={d} style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)',paddingLeft:4 }}>{d}</div>
            ))}
          </div>
          {/* grid — flex:1 so it fills remaining card height */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:5, flex:1, minHeight:0 }}>
            {monthCells.map((date, i) => date ? renderDayCell(date, true) : <div key={`blank-${i}`} style={{ opacity:0 }} />)}
          </div>
        </>
      )}

      {view === 'week' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:5, flexShrink:0 }}>
            {weekDays.map(d => (
              <div key={d.toISOString()} style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)',paddingLeft:4 }}>
                {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'][d.getDay()===0?6:d.getDay()-1]} {d.getDate()}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, flex:1, minHeight:0 }}>
            {weekDays.map(d => renderDayCell(d, false))}
          </div>
        </>
      )}

      {view === 'day' && (
        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)', flexShrink:0 }}>
            {WEEKDAY_FULL[cursor.getDay()===0?6:cursor.getDay()-1]}
          </div>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
            {dayTasksForAgenda.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-3)', fontSize:13 }}>Brak zadań tego dnia.</div>
            ) : dayTasksForAgenda.map(t => (
              <div
                key={t.id}
                className="day-cell hover-row"
                onClick={() => onTaskClick(t)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:10, border:'1px solid var(--border-soft)', background:'var(--surface-inset)', cursor:'pointer', opacity:t.done?.7:1 }}
              >
                <i style={{ width:7, height:7, borderRadius:'50%', background:CAT_COLORS[t.category ?? '']??CAT_COLORS.default, flexShrink:0 }} />
                <span style={{ flex:1, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink)', textDecoration:t.done?'line-through':'none' }}>
                  {t.title}
                  {isRecurringTask(t) && <RecurringIcon size={11} />}
                </span>
                {t.category && <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)' }}>{t.category}</span>}
              </div>
            ))}
            <button
              onClick={() => onDayClick(cursorDateStr)}
              style={{ marginTop:4, display:'flex', alignItems:'center', gap:6, background:'transparent', border:'1px dashed var(--border)', borderRadius:10, padding:'11px 12px', color:'var(--ink-3)', cursor:'pointer', fontSize:13, flexShrink:0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Dodaj zadanie na ten dzień
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM STRIP COMPONENTS ──────────────────────────────────

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
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Nawyki</span>
        <span style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-3)' }}>{done} / {total}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14, flexShrink:0 }}>
        <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
          <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-inset)" strokeWidth="12"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--acc-a)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray="251.3" strokeDashoffset={251.3-(251.3*pct/100)}/>
          </svg>
        </div>
      </div>
      <div
        className={`habits-strip-list${habitItems.length > 4 ? ' two-col' : ''}`}
        style={{ flex:1, overflowY:'auto', paddingRight:2, minHeight:0 }}
      >
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
              className="hover-row"
              style={{
                display:'grid',
                gridTemplateColumns:'18px 1fr auto',
                alignItems:'center',
                gap:8,
                width:'100%',
                border:0,
                background:'transparent',
                color:'inherit',
                padding:'4px 6px',
                borderRadius: 8,
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
      <Link to="/goals" style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:14, fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--acc-a-ink)', textDecoration:'none', fontWeight:600, flexShrink:0 }}>
        Zobacz szczegóły
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Następny trening</span>
        {tpl && <span style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--acc-b-ink)',background:'var(--acc-b-soft)',padding:'4px 9px',borderRadius:999,fontWeight:600 }}>Push A</span>}
      </div>
      {tpl ? (
        <div style={{ display:'flex', flexDirection:'column', flex:1, justifyContent:'center', gap:16, minHeight:0 }}>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ width:72, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <svg viewBox="0 0 40 80" width="48" height="96" fill="none">
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
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:17, fontWeight:700, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tpl.name}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:4 }}>
                Ćwiczenie · {tpl.exercises.length > 0 ? tpl.exercises.reduce((s,e)=>s+e.sets.length,0) : 23} serii
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, padding:'14px 0', borderTop:'1px solid var(--border-soft)', borderBottom:'1px solid var(--border-soft)' }}>
            {[
              { k:'Czas.',    v: tpl.estimatedDuration + ' min' },
              { k:'Obj.',     v: lastSess ? '9 240 kg' : '–' },
              { k:'Top seria',v: 'RIR 2' },
            ].map(s => (
              <div key={s.k} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--ink-3)' }}>{s.k}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)', marginTop:3 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--ink-3)', textAlign:'center' }}>Brak szablonu</div>
      )}
      {tpl && (
        <div style={{ display:'flex', gap:8, marginTop:16, flexShrink:0 }}>
          <Link to="/sport" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'var(--ink)', color:'var(--bg-1)', borderRadius:'var(--r-mid)', padding:'11px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Rozpocznij sesję
          </Link>
          <Link to="/sport" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', color:'var(--ink-2)', border:'1px solid var(--border)', borderRadius:'var(--r-mid)', padding:'11px 14px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </Link>
        </div>
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Podsumowanie kalorii</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', flex:1, justifyContent:'center', gap:22, minHeight:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ position:'relative', width:108, height:108, flexShrink:0 }}>
            <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="43" fill="none" stroke="var(--surface-inset)" strokeWidth="13"/>
              <circle cx="50" cy="50" r="43" fill="none" stroke="var(--acc-a)" strokeWidth="13" strokeLinecap="round"
                strokeDasharray="270.2" strokeDashoffset={270.2-(270.2*pct/100)}/>
            </svg>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:26, fontWeight:800, color:'var(--ink)', lineHeight:1.1 }}>
              {Math.round(eaten)} <span style={{ color:'var(--ink-3)', fontWeight:600 }}>/ {kcalGoal}</span>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:5 }}>kcal</div>
            <div style={{ fontSize:13, color: remaining >= 0 ? 'var(--ink-2)' : 'var(--p-high)', marginTop:12, fontWeight:700 }}>
              {remaining >= 0 ? `Pozostało ${remaining}` : `Przekroczono ${Math.abs(remaining)}`} kcal
            </div>
          </div>
        </div>
        <div style={{ width:'100%' }}>
          {[
            { k:'Białko', v:protein, goal:proteinGoal, color:'var(--acc-a)' },
            { k:'Węglowodany', v:carbs, goal:carbGoal, color:'var(--ev-blue)' },
            { k:'Tłuszcze', v:fat, goal:fatGoal, color:'var(--acc-b)' },
          ].map(m => (
            <div key={m.k} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12.5, color:'var(--ink-2)', fontWeight:500 }}>{m.k}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:'var(--ink)', fontWeight:600 }}>{m.v} <span style={{ color:'var(--ink-3)', fontWeight:400 }}>/ {m.goal} g</span></span>
              </div>
              <div style={{ height:5, borderRadius:999, background:'var(--surface-inset)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${m.goal > 0 ? Math.min(100,Math.round(m.v/m.goal*100)) : 0}%`, background:m.color, borderRadius:999 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link to="/diet" style={{ display:'inline-flex',alignItems:'center',gap:5,marginTop:12,fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--acc-a-ink)',textDecoration:'none',fontWeight:600,flexShrink:0 }}>
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
  onAddTask: () => void;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
  onDeleteCompleted: (tasks: SupabaseTask[]) => void;
}

function TodayPanel({
  tasks,
  isLoading,
  onAddTask,
  onTaskClick,
  onToggleTask,
  onDeleteCompleted,
}: TodayPanelProps) {
  const now = useMemo(() => new Date(), []);

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
              className="hover-row"
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 6px', margin:'0 -6px', borderTop:'1px solid var(--border-soft)', borderRadius:8, cursor:'pointer', opacity:isDone ? .72 : 1 }}
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(todayStr);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [seriesDeleteTarget, setSeriesDeleteTarget] = useState<SupabaseTask | null>(null);

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
  function requestDeleteSeries(task: SupabaseTask) {
    if (!task.series_id) return handleDeleteSingle(task);
    setSeriesDeleteTarget(task);
  }
  async function handleDeleteSeries(task: SupabaseTask) {
    if (!task.series_id) return handleDeleteSingle(task);
    const ids = tasks.filter((item) => item.series_id === task.series_id).map((item) => item.id);
    await deleteTasks.mutateAsync(ids);
    setSeriesDeleteTarget(null);
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
              onAddTask={openForToday}
              onTaskClick={openTask}
              onToggleTask={(id, done) => toggleTask.mutate({ id, done })}
              onDeleteCompleted={handleDeleteCompleted}
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
        onDeleteSeries={requestDeleteSeries}
      />

      <ConfirmDelete
        open={!!seriesDeleteTarget}
        onClose={() => setSeriesDeleteTarget(null)}
        onConfirm={() => seriesDeleteTarget && handleDeleteSeries(seriesDeleteTarget)}
        label="cały cykl zadań"
      />
    </div>
  );
}
