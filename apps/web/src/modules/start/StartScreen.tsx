import { useState, useEffect, useMemo, useRef, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDelete, Field, Modal, PageHeader } from '@/components/common';
import { useHabits, useHabitLogs, useToggleHabitLog } from '@/features/habits/hooks';
import { habitOccursOn, habitScheduleLabel, habitStats, todayStr as habitsTodayStr } from '@/features/habits/dates';
import type { HabitLog } from '@/features/habits/types';
import { useCreateTask, useDeleteTask, useDeleteTasks, useTasks, useToggleTask, useUpdateTask } from '@/features/tasks/hooks';
import type { Task as SupabaseTask } from '@/features/tasks/types';

const MONTH_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const MONTH_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function fmtShortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTH_SHORT[m - 1] ?? ''}`;
}

// ─── ADD TASK MODAL ───────────────────────────────────────────

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
type RepeatEndMode = 'date' | 'count';

interface NewTask {
  title: string;
  priority: 'high' | 'mid' | 'low';
  dueDates: string[];
  repeatMode: RepeatMode;
  repeatWeekdays: number[];
  repeatEndMode: RepeatEndMode;
  repeatUntil: string;
  repeatCount: number;
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

function expandTaskDates(task: Pick<NewTask, 'dueDates' | 'repeatMode' | 'repeatWeekdays' | 'repeatEndMode' | 'repeatUntil' | 'repeatCount'>): string[] {
  const baseDates = uniqueSorted(task.dueDates.filter(isDateStr));
  if (baseDates.length === 0) return [];
  if (task.repeatMode === 'none') return baseDates;

  const start = baseDates[0];
  const end = task.repeatEndMode === 'date' && task.repeatUntil && isDateStr(task.repeatUntil) && task.repeatUntil >= start
    ? task.repeatUntil
    : addDaysStr(start, DEFAULT_REPEAT_DAYS);
  const occurrenceLimit = task.repeatEndMode === 'count'
    ? Math.max(1, Math.min(MAX_TASK_OCCURRENCES, Math.floor(task.repeatCount || 1)))
    : MAX_TASK_OCCURRENCES;
  const dates = new Set(baseDates);

  if (task.repeatMode === 'daily') {
    for (let cursor = start; cursor <= end && dates.size < occurrenceLimit; cursor = addDaysStr(cursor, 1)) {
      dates.add(cursor);
    }
  }

  if (task.repeatMode === 'weekly') {
    const weekdays = task.repeatWeekdays.length
      ? task.repeatWeekdays
      : [...new Set(baseDates.map(weekdayFromDateStr))];
    for (let cursor = start; cursor <= end && dates.size < occurrenceLimit; cursor = addDaysStr(cursor, 1)) {
      if (weekdays.includes(weekdayFromDateStr(cursor))) dates.add(cursor);
    }
  }

  return uniqueSorted([...dates]).slice(0, occurrenceLimit);
}

interface AddTaskModalProps {
  open: boolean;
  defaultDate: string;
  task?: SupabaseTask | null;
  seriesCount?: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (task: TaskModalPayload) => Promise<void> | void;
  onComplete?: (task: SupabaseTask) => Promise<void> | void;
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
  onComplete,
  onDeleteSingle,
  onDeleteSeries,
}: AddTaskModalProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'mid' | 'low'>('mid');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([defaultDate]));
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([weekdayFromDateStr(defaultDate)]);
  const [repeatEndMode, setRepeatEndMode] = useState<RepeatEndMode>('date');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [repeatCount, setRepeatCount] = useState(8);
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
      setPriority(task.priority ?? 'mid');
      setRepeatMode('none');
      setRepeatWeekdays([weekdayFromDateStr(date)]);
      setRepeatEndMode('date');
      setRepeatUntil('');
      setRepeatCount(8);
      setNote(task.note ?? '');
      focusDate(date);
      return;
    }
    setTitle('');
    setPriority('mid');
    setRepeatMode('none');
    setRepeatEndMode('date');
    setRepeatUntil('');
    setRepeatCount(8);
    setNote('');
    focusDate(defaultDate);
  }, [defaultDate, open, task]);

  const reset = () => {
    setTitle('');
    setPriority('mid');
    setRepeatMode('none');
    setRepeatEndMode('date');
    setRepeatUntil('');
    setRepeatCount(8);
    setNote('');
    focusDate(defaultDate);
  };

  const selectedDateList = uniqueSorted([...selectedDates]);
  const displayedDateSet = dragRange ? new Set(dateRangeInclusive(dragRange.start, dragRange.end)) : selectedDates;
  const repeatUntilClean = repeatUntil.trim();
  const repeatUntilInvalid = !isEditing && repeatMode !== 'none' && repeatEndMode === 'date' && repeatUntilClean !== '' && (!isDateStr(repeatUntilClean) || repeatUntilClean < selectedDateList[0]);
  const repeatCountInvalid = !isEditing && repeatMode !== 'none' && repeatEndMode === 'count' && (!Number.isFinite(repeatCount) || repeatCount < 1 || repeatCount > MAX_TASK_OCCURRENCES);
  const previewCount = isEditing ? 1 : expandTaskDates({
    dueDates: selectedDateList,
    repeatMode,
    repeatWeekdays,
    repeatEndMode,
    repeatUntil: repeatUntilClean,
    repeatCount,
  }).length;

  async function handleSave() {
    if (!title.trim() || selectedDateList.length === 0 || repeatUntilInvalid || repeatCountInvalid || saving) return;
    try {
      await onSave({
        editingId: task?.id,
        title: title.trim(),
        priority,
        dueDates: isEditing ? selectedDateList.slice(0, 1) : selectedDateList,
        repeatMode: isEditing ? 'none' : repeatMode,
        repeatWeekdays,
        repeatEndMode,
        repeatUntil: isEditing ? '' : repeatUntilClean,
        repeatCount,
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
            {task && !task.done && (
              <button className="btn btn-primary btn-sm" onClick={() => onComplete?.(task)} disabled={saving}>
                Zakończ zadanie
              </button>
            )}
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
              disabled={!title.trim() || selectedDateList.length === 0 || repeatUntilInvalid || repeatCountInvalid || saving}
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

          <Field label="Priorytet">
            <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as 'high' | 'mid' | 'low')} style={{ width: '100%' }}>
              {PRIO_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>

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

          {!isEditing && repeatMode !== 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid var(--border-soft)', borderRadius: 'var(--r-mid)', background: 'var(--surface-inset)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 800 }}>
                Zakończenie powtarzania
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {([
                  ['date', 'Do daty'],
                  ['count', 'Po liczbie'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRepeatEndMode(value)}
                    style={{
                      minHeight: 34,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: repeatEndMode === value ? 'var(--acc-a-soft)' : 'var(--surface)',
                      color: repeatEndMode === value ? 'var(--acc-a-ink)' : 'var(--ink-2)',
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
              {repeatEndMode === 'date' ? (
                <Field label="Data końca">
                  <input
                    className="input"
                    type="date"
                    value={repeatUntil}
                    onChange={(e) => setRepeatUntil(e.target.value)}
                    style={{ width: '100%', borderColor: repeatUntilInvalid ? 'var(--p-high)' : undefined }}
                  />
                </Field>
              ) : (
                <Field label="Liczba wystąpień">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={MAX_TASK_OCCURRENCES}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Number(e.target.value))}
                    style={{ width: '100%', borderColor: repeatCountInvalid ? 'var(--p-high)' : undefined }}
                  />
                </Field>
              )}
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Seria utworzy <strong style={{ color: 'var(--ink)' }}>{previewCount}</strong> wystąpień.
              </div>
            </div>
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
                    color: active ? 'var(--on-acc)' : 'var(--ink-2)',
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
            <div style={{ marginTop: 8, color: 'var(--p-high)', fontSize: 12 }}>Data końca musi być poprawna i nie może być wcześniejsza niż pierwszy termin.</div>
          )}
          {repeatCountInvalid && (
            <div style={{ marginTop: 8, color: 'var(--p-high)', fontSize: 12 }}>Liczba wystąpień musi być od 1 do {MAX_TASK_OCCURRENCES}.</div>
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
  onToggleTask: (id: string, done: boolean) => void;
  onMoveTask: (task: SupabaseTask, dateStr: string) => void;
}

function Calendar({ tasks, onDayClick, onTaskClick, onToggleTask, onMoveTask }: CalendarProps) {
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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('text/plain');
          const movedTask = tasks.find((item) => item.id === taskId);
          if (movedTask && movedTask.due_date !== dateStr) onMoveTask(movedTask, dateStr);
        }}
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
            ? { color:'var(--on-acc)', background:'var(--acc-a)', width:22, height:22, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, fontWeight:700 }
            : { fontSize:12, fontWeight:600, color:'var(--ink-2)' })
        }}>{date.getDate()}</div>
        {dayTasks.map(t => (
          <div
            key={t.id}
            className="ev green ev-task"
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData('text/plain', t.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(t);
            }}
            style={{ fontSize:9.5, opacity:t.done ? .75 : 1, textDecoration:t.done?'line-through':'none', cursor:'grab' }}
            title="Edytuj zadanie"
          >
            <button
              type="button"
              aria-label={t.done ? 'Oznacz jako niewykonane' : 'Zakończ zadanie'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleTask(t.id, !t.done);
              }}
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                border: `1.4px solid ${t.done ? 'var(--acc-a)' : 'currentColor'}`,
                background: t.done ? 'var(--acc-a)' : 'transparent',
                color: 'var(--on-acc)',
                display: 'grid',
                placeItems: 'center',
                padding: 0,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {t.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
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
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', t.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onTaskClick(t)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:10, border:'1px solid var(--border-soft)', background:'var(--surface-inset)', cursor:'pointer', opacity:t.done?.7:1 }}
              >
                <button
                  type="button"
                  aria-label={t.done ? 'Oznacz jako niewykonane' : 'Zakończ zadanie'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(t.id, !t.done);
                  }}
                  style={{ width:18, height:18, borderRadius:6, border:`1.5px solid ${t.done?'var(--acc-a)':'var(--border)'}`, background:t.done?'var(--acc-a)':'transparent', flexShrink:0, display:'grid', placeItems:'center', color:'var(--on-acc)', cursor:'pointer' }}
                >
                  {t.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </button>
                <span style={{ flex:1, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink)', textDecoration:t.done?'line-through':'none' }}>
                  {t.title}
                  {isRecurringTask(t) && <RecurringIcon size={11} />}
                </span>
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
          <span style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', fontFamily:'var(--mono)', fontSize:13, fontWeight:800, color:'var(--ink)' }}>{pct}%</span>
        </div>
        <div style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.4 }}>
          Wykonano <strong style={{ color:'var(--ink)' }}>{done}</strong> z <strong style={{ color:'var(--ink)' }}>{total}</strong> dzisiejszych nawyków.
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
              className={`habit-chip${stats.doneToday ? ' done' : ''}`}
              style={{
                display:'grid',
                gridTemplateColumns:'18px 1fr auto',
                alignItems:'center',
                gap:8,
                width:'100%',
                color:'inherit',
                padding:'8px 10px',
                borderRadius: 10,
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
                background: stats.doneToday ? 'var(--acc-a)' : 'var(--surface)',
                display:'grid',
                placeItems:'center',
                color:'var(--on-acc)',
                flexShrink: 0,
              }}>
                {stats.doneToday && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </span>
              <span style={{ minWidth:0 }}>
                <span style={{ display:'block', fontSize:12.5, fontWeight:700, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{habit.name}</span>
                <span style={{ display:'block', fontSize:10.5, color:'var(--ink-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{habitScheduleLabel(habit)}</span>
              </span>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', whiteSpace:'nowrap' }}>{stats.streak}d</span>
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

// ─── TODAY PANEL ──────────────────────────────────────────────

interface TodayPanelProps {
  tasks: SupabaseTask[];
  isLoading: boolean;
  onAddTask: () => void;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
  onDeleteCompleted: (tasks: SupabaseTask[]) => void;
}

function PlannerTaskRow({ task, todayStr, onTaskClick, onToggleTask }: {
  task: SupabaseTask; todayStr: string;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
}) {
  const isDone = task.done;
  const overdue = !isDone && !!task.due_date && task.due_date < todayStr;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTaskClick(task)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTaskClick(task)}
      className="hover-row"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 6px', margin:'0 -6px', borderRadius:8, cursor:'pointer', opacity:isDone ? .72 : 1 }}
    >
      <div
        role="checkbox"
        aria-checked={isDone}
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, !task.done); }}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); onToggleTask(task.id, !task.done); } }}
        style={{ width:18, height:18, borderRadius:6, border:`1.5px solid ${isDone?'var(--acc-a)':'var(--border)'}`, background:isDone?'var(--acc-a)':'transparent', flexShrink:0, display:'grid', placeItems:'center', color:'var(--on-acc)', cursor:'pointer', transition:'.15s' }}
      >
        {isDone && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
      </div>
      <span style={{ flex:1, fontSize:13, color:isDone?'var(--ink-3)':'var(--ink)', fontWeight:500, textDecoration:isDone?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {task.title}
      </span>
      {overdue && <span className="badge status-overdue" style={{ flexShrink:0 }}>Po terminie</span>}
      {!overdue && task.due_date && task.due_date !== todayStr && (
        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', flexShrink:0 }}>{fmtShortDate(task.due_date)}</span>
      )}
    </div>
  );
}

function PlannerSection({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, padding:'0 2px' }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:700 }}>{label}</span>
        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>{count}</span>
      </div>
      {children}
    </div>
  );
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

  const byDate = (a: SupabaseTask, b: SupabaseTask) => {
    const aDate = a.due_date ?? '';
    const bDate = b.due_date ?? '';
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return a.created_at.localeCompare(b.created_at);
  };

  // Sekcje: Dzisiaj (dziś + po terminie), Nadchodzące, Bez daty.
  const todaySec = tasks.filter((t) => !t.done && (t.due_date === todayStr || (!!t.due_date && t.due_date < todayStr))).sort(byDate);
  const upcomingSec = tasks.filter((t) => !t.done && !!t.due_date && t.due_date > todayStr).sort(byDate);
  const undatedSec = tasks.filter((t) => !t.done && !t.due_date).sort(byDate);
  const completedToday = tasks.filter((t) => t.done && (!t.due_date || t.due_date === todayStr)).sort(byDate);
  const total = todaySec.length + upcomingSec.length + undatedSec.length + completedToday.length;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:600, letterSpacing:'-.02em', lineHeight:1 }}>Zadania</span>
      </div>

      {/* Task list — scrollable, grouped */}
      <div style={{ flex:1, overflowY:'auto', minHeight:0, paddingRight:2 }}>
        {isLoading ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>Ladowanie zadan...</div>
        ) : total === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>Brak zadań. Dodaj pierwsze poniżej.</div>
        ) : (
          <>
            <PlannerSection label="Dzisiaj" count={todaySec.length}>
              {todaySec.map((task) => <PlannerTaskRow key={task.id} task={task} todayStr={todayStr} onTaskClick={onTaskClick} onToggleTask={onToggleTask} />)}
            </PlannerSection>
            <PlannerSection label="Nadchodzące" count={upcomingSec.length}>
              {upcomingSec.map((task) => <PlannerTaskRow key={task.id} task={task} todayStr={todayStr} onTaskClick={onTaskClick} onToggleTask={onToggleTask} />)}
            </PlannerSection>
            <PlannerSection label="Bez daty" count={undatedSec.length}>
              {undatedSec.map((task) => <PlannerTaskRow key={task.id} task={task} todayStr={todayStr} onTaskClick={onTaskClick} onToggleTask={onToggleTask} />)}
            </PlannerSection>
            <PlannerSection label="Ukończone dziś" count={completedToday.length}>
              {completedToday.map((task) => <PlannerTaskRow key={task.id} task={task} todayStr={todayStr} onTaskClick={onTaskClick} onToggleTask={onToggleTask} />)}
            </PlannerSection>
          </>
        )}
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
        {completedToday.length > 0 && (
          <button
            type="button"
            onClick={() => onDeleteCompleted(completedToday)}
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

function PlannerHeaderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
    </svg>
  );
}

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
  const taskMutationPending = createTask.isPending || updateTask.isPending || toggleTask.isPending || deleteTask.isPending || deleteTasks.isPending;

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
          category: null,
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
        category: null,
        priority: task.priority,
        due_date: dueDate || null,
        scheduled_time: null,
        note: task.note,
        series_id: seriesId,
        repeat_mode: task.repeatMode,
        repeat_until: task.repeatEndMode === 'date' ? task.repeatUntil || null : dueDates[dueDates.length - 1] ?? null,
        repeat_weekdays: task.repeatMode === 'weekly' ? task.repeatWeekdays : null,
      });
    }
  }
  async function handleCompleteTask(task: SupabaseTask) {
    await toggleTask.mutateAsync({ id: task.id, done: true });
    closeTaskModal();
  }
  function handleMoveTask(task: SupabaseTask, dateStr: string) {
    updateTask.mutate({ id: task.id, patch: { due_date: dateStr } });
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
      <div className="planner-shell">
        <PageHeader
          icon={<PlannerHeaderIcon />}
          title="Planer"
          desc={'Zaplanuj dzie\u0144, zadania, nawyki i cele w jednym miejscu.'}
          actions={<button className="btn btn-primary btn-sm" type="button" onClick={openForToday}>+ Nowe zadanie</button>}
        />
        <div className="planner-layout">
          <aside className="planner-sidebar">
            <div className="card planner-tasks-card">
              <TodayPanel
                tasks={tasks}
                isLoading={tasksLoading}
                onAddTask={openForToday}
                onTaskClick={openTask}
                onToggleTask={(id, done) => toggleTask.mutate({ id, done })}
                onDeleteCompleted={handleDeleteCompleted}
              />
            </div>
            <div className="card planner-habits-card"><HabitsStrip /></div>
          </aside>
          <section className="card planner-calendar-card">
            <Calendar
              tasks={tasks}
              onDayClick={openForDay}
              onTaskClick={openTask}
              onToggleTask={(id, done) => toggleTask.mutate({ id, done })}
              onMoveTask={handleMoveTask}
            />
          </section>
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
        onComplete={handleCompleteTask}
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
