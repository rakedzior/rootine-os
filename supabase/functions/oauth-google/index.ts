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
  const state = url.searchParams.get('state'); // user_id passed as state
  const error = url.searchParams.get('error');

  if (error) {
    return Response.redirect(`${APP_URL}/settings/integrations?error=${error}`);
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
    };

    if (!tokens.access_token) {
      throw new Error('No access_token in Google response');
    }

    const userId = state;
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
    if (intErr) throw intErr;

    // Upsert token row
    const { error: tokErr } = await admin
      .from('integration_tokens')
      .upsert(
        { integration_id: intRow.id, user_id: userId,
          access_token_enc: accessEnc, refresh_token_enc: refreshEnc, expires_at: expiresAt },
        { onConflict: 'integration_id' },
      );
    if (tokErr) throw tokErr;

    // Log audit
    await admin.from('audit_log').insert({
      user_id: userId, action: 'integration_connect', entity: 'google_calendar', metadata: {},
    });

    return Response.redirect(`${APP_URL}/settings/integrations?success=google_calendar`);
  } catch (e) {
    console.error('oauth-google error', e);
    return Response.redirect(`${APP_URL}/settings/integrations?error=server`);
  }
});
