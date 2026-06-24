/**
 * Theme management — white-lotus (beige), dark, green.
 * Applies data-theme to <html>; persists to localStorage.
 */
import { fetchPreferences, updatePreferences } from '@/features/config/profile';

export type Theme = 'white-lotus' | 'dark' | 'green' | 'coastal' | 'aqua' | 'lavender' | 'coral' | 'steel' | 'magenta' | 'mono';

const ROOT = document.documentElement;
const KEY = 'rootine-theme';
const DEFAULT_THEME: Theme = 'magenta';

export function applyTheme(theme: Theme, animate = false) {
  if (animate) {
    ROOT.classList.add('theme-switching');
    setTimeout(() => ROOT.classList.remove('theme-switching'), 60);
  }
  ROOT.setAttribute('data-theme', theme === 'white-lotus' ? 'light' : theme);
  localStorage.setItem(KEY, theme);
}

export function applyStoredTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  applyTheme(stored ?? DEFAULT_THEME);
}

export function getCurrentTheme(): Theme {
  const stored = localStorage.getItem(KEY) as Theme | null;
  return stored ?? DEFAULT_THEME;
}

export function setTheme(theme: Theme) {
  applyTheme(theme, true);
  // Cross-device sync (fire-and-forget); localStorage already applied above.
  void updatePreferences({ theme }).catch(() => {});
}

/** Loads theme from server prefs (with localStorage as instant fallback). */
export async function loadUserTheme(): Promise<Theme> {
  applyStoredTheme();
  const local = getCurrentTheme();
  try {
    const prefs = await fetchPreferences();
    const server = prefs?.theme as Theme | undefined;
    if (!server) return local;
    // Legacy: column seeded literal 'light' but user has a real local pick → migrate up.
    if ((server as string) === 'light' && local !== 'white-lotus') {
      void updatePreferences({ theme: local }).catch(() => {});
      return local;
    }
    applyTheme(server);
    return server;
  } catch {
    return local;
  }
}
