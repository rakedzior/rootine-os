/**
 * Theme management — reads/writes user_preferences.theme and applies data-theme to <html>.
 * Called once on app start (AuthProvider or main.tsx) and from settings toggle.
 */
import { supabase } from './supabase';

export type Theme = 'light' | 'dark';

const ROOT = document.documentElement;
const KEY = 'rootine-theme';

function applyTheme(theme: Theme, animate = false) {
  if (animate) {
    ROOT.classList.add('theme-switching');
    setTimeout(() => ROOT.classList.remove('theme-switching'), 50);
  }
  if (theme === 'dark') {
    ROOT.setAttribute('data-theme', 'dark');
  } else {
    ROOT.removeAttribute('data-theme');
  }
  localStorage.setItem(KEY, theme);
}

/** Apply theme from localStorage immediately (before auth resolves). */
export function applyStoredTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  if (stored) applyTheme(stored);
}

/** Load user's saved theme from Supabase and apply it. */
export async function loadUserTheme(): Promise<Theme> {
  const { data } = await supabase.from('user_preferences').select('theme').maybeSingle();
  const theme = (data?.theme ?? 'light') as Theme;
  applyTheme(theme);
  return theme;
}

/** Toggle and persist to Supabase. */
export async function setTheme(theme: Theme): Promise<void> {
  applyTheme(theme, true);
  await supabase
    .from('user_preferences')
    .update({ theme })
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '');
}

/** Get current theme from DOM. */
export function getCurrentTheme(): Theme {
  return ROOT.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
