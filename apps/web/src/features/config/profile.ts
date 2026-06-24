import { supabase } from '@/lib/supabase';

// ─── PROFILE ─────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  avatar_url: string | null;
  avatar_label: string | null;
  default_city: string | null;
  timezone: string | null;
}

export interface ProfileUpdate {
  display_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
  default_city?: string | null;
  timezone?: string | null;
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, avatar_url, avatar_label, default_city, timezone')
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateProfile(patch: ProfileUpdate): Promise<void> {
  const id = await uid();
  const { error } = await supabase
    .from('profiles')
    .upsert({ id, ...patch }, { onConflict: 'id' });
  if (error) throw error;
}

// ─── PREFERENCES ─────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Preferences {
  theme: string;
  mode: ThemeMode;
  locale: string;
  notifications: Record<string, boolean>;
  privacy: Record<string, boolean>;
}

export interface PreferencesUpdate {
  theme?: string;
  mode?: ThemeMode;
  locale?: string;
  notifications?: Record<string, boolean>;
  privacy?: Record<string, boolean>;
}

export async function fetchPreferences(): Promise<Preferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, mode, locale, notifications, privacy')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    theme: data.theme ?? 'magenta',
    mode: (data.mode ?? 'system') as ThemeMode,
    locale: data.locale ?? 'pl',
    notifications: (data.notifications ?? {}) as Record<string, boolean>,
    privacy: (data.privacy ?? {}) as Record<string, boolean>,
  };
}

export async function updatePreferences(patch: PreferencesUpdate): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) throw error;
}
