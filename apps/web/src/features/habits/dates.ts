import type { Habit } from './types';

/** Local-date helpers (YYYY-MM-DD). Habit logs use a calendar date, so we
 *  format using the user's local time, not UTC. */

export const HABIT_WEEKDAYS = [
  { value: 1, label: 'Pon' },
  { value: 2, label: 'Wt' },
  { value: 3, label: 'Sr' },
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

function normalizedWeekdays(habit: Pick<Habit, 'recurrence_type' | 'weekdays'>): number[] {
  if (habit.recurrence_type === 'daily') return ALL_WEEKDAYS;
  const days = Array.isArray(habit.weekdays) ? habit.weekdays.filter((d) => d >= 1 && d <= 7) : [];
  return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : ALL_WEEKDAYS;
}

export function habitOccursOn(
  habit: Pick<Habit, 'recurrence_type' | 'weekdays' | 'start_date' | 'end_date'>,
  date: string = todayStr(),
): boolean {
  if (habit.start_date && date < habit.start_date) return false;
  if (habit.end_date && date > habit.end_date) return false;
  return normalizedWeekdays(habit).includes(weekdayOf(date));
}

export function habitScheduleLabel(
  habit: Pick<Habit, 'recurrence_type' | 'weekdays' | 'end_date'>,
): string {
  const days = normalizedWeekdays(habit);
  const sameDays = (expected: number[]) => expected.length === days.length && expected.every((d, i) => d === days[i]);
  let label = 'Codziennie';
  if (habit.recurrence_type === 'weekly' && !sameDays(ALL_WEEKDAYS)) {
    if (sameDays([1, 2, 3, 4, 5])) label = 'Dni robocze';
    else if (sameDays([6, 7])) label = 'Weekend';
    else label = days.map((d) => HABIT_WEEKDAYS.find((w) => w.value === d)?.label ?? String(d)).join(', ');
  }
  return habit.end_date ? `${label} do ${habit.end_date}` : label;
}

/** Oldest -> newest list of the last `n` calendar dates ending at `end`. */
export function lastNDays(n: number, end: string = todayStr()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

export interface HabitStats {
  doneToday: boolean;
  streak: number;
  week: boolean[]; // last 7 days, oldest -> newest
}

/** Compute today-status, current streak and 7-day dots from a set of
 *  completed dates. Streak counts consecutive days ending today (or
 *  yesterday if today isn't done yet, so a pending today doesn't reset it). */
export function habitStats(
  dates: Set<string>,
  today: string = todayStr(),
  habit?: Pick<Habit, 'recurrence_type' | 'weekdays' | 'start_date' | 'end_date'>,
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
