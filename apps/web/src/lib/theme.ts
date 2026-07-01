/**
 * Theme management — dark (Graphite Cockpit, primary identity) + white-lotus (light alt).
 * Applies data-theme to <html>; persists to localStorage.
 */
import { fetchPreferences, updatePreferences } from '@/features/config/profile';

export type Theme = 'dark' | 'white-lotus';
export type AccentColor = 'emerald' | 'cool-ice';

const ROOT = document.documentElement;
const KEY = 'rootine-theme';
const ACCENT_KEY = 'rootine-accent';
const DEFAULT_THEME: Theme = 'dark';
const DEFAULT_ACCENT: AccentColor = 'emerald';
const VALID: readonly Theme[] = ['dark', 'white-lotus'];
const VALID_ACCENTS: readonly AccentColor[] = ['emerald', 'cool-ice'];

/** Coerce any stored/legacy value (retired palettes, seeded 'light') to a supported theme. */
function normalize(value: string | null | undefined): Theme {
  return VALID.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME;
}

function normalizeAccent(value: string | null | undefined): AccentColor {
  return VALID_ACCENTS.includes(value as AccentColor) ? (value as AccentColor) : DEFAULT_ACCENT;
}

export function applyTheme(theme: Theme, animate = false) {
  if (animate) {
    ROOT.classList.add('theme-switching');
    setTimeout(() => ROOT.classList.remove('theme-switching'), 60);
  }
  ROOT.setAttribute('data-theme', theme === 'white-lotus' ? 'light' : theme);
  localStorage.setItem(KEY, theme);
}

export function applyAccentColor(accent: AccentColor, animate = false) {
  if (animate) {
    ROOT.classList.add('theme-switching');
    setTimeout(() => ROOT.classList.remove('theme-switching'), 60);
  }
  ROOT.setAttribute('data-accent', accent);
  localStorage.setItem(ACCENT_KEY, accent);
}

export function applyStoredTheme() {
  applyTheme(normalize(localStorage.getItem(KEY)));
  applyAccentColor(normalizeAccent(localStorage.getItem(ACCENT_KEY)));
}

export function getCurrentTheme(): Theme {
  return normalize(localStorage.getItem(KEY));
}

export function getCurrentAccentColor(): AccentColor {
  return normalizeAccent(localStorage.getItem(ACCENT_KEY));
}

export function setTheme(theme: Theme) {
  applyTheme(theme, true);
  // Cross-device sync (fire-and-forget); localStorage already applied above.
  void updatePreferences({ theme }).catch(() => {});
}

export function setAccentColor(accent: AccentColor) {
  applyAccentColor(accent, true);
}

/** Loads theme from server prefs (with localStorage as instant fallback). */
export async function loadUserTheme(): Promise<Theme> {
  applyStoredTheme();
  const local = getCurrentTheme();
  try {
    const prefs = await fetchPreferences();
    const serverRaw = prefs?.theme as string | undefined;
    if (!serverRaw) return local;
    // Legacy: column seeded literal 'light' but user has a real local pick → migrate up.
    if (serverRaw === 'light' && local !== 'white-lotus') {
      void updatePreferences({ theme: local }).catch(() => {});
      return local;
    }
    // Legacy 'light' → white-lotus; retired palettes coerce to the default identity.
    const server: Theme = serverRaw === 'light' ? 'white-lotus' : normalize(serverRaw);
    applyTheme(server);
    return server;
  } catch {
    return local;
  }
}
