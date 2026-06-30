/**
 * Theme management.
 * Rootine OS uses one app-wide Graphite Cool Ice interface. Legacy theme ids
 * are accepted for compatibility and normalized to `dark`.
 */
import { fetchPreferences, updatePreferences } from '@/features/config/profile';

export type Theme = 'white-lotus' | 'dark' | 'green' | 'coastal' | 'aqua' | 'lavender' | 'coral' | 'steel' | 'magenta' | 'mono';

const ROOT = document.documentElement;
const KEY = 'rootine-theme';
const DEFAULT_THEME: Theme = 'dark';

function normalizeTheme(_theme?: Theme | null): Theme {
  return DEFAULT_THEME;
}

export function applyTheme(theme: Theme, animate = false) {
  const normalized = normalizeTheme(theme);
  if (animate) {
    ROOT.classList.add('theme-switching');
    setTimeout(() => ROOT.classList.remove('theme-switching'), 60);
  }
  ROOT.setAttribute('data-theme', normalized);
  localStorage.setItem(KEY, normalized);
}

export function applyStoredTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  applyTheme(normalizeTheme(stored));
}

export function getCurrentTheme(): Theme {
  const stored = localStorage.getItem(KEY) as Theme | null;
  return normalizeTheme(stored);
}

export function setTheme(theme: Theme) {
  const normalized = normalizeTheme(theme);
  applyTheme(normalized, true);
  void updatePreferences({ theme: normalized }).catch(() => {});
}

/** Loads theme from server prefs, migrating older palette choices to Graphite. */
export async function loadUserTheme(): Promise<Theme> {
  applyStoredTheme();
  const local = getCurrentTheme();
  try {
    const prefs = await fetchPreferences();
    const server = prefs?.theme as Theme | undefined;
    if (!server) return local;
    const normalized = normalizeTheme(server);
    applyTheme(normalized);
    if (server !== normalized) void updatePreferences({ theme: normalized }).catch(() => {});
    return normalized;
  } catch {
    return local;
  }
}
