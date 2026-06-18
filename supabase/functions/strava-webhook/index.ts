/**
 * strava-webhook — receives new Strava activities and stores them
 *
 * Register webhook in Strava:
 *   POST https://www.strava.com/api/v3/push_subscriptions
 *     client_id=... client_secret=... callback_url=<fn-url> verify_token=<STRAVA_VERIFY_TOKEN>
 *
 * Supabase secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_VERIFY_TOKEN, TOKEN_ENC_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID') ?? '';
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET') ?? '';
const VERIFY_TOKEN = Deno.env.get('STRAVA_VERIFY_TOKEN') ?? 'rootine-strava-verify';
const TOKEN_ENC_KEY = Deno.env.get('TOKEN_ENC_KEY') ?? 'change-me';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function decrypt(enc: string): Promise<string> {
  const { data, error } = await admin.rpc('pgp_sym_decrypt_text_wrapper', { data: enc, key: TOKEN_ENC_KEY });
  if (error || !data) return atob(enc); // fallback base64
  return data as string;
}

async function refreshStravaToken(userId: string, integrationId: string, refreshEnc: string): Promise<string> {
  const refreshToken = await decrypt(refreshEnc);
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  const t = await res.json() as { access_token: string; refresh_token: string; expires_at: number };
  const accessEnc = btoa(t.access_token);
  const newRefreshEnc = btoa(t.refresh_token);
  await admin.from('integration_tokens').update({
    access_token_enc: accessEnc, refresh_token_enc: newRefreshEnc,
    expires_at: new Date(t.expires_at * 1000).toISOString(),
  }).eq('integration_id', integrationId);
  return t.access_token;
}

Deno.serve(async (req) => {
  // Webhook verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const challenge = url.searchParams.get('hub.challenge');
    const verify = url.searchParams.get('hub.verify_token');
    if (verify !== VERIFY_TOKEN) return new Response('Forbidden', { status: 403 });
    return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.json() as {
    owner_id: number;
    object_type: string;
    object_id: number;
    aspect_type: string;
  };

  if (body.object_type !== 'activity' || body.aspect_type !== 'create') {
    return new Response('OK', { status: 200 });
  }

  const athleteId = body.owner_id;
  const activityId = body.object_id;

  // Find user by Strava athlete_id — stored in metadata or look up integration by external mapping
  // For MVP: we look up integration token to find user
  const { data: tokens } = await admin
    .from('integration_tokens')
    .select('user_id, integration_id, access_token_enc, refresh_token_enc, expires_at')
    .eq('user_id', (await admin.from('integrations').select('user_id').eq('provider', 'strava')).data?.[0]?.user_id ?? '')
    .maybeSingle();

  if (!tokens) return new Response('User not found', { status: 200 });

  let accessToken = await decrypt(tokens.access_token_enc);
  const expired = tokens.expires_at && new Date(tokens.expires_at) < new Date();
  if (expired && tokens.refresh_token_enc) {
    accessToken = await refreshStravaToken(tokens.user_id, tokens.integration_id, tokens.refresh_token_enc);
  }

  // Fetch activity detail from Strava
  const actRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const act = await actRes.json() as {
    name: string; type: string; distance: number; moving_time: number;
    total_elevation_gain: number; start_date_local: string;
    average_heartrate?: number; max_heartrate?: number; map?: { summary_polyline?: string };
  };

  const startDate = act.start_date_local.split('T')[0];
  const distKm = act.distance / 1000;
  const avgPaceS = distKm > 0 ? Math.round(act.moving_time / distKm) : null;

  await admin.from('strava_activities').upsert({
    user_id: tokens.user_id,
    external_id: activityId,
    name: act.name,
    type: act.type,
    distance_m: act.distance,
    duration_s: act.moving_time,
    elevation_m: act.total_elevation_gain,
    start_date: startDate,
    avg_hr: act.average_heartrate ? Math.round(act.average_heartrate) : null,
    max_hr: act.max_heartrate ? Math.round(act.max_heartrate) : null,
    avg_pace_s: avgPaceS,
    polyline: act.map?.summary_polyline ?? null,
  }, { onConflict: 'user_id,external_id' });

  // Also add to runs in sport module
  await admin.from('runs').upsert({
    user_id: tokens.user_id,
    date: startDate,
    distance_km: distKm,
    duration_s: act.moving_time,
    source: 'strava',
    external_id: String(activityId),
    name: act.name,
  }, { onConflict: 'user_id,external_id' }).select();

  return new Response('OK', { status: 200 });
});
