export type IntegrationProvider = 'google_calendar' | 'strava';
export type IntegrationStatus = 'connected' | 'disconnected';

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  scope: string | null;
  connected_at: string | null;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  external_id: string | null;
  title: string;
  start_ts: string;
  end_ts: string;
  all_day: boolean;
  calendar_id: string | null;
  color: string | null;
  location: string | null;
  description: string | null;
  url: string | null;
  source: 'manual' | 'google_calendar';
  created_at: string;
  updated_at: string;
}

export interface StravaActivity {
  id: string;
  user_id: string;
  external_id: number | null;
  name: string;
  type: string | null;
  distance_m: number | null;
  duration_s: number | null;
  elevation_m: number | null;
  start_date: string;
  avg_hr: number | null;
  max_hr: number | null;
  avg_pace_s: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewCalendarEventInput {
  title: string;
  start_ts: string;
  end_ts: string;
  all_day?: boolean;
  location?: string | null;
  description?: string | null;
  color?: string | null;
}
