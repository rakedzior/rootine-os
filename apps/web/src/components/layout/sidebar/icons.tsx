import type { ReactNode } from 'react';

/** Shared stroke-based icon set for the sidebar. Simple, consistent, 24-grid. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type IconName =
  | 'planner' | 'sport' | 'diet' | 'goals' | 'finance' | 'office'
  | 'work' | 'travel' | 'notes' | 'settings'
  | 'chevron-left' | 'lock' | 'unlock' | 'clock' | 'logout';

const PATHS: Record<IconName, ReactNode> = {
  planner: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" /></>),
  sport: (<><path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 9l6-6 6 6-6 6zM15 9l6 6" /></>),
  diet: (<><path d="M12 20a6 6 0 0 1-6-6c0-4 3-8 6-8s6 4 6 8a6 6 0 0 1-6 6Z" /><path d="M12 6c0-2 1-3 3-4" /></>),
  goals: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>),
  finance: (<><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M16 15h2" /></>),
  office: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>),
  work: (<><path d="M3 7a2 2 0 0 1 2-2h3l2 2.5h9a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></>),
  travel: (<><path d="M17.8 19.2 16 11l4.5-4.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7L9 11l-2 3-2.5-.5a.8.8 0 0 0-.7 1.3L6 18l2.5 2.2a.8.8 0 0 0 1.3-.7L9 17l3-2 3.3 4.9a1 1 0 0 0 1.7-.9Z" /></>),
  notes: (<><path d="M5 3h11l3 3v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M8 8h7M8 12h7M8 16h4" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  'chevron-left': (<path d="M15 18l-6-6 6-6" />),
  lock: (<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" /></>),
  unlock: (<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V7a3.5 3.5 0 0 1 6.5-1.8" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3.5 2" /></>),
  logout: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg {...base} style={{ width: size, height: size, flexShrink: 0 }} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
