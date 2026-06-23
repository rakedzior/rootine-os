/**
 * Theme management — white-lotus (beige), dark, green.
 * Applies data-theme to <html>; persists to localStorage.
 */
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
}

/** Compat shim for AuthProvider */
export async function loadUserTheme(): Promise<Theme> {
  applyStoredTheme();
  return getCurrentTheme();
}
