/**
 * oauth-google — Google Calendar OAuth callback
 *
 * Setup (user must do in Google Cloud Console):
 *   1. Enable Google Calendar API
 *   2. Create OAuth 2.0 Client ID (Web application)
 *   3. Authorized redirect URI: https://<project>.supabase.co/functions/v1/oauth-google
 *   4. In Supabase: Settings → Edge Functions → Secrets:
 *      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TOKEN_ENC_KEY (random 32-char string)
 *
 * Flow:
 *   Front-end redirects user to Google OAuth URL (built by the front-end).
 *   Google redirects back here with ?code=... → exchange for tokens → store encrypted.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const TOKEN_ENC_KEY = Deno.env.get('TOKEN_ENC_KEY') ?? 'change-me-in-secrets';
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/oauth-google`;
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
  const { data, error } = await admin.rpc('pgp_sym_encrypt_text_wrapper', {
    data: text,
    key: TOKEN_ENC_KEY,
  });
  if (error || !data) return btoa(text); // fallback: base64 (not secure — replace with Vault)
  return data as string;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // encoded { userId, returnTo }; legacy user_id supported
  const error = url.searchParams.get('error');
  const parsedState = state ? parseState(state) : null;
  const returnTo = parsedState?.returnTo ?? `${APP_URL}/settings/integrations`;

  if (error) {
    return redirectWith(returnTo, 'error', error);
  }

  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokens.access_token) {
      console.error('oauth-google token exchange failed', tokenRes.status, tokens.error, tokens.error_description);
      return redirectWith(returnTo, 'error', 'token');
    }

    const userId = parsedState?.userId ?? state;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const accessEnc = await encrypt(tokens.access_token);
    const refreshEnc = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;

    // Upsert integration row
    const { data: intRow, error: intErr } = await admin
      .from('integrations')
      .upsert(
        { user_id: userId, provider: 'google_calendar', status: 'connected',
          scope: tokens.scope, connected_at: new Date().toISOString() },
        { onConflict: 'user_id,provider' },
      )
      .select('id')
      .single();
    if (intErr) {
      console.error('oauth-google integration upsert failed', intErr);
      return redirectWith(returnTo, 'error', 'database');
    }

    // Upsert token row
    const { error: tokErr } = await admin
      .from('integration_tokens')
      .upsert(
        { integration_id: intRow.id, user_id: userId,
          access_token_enc: accessEnc, refresh_token_enc: refreshEnc, expires_at: expiresAt },
        { onConflict: 'integration_id' },
      );
    if (tokErr) {
      console.error('oauth-google token upsert failed', tokErr);
      return redirectWith(returnTo, 'error', 'database');
    }

    // Log audit
    await admin.from('audit_log').insert({
      user_id: userId, action: 'integration_connect', entity: 'google_calendar', metadata: {},
    });

    return redirectWith(returnTo, 'success', 'google_calendar');
  } catch (e) {
    console.error('oauth-google error', e);
    return redirectWith(returnTo, 'error', 'server');
  }
});
