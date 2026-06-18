import { supabase } from '@/lib/supabase';
import type { Integration, IntegrationProvider, CalendarEvent, StravaActivity, NewCalendarEventInput } from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ── integrations ──────────────────────────────────────────────

export async function fetchIntegrations(): Promise<Integration[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .order('provider');
  if (error) throw error;
  return (data ?? []) as Integration[];
}

export async function disconnectIntegration(provider: IntegrationProvider): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('integrations')
    .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw error;
  // Remove tokens
  const { data: intRow } = await supabase
    .from('integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  if (intRow) {
    await supabase.from('integration_tokens').delete().eq('integration_id', intRow.id);
  }
}

// ── calendar_events ────────────────────────────────────────────

export async function fetchCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_ts', from)
    .lte('start_ts', to)
    .order('start_ts', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function insertCalendarEvent(input: NewCalendarEventInput): Promise<CalendarEvent> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ user_id: userId, source: 'manual', ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}

// ── strava_activities ──────────────────────────────────────────

export async function fetchStravaActivities(limit = 20): Promise<StravaActivity[]> {
  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as StravaActivity[]).map((r) => ({
    ...r,
    distance_m: r.distance_m != null ? Number(r.distance_m) : null,
    elevation_m: r.elevation_m != null ? Number(r.elevation_m) : null,
  }));
}
