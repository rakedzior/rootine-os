import type { CycleGoal, CycleStatus, CycleWeekType } from '@/features/sport/types';

export const CYCLE_GOAL_PRESETS: { value: CycleGoal; label: string }[] = [
  { value: 'hipertrofia', label: 'Budowa mięśni' },
  { value: 'sila', label: 'Siła' },
  { value: 'redukcja', label: 'Redukcja' },
  { value: 'wytrzymalosc', label: 'Kondycja' },
  { value: 'rehabilitacja', label: 'Rehabilitacja' },
  { value: 'mobilnosc', label: 'Mobilność' },
  { value: 'powrot_po_przerwie', label: 'Powrót po przerwie' },
  { value: 'custom', label: 'Własny cel' },
];

export function cycleGoalLabel(goal: string): string {
  return CYCLE_GOAL_PRESETS.find(g => g.value === goal)?.label ?? goal;
}

export const CYCLE_STATUS_LABEL: Record<CycleStatus, string> = {
  planned: 'Planowany', active: 'Aktywny', paused: 'Wstrzymany', completed: 'Zakończony', archived: 'Zarchiwizowany',
};

/** Maps a cycle status onto the app's canonical StatusBadge color keys (todo/active/waiting/done/cancelled). */
export const CYCLE_STATUS_BADGE_KEY: Record<CycleStatus, string> = {
  planned: 'todo', active: 'active', paused: 'waiting', completed: 'done', archived: 'cancelled',
};

export const CYCLE_WEEK_TYPE_LABEL: Record<CycleWeekType, string> = {
  standard: 'Normalny', deload: 'Lżejszy', test: 'Sprawdzian', special: 'Inny',
};
