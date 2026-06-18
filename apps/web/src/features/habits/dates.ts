/** Local-date helpers (YYYY-MM-DD). Habit logs use a calendar date, so we
 *  format using the user's local time, not UTC. */

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
export function habitStats(dates: Set<string>, today: string = todayStr()): HabitStats {
  const doneToday = dates.has(today);
  let cursor = doneToday ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  const week = lastNDays(7, today).map((d) => dates.has(d));
  return { doneToday, streak, week };
}
