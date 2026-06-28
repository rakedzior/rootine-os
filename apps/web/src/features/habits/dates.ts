import type { Habit } from './types';

export const HABIT_WEEKDAYS = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Śr' },
  { value: 4, label: 'Czw' },
  { value: 5, label: 'Pt' },
  { value: 6, label: 'Sob' },
  { value: 7, label: 'Ndz' },
] as const;

export const ALL_WEEKDAYS = HABIT_WEEKDAYS.map((d) => d.value);

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDays(str: string, n: number): string {
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return toDateStr(dt);
}

export function weekdayOf(str: string): number {
  const [y, m, d] = str.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 7 : day;
}

function normalizedWeekdays(
  habit: Pick<Habit, 'recurrence_type' | 'weekdays'> & Partial<Pick<Habit, 'schedule_type' | 'schedule_days'>>,
): number[] {
  if (habit.schedule_type === 'daily' || habit.schedule_type === 'every_n_months') return ALL_WEEKDAYS;
  if (habit.recurrence_type === 'daily' && !habit.schedule_type) return ALL_WEEKDAYS;
  const source = Array.isArray(habit.schedule_days) ? habit.schedule_days : habit.weekdays;
  const days = Array.isArray(source) ? source.filter((d) => d >= 1 && d <= 7) : [];
  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : ALL_WEEKDAYS;
}

function dateParts(str: string): { year: number; month: number; day: number } {
  const [year, month, day] = str.split('-').map(Number);
  return { year, month, day };
}

function weeksBetween(start: string, date: string): number {
  const a = dateParts(start);
  const b = dateParts(date);
  const startDate = new Date(a.year, a.month - 1, a.day);
  const targetDate = new Date(b.year, b.month - 1, b.day);
  return Math.floor((targetDate.getTime() - startDate.getTime()) / (7 * 86400000));
}

function monthsBetween(start: string, date: string): number {
  const a = dateParts(start);
  const b = dateParts(date);
  return (b.year - a.year) * 12 + (b.month - a.month);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

type HabitScheduleShape = Pick<Habit, 'recurrence_type' | 'weekdays' | 'start_date' | 'end_date'> &
  Partial<Pick<Habit, 'status' | 'schedule_type' | 'schedule_days' | 'interval_value' | 'end_mode' | 'end_after_cycles'>>;

function habitOccursBySchedule(habit: HabitScheduleShape, date: string): boolean {
  if (habit.start_date && date < habit.start_date) return false;
  const endMode = habit.end_mode ?? (habit.end_date ? 'on_date' : 'forever');
  if (endMode === 'on_date' && habit.end_date && date > habit.end_date) return false;
  if (habit.status && habit.status !== 'active' && date >= todayStr()) return false;

  const scheduleType = habit.schedule_type ?? (habit.recurrence_type === 'weekly' ? 'selected_weekdays' : 'daily');
  const interval = Math.max(1, habit.interval_value ?? 1);

  if (scheduleType === 'daily') return true;
  if (scheduleType === 'selected_weekdays') return normalizedWeekdays(habit).includes(weekdayOf(date));
  if (scheduleType === 'every_n_weeks') {
    return weeksBetween(habit.start_date || date, date) % interval === 0 && normalizedWeekdays(habit).includes(weekdayOf(date));
  }
  if (scheduleType === 'every_n_months') {
    const diff = monthsBetween(habit.start_date || date, date);
    if (diff < 0 || diff % interval !== 0) return false;
    const start = dateParts(habit.start_date || date);
    const current = dateParts(date);
    const expectedDay = Math.min(start.day, lastDayOfMonth(current.year, current.month));
    return current.day === expectedDay;
  }
  return false;
}

function occurrenceNumberOnOrBefore(habit: HabitScheduleShape, date: string): number {
  let cursor = habit.start_date || date;
  let count = 0;
  let guard = 0;
  while (cursor <= date && guard < 5000) {
    guard++;
    if (habitOccursBySchedule({ ...habit, status: 'active', end_mode: 'forever', end_date: null }, cursor)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}

export function habitOccursOn(habit: HabitScheduleShape, date: string = todayStr()): boolean {
  if (!habitOccursBySchedule(habit, date)) return false;
  if (habit.end_mode === 'after_cycles' && habit.end_after_cycles && habit.start_date) {
    return occurrenceNumberOnOrBefore(habit, date) <= habit.end_after_cycles;
  }
  return true;
}

function withEndLabel(
  label: string,
  habit: Partial<Pick<Habit, 'end_mode' | 'end_date' | 'end_after_cycles'>>,
): string {
  const endMode = habit.end_mode ?? (habit.end_date ? 'on_date' : 'forever');
  if (endMode === 'on_date' && habit.end_date) return `${label} do ${habit.end_date}`;
  if (endMode === 'after_cycles' && habit.end_after_cycles) return `${label} · ${habit.end_after_cycles} cykli`;
  return label;
}

export function habitScheduleLabel(
  habit: Pick<Habit, 'recurrence_type' | 'weekdays' | 'end_date'> &
    Partial<Pick<Habit, 'schedule_type' | 'schedule_days' | 'interval_value' | 'end_mode' | 'end_after_cycles'>>,
): string {
  const scheduleType = habit.schedule_type ?? (habit.recurrence_type === 'weekly' ? 'selected_weekdays' : 'daily');
  if (scheduleType === 'every_n_months') {
    const interval = Math.max(1, habit.interval_value ?? 1);
    return withEndLabel(interval === 1 ? 'Co miesiąc' : `Co ${interval} mies.`, habit);
  }

  const days = normalizedWeekdays(habit);
  const sameDays = (expected: number[]) => expected.length === days.length && expected.every((d, i) => d === days[i]);
  let label = 'Codziennie';
  if ((scheduleType === 'selected_weekdays' || scheduleType === 'every_n_weeks') && !sameDays(ALL_WEEKDAYS)) {
    if (sameDays([1, 2, 3, 4, 5])) label = 'Dni robocze';
    else if (sameDays([6, 7])) label = 'Weekend';
    else label = days.map((d) => HABIT_WEEKDAYS.find((w) => w.value === d)?.label ?? String(d)).join(', ');
  }
  if (scheduleType === 'every_n_weeks') {
    const interval = Math.max(1, habit.interval_value ?? 1);
    label = `Co ${interval} tyg.${label === 'Codziennie' ? '' : ` · ${label}`}`;
  }
  return withEndLabel(label, habit);
}

export function lastNDays(n: number, end: string = todayStr()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

export interface HabitStats {
  doneToday: boolean;
  streak: number;
  week: boolean[];
}

export function habitStats(
  dates: Set<string>,
  today: string = todayStr(),
  habit?: HabitScheduleShape,
): HabitStats {
  const doneToday = dates.has(today);
  const scheduledToday = habit ? habitOccursOn(habit, today) : true;
  let cursor = doneToday || !scheduledToday ? today : addDays(today, -1);
  let streak = 0;
  let guard = 0;
  while (guard < 370) {
    guard++;
    if (habit && !habitOccursOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!dates.has(cursor)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }
  const week = lastNDays(7, today).map((d) => dates.has(d));
  return { doneToday, streak, week };
}
