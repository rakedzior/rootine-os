/**
 * Sport — date, week and recurrence helpers shared by the "Dzisiaj",
 * "Podsumowanie tygodnia" and "Planowanie" views. Pulled out of SportScreen
 * so the recurrence math has a single, testable home.
 */
import type { ScheduledWorkout, WorkoutRecurrenceRule } from '@/store/localStore';

/** How far past "now" an indefinite rule gets materialized in one pass. */
export const INDEFINITE_HORIZON_DAYS = 120;
/** Hard cap on a single materialization run, regardless of horizon, to keep this O(1)-ish. */
const MAX_MATERIALIZE_DAYS = 730;

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function todayStr(): string {
  return toDateStr(new Date());
}
export function parseDateStr(s: string): Date {
  return new Date(`${s}T12:00:00`);
}
export function addDaysStr(s: string, n: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
export function weekdayOf(s: string): number {
  return parseDateStr(s).getDay();
}
/** Monday-based week start, matching the rest of the app's week math. */
export function startOfWeekStr(s: string): string {
  const d = parseDateStr(s);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return toDateStr(d);
}
function weeksBetween(aWeekStart: string, bWeekStart: string): number {
  const diffMs = parseDateStr(bWeekStart).getTime() - parseDateStr(aWeekStart).getTime();
  return Math.round(diffMs / (7 * 86400000));
}

export const WEEKDAY_LABELS = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
export const WEEKDAY_LABELS_LONG = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

/** Every date a rule fires on, between rule.startDate and `until` (inclusive). */
export function occurrenceDates(rule: WorkoutRecurrenceRule, until: string): string[] {
  const end = rule.endDate && rule.endDate < until ? rule.endDate : until;
  if (end < rule.startDate) return [];
  const ruleWeekStart = startOfWeekStr(rule.startDate);
  const dates: string[] = [];
  let cursor = rule.startDate;
  let guard = 0;
  while (cursor <= end && guard < MAX_MATERIALIZE_DAYS) {
    if (rule.weekdays.includes(weekdayOf(cursor))) {
      const weekDiff = weeksBetween(ruleWeekStart, startOfWeekStr(cursor));
      if (weekDiff % Math.max(rule.interval, 1) === 0) dates.push(cursor);
    }
    cursor = addDaysStr(cursor, 1);
    guard += 1;
  }
  return dates;
}

/** New (un-persisted) ScheduledWorkout rows for a rule, up to `through`. Skips dates already materialized. */
export function materializeRule(
  rule: WorkoutRecurrenceRule,
  through: string,
  alreadyMaterialized: Set<string>,
): Omit<ScheduledWorkout, 'id' | 'createdAt' | 'updatedAt'>[] {
  const horizon = rule.endDate ?? through;
  return occurrenceDates(rule, horizon)
    .filter((date) => !alreadyMaterialized.has(`${rule.id}|${date}`))
    .map((date) => ({
      templateId: rule.templateId,
      date,
      order: 0,
      status: 'planned' as const,
      recurrenceRuleId: rule.id,
    }));
}

export function describeRecurrence(rule: WorkoutRecurrenceRule): string {
  const days = rule.weekdays.slice().sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join(', ');
  const cadence = rule.interval > 1 ? `co ${rule.interval} tyg.` : 'co tydzień';
  const range = rule.isIndefinite ? 'bezterminowo' : `do ${rule.endDate}`;
  return `${days} · ${cadence} · ${range}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() + (dow === 0 ? -6 : 1 - dow));
  return copy;
}
