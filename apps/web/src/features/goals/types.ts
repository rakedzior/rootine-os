export interface Goal {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  progress: number; // 0..100 (derived from milestones when any exist)
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Milestone {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  done: boolean;
  weight: number | null; // explicit % or null = auto (equal split)
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewGoalInput {
  name: string;
  category?: string | null;
}

/** Maps a goal category to one of the prototype's coloured icon classes. */
export function categoryIconClass(category: string | null): string {
  switch ((category ?? '').toLowerCase()) {
    case 'siła':
    case 'sila':
    case 'sport':
    case 'zdrowie':
      return 'gic-str';
    case 'nauka':
    case 'książki':
    case 'ksiazki':
      return 'gic-book';
    case 'finanse':
         return 'gic-fin';
    default:
      return 'gic-default';
  }
}

export interface NewMilestoneInput {
  goal_id: string;
  title: string;
  weight?: number | null;
  due_date?: string | null;
}

export function computeGoalProgress(milestones: { done: boolean; weight: number | null }[]): number {
  if (milestones.length === 0) return 0;
  const total = milestones.reduce((s, m) => s + (m.weight ?? 1), 0);
  const done = milestones.filter((m) => m.done).reduce((s, m) => s + (m.weight ?? 1), 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
