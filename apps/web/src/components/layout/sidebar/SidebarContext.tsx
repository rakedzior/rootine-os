import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Central sidebar state. Two persisted user choices:
 *  - committedExpanded: the pinned collapsed/expanded state (toggle button)
 *  - locked: when true the sidebar ignores hover and stays in its committed state
 * When unlocked, hovering expands the sidebar (visually, as an overlay) and it
 * collapses again on mouse leave. Both choices survive a reload via localStorage.
 */
interface SidebarState {
  /** High-level behavior mode used by the lock button. */
  lockMode: 'auto' | 'pinned-open' | 'pinned-closed';
  /** Effective (visual) expanded state — committed OR hover when unlocked. */
  expanded: boolean;
  /** The pinned state that controls how much horizontal space the content gets. */
  committedExpanded: boolean;
  locked: boolean;
  setHover: (hovering: boolean) => void;
  toggleExpanded: () => void;
  cycleLockMode: () => void;
}

const LS_EXPANDED = 'rootine-sidebar-expanded';
const LS_LOCKED = 'rootine-sidebar-locked';

const SidebarCtx = createContext<SidebarState | null>(null);

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [committedExpanded, setCommittedExpanded] = useState(() => readBool(LS_EXPANDED, false));
  const [locked, setLocked] = useState(() => readBool(LS_LOCKED, false));
  const [hover, setHover] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_EXPANDED, committedExpanded ? '1' : '0'); } catch { /* ignore */ }
  }, [committedExpanded]);
  useEffect(() => {
    try { localStorage.setItem(LS_LOCKED, locked ? '1' : '0'); } catch { /* ignore */ }
  }, [locked]);

  const lockMode: SidebarState['lockMode'] = !locked
    ? 'auto'
    : (committedExpanded ? 'pinned-open' : 'pinned-closed');

  const expanded = locked ? committedExpanded : (hover || committedExpanded);

  const value = useMemo<SidebarState>(() => ({
    lockMode,
    expanded,
    committedExpanded,
    locked,
    setHover,
    toggleExpanded: () => setCommittedExpanded((v) => !v),
    cycleLockMode: () => {
      if (lockMode === 'auto') {
        setLocked(true);
        setCommittedExpanded(true);
        return;
      }
      if (lockMode === 'pinned-open') {
        setLocked(true);
        setCommittedExpanded(false);
        return;
      }
      setLocked(false);
    },
  }), [lockMode, expanded, committedExpanded, locked]);

  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error('useSidebar must be used within <SidebarProvider>');
  return ctx;
}
