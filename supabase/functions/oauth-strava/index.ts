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

async function encrypt(text: string): Promise<string> {
  const { data, error } = await admin.rpc('pgp_sym_encrypt_text_wrapper', { data: text, key: TOKEN_ENC_KEY });
  if (error || !data) return btoa(text);
  return data as string;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // user_id
  const error = url.searchParams.get('error');

  if (error) return Response.redirect(`${APP_URL}/settings/integrations?error=${error}`);
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
    };

    if (!tokens.access_token) throw new Error('No access_token');

    const userId = state;
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
    if (intErr) throw intErr;

    await admin
      .from('integration_tokens')
      .upsert(
        { integration_id: intRow.id, user_id: userId,
          access_token_enc: accessEnc, refresh_token_enc: refreshEnc, expires_at: expiresAt },
        { onConflict: 'integration_id' },
      );

    await admin.from('audit_log').insert({
      user_id: userId, action: 'integration_connect', entity: 'strava', metadata: {},
    });

    return Response.redirect(`${APP_URL}/settings/integrations?success=strava`);
  } catch (e) {
    console.error('oauth-strava error', e);
    return Response.redirect(`${APP_URL}/settings/integrations?error=server`);
  }
});
