/**
 * oauth-strava — Strava OAuth callback
 *
 * Setup (user must do at strava.com/settings/api):
 *   1. Create Strava API Application
 *   2. Authorization Callback Domain: <project>.supabase.co
 *   3. In Supabase secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, TOKEN_ENC_KEY, APP_URL
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID') ?? '';
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET') ?? '';
const TOKEN_ENC_KEY = Deno.env.get('TOKEN_ENC_KEY') ?? 'change-me-in-secrets';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://rootine-os.netlify.app';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseState(rawState: string): { userId: string; returnTo: string } {
  try {
    const parsed = JSON.parse(atob(rawState)) as { userId?: string; returnTo?: string };
    if (!parsed.userId) throw new Error('Missing userId');

    const fallback = `${APP_URL}/settings/integrations`;
    const returnTo = parsed.returnTo ?? fallback;
    const origin = new URL(returnTo).origin;
    const appOrigin = new URL(APP_URL).origin;
    const allowed =
      origin === appOrigin ||
      origin === 'http://127.0.0.1:5173' ||
      origin === 'http://localhost:5173';

    return { userId: parsed.userId, returnTo: allowed ? returnTo : fallback };
  } catch {
    return { userId: rawState, returnTo: `${APP_URL}/settings/integrations` };
  }
}

function redirectWith(returnTo: string, key: 'success' | 'error', value: string): Response {
  const url = new URL(returnTo);
  url.searchParams.set(key, value);
  return Response.redirect(url.toString());
}

async function encrypt(text: string): Promise<string> {
  const { data, error } = await admin.rpc('pgp_sym_encrypt_text_wrapper', { data: text, key: TOKEN_ENC_KEY });
  if (error || !data) return btoa(text);
  return data as string;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // encoded { userId, returnTo }; legacy user_id supported
  const error = url.searchParams.get('error');
  const parsedState = state ? parseState(state) : null;
  const returnTo = parsedState?.returnTo ?? `${APP_URL}/settings/integrations`;

  if (error) return redirectWith(returnTo, 'error', error);
  if (!code || !state) return new Response('Missing params', { status: 400 });

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_at: number; // unix timestamp
      athlete: { id: number };
      message?: string;
      errors?: unknown;
    };

    if (!tokenRes.ok || !tokens.access_token) {
      console.error('oauth-strava token exchange failed', tokenRes.status, tokens.message, tokens.errors);
      return redirectWith(returnTo, 'error', 'token');
    }

    const userId = parsedState?.userId ?? state;
    const accessEnc = await encrypt(tokens.access_token);
    const refreshEnc = await encrypt(tokens.refresh_token);
    const expiresAt = new Date(tokens.expires_at * 1000).toISOString();

    const { data: intRow, error: intErr } = await admin
      .from('integrations')
      .upsert(
        { user_id: userId, provider: 'strava', status: 'connected',
          scope: 'activity:read_all', connected_at: new Date().toISOString() },
        { onConflict: 'user_id,provider' },
      )
      .select('id')
      .single();
    if (intErr) {
      console.error('oauth-strava integration upsert failed', intErr);
      return redirectWith(returnTo, 'error', 'database');
    }

    const { error: tokErr } = await admin
      .from('integration_tokens')
      .upsert(
        { integration_id: intRow.id, user_id: userId,
          access_token_enc: accessEnc, refresh_token_enc: refreshEnc, expires_at: expiresAt },
        { onConflict: 'integration_id' },
      );
    if (tokErr) {
      console.error('oauth-strava token upsert failed', tokErr);
      return redirectWith(returnTo, 'error', 'database');
    }

    await admin.from('audit_log').insert({
      user_id: userId, action: 'integration_connect', entity: 'strava', metadata: {},
    });

    return redirectWith(returnTo, 'success', 'strava');
  } catch (e) {
    console.error('oauth-strava error', e);
    return redirectWith(returnTo, 'error', 'server');
  }
});
