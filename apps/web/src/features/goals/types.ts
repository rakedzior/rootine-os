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
    case 'pieniądze':
    case 'pieniadze':
      return 'gic-fin';
    default:
      return 'gic-fin';
  }
}

/** Derived goal progress from its milestones.
 *  - milestones with an explicit weight contribute that weight when done
 *  - milestones without a weight ("auto") split the remaining % equally
 *  Returns 0..100 (rounded). With all-auto milestones this is simply
 *  done/total × 100. */
export function computeGoalProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const explicit = milestones.filter((m) => m.weight != null);
  const auto = milestones.filter((m) => m.weight == null);
  const explicitTotal = explicit.reduce((s, m) => s + (m.weight ?? 0), 0);
  const remaining = Math.max(0, 100 - explicitTotal);
  const autoShare = auto.length ? remaining / auto.length : 0;
  let p = 0;
  for (const m of milestones) {
    if (!m.done) continue;
    p += m.weight != null ? m.weight : autoShare;
  }
  return Math.round(Math.min(100, Math.max(0, p)));
}
