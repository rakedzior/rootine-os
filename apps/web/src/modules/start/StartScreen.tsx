import { useState, useEffect, useLayoutEffect, useMemo, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { ConfirmDelete, Field, Modal, PageHeader } from '@/components/common';
import { PageLayout } from '@/components/layout/primitives';
import { useHabits, useHabitLogs, useCreateHabit, useUpdateHabit, useDeleteHabit, useSetHabitStatus, useSetHabitVisibility, useSetHabitEntry, useToggleHabitLog } from '@/features/habits/hooks';
import { ALL_WEEKDAYS, habitOccursOn, habitScheduleLabel, habitStats, todayStr as habitsTodayStr } from '@/features/habits/dates';
import type { Habit, HabitEndMode, HabitEntryStatus, HabitLog, HabitScheduleType, NewHabitInput } from '@/features/habits/types';
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

function normalizeTag(value: string): string {
  return value.trim().replace(/^#/, '').toLowerCase();
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTag(raw);
    if (!tag) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

function consumeCompletedTags(text: string, currentTags: string[]): { title: string; tags: string[] } {
  const captured: string[] = [];
  const title = text
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)\s+/gu, (_m, lead: string, tag: string) => {
      captured.push(tag);
      return lead;
    })
    .replace(/\s{2,}/g, ' ')
    .trimStart();
  return { title, tags: dedupeTags([...currentTags, ...captured]) };
}

function extractTitleAndTags(text: string, currentTags: string[]): { title: string; tags: string[] } {
  const captured: string[] = [];
  const title = text
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)(?=\s|$)/gu, (_m, lead: string, tag: string) => {
      captured.push(tag);
      return lead;
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { title, tags: dedupeTags([...currentTags, ...captured]) };
}

// ADD TASK MODAL

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
  tags: string[];
  priority: 'high' | 'mid' | 'low';
  dueDates: string[];
  allDay: boolean;
  startTime: string;
  endDate: string;
  endTime: string;
  reminderMode: 'at_time' | '5m' | '30m' | '1h' | '1d';
  repeatMode: RepeatMode;
  repeatWeekdays: number[];
  repeatEndMode: RepeatEndMode;
  repeatUntil: string;
  repeatCount: number;
  repeatModeUi: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatAnchor: 'due_date' | 'completion_date';
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
  initialTitle?: string;
  initialTags?: string[];
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
  initialTitle,
  initialTags,
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
  const [tags, setTags] = useState<string[]>([]);
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
      setTags(dedupeTags(task.tags ?? []));
      setPriority(task.priority ?? 'mid');
      setRepeatMode('none');
      setRepeatWeekdays([weekdayFromDateStr(date)]);
      setRepeatEndMode('date');
      setRepeatUntil('');
      setRepeatCount(8);
      setNote(task.note ?? '');
      setRepeatMode(task.repeat_mode === 'daily' ? 'daily' : task.repeat_mode === 'weekly' ? 'weekly' : 'none');
      if (task.repeat_until) setRepeatUntil(task.repeat_until);
      focusDate(date);
      return;
    }
    const parsed = extractTitleAndTags(initialTitle ?? '', initialTags ?? []);
    setTitle(parsed.title);
    setTags(parsed.tags);
    setPriority('mid');
    setRepeatMode('none');
    setRepeatEndMode('date');
    setRepeatUntil('');
    setRepeatCount(8);
    setNote('');
    focusDate(defaultDate);
  }, [defaultDate, initialTags, initialTitle, open, task]);

  const reset = () => {
    setTitle('');
    setTags([]);
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
    const parsed = extractTitleAndTags(title, tags);
    if (!parsed.title || selectedDateList.length === 0 || repeatUntilInvalid || repeatCountInvalid || saving) return;
    try {
      await onSave({
        editingId: task?.id,
        title: parsed.title,
        tags: parsed.tags,
        priority,
        dueDates: isEditing ? selectedDateList.slice(0, 1) : selectedDateList,
        allDay: true,
        startTime: '',
        endDate: '',
        endTime: '',
        reminderMode: 'at_time',
        repeatMode: isEditing ? 'none' : repeatMode,
        repeatWeekdays,
        repeatEndMode,
        repeatUntil: isEditing ? '' : repeatUntilClean,
        repeatCount,
        repeatModeUi: isEditing
          ? (task?.repeat_mode === 'daily'
            ? 'daily'
            : task?.repeat_mode === 'weekly'
              ? 'weekly'
              : task?.repeat_mode === 'monthly'
                ? 'monthly'
                : task?.repeat_mode === 'yearly'
                  ? 'yearly'
                  : 'none')
          : (repeatMode === 'daily' ? 'daily' : repeatMode === 'weekly' ? 'weekly' : 'none'),
        repeatAnchor: 'due_date',
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

  function beginDateDrag(date: string, event: ReactMouseEvent<HTMLButtonElement>) {
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tags.length > 0 && (
                <div className="task-tags-row">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="task-tag-badge"
                      onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                      title="Usuń tag"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
              <input
                autoFocus
                className="input"
                placeholder="Wpisz zadanie... #praca #pilne"
                value={title}
                onChange={(e) => {
                  const consumed = consumeCompletedTags(e.target.value, tags);
                  setTitle(consumed.title);
                  setTags(consumed.tags);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSave();
                  }
                  if (e.key === 'Backspace' && !title && tags.length > 0) {
                    setTags((prev) => prev.slice(0, -1));
                  }
                }}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
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

// CALENDAR

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
  activeDate?: string | null;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  onDayClick: (dateStr: string, anchor: AnchorRect) => void;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
  onMoveTask: (task: SupabaseTask, dateStr: string) => void;
}

function Calendar({ tasks, activeDate, hideCompleted, onToggleHideCompleted, onDayClick, onTaskClick, onToggleTask, onMoveTask }: CalendarProps) {
  const now = new Date();
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<'month'|'week'|'day'>('month');
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const [overflowDates, setOverflowDates] = useState<Set<string>>(() => new Set());

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

  useLayoutEffect(() => {
    function measureTaskOverflow() {
      const root = calendarRef.current;
      if (!root) return;
      const next = new Set<string>();
      root.querySelectorAll<HTMLElement>('.day-cell-tasks[data-date]').forEach((el) => {
        const date = el.dataset.date;
        if (date && el.scrollHeight > el.clientHeight + 1) next.add(date);
      });
      setOverflowDates((prev) => {
        if (prev.size === next.size && [...prev].every((date) => next.has(date))) return prev;
        return next;
      });
    }

    const frame = window.requestAnimationFrame(measureTaskOverflow);
    window.addEventListener('resize', measureTaskOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureTaskOverflow);
    };
  }, [tasks, view, cursor, activeDate]);

  function renderDayCell(date: Date, compact: boolean) {
    const dateStr = toDateStr(date.getFullYear(), date.getMonth(), date.getDate());
    const isCellToday = dateStr === todayDateStr;
    const isActive = dateStr === activeDate;
    const isDropTarget = dropTargetDate === dateStr;
    const hasTaskOverflow = overflowDates.has(dateStr);
    const allDayTasks = tasks
      .filter(t => t.due_date === dateStr)
      .filter(t => !hideCompleted || !t.done)
      .sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at));
    const dayTasks = allDayTasks;
    return (
      <div key={dateStr}
        className={`day-cell${compact ? ' is-compact' : ''}${isCellToday ? ' is-today' : ''}${isActive ? ' is-active' : ''}${isDropTarget ? ' is-drop-target' : ''}${hasTaskOverflow ? ' has-task-overflow' : ''}`}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onDayClick(dateStr, { left: r.left, right: r.right, top: r.top, bottom: r.bottom }); }}
        onDragOver={(e) => {
          if (!dragTaskId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDropTargetDate(dateStr);
        }}
        onDragEnter={(e) => {
          if (!dragTaskId) return;
          e.preventDefault();
          setDropTargetDate(dateStr);
        }}
        onDragLeave={() => {
          if (dropTargetDate === dateStr) setDropTargetDate(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('text/plain');
          const movedTask = tasks.find((item) => item.id === taskId);
          setDropTargetDate(null);
          setDragTaskId(null);
          if (movedTask && movedTask.due_date !== dateStr) onMoveTask(movedTask, dateStr);
        }}
        onDragEnd={() => {
          setDropTargetDate(null);
          setDragTaskId(null);
        }}
        title={`Dodaj zadanie na ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`}
      >
        <div className="day-cell-head">
          <div className="day-number">{date.getDate()}</div>
          <div className="day-head-meta">
          {dayTasks.length > 3 && (
            <span className="day-count" title={`${dayTasks.length} zadań tego dnia`}>
              <span className="day-count-dot" />{dayTasks.length}
            </span>
          )}
            <span className="day-flag" aria-hidden="true">{IC_FLAG}</span>
          </div>
        </div>
        <div className="day-cell-tasks" data-date={dateStr}>
        {dayTasks.map(t => (
          <div
            key={t.id}
            className={`ev ev-task ${t.done ? 'is-done' : ''}`}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData('text/plain', t.id);
              e.dataTransfer.effectAllowed = 'move';
              setDragTaskId(t.id);
            }}
            onDragEnd={() => {
              setDropTargetDate(null);
              setDragTaskId(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(t);
            }}
            style={{
              opacity:t.done ? .75 : 1,
              textDecoration:t.done?'line-through':'none',
              cursor:'grab',
              zIndex: dragTaskId === t.id ? 6 : 1,
              transform: dragTaskId === t.id ? 'scale(1.01)' : 'none',
            }}
            title="Edytuj zadanie"
          >
            <button
              type="button"
              aria-label={t.done ? 'Oznacz jako niewykonane' : 'Zakończ zadanie'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleTask(t.id, !t.done);
              }}
              className={`tsk-check tsk-check-sm ${t.done ? 'is-done' : ''}`}
            >
              {t.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
            {isRecurringTask(t) && <RecurringIcon />}
            <span className="ev-task-title">{t.title}</span>
            {t.scheduled_time && <span className="ev-task-time">{t.scheduled_time}</span>}
          </div>
        ))}
        </div>
        {hasTaskOverflow && (
          <span className="day-scroll-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        )}
      </div>
    );
  }

  const cursorDateStr = toDateStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  const dayTasksForAgenda = tasks
    .filter(t => t.due_date === cursorDateStr)
    .filter(t => !hideCompleted || !t.done)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.created_at.localeCompare(b.created_at));

  return (
    <div ref={calendarRef} style={{ display:'flex', flexDirection:'column', height:'100%', minHeight: 0 }}>
      {/* cal head */}
      <div className="planner-calendar-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0, flexWrap:'wrap', gap:8 }}>
        <span className="planner-calendar-title" style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:600, letterSpacing:'-.01em' }}>
          {view === 'month' && <>{MONTH_FULL[month]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{year}</span></>}
          {view === 'day' && <>{cursor.getDate()} {MONTH_FULL[cursor.getMonth()]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{cursor.getFullYear()}</span></>}
          {view === 'week' && (
            weekStart.getMonth() === weekEnd.getMonth()
              ? <>{weekStart.getDate()}–{weekEnd.getDate()} {MONTH_FULL[weekStart.getMonth()]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{weekEnd.getFullYear()}</span></>
              : <>{weekStart.getDate()} {MONTH_SHORT[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTH_SHORT[weekEnd.getMonth()]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{weekEnd.getFullYear()}</span></>
          )}
        </span>
        <div className="planner-calendar-controls" style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button
            type="button"
            className={`hide-completed-toggle${hideCompleted ? ' is-active' : ''}`}
            onClick={onToggleHideCompleted}
            aria-pressed={hideCompleted}
            title="Ukryj zakończone zadania"
          >
            Ukryj zakończone
          </button>
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
          {/* grid - flex:1 so it fills remaining card height */}
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
            {weekDays.map(d => renderDayCell(d, true))}
          </div>
        </>
      )}

      {view === 'day' && (
        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)', flexShrink:0 }}>
            {WEEKDAY_FULL[cursor.getDay()===0?6:cursor.getDay()-1]}
          </div>
          <div className="day-view-panel">
            {renderDayCell(cursor, false)}
            {dayTasksForAgenda.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--ink-3)', fontSize:13 }}>Brak zadań tego dnia.</div>
            ) : dayTasksForAgenda.map(t => (
              <div
                key={t.id}
                className="day-agenda-task hover-row"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', t.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onTaskClick(t)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:10, border:'1px solid var(--border-soft)', background:'var(--surface-inset)', cursor:'pointer', opacity:t.done ? .7 : 1 }}
              >
                <button
                  type="button"
                  aria-label={t.done ? 'Oznacz jako niewykonane' : 'Zakończ zadanie'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(t.id, !t.done);
                  }}
                  className={`tsk-check ${t.done ? 'is-done' : ''}`}
                >
                  {t.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </button>
                <span style={{ flex:1, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--ink)', textDecoration:t.done?'line-through':'none' }}>
                  {t.title}
                  {isRecurringTask(t) && <RecurringIcon size={11} />}
                </span>
              </div>
            ))}
            <button
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onDayClick(cursorDateStr, { left: r.left, right: r.right, top: r.top, bottom: r.bottom }); }}
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

// BOTTOM STRIP COMPONENTS

interface HabitDraft {
  name: string;
  description: string;
  visible_on_dashboard: boolean;
  status: 'active' | 'paused';
  schedule_type: HabitScheduleType;
  interval_value: number;
  weekdays: number[];
  start_date: string;
  end_date: string;
  end_mode: HabitEndMode;
  end_after_cycles: number;
}

function habitDraftFromHabit(habit: Habit | null, today: string): HabitDraft {
  return {
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    visible_on_dashboard: habit?.visible_on_dashboard ?? true,
    status: habit?.status === 'paused' ? 'paused' : 'active',
    schedule_type: habit?.schedule_type ?? 'daily',
    interval_value: habit?.interval_value ?? 1,
    weekdays: habit?.schedule_days?.length ? habit.schedule_days : ALL_WEEKDAYS,
    start_date: habit?.start_date ?? today,
    end_date: habit?.end_date ?? '',
    end_mode: habit?.end_mode ?? (habit?.end_date ? 'on_date' : 'forever'),
    end_after_cycles: habit?.end_after_cycles ?? 12,
  };
}

function habitDraftToInput(draft: HabitDraft): NewHabitInput {
  return {
    name: draft.name,
    description: draft.description || null,
    visible_on_dashboard: draft.visible_on_dashboard,
    status: draft.status,
    schedule_type: draft.schedule_type,
    interval_value: draft.interval_value,
    weekdays: draft.weekdays,
    start_date: draft.start_date,
    end_mode: draft.end_mode,
    end_after_cycles: draft.end_mode === 'after_cycles' ? draft.end_after_cycles : null,
    end_date: draft.end_mode === 'on_date' ? draft.end_date || null : null,
    time_of_day: null,
  };
}

function datePartsFromStr(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const fallback = new Date();
  return {
    year: year || fallback.getFullYear(),
    month: month || fallback.getMonth() + 1,
    day: day || fallback.getDate(),
  };
}

function HabitDateSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parts = datePartsFromStr(value);
  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i);
  const daysInMonth = new Date(parts.year, parts.month, 0).getDate();
  const update = (patch: Partial<typeof parts>) => {
    const next = { ...parts, ...patch };
    const day = Math.min(next.day, new Date(next.year, next.month, 0).getDate());
    onChange(`${next.year}-${pad(next.month)}-${pad(day)}`);
  };
  return (
    <div className="habit-date-select">
      <span>{label}</span>
      <div>
        <select className="select" value={parts.day} onChange={(e) => update({ day: Number(e.target.value) })}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => <option key={day} value={day}>{day}</option>)}
        </select>
        <select className="select" value={parts.month} onChange={(e) => update({ month: Number(e.target.value) })}>
          {MONTH_SHORT.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
        </select>
        <select className="select" value={parts.year} onChange={(e) => update({ year: Number(e.target.value) })}>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
    </div>
  );
}

function HabitDetailsOverlay({
  open,
  habits,
  logs,
  datesByHabit,
  today,
  selectedId,
  onSelect,
  onClose,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  onSetHabitStatus,
  onSetHabitVisibility,
  onSetHabitEntry,
}: {
  open: boolean;
  habits: Habit[];
  logs: HabitLog[];
  datesByHabit: Map<string, Set<string>>;
  today: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onCreateHabit: (input: NewHabitInput) => Promise<Habit | void> | void;
  onUpdateHabit: (id: string, input: NewHabitInput) => Promise<void> | void;
  onDeleteHabit: (id: string) => void;
  onSetHabitStatus: (id: string, status: 'active' | 'paused') => void;
  onSetHabitVisibility: (id: string, visible: boolean) => void;
  onSetHabitEntry: (habitId: string, date: string, status: HabitEntryStatus | null) => void;
}) {
  const [historyMonth, setHistoryMonth] = useState(() => firstOfMonth(today));
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none');
  const [draft, setDraft] = useState<HabitDraft>(() => habitDraftFromHabit(null, today));
  const [formError, setFormError] = useState('');
  const selected = habits.find((habit) => habit.id === selectedId) ?? habits[0] ?? null;

  useEffect(() => {
    if (open) setHistoryMonth(firstOfMonth(today));
  }, [open, today]);

  if (!open) return null;

  const historyDate = parseDateStr(historyMonth) ?? new Date();
  const historyYear = historyDate.getFullYear();
  const historyMonthIndex = historyDate.getMonth();
  const firstHistoryDay = new Date(historyYear, historyMonthIndex, 1);
  const historyStartOffset = (firstHistoryDay.getDay() + 6) % 7;
  const historyDaysInMonth = new Date(historyYear, historyMonthIndex + 1, 0).getDate();
  const historyGrid: Array<{ value: string; day: number } | null> = [
    ...Array.from({ length: historyStartOffset }, () => null),
    ...Array.from({ length: historyDaysInMonth }, (_, i) => {
      const day = i + 1;
      return { value: toDateStr(historyYear, historyMonthIndex, day), day };
    }),
  ];
  const selectedDates = selected ? datesByHabit.get(selected.id) ?? new Set<string>() : new Set<string>();
  const selectedStats = selected ? habitStats(selectedDates, today, selected) : null;
  const weekdaySet = new Set(selected?.schedule_days ?? selected?.weekdays ?? []);
  const selectedEntries = new Map(
    logs
      .filter((log) => selected && log.habit_id === selected.id)
      .map((log) => [log.entry_date, log.status] as const),
  );
  const selectedLogsCount = selected ? logs.filter((log) => log.habit_id === selected.id && log.entry_date.startsWith(historyMonth.slice(0, 7))).length : 0;
  const visibleHabits = showActiveOnly ? habits.filter((habit) => habit.status === 'active') : habits.filter((habit) => habit.status !== 'archived');

  function openCreateForm() {
    setFormError('');
    setDraft(habitDraftFromHabit(null, today));
    setFormMode('create');
  }

  function openEditForm() {
    if (!selected) return;
    setFormError('');
    setDraft(habitDraftFromHabit(selected, today));
    setFormMode('edit');
  }

  function validateDraft() {
    const name = draft.name.trim();
    if (!name || name.length > 80) return 'Nazwa nawyku musi mieć 1-80 znaków.';
    if ((draft.schedule_type === 'selected_weekdays' || draft.schedule_type === 'every_n_weeks') && draft.weekdays.length === 0) return 'Wybierz przynajmniej jeden dzień tygodnia.';
    if (draft.schedule_type === 'every_n_weeks' && (draft.interval_value < 1 || draft.interval_value > 52)) return 'Powtarzanie tygodniowe musi być w zakresie 1-52.';
    if (draft.schedule_type === 'every_n_months' && (draft.interval_value < 1 || draft.interval_value > 24)) return 'Powtarzanie miesięczne musi być w zakresie 1-24.';
    if (draft.end_mode === 'after_cycles' && draft.end_after_cycles < 1) return 'Podaj liczbę cykli większą od zera.';
    if (draft.end_mode === 'on_date' && !draft.end_date) return 'Wybierz datę zakończenia.';
    return '';
  }

  async function submitHabitForm() {
    const error = validateDraft();
    if (error) {
      setFormError(error);
      return;
    }
    const input = habitDraftToInput({ ...draft, name: draft.name.trim() });
    if (formMode === 'edit' && selected) {
      await onUpdateHabit(selected.id, input);
    } else {
      const created = await onCreateHabit(input);
      if (created && 'id' in created) onSelect(created.id);
    }
    setFormMode('none');
  }

  function nextEntryStatus(current: HabitEntryStatus | undefined): HabitEntryStatus | null {
    if (!current) return 'completed';
    if (current === 'completed') return 'skipped';
    return null;
  }

  function toggleDraftWeekday(day: number) {
    setDraft((prev) => {
      const has = prev.weekdays.includes(day);
      return { ...prev, weekdays: has ? prev.weekdays.filter((item) => item !== day) : [...prev.weekdays, day].sort((a, b) => a - b) };
    });
  }

  return (
    <div className="habit-detail-overlay" role="dialog" aria-modal="true" aria-label="Szczegóły nawyków">
      <div className="habit-detail-shell">
        <div className="habit-detail-top">
          <button type="button" className="habit-detail-back" onClick={onClose} aria-label="Wróć">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span>Nawyki</span>
          <strong>Szczegóły</strong>
          <button type="button" className="habit-detail-close" onClick={onClose} aria-label="Zamknij">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="habit-detail-grid">
          <aside className="habit-detail-list">
            <button type="button" className="habit-detail-add" onClick={openCreateForm}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Dodaj nawyk
            </button>
            <div className="habit-detail-list-head">
              <span>Wyświetl aktywne</span>
              <button type="button" className={`habit-detail-switch${showActiveOnly ? ' is-on' : ''}`} onClick={() => setShowActiveOnly((value) => !value)} aria-pressed={showActiveOnly}><i /></button>
            </div>
            <div className="habit-detail-items">
              {habits.length === 0 && <div className="habit-detail-empty">Brak nawyków.</div>}
              {visibleHabits.map((habit) => {
                const isSelected = selected?.id === habit.id;
                const isActive = habit.status === 'active';
                return (
                  <button
                    key={habit.id}
                    type="button"
                    className={`habit-detail-item${isSelected ? ' is-selected' : ''}`}
                    onClick={() => onSelect(habit.id)}
                  >
                    <span
                      role="checkbox"
                      aria-checked={habit.visible_on_dashboard}
                      className={`habit-detail-check${habit.visible_on_dashboard ? ' is-done' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (habit.status === 'paused') {
                          setFormError('Nawyki wstrzymane nie są widoczne w panelu głównym. Najpierw wznów nawyk.');
                          return;
                        }
                        onSetHabitVisibility(habit.id, !habit.visible_on_dashboard);
                      }}
                    >
                      {habit.visible_on_dashboard && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                    </span>
                    <span className="habit-detail-item-main">
                      <strong>{habit.name}</strong>
                      <em>{habitScheduleLabel(habit)}</em>
                    </span>
                    <span className={`habit-detail-status${isActive ? ' is-active' : ''}`}>{isActive ? 'Aktywny' : 'Wstrzymany'}</span>
                    <span className="habit-detail-dots">⋮</span>
                  </button>
                );
              })}
            </div>
            <div className="habit-detail-note">
              <span>i</span>
              Zaznacz, które nawyki mają być widoczne w głównym panelu.
            </div>
          </aside>

          <section className="habit-detail-main">
            {selected ? (
              <>
                <div className="habit-detail-main-head">
                  <h3>{selected.name}</h3>
                  <div className="habit-detail-actions">
                    <button type="button" onClick={openEditForm}><span>E</span> Edytuj</button>
                    <button type="button" onClick={() => onSetHabitStatus(selected.id, selected.status === 'paused' ? 'active' : 'paused')}><span>II</span> {selected.status === 'paused' ? 'Wznow' : 'Wstrzymaj'}</button>
                    <button type="button" className="is-danger" onClick={() => { if (window.confirm('Czy na pewno chcesz usunąć ten nawyk? Historia zostanie zachowana.')) onDeleteHabit(selected.id); }}><span>X</span> Usuń</button>
                  </div>
                </div>

                <div className="habit-detail-feature">
                  <span>
                    <strong>Aktywny w panelu głównym</strong>
                    <em>Nawyk będzie widoczny w głównym panelu przeglądu.</em>
                  </span>
                  <button
                    type="button"
                    className={`habit-detail-switch${selected.visible_on_dashboard && selected.status === 'active' ? ' is-on' : ''}`}
                    onClick={() => {
                      if (selected.status === 'paused') {
                        setFormError('Nawyki wstrzymane nie są widoczne w panelu głównym. Najpierw wznów nawyk.');
                        return;
                      }
                      onSetHabitVisibility(selected.id, !selected.visible_on_dashboard);
                    }}
                    aria-pressed={selected.visible_on_dashboard && selected.status === 'active'}
                  ><i /></button>
                </div>

                <div className="habit-detail-card">
                  <h4>Cykliczność</h4>
                  <div className="habit-detail-form-row">
                    <span>Powtarzaj</span>
                    <strong>{habitScheduleLabel(selected)}</strong>
                  </div>
                  <div className="habit-detail-form-row">
                    <span>W dni</span>
                    <div className="habit-detail-weekdays">
                      {TASK_WEEKDAYS.map((day) => (
                        <span key={day.value} className={selected.schedule_type === 'daily' || selected.schedule_type === 'every_n_months' || weekdaySet.has(day.value) ? 'is-on' : ''}>{day.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="habit-detail-form-row">
                    <span>Seria</span>
                    <strong>{selectedStats?.streak ?? 0} dni</strong>
                  </div>
                </div>

                <div className="habit-detail-card habit-history-card">
                  <div className="habit-history-head">
                    <h4>Historia - {MONTH_FULL[historyDate.getMonth()]} {historyDate.getFullYear()}</h4>
                    <div>
                      <button type="button" onClick={() => setHistoryMonth((m) => shiftMonth(m, -1))} aria-label="Poprzedni miesiąc">‹</button>
                      <button type="button" onClick={() => setHistoryMonth(firstOfMonth(today))}>Dziś</button>
                      <button type="button" onClick={() => setHistoryMonth((m) => shiftMonth(m, 1))} aria-label="Następny miesiąc">›</button>
                    </div>
                  </div>
                  <div className="habit-history-weekdays">{['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'].map((day) => <span key={day}>{day}</span>)}</div>
                  <div className="habit-history-grid">
                    {historyGrid.map((item, index) => {
                      if (!item) return <span key={`blank-${index}`} className="habit-history-empty" />;
                      const planned = selected ? habitOccursOn(selected, item.value) : false;
                      const entryStatus = selectedEntries.get(item.value);
                      const done = entryStatus === 'completed';
                      const isToday = item.value === today;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={isToday ? 'is-today' : ''}
                          onClick={() => planned && onSetHabitEntry(selected.id, item.value, nextEntryStatus(entryStatus))}
                          disabled={!planned}
                          title={done ? 'Wykonano' : planned ? 'Pominięto' : 'Brak planu'}
                        >
                          <span>{item.day}</span>
                          <i className={done ? 'is-done' : entryStatus === 'skipped' ? 'is-skipped' : planned ? 'is-missed' : 'is-off'}>{done ? '✓' : entryStatus === 'skipped' ? '×' : planned ? '' : '-'}</i>
                        </button>
                      );
                    })}
                  </div>
                  <div className="habit-history-legend">
                    <span><i className="is-done">✓</i> Wykonano</span>
                    <span><i className="is-skipped">×</i> Pominięto</span>
                    <span><i className="is-missed" /> Zaplanowane</span>
                    <span><i className="is-off">-</i> Brak planu</span>
                    <span className="habit-history-count">{selectedLogsCount} wpisów</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="habit-detail-empty big">Wybierz nawyk z listy.</div>
            )}
          </section>
        </div>
        {formMode !== 'none' && (
          <div className="habit-form-layer" role="dialog" aria-label={formMode === 'edit' ? 'Edytuj nawyk' : 'Dodaj nawyk'}>
            <div className="habit-form-card">
              <div className="habit-form-head">
                <h3>{formMode === 'edit' ? 'Edytuj nawyk' : 'Dodaj nawyk'}</h3>
                <button type="button" onClick={() => setFormMode('none')} aria-label="Zamknij">×</button>
              </div>
              {formError && <div className="habit-form-error">{formError}</div>}
              <label>Nazwa
                <input className="input" value={draft.name} maxLength={80} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
              </label>
              <label>Opis
                <textarea className="input" value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
              </label>
              <label>Status
                <select className="select" value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as HabitDraft['status'], visible_on_dashboard: e.target.value === 'paused' ? false : prev.visible_on_dashboard }))}>
                  <option value="active">Aktywny</option>
                  <option value="paused">Wstrzymany</option>
                </select>
              </label>
              <button type="button" className={`habit-form-toggle${draft.visible_on_dashboard ? ' is-on' : ''}`} onClick={() => setDraft((prev) => ({ ...prev, visible_on_dashboard: prev.status === 'paused' ? false : !prev.visible_on_dashboard }))}>
                Widoczny w panelu głównym
                <span className={`habit-detail-switch${draft.visible_on_dashboard ? ' is-on' : ''}`}><i /></span>
              </button>
              <div className="habit-form-section">
                <strong>Plan</strong>
                <label>Powtarzaj
                  <select className="select" value={draft.schedule_type} onChange={(e) => setDraft((prev) => ({ ...prev, schedule_type: e.target.value as HabitScheduleType }))}>
                    <option value="daily">Codziennie</option>
                    <option value="selected_weekdays">W wybrane dni tygodnia</option>
                    <option value="every_n_weeks">Co kilka tygodni</option>
                    <option value="every_n_months">Co kilka miesięcy</option>
                  </select>
                </label>
                {(draft.schedule_type === 'every_n_weeks' || draft.schedule_type === 'every_n_months') && (
                  <label>{draft.schedule_type === 'every_n_weeks' ? 'Co ile tygodni?' : 'Co ile miesięcy?'}
                    <input className="input" type="number" min={1} max={draft.schedule_type === 'every_n_months' ? 24 : 52} value={draft.interval_value} onChange={(e) => setDraft((prev) => ({ ...prev, interval_value: Math.max(1, Number(e.target.value) || 1) }))} />
                  </label>
                )}
              </div>
              {(draft.schedule_type === 'selected_weekdays' || draft.schedule_type === 'every_n_weeks') && (
                <div className="habit-form-section">
                  <strong>Dni tygodnia</strong>
                  <div className="habit-form-days">
                    {TASK_WEEKDAYS.map((day) => (
                      <button key={day.value} type="button" className={draft.weekdays.includes(day.value) ? 'is-on' : ''} onClick={() => toggleDraftWeekday(day.value)}>{day.label}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="habit-form-section">
                <strong>Czas trwania</strong>
                <HabitDateSelect label="Start" value={draft.start_date} onChange={(value) => setDraft((prev) => ({ ...prev, start_date: value }))} />
                <div className="habit-end-options">
                  {[
                    ['forever', 'Bezterminowo'],
                    ['after_cycles', 'Po liczbie cykli'],
                    ['on_date', 'Do daty'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={draft.end_mode === value ? 'is-on' : ''} onClick={() => setDraft((prev) => ({ ...prev, end_mode: value as HabitEndMode }))}>{label}</button>
                  ))}
                </div>
                {draft.end_mode === 'after_cycles' && (
                  <label>Liczba cykli
                    <input className="input" type="number" min={1} max={999} value={draft.end_after_cycles} onChange={(e) => setDraft((prev) => ({ ...prev, end_after_cycles: Math.max(1, Number(e.target.value) || 1) }))} />
                  </label>
                )}
                {draft.end_mode === 'on_date' && (
                  <HabitDateSelect label="Koniec" value={draft.end_date || draft.start_date} onChange={(value) => setDraft((prev) => ({ ...prev, end_date: value }))} />
                )}
              </div>
              <div className="habit-form-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFormMode('none')}>Anuluj</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void submitHabitForm()}>Zapisz</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HabitsStrip() {
  const habitsQ = useHabits();
  const logsQ = useHabitLogs();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const setHabitStatusMutation = useSetHabitStatus();
  const setHabitVisibilityMutation = useSetHabitVisibility();
  const setHabitEntryMutation = useSetHabitEntry();
  const toggleHabit = useToggleHabitLog();
  const today = habitsTodayStr();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const datesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of (logsQ.data ?? []) as HabitLog[]) {
      let dates = map.get(l.habit_id);
      if (!dates) {
        dates = new Set();
        map.set(l.habit_id, dates);
      }
      if (l.status === 'completed') dates.add(l.entry_date);
    }
    return map;
  }, [logsQ.data]);

  const habitItems = (habitsQ.data ?? [])
    .filter((habit) => habit.status === 'active' && habit.visible_on_dashboard)
    .map((habit) => {
    const stats = habitStats(datesByHabit.get(habit.id) ?? new Set(), today, habit);
    return { habit, stats, scheduledToday: habitOccursOn(habit, today) };
  }).filter((item) => item.scheduledToday || item.stats.doneToday);
  const scheduled = habitItems.filter((item) => item.scheduledToday);
  const done = scheduled.filter((item) => item.stats.doneToday).length;
  const total = scheduled.length || habitItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const habits = habitsQ.data ?? [];

  useEffect(() => {
    if (selectedHabitId && habits.some((habit) => habit.id === selectedHabitId)) return;
    const next = habits.find((habit) => habit.status === 'active') ?? habits.find((habit) => habit.status === 'paused') ?? null;
    setSelectedHabitId(next?.id ?? null);
  }, [habits, selectedHabitId]);

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
      <button type="button" onClick={() => setDetailsOpen(true)} style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:14, fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--acc-a-ink)', background:'transparent', border:0, padding:0, cursor:'pointer', fontWeight:600, flexShrink:0 }}>
        Zobacz szczegóły
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <HabitDetailsOverlay
        open={detailsOpen}
        habits={habits}
        logs={(logsQ.data ?? []) as HabitLog[]}
        datesByHabit={datesByHabit}
        today={today}
        selectedId={selectedHabitId}
        onSelect={setSelectedHabitId}
        onClose={() => setDetailsOpen(false)}
        onCreateHabit={(input) => createHabit.mutateAsync(input)}
        onUpdateHabit={(id, input) => updateHabit.mutateAsync({ id, ...input })}
        onDeleteHabit={(id) => {
          deleteHabit.mutate(id);
          const next = habits.find((habit) => habit.id !== id && habit.status === 'active') ?? habits.find((habit) => habit.id !== id && habit.status === 'paused') ?? null;
          setSelectedHabitId(next?.id ?? null);
        }}
        onSetHabitStatus={(id, status) => setHabitStatusMutation.mutate({ id, status })}
        onSetHabitVisibility={(id, visible) => setHabitVisibilityMutation.mutate({ id, visible })}
        onSetHabitEntry={(habitId, date, status) => setHabitEntryMutation.mutate({ habitId, date, status })}
      />
    </div>
  );
}

// TODAY PANEL

interface TodayPanelProps {
  tasks: SupabaseTask[];
  isLoading: boolean;
  isSaving: boolean;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  onScheduleTask: (title: string, tags: string[], dueDate: string, anchor: AnchorRect) => void;
  onQuickAddTask: (title: string, tags: string[], dueDate: string) => Promise<void> | void;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
}

function PlannerTaskRow({ task, todayStr, onTaskClick, onToggleTask }: {
  task: SupabaseTask; todayStr: string;
  onTaskClick: (task: SupabaseTask) => void;
  onToggleTask: (id: string, done: boolean) => void;
}) {
  const isDone = task.done;
  const dueLabel = task.due_date
    ? (task.due_date === todayStr ? 'dziś' : task.due_date === addDaysStr(todayStr, 1) ? 'jutro' : fmtShortDate(task.due_date))
    : 'bez terminu';
  const tags = dedupeTags(task.tags ?? []);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTaskClick(task)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTaskClick(task)}
      className="hover-row planner-task-row"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 6px', margin:0, borderRadius:8, cursor:'pointer', opacity:isDone ? .72 : 1, minWidth: 0 }}
    >
      <div
        role="checkbox"
        aria-checked={isDone}
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, !task.done); }}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); onToggleTask(task.id, !task.done); } }}
        className={`tsk-check ${isDone ? 'is-done' : ''}`}
      >
        {isDone && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
      </div>
      <span className="planner-task-title" style={{ flex:1, fontSize:13, color:isDone?'var(--ink-3)':'var(--ink)', fontWeight:500, textDecoration:isDone?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {task.title}
      </span>
      <div className="planner-task-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 0, maxWidth: '56%' }}>
        <div className="task-tags-row" style={{ justifyContent: 'flex-end', overflow: 'hidden', minWidth: 0 }}>
          {tags.map((tag) => (
            <span key={tag} className="task-tag-badge">{tag}</span>
          ))}
        </div>
        {task.scheduled_time && (
          <span className="planner-task-time">{task.scheduled_time}</span>
        )}
        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', flexShrink:0, whiteSpace:'nowrap' }}>{dueLabel}</span>
      </div>
    </div>
  );
}

type TaskWindow = 'today' | 'tomorrow' | 'week' | 'month' | 'all';

function TodayPanel({
  tasks,
  isLoading,
  isSaving,
  hideCompleted,
  onToggleHideCompleted,
  onScheduleTask,
  onQuickAddTask,
  onTaskClick,
  onToggleTask,
}: TodayPanelProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [windowFilter, setWindowFilter] = useState<TaskWindow>('today');
  const now = useMemo(() => new Date(), []);
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStr = addDaysStr(todayStr, 1);
  const dow = now.getDay();
  const weekStart = addDaysStr(todayStr, -(dow === 0 ? 6 : dow - 1));
  const weekEnd = addDaysStr(weekStart, 6);
  const monthKey = todayStr.slice(0, 7);

  const byDate = (a: SupabaseTask, b: SupabaseTask) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    const aDate = a.due_date ?? '9999-12-31';
    const bDate = b.due_date ?? '9999-12-31';
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    const aTime = a.scheduled_time ?? '';
    const bTime = b.scheduled_time ?? '';
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return a.created_at.localeCompare(b.created_at);
  };

  const panelTasks = useMemo(() => hideCompleted ? tasks.filter((t) => !t.done) : tasks, [hideCompleted, tasks]);
  const counters = useMemo(() => {
    const today = panelTasks.filter((t) => t.due_date === todayStr).length;
    const tomorrow = panelTasks.filter((t) => t.due_date === tomorrowStr).length;
    const week = panelTasks.filter((t) => !!t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd).length;
    const month = panelTasks.filter((t) => !!t.due_date && t.due_date.startsWith(monthKey)).length;
    const all = panelTasks.length;
    return { today, tomorrow, week, month, all };
  }, [monthKey, panelTasks, todayStr, tomorrowStr, weekEnd, weekStart]);

  const visibleTasks = useMemo(() => {
    const filtered = panelTasks.filter((t) => {
      if (windowFilter === 'today') return t.due_date === todayStr;
      if (windowFilter === 'tomorrow') return t.due_date === tomorrowStr;
      if (windowFilter === 'week') return !!t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd;
      if (windowFilter === 'month') return !!t.due_date && t.due_date.startsWith(monthKey);
      return true;
    });
    return filtered.sort(byDate);
  }, [monthKey, panelTasks, todayStr, tomorrowStr, weekEnd, weekStart, windowFilter]);

  const tabs: Array<{ id: TaskWindow; label: string; count: number }> = [
    { id: 'today', label: 'DZISIAJ', count: counters.today },
    { id: 'tomorrow', label: 'JUTRO', count: counters.tomorrow },
    { id: 'week', label: 'TYDZIEŃ', count: counters.week },
    { id: 'month', label: 'MIESIĄC', count: counters.month },
    { id: 'all', label: 'WSZYSTKIE', count: counters.all },
  ];

  // Default due date for additions made from this panel follows the active tab.
  const panelDate = windowFilter === 'tomorrow' ? tomorrowStr : todayStr;

  async function handleQuickSubmit() {
    const parsed = extractTitleAndTags(quickTitle, quickTags);
    if (!parsed.title || isSaving) return;
    await onQuickAddTask(parsed.title, parsed.tags, panelDate);
    setQuickTitle('');
    setQuickTags([]);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div className="planner-panel-head" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:600, letterSpacing:'-.02em', lineHeight:1 }}>Zadania</span>
        <button
          type="button"
          className={`hide-completed-toggle${hideCompleted ? ' is-active' : ''}`}
          onClick={onToggleHideCompleted}
          aria-pressed={hideCompleted}
          title="Ukryj zakończone zadania"
        >
          Ukryj zakończone
        </button>
      </div>

      <div className="task-filter-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`task-filter-btn${windowFilter === tab.id ? ' is-active' : ''}`}
            onClick={() => setWindowFilter(tab.id)}
          >
            <span>{tab.label}</span>
            <sup>{tab.count}</sup>
          </button>
        ))}
      </div>

      {/* Task list - scrollable, grouped */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', minHeight:0, paddingRight:2 }}>
        {isLoading ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>Ładowanie zadań...</div>
        ) : visibleTasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>Brak zadań. Dodaj pierwsze poniżej.</div>
        ) : (
          visibleTasks.map((task) => <PlannerTaskRow key={task.id} task={task} todayStr={todayStr} onTaskClick={onTaskClick} onToggleTask={onToggleTask} />)
        )}
      </div>

      {/* Quick add row */}
      <div className="planner-quick-add-row" style={{ display:'flex', alignItems:'center', gap:8, paddingTop:12, marginTop:8, borderTop:'1px solid var(--border-soft)', flexShrink:0 }}>
        {quickTags.length > 0 && (
          <div className="task-tags-row" style={{ marginRight: 2 }}>
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="task-tag-badge"
                title="Usuń tag"
                onClick={() => setQuickTags((prev) => prev.filter((item) => item !== tag))}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        <input
          className="input"
          value={quickTitle}
          onChange={(e) => {
            const consumed = consumeCompletedTags(e.target.value, quickTags);
            setQuickTitle(consumed.title);
            setQuickTags(consumed.tags);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleQuickSubmit();
            }
            if (e.key === 'Backspace' && !quickTitle && quickTags.length > 0) {
              setQuickTags((prev) => prev.slice(0, -1));
            }
          }}
          placeholder="Dodaj zadanie na dziś... #praca #pilne"
          aria-label="Szybkie dodanie zadania na dziś"
          disabled={isSaving}
          style={{ flex: 1, height: 36 }}
        />
        <button
          type="button"
          onClick={() => void handleQuickSubmit()}
          className="icon-btn"
          aria-label="Szybko dodaj zadanie na dziś"
          title="Dodaj na dziś"
          disabled={isSaving || !quickTitle.trim()}
          style={{ width: 36, height: 36, borderRadius: 999 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onScheduleTask(quickTitle, quickTags, panelDate, { left: r.left, right: r.right, top: r.top, bottom: r.bottom }); }}
          className="icon-btn"
          aria-label="Ustaw termin i szczegóły zadania"
          title="Termin i szczegóły"
          style={{ width: 36, height: 36, borderRadius: 999 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface TaskOptionsState {
  open: boolean;
  overlayMode: boolean;
  aLeft: number;
  aRight: number;
  aTop: number;
  aBottom: number;
  title: string;
  tags: string[];
  dueDate: string;
  scheduledTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  durationMinutes: number | null;
  priority: 'high' | 'mid' | 'low';
  reminderMode: 'at_time' | '5m' | '30m' | '1h' | '1d';
  repeatModeUi: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatAnchor: 'due_date' | 'completion_date';
  editingId: string | null;
}

interface TaskOptionsPopoverProps {
  state: TaskOptionsState;
  saving: boolean;
  onClose: () => void;
  onChange: (next: Partial<TaskOptionsState>) => void;
  onSave: () => void;
  onDelete: () => void;
}

type TaskSubpanel = 'none' | 'time-start' | 'reminder' | 'repeat' | 'repeat_rule';

const TIME_OPTIONS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00', '19:00', '20:00', '21:00'];

const REMINDER_LABEL: Record<TaskOptionsState['reminderMode'], string> = {
  at_time: 'O godzinie',
  '5m': '5 minut wcześniej',
  '30m': '30 minut wcześniej',
  '1h': '1 godzinę wcześniej',
  '1d': '1 dzień wcześniej',
};

const REPEAT_LABEL: Record<TaskOptionsState['repeatModeUi'], string> = {
  none: 'Brak',
  daily: 'Codziennie',
  weekly: 'Co tydzień',
  monthly: 'Miesiącznie',
  yearly: 'Rocznie',
};

const IC_SUN = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
const IC_SUNRISE = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a5 5 0 0 0-10 0" /><path d="M12 2v6M9.5 5.5 12 3l2.5 2.5" /><path d="M2 18h2M20 18h2M22 22H2" /></svg>);
const IC_WEEK = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><text x="12" y="19" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor" stroke="none">+7</text></svg>);
const IC_MOON = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>);
const IC_CLOCK = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></svg>);
const IC_BELL = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>);
const IC_REPEAT = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>);
const IC_CHEVRON_L = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>);
const IC_CHEVRON_R = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>);
const IC_CHECK = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>);
const IC_NOTE = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3.5" width="16" height="17" rx="3.5" /><path d="M8.5 3.5v3" /></svg>);

function clampPopoverPosition(x: number, y: number, width: number, height: number, pad = 12) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.min(Math.max(pad, x), Math.max(pad, vw - width - pad));
  const top = Math.min(Math.max(pad, y), Math.max(pad, vh - height - pad));
  return { left, top };
}

interface AnchorRect { left: number; right: number; top: number; bottom: number; }

// Smart anchor positioning: prefer the right side of the anchor, flip to the
// left when there is no room, then keep the panel fully inside the viewport -
// shifting it up so it never spills past the bottom edge.
function placePopover(anchor: AnchorRect, width: number, height: number, gap = 8, pad = 16) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  let left = anchor.right + gap;
  if (left + width + pad > vw) left = anchor.left - gap - width;
  left = Math.min(Math.max(pad, left), Math.max(pad, vw - width - pad));
  let top = anchor.top;
  if (top + height + pad > vh) top = vh - height - pad;
  top = Math.min(Math.max(pad, top), Math.max(pad, vh - height - pad));
  return { left, top };
}

function placeLayeredPopover(anchor: AnchorRect, width: number, height: number, pad = 16) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const anchorWidth = Math.max(0, anchor.right - anchor.left);
  const anchorHeight = Math.max(0, anchor.bottom - anchor.top);
  const offsetX = Math.min(34, Math.max(16, anchorWidth * 0.08));
  const offsetY = Math.min(42, Math.max(18, anchorHeight * 0.10));
  let left = anchor.left + offsetX;
  let top = anchor.top + offsetY;
  left = Math.min(Math.max(pad, left), Math.max(pad, vw - width - pad));
  top = Math.min(Math.max(pad, top), Math.max(pad, vh - height - pad));
  return { left, top };
}

function taskOptionsSize() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    width: Math.min(Math.max(380, Math.round(vw * 0.30)), Math.min(500, Math.max(280, vw - 32))),
    height: Math.min(Math.max(520, Math.round(vh * 0.72)), Math.min(660, Math.max(340, vh - 32))),
  };
}

function firstOfMonth(dateStr: string): string {
  const dt = parseDateStr(dateStr) ?? new Date();
  return toDateStr(dt.getFullYear(), dt.getMonth(), 1);
}

function shiftMonth(monthStr: string, delta: number): string {
  const dt = parseDateStr(monthStr) ?? new Date();
  return toDateStr(dt.getFullYear(), dt.getMonth() + delta, 1);
}

function monthGridFor(year: number, month: number): Array<{ value: string; day: number; currentMonth: boolean }> {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const grid: Array<{ value: string; day: number; currentMonth: boolean }> = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    grid.push({
      value: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      currentMonth: d.getMonth() === month,
    });
  }
  return grid;
}

function timeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutesToReminderOffset(mode: TaskOptionsState['reminderMode']): number {
  if (mode === 'at_time') return 0;
  if (mode === '5m') return 5;
  if (mode === '30m') return 30;
  if (mode === '1h') return 60;
  if (mode === '1d') return 24 * 60;
  return 0;
}

function combineDateAndTimeToIso(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  const parsedDate = parseDateStr(dateStr);
  if (!parsedDate) return null;
  const hasTime = /^\d{1,2}:\d{2}$/.test(timeStr);
  const [hh, mm] = hasTime ? timeStr.split(':').map(Number) : [0, 0];
  const dt = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

function isoFromDateWithOffset(dateStr: string, timeStr: string, offsetMinutes: number): string | null {
  const base = combineDateAndTimeToIso(dateStr, timeStr);
  if (!base) return null;
  const baseMs = new Date(base).getTime();
  const reminderMs = baseMs - offsetMinutes * 60_000;
  return Number.isNaN(reminderMs) ? null : new Date(reminderMs).toISOString();
}

function reminderModeFromTask(startAt: string | null, reminderAt: string | null): TaskOptionsState['reminderMode'] {
  if (!startAt || !reminderAt) return 'at_time';
  const startMs = new Date(startAt).getTime();
  const reminderMs = new Date(reminderAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(reminderMs)) return 'at_time';
  const diffMinutes = Math.round((startMs - reminderMs) / 60_000);
  if (diffMinutes === 5) return '5m';
  if (diffMinutes === 30) return '30m';
  if (diffMinutes === 60) return '1h';
  if (diffMinutes === 24 * 60) return '1d';
  return 'at_time';
}

// Shared, normalized shape every "add task" entry point funnels through, so the
// calendar quick-add, the tasks-panel input and the schedule popover all save
// with identical rules. `buildTaskFields` derives the DB record from a draft.
interface TaskDraft {
  title: string;
  tags: string[];
  dueDate: string | null;
  scheduledTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  priority: 'high' | 'mid' | 'low';
  reminderMode: TaskOptionsState['reminderMode'];
  repeatModeUi: TaskOptionsState['repeatModeUi'];
  repeatAnchor: TaskOptionsState['repeatAnchor'];
}

function emptyDraft(dueDate: string | null, priority: TaskDraft['priority'] = 'mid'): TaskDraft {
  return {
    title: '',
    tags: [],
    dueDate,
    scheduledTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    priority,
    reminderMode: 'at_time',
    repeatModeUi: 'none',
    repeatAnchor: 'due_date',
  };
}

function buildTaskFields(draft: TaskDraft) {
  const dueDate = draft.dueDate;
  const allDay = draft.allDay;
  const startTime = allDay ? '' : draft.scheduledTime;
  const endTime = allDay ? '' : draft.endTime;
  const endDate = draft.endDate || dueDate || '';

  let durationMinutes: number | null = null;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const startDay = dueDate ? parseDateStr(dueDate) : null;
  const endDay = endDate ? parseDateStr(endDate) : null;
  if (startMin != null && endMin != null && startDay && endDay) {
    const dayDiff = Math.round((endDay.getTime() - startDay.getTime()) / 86400000);
    const total = dayDiff * 1440 + endMin - startMin;
    durationMinutes = total > 0 ? total : null;
  }

  const repeatMode = draft.repeatModeUi;
  const repeatWeekdays = repeatMode === 'weekly' && dueDate ? [weekdayFromDateStr(dueDate)] : null;
  const repeatRule = repeatMode === 'none'
    ? null
    : { frequency: repeatMode, interval: 1, anchor: draft.repeatAnchor, days_of_week: repeatWeekdays, until: null };

  const startAtIso = !dueDate
    ? null
    : allDay
      ? combineDateAndTimeToIso(dueDate, '00:00')
      : (startTime ? combineDateAndTimeToIso(dueDate, startTime) : null);
  const endAtIso = allDay || !startTime
    ? null
    : (endTime
      ? combineDateAndTimeToIso(endDate || dueDate || '', endTime)
      : (durationMinutes && startAtIso
        ? new Date(new Date(startAtIso).getTime() + durationMinutes * 60_000).toISOString()
        : null));
  const reminderAt = allDay || !startTime || !dueDate
    ? null
    : isoFromDateWithOffset(dueDate, startTime, minutesToReminderOffset(draft.reminderMode));

  return {
    title: draft.title,
    tags: draft.tags,
    priority: draft.priority,
    all_day: allDay,
    due_date: dueDate || null,
    scheduled_time: startTime || null,
    start_at: startAtIso,
    end_at: endAtIso,
    reminder_at: reminderAt,
    duration_minutes: durationMinutes,
    repeat_mode: repeatMode,
    repeat_rule: repeatRule,
    repeat_anchor: draft.repeatAnchor,
    repeat_weekdays: repeatWeekdays,
  };
}

function TaskOptionsPopover({ state, saving, onClose, onChange, onSave, onDelete }: TaskOptionsPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const [subpanel, setSubpanel] = useState<TaskSubpanel>('none');
  const [calEdit, setCalEdit] = useState<'start' | 'end'>('start');
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(state.dueDate));
  const [, setViewportVersion] = useState(0);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const quick = {
    today: todayStr,
    tomorrow: addDaysStr(todayStr, 1),
    week: addDaysStr(todayStr, 7),
    month: addDaysStr(todayStr, 30),
  };

  const viewDate = parseDateStr(viewMonth) ?? today;
  const monthGrid = useMemo(() => monthGridFor(viewDate.getFullYear(), viewDate.getMonth()), [viewMonth]);
  const anchorRect = { left: state.aLeft, right: state.aRight, top: state.aTop, bottom: state.aBottom };
  const { width: popWidth, height: popHeight } = taskOptionsSize();
  const [mainPos, setMainPos] = useState(() => (
    state.overlayMode ? placeLayeredPopover(anchorRect, popWidth, popHeight, 16) : placePopover(anchorRect, popWidth, popHeight, 8, 16)
  ));

  // Re-clamp using the popover's *measured* size so a tall panel opened from a
  // day low in the calendar never spills past the bottom of the viewport.
  useLayoutEffect(() => {
    if (!state.open) return;
    const el = ref.current;
    const w = el?.offsetWidth ?? popWidth;
    const h = el?.offsetHeight ?? popHeight;
    const nextAnchor = { left: state.aLeft, right: state.aRight, top: state.aTop, bottom: state.aBottom };
    setMainPos(state.overlayMode ? placeLayeredPopover(nextAnchor, w, h, 16) : placePopover(nextAnchor, w, h, 8, 16));
  }, [state.open, state.overlayMode, state.aLeft, state.aRight, state.aTop, state.aBottom, popHeight, popWidth]);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const subWidth = 244;
  const preferredSubLeft = mainPos.left + popWidth + 10;
  const subLeft = preferredSubLeft + subWidth + 14 <= vw ? preferredSubLeft : mainPos.left - subWidth - 10;
  const subPos = clampPopoverPosition(subLeft, mainPos.top + 40, subWidth, 360, 14);

  useEffect(() => {
    if (!state.open) return;
    function onResize() {
      setViewportVersion((version) => version + 1);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [state.open]);

  useEffect(() => {
    if (!state.open) return;
    setSubpanel('none');
    setCalEdit('start');
    setViewMonth(firstOfMonth(state.dueDate));
  }, [state.open]);

  useEffect(() => {
    if (!state.open) return;
    function onDown(ev: MouseEvent) {
      const node = ev.target as Node;
      if (ref.current?.contains(node)) return;
      if (subRef.current?.contains(node)) return;
      onClose();
    }
    function onEsc(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onEsc);
    };
  }, [onClose, state.open]);

  if (!state.open) return null;

  function pickQuick(target: string) {
    setCalEdit('start');
    onChange(state.endDate && state.endDate < target ? { dueDate: target, endDate: '' } : { dueDate: target });
    setViewMonth(firstOfMonth(target));
  }

  function pickDay(value: string) {
    if (calEdit === 'end') {
      onChange({ endDate: value < state.dueDate ? '' : value });
    } else {
      onChange(state.endDate && state.endDate < value ? { dueDate: value, endDate: '' } : { dueDate: value });
    }
  }

  return (
    <>
      <div
        ref={ref}
        className="task-options-pop"
        style={{ left: mainPos.left, top: mainPos.top, width: popWidth, height: popHeight }}
        role="dialog"
        aria-label="Dodatkowe opcje zadania"
      >
        <div className="task-options-namebox">
          <span className="ton-ic">{IC_NOTE}</span>
          <input
            className="task-options-title"
            value={state.title}
            placeholder="Nazwa zadania"
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label="Nazwa zadania"
            autoFocus={!state.editingId && !state.title}
          />
        </div>
        <div className="task-options-icons">
          <button type="button" className={state.dueDate === quick.today ? 'is-active' : ''} title="Dziś" aria-label="Dziś" onClick={() => pickQuick(quick.today)}>{IC_SUN}</button>
          <button type="button" className={state.dueDate === quick.tomorrow ? 'is-active' : ''} title="Jutro" aria-label="Jutro" onClick={() => pickQuick(quick.tomorrow)}>{IC_SUNRISE}</button>
          <button type="button" className={state.dueDate === quick.week ? 'is-active' : ''} title="Za tydzień" aria-label="Za tydzień" onClick={() => pickQuick(quick.week)}>{IC_WEEK}</button>
          <button type="button" className={state.dueDate === quick.month ? 'is-active' : ''} title="Za miesiąc" aria-label="Za miesiąc" onClick={() => pickQuick(quick.month)}>{IC_MOON}</button>
        </div>

        <div className="task-options-navhead">
          <button type="button" aria-label="Poprzedni miesiąc" onClick={() => setViewMonth((m) => shiftMonth(m, -1))}>{IC_CHEVRON_L}</button>
          <span>{MONTH_FULL[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
          <button type="button" aria-label="Następny miesiąc" onClick={() => setViewMonth((m) => shiftMonth(m, 1))}>{IC_CHEVRON_R}</button>
        </div>
        <div className="task-options-weekdays">{['P', 'W', 'Ś', 'C', 'P', 'S', 'N'].map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}</div>
        <div className="task-options-days">
          {monthGrid.map((item) => {
            const isStart = item.value === state.dueDate;
            const isEnd = !!state.endDate && item.value === state.endDate;
            const isEditing = (calEdit === 'start' && isStart) || (calEdit === 'end' && isEnd);
            const cls = [
              isStart ? 'is-start' : '',
              isEnd ? 'is-end' : '',
              isEditing ? 'is-editing' : '',
              item.value === todayStr && !isStart && !isEnd ? 'is-today' : '',
              item.currentMonth ? '' : 'is-out',
            ].filter(Boolean).join(' ');
            return (
              <button key={item.value} type="button" className={cls} onClick={() => pickDay(item.value)}>
                {item.day}
              </button>
            );
          })}
        </div>

        <div className="task-options-card task-options-links-card">
          <div className="task-options-links">
            <button type="button" onClick={() => setSubpanel('repeat')}>
              <span className="tol-ic">{IC_REPEAT}</span><span className="tol-lbl">Powtarzaj</span><em>{REPEAT_LABEL[state.repeatModeUi]}</em><span className="tol-chev">{IC_CHEVRON_R}</span>
            </button>
            <button type="button" onClick={() => setSubpanel('reminder')}>
              <span className="tol-ic">{IC_BELL}</span><span className="tol-lbl">Przypomnienie</span><em>{REMINDER_LABEL[state.reminderMode]}</em><span className="tol-chev">{IC_CHEVRON_R}</span>
            </button>
            {!state.allDay && (
              <button type="button" onClick={() => { setCalEdit('start'); setSubpanel('time-start'); }}>
                <span className="tol-ic">{IC_CLOCK}</span><span className="tol-lbl">Godzina</span><em>{state.scheduledTime || 'Brak'}</em><span className="tol-chev">{IC_CHEVRON_R}</span>
              </button>
            )}
          </div>
        </div>


        <div className="task-options-actions">
          {state.editingId ? (
            <button className="btn btn-secondary btn-sm task-del-btn" type="button" onClick={onDelete}>Usuń</button>
          ) : (
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => onChange({ scheduledTime: '', endDate: '', endTime: '', allDay: false, durationMinutes: null, reminderMode: 'at_time', repeatModeUi: 'none' })}>Wyczyść</button>
          )}
          <button className="btn btn-primary btn-sm" type="button" onClick={onSave} disabled={saving || !state.title.trim()}>
            {saving ? 'Zapisywanie...' : 'OK'}
          </button>
        </div>
      </div>
      {subpanel !== 'none' && (
        <div ref={subRef} className="task-options-subpop" style={{ left: subPos.left, top: subPos.top }}>
          {subpanel === 'time-start' && (() => {
            const isStart = true;
            const value = state.scheduledTime;
            const set = (time: string) => onChange({ scheduledTime: time });
            return (
              <>
                <div className="task-sub-head">{isStart ? 'Godzina rozpoczęcia' : 'Godzina zakończenia'}</div>
                <div className="task-sub-list">
                  <button type="button" className={value === '' ? 'is-active' : ''} onClick={() => set('')}>Brak{value === '' && <span className="task-sub-check">{IC_CHECK}</span>}</button>
                  {TIME_OPTIONS.map((time) => (
                    <button key={time} type="button" className={time === value ? 'is-active' : ''} onClick={() => set(time)}>{time}{time === value && <span className="task-sub-check">{IC_CHECK}</span>}</button>
                  ))}
                </div>
              </>
            );
          })()}
          {subpanel === 'reminder' && (
            <>
              <div className="task-sub-head">Przypomnienie</div>
              <div className="task-sub-list">
                {(Object.keys(REMINDER_LABEL) as Array<TaskOptionsState['reminderMode']>).map((mode) => (
                  <button key={mode} type="button" className={state.reminderMode === mode ? 'is-active' : ''} onClick={() => onChange({ reminderMode: mode })}>{REMINDER_LABEL[mode]}{state.reminderMode === mode && <span className="task-sub-check">{IC_CHECK}</span>}</button>
                ))}
              </div>
            </>
          )}
          {subpanel === 'repeat' && (
            <>
              <div className="task-sub-head">Powtarzaj</div>
              <div className="task-sub-list">
                {([['none', 'Brak'], ['daily', 'Dziennie'], ['weekly', 'Co tydzień'], ['monthly', 'Miesiącznie'], ['yearly', 'Rocznie']] as Array<[TaskOptionsState['repeatModeUi'], string]>).map(([mode, label]) => (
                  <button key={mode} type="button" className={state.repeatModeUi === mode ? 'is-active' : ''} onClick={() => onChange({ repeatModeUi: mode })}>{label}{state.repeatModeUi === mode && <span className="task-sub-check">{IC_CHECK}</span>}</button>
                ))}
              </div>
              <button type="button" className="task-sub-link" onClick={() => setSubpanel('repeat_rule')}>Reguła powtarzania…</button>
            </>
          )}
          {subpanel === 'repeat_rule' && (
            <>
              <div className="task-sub-head">Reguła</div>
              <div className="task-sub-list">
                <button type="button" className={state.repeatAnchor === 'due_date' ? 'is-active' : ''} onClick={() => onChange({ repeatAnchor: 'due_date' })}>Według dat wymagalności{state.repeatAnchor === 'due_date' && <span className="task-sub-check">{IC_CHECK}</span>}</button>
                <button type="button" className={state.repeatAnchor === 'completion_date' ? 'is-active' : ''} onClick={() => onChange({ repeatAnchor: 'completion_date' })}>Według daty ukończenia{state.repeatAnchor === 'completion_date' && <span className="task-sub-check">{IC_CHECK}</span>}</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

interface CalendarQuickState {
  open: boolean;
  aLeft: number;
  aRight: number;
  aTop: number;
  aBottom: number;
  date: string;
  title: string;
  tags: string[];
  flagged: boolean;
}

interface CalendarQuickPopoverProps {
  state: CalendarQuickState;
  saving: boolean;
  detailsOpen: boolean;
  onClose: () => void;
  onChange: (next: Partial<CalendarQuickState>) => void;
  onSubmit: () => void;
  onOpenOptions: (anchor: AnchorRect) => void;
  onReturnSimple: () => void;
}

function quickDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  if (dateStr === todayStr) return `Dziś, ${fmtShortDate(dateStr)}`;
  if (dateStr === addDaysStr(todayStr, 1)) return `Jutro, ${fmtShortDate(dateStr)}`;
  const dt = parseDateStr(dateStr);
  const wd = dt ? ['ndz', 'pon', 'wt', 'śr', 'czw', 'pt', 'sob'][dt.getDay()] : '';
  return `${wd}, ${fmtShortDate(dateStr)}`;
}

const IC_CAL_SM = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
const IC_FLAG = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></svg>);
const IC_SEND = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>);

function CalendarQuickPopover({ state, saving, detailsOpen, onClose, onChange, onSubmit, onOpenOptions, onReturnSimple }: CalendarQuickPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const anchorWidth = Math.max(0, state.aRight - state.aLeft);
  const anchorHeight = Math.max(0, state.aBottom - state.aTop);
  const gridGap = 6;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const maxNoteWidth = Math.max(260, viewportW - 36);
  const maxNoteHeight = Math.max(190, viewportH - 36);
  const noteWidth = Math.min(Math.max(300, Math.round(anchorWidth * 2 + gridGap)), maxNoteWidth);
  const noteHeight = Math.min(Math.max(230, Math.round(anchorHeight * 2 + gridGap)), maxNoteHeight);
  const quickPos = placePopover({ left: state.aLeft, right: state.aRight, top: state.aTop, bottom: state.aBottom }, noteWidth, noteHeight, 10, 18);
  const quickRect = { left: quickPos.left, right: quickPos.left + noteWidth, top: quickPos.top, bottom: quickPos.top + noteHeight };

  // Clicking anywhere outside the note confirms it (saves when there is text),
  // otherwise just closes. Esc always closes without saving.
  useEffect(() => {
    if (!state.open) return;
    function onDown(ev: MouseEvent) {
      if (!ref.current) return;
      const target = ev.target as Element;
      if (ref.current.contains(target)) return;
      if (target.closest('.task-options-pop, .task-options-subpop')) return;
      if (detailsOpen) return;
      if (state.title.trim()) void onSubmit();
      else onClose();
    }
    function onEsc(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onClose();
    }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onEsc);
    };
  }, [detailsOpen, onClose, onSubmit, state.open, state.title]);

  if (!state.open) return null;

  const canSave = !!state.title.trim() && !saving;

  return (
    <div
      ref={ref}
      className={`task-quick-pop task-quick-note${detailsOpen ? ' is-under-detail' : ''}`}
      style={{ left: quickPos.left, top: quickPos.top, width: noteWidth, height: noteHeight }}
      onMouseDownCapture={(e) => {
        if (!detailsOpen) return;
        e.preventDefault();
        e.stopPropagation();
        onReturnSimple();
      }}
    >
      <div className="tq-head">
        <button type="button" className="tq-date" onClick={() => onOpenOptions(quickRect)} title="Ustaw termin, godzinę i szczegóły">
          <span className="tq-date-ic">{IC_CAL_SM}</span>
          <span>{quickDateLabel(state.date)}</span>
        </button>
        <button type="button" className={`tq-flag ${state.flagged ? 'is-on' : ''}`} onClick={() => onChange({ flagged: !state.flagged })} aria-pressed={state.flagged} aria-label="Oflaguj jako ważne" title="Oflaguj jako ważne">
          {IC_FLAG}
        </button>
      </div>
      <textarea
        className="tq-input"
        value={state.title}
        placeholder="Co chciałbyś zrobić?"
        onChange={(e) => {
          const consumed = consumeCompletedTags(e.target.value, state.tags);
          onChange({ title: consumed.title, tags: consumed.tags });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void onSubmit();
          }
          if (e.key === 'Backspace' && !state.title && state.tags.length > 0) {
            onChange({ tags: state.tags.slice(0, -1) });
          }
        }}
        autoFocus
      />
      {state.tags.length > 0 && (
        <div className="tq-tags">
          {state.tags.map((tag) => (
            <button key={tag} type="button" className="task-tag-badge" title="Usuń tag" onClick={() => onChange({ tags: state.tags.filter((item) => item !== tag) })}>#{tag}</button>
          ))}
        </div>
      )}
      <button type="button" className="tq-send" onClick={() => void onSubmit()} disabled={!canSave} aria-label="Dodaj zadanie" title="Dodaj (lub kliknij poza notatkę)">
        {IC_SEND}
      </button>
    </div>
  );
}

// ROOT

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
  const modalDate = todayStr;
  const [modalInitialTitle, setModalInitialTitle] = useState('');
  const [modalInitialTags, setModalInitialTags] = useState<string[]>([]);
  const [taskOptions, setTaskOptions] = useState<TaskOptionsState>({
    open: false,
    overlayMode: false,
    aLeft: 0,
    aRight: 0,
    aTop: 0,
    aBottom: 0,
    title: '',
    tags: [],
    dueDate: todayStr,
    scheduledTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    durationMinutes: null,
    priority: 'mid',
    reminderMode: 'at_time',
    repeatModeUi: 'none',
    repeatAnchor: 'due_date',
    editingId: null,
  });
  const [calendarQuick, setCalendarQuick] = useState<CalendarQuickState>({
    open: false,
    aLeft: 0,
    aRight: 0,
    aTop: 0,
    aBottom: 0,
    date: todayStr,
    title: '',
    tags: [],
    flagged: false,
  });
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [seriesDeleteTarget, setSeriesDeleteTarget] = useState<SupabaseTask | null>(null);

  const editingTask = editingTaskId ? tasks.find((task) => task.id === editingTaskId) ?? null : null;
  const editingSeriesCount = editingTask?.series_id
    ? tasks.filter((task) => task.series_id === editingTask.series_id).length
    : 0;
  const taskMutationPending = createTask.isPending || updateTask.isPending || toggleTask.isPending || deleteTask.isPending || deleteTasks.isPending;

  function openTaskOptions(anchor: AnchorRect, prefillTitle: string, prefillTags: string[], dueDate: string, overlayMode = false) {
    const parsed = extractTitleAndTags(prefillTitle, prefillTags);
    setTaskOptions({
      open: true,
      overlayMode,
      aLeft: anchor.left,
      aRight: anchor.right,
      aTop: anchor.top,
      aBottom: anchor.bottom,
      title: parsed.title,
      tags: parsed.tags,
      dueDate,
      scheduledTime: '',
      endDate: '',
      endTime: '',
      allDay: false,
      durationMinutes: null,
      priority: 'mid',
      reminderMode: 'at_time',
      repeatModeUi: 'none',
      repeatAnchor: 'due_date',
      editingId: null,
    });
  }

  // Single create path shared by the calendar quick-add, the tasks-panel input
  // and the schedule popover ? no per-component duplication of save rules.
  async function createTaskFromDraft(draft: TaskDraft, source: 'manual' | 'quick_add' | 'calendar_quick' | 'imported') {
    if (!draft.title.trim()) return;
    await createTask.mutateAsync({
      ...buildTaskFields(draft),
      source,
      category: null,
      note: '',
      series_id: null,
      repeat_until: null,
    });
  }

  async function saveTaskOptions() {
    const parsed = extractTitleAndTags(taskOptions.title, taskOptions.tags);
    if (!parsed.title || taskMutationPending) return;
    const startTime = taskOptions.allDay ? '' : taskOptions.scheduledTime;
    const endTime = taskOptions.allDay ? '' : taskOptions.endTime;

    const draft: TaskDraft = {
      title: parsed.title,
      tags: parsed.tags,
      dueDate: taskOptions.dueDate || null,
      scheduledTime: taskOptions.scheduledTime,
      endDate: taskOptions.endDate,
      endTime: taskOptions.endTime,
      allDay: taskOptions.allDay,
      priority: taskOptions.priority,
      reminderMode: taskOptions.reminderMode,
      repeatModeUi: taskOptions.repeatModeUi,
      repeatAnchor: taskOptions.repeatAnchor,
    };
    const fields = buildTaskFields(draft);
    if (!taskOptions.allDay && startTime && endTime && fields.duration_minutes == null) return;

    if (taskOptions.editingId) {
      await updateTask.mutateAsync({ id: taskOptions.editingId, patch: fields });
    } else {
      await createTaskFromDraft(draft, 'manual');
    }
    setTaskOptions((prev) => ({ ...prev, open: false }));
    setCalendarQuick((prev) => ({ ...prev, open: false, title: '', tags: [], flagged: false }));
  }

  function deleteTaskOptions() {
    const id = taskOptions.editingId;
    setTaskOptions((prev) => ({ ...prev, open: false }));
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (task) requestDeleteSeries(task);
  }

  async function handleQuickAddTask(title: string, tags: string[], dueDate: string) {
    if (taskMutationPending) return;
    await createTaskFromDraft({ ...emptyDraft(dueDate), title, tags }, 'quick_add');
  }
  function openCalendarQuick(dateStr: string, anchor: AnchorRect) {
    setCalendarQuick({
      open: true,
      aLeft: anchor.left,
      aRight: anchor.right,
      aTop: anchor.top,
      aBottom: anchor.bottom,
      date: dateStr,
      title: '',
      tags: [],
      flagged: false,
    });
  }

  function openScheduleForPanel(title: string, tags: string[], dueDate: string, anchor: AnchorRect) {
    openTaskOptions(anchor, title, tags, dueDate);
  }

  async function submitCalendarQuick() {
    const parsed = extractTitleAndTags(calendarQuick.title, calendarQuick.tags);
    if (!parsed.title || taskMutationPending) return;
    await createTaskFromDraft(
      { ...emptyDraft(calendarQuick.date, calendarQuick.flagged ? 'high' : 'mid'), title: parsed.title, tags: parsed.tags },
      'calendar_quick',
    );
    setCalendarQuick((prev) => ({ ...prev, open: false, title: '', tags: [], flagged: false }));
  }
  function openTask(task: SupabaseTask) {
    const startTime = task.scheduled_time ?? '';
    let endDate = '';
    let endTime = '';
    const startMin = timeToMinutes(startTime);
    if (startMin != null && task.duration_minutes) {
      const total = startMin + task.duration_minutes;
      const addDays = Math.floor(total / 1440);
      const mm = total % 1440;
      endTime = `${pad(Math.floor(mm / 60))}:${pad(mm % 60)}`;
      if (addDays > 0) endDate = addDaysStr(task.due_date ?? todayStr, addDays);
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const centerLeft = Math.max(16, (vw - 372) / 2);
    setTaskOptions({
      open: true,
      overlayMode: false,
      aLeft: centerLeft - 8,
      aRight: centerLeft - 8,
      aTop: 72,
      aBottom: 72,
      title: task.title,
      tags: dedupeTags(task.tags ?? []),
      dueDate: task.due_date ?? todayStr,
      scheduledTime: startTime,
      endDate,
      endTime,
      allDay: task.all_day,
      durationMinutes: task.duration_minutes ?? null,
      priority: task.priority ?? 'mid',
      reminderMode: reminderModeFromTask(task.start_at, task.reminder_at),
      repeatModeUi: task.repeat_mode === 'daily'
        ? 'daily'
        : task.repeat_mode === 'weekly'
          ? 'weekly'
          : task.repeat_mode === 'monthly'
            ? 'monthly'
            : task.repeat_mode === 'yearly'
              ? 'yearly'
              : 'none',
      repeatAnchor: task.repeat_anchor ?? 'due_date',
      editingId: task.id,
    });
  }
  function closeTaskModal() {
    setModalOpen(false);
    setEditingTaskId(null);
    setModalInitialTitle('');
    setModalInitialTags([]);
  }
  async function handleSaveTask(task: TaskModalPayload) {
    const primaryDueDate = task.dueDates[0] ?? todayStr;
    if (task.editingId) {
      await updateTask.mutateAsync({
        id: task.editingId,
        patch: {
          title: task.title,
          tags: task.tags,
          category: null,
          priority: task.priority,
          all_day: task.allDay,
          due_date: task.dueDates[0] ?? null,
          scheduled_time: task.startTime || null,
          start_at: task.allDay ? combineDateAndTimeToIso(primaryDueDate, '00:00') : combineDateAndTimeToIso(primaryDueDate, task.startTime || '00:00'),
          end_at: task.allDay
            ? null
            : (task.endTime
              ? combineDateAndTimeToIso(task.endDate || primaryDueDate, task.endTime)
              : null),
          reminder_at: task.allDay ? null : isoFromDateWithOffset(primaryDueDate, task.startTime || '00:00', minutesToReminderOffset(task.reminderMode)),
          repeat_mode: task.repeatModeUi,
          repeat_rule: task.repeatModeUi === 'none'
            ? null
            : {
              frequency: task.repeatModeUi,
              interval: 1,
              anchor: task.repeatAnchor,
              days_of_week: task.repeatModeUi === 'weekly' ? task.repeatWeekdays : null,
              until: task.repeatEndMode === 'date' ? task.repeatUntil || null : null,
            },
          repeat_anchor: task.repeatAnchor,
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
        tags: task.tags,
        source: task.repeatMode === 'none' ? 'manual' : 'imported',
        category: null,
        priority: task.priority,
        due_date: dueDate || null,
        all_day: task.allDay,
        scheduled_time: task.startTime || null,
        start_at: task.allDay ? combineDateAndTimeToIso(dueDate, '00:00') : combineDateAndTimeToIso(dueDate, task.startTime || '00:00'),
        end_at: task.allDay
          ? null
          : (task.endTime
            ? combineDateAndTimeToIso(task.endDate || dueDate, task.endTime)
            : null),
        reminder_at: task.allDay ? null : isoFromDateWithOffset(dueDate, task.startTime || '00:00', minutesToReminderOffset(task.reminderMode)),
        note: task.note,
        series_id: seriesId,
        repeat_mode: task.repeatModeUi === 'none' ? task.repeatMode : task.repeatModeUi,
        repeat_rule: task.repeatModeUi === 'none'
          ? null
          : {
            frequency: task.repeatModeUi,
            interval: 1,
            anchor: task.repeatAnchor,
            days_of_week: task.repeatModeUi === 'weekly' ? task.repeatWeekdays : null,
            until: task.repeatEndMode === 'date' ? task.repeatUntil || null : null,
          },
        repeat_anchor: task.repeatAnchor,
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
    updateTask.mutate({ id: task.id, patch: { due_date: dateStr, source: 'drag_drop' } });
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
  return (
    <PageLayout
      className="planner-page"
      header={<PageHeader
        icon={<PlannerHeaderIcon />}
        title="Planer"
        desc={'Zaplanuj dzień, zadania, nawyki i cele w jednym miejscu.'}
      />}
    >

      <div className="planner-shell">
        <div className="planner-layout">
          <aside className="planner-sidebar">
            <div className="card planner-tasks-card">
              <TodayPanel
                tasks={tasks}
                isLoading={tasksLoading}
                isSaving={taskMutationPending}
                hideCompleted={hideCompletedTasks}
                onToggleHideCompleted={() => setHideCompletedTasks((prev) => !prev)}
                onScheduleTask={openScheduleForPanel}
                onQuickAddTask={handleQuickAddTask}
                onTaskClick={openTask}
                onToggleTask={(id, done) => toggleTask.mutate({ id, done })}
              />
            </div>
            <div className="card planner-habits-card"><HabitsStrip /></div>
          </aside>
          <section className="card planner-calendar-card">
            <Calendar
              tasks={tasks}
              activeDate={calendarQuick.open ? calendarQuick.date : taskOptions.open ? taskOptions.dueDate : null}
              hideCompleted={hideCompletedTasks}
              onToggleHideCompleted={() => setHideCompletedTasks((prev) => !prev)}
              onDayClick={openCalendarQuick}
              onTaskClick={openTask}
              onToggleTask={(id, done) => toggleTask.mutate({ id, done })}
              onMoveTask={handleMoveTask}
            />
          </section>
        </div>
      </div>

      <TaskOptionsPopover
        state={taskOptions}
        saving={taskMutationPending}
        onClose={() => setTaskOptions((prev) => ({ ...prev, open: false }))}
        onChange={(next) => setTaskOptions((prev) => ({ ...prev, ...next }))}
        onSave={saveTaskOptions}
        onDelete={deleteTaskOptions}
      />

      <CalendarQuickPopover
        state={calendarQuick}
        saving={taskMutationPending}
        detailsOpen={taskOptions.open && taskOptions.overlayMode}
        onClose={() => setCalendarQuick((prev) => ({ ...prev, open: false }))}
        onChange={(next) => setCalendarQuick((prev) => ({ ...prev, ...next }))}
        onSubmit={submitCalendarQuick}
        onOpenOptions={(anchor) => {
          openTaskOptions(anchor, calendarQuick.title, calendarQuick.tags, calendarQuick.date, true);
        }}
        onReturnSimple={() => setTaskOptions((prev) => ({ ...prev, open: false }))}
      />

      <AddTaskModal
        open={modalOpen}
        defaultDate={modalDate}
        initialTitle={modalInitialTitle}
        initialTags={modalInitialTags}
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
    </PageLayout>
  );
}


