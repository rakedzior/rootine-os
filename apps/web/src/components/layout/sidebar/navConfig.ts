import type { IconName } from './icons';

/**
 * Single source of truth for the sidebar navigation.
 * Add / reorder / relabel tabs here, or point them at a different route.
 * `badge` is reserved for future counts (tasks, documents, notes…).
 */
export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: IconName;
  /** Match the route exactly (used for the index "/" route). */
  end?: boolean;
  /** Optional count badge — wire to live data later. */
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'start', path: '/', label: 'Planer', icon: 'planner', end: true },
  { key: 'sport', path: '/sport', label: 'Sport', icon: 'sport' },
  { key: 'diet', path: '/diet', label: 'Odżywianie', icon: 'diet' },
  { key: 'goals', path: '/goals', label: 'Cele', icon: 'goals' },
  { key: 'finance', path: '/finance', label: 'Finanse', icon: 'finance' },
  { key: 'office', path: '/office', label: 'Biuro', icon: 'office' },
  { key: 'work', path: '/work', label: 'Praca', icon: 'work' },
  { key: 'travel', path: '/travel', label: 'Podróże', icon: 'travel' },
  { key: 'notes', path: '/notes', label: 'Notatki', icon: 'notes' },
];

/** Settings lives in the footer cluster, separate from the main nav list. */
export const SETTINGS_ITEM: NavItem = { key: 'settings', path: '/settings', label: 'Ustawienia', icon: 'settings' };
