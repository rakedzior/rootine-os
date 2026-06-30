import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const TOKEN_ENC_KEY = Deno.env.get('TOKEN_ENC_KEY') ?? '';
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/oauth-google`;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://rootine-os.netlify.app';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlText(text: string): string {
  return base64Url(new TextEncoder().encode(text));
}

function decodeBase64UrlText(value: string): string {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  return atob(padded);
}

async function sign(payload: string): Promise<string> {
  if (!TOKEN_ENC_KEY) throw new Error('TOKEN_ENC_KEY is required');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(TOKEN_ENC_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64Url(new Uint8Array(sig));
}

function safeReturnTo(returnTo?: string): string {
  const fallback = `${APP_URL}/settings/integrations`;
  try {
    const candidate = returnTo ?? fallback;
    const origin = new URL(candidate).origin;
    const appOrigin = new URL(APP_URL).origin;
    const allowed = origin === appOrigin || origin === 'http://127.0.0.1:5173' || origin === 'http://localhost:5173';
    return allowed ? candidate : fallback;
  } catch {
    return fallback;
  }
}

async function buildState(userId: string, returnTo?: string): Promise<string> {
  const payload = base64UrlText(JSON.stringify({
    userId,
    returnTo: safeReturnTo(returnTo),
    exp: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomUUID(),
  }));
  return `${payload}.${await sign(payload)}`;
}

async function parseState(rawState: string): Promise<{ userId: string; returnTo: string }> {
  const [payload, signature] = rawState.split('.');
  if (!payload || !signature || signature !== await sign(payload)) throw new Error('Invalid OAuth state');
  const parsed = JSON.parse(decodeBase64UrlText(payload)) as { userId?: string; returnTo?: string; exp?: number };
  if (!parsed.userId || !parsed.exp || parsed.exp < Date.now()) throw new Error('Expired OAuth state');
  return { userId: parsed.userId, returnTo: safeReturnTo(parsed.returnTo) };
}

async function currentUserId(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

async function encrypt(text: string): Promise<string> {
  const { data, error } = await admin.rpc('pgp_sym_encrypt_text_wrapper', {
    data: text,
    key: TOKEN_ENC_KEY,
  });
  if (error || !data) {
    console.error('oauth-google encryption failed', error);
    throw new Error('Token encryption failed');
  }
  return data as string;
}

function redirectWith(returnTo: string, key: 'success' | 'error', value: string): Response {
  const url = new URL(returnTo);
  url.searchParams.set(key, value);
  return Response.redirect(url.toString());
}

async function createAuthorizationUrl(req: Request): Promise<Response> {
  const userId = await currentUserId(req);
  if (!userId) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const body = await req.json().catch(() => ({})) as { returnTo?: string };
  const state = await buildState(userId, body.returnTo);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return Response.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, { headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'POST') return createAuthorizationUrl(req);

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  let parsedState: { userId: string; returnTo: string } | null = null;
  try {
    parsedState = state ? await parseState(state) : null;
  } catch (stateError) {
    console.error('oauth-google invalid state', stateError);
  }
  const returnTo = parsedState?.returnTo ?? `${APP_URL}/settings/integrations`;

  if (error) return redirectWith(returnTo, 'error', error);
  if (!code || !state || !parsedState) return new Response('Missing code or state', { status: 400 });

  try {
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

    const userId = parsedState.userId;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const accessEnc = await encrypt(tokens.access_token);
    const refreshEnc = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;

    const { data: intRow, error: intErr } = await admin
      .from('integrations')
      .upsert(
        { user_id: userId, provider: 'google_calendar', status: 'connected', scope: tokens.scope, connected_at: new Date().toISOString() },
        { onConflict: 'user_id,provider' },
      )
      .select('id')
      .single();
    if (intErr) {
      console.error('oauth-google integration upsert failed', intErr);
      return redirectWith(returnTo, 'error', 'database');
    }

    const { error: tokErr } = await admin
      .from('integration_tokens')
      .upsert(
        { integration_id: intRow.id, user_id: userId, access_token_enc: accessEnc, refresh_token_enc: refreshEnc, expires_at: expiresAt },
        { onConflict: 'integration_id' },
      );
    if (tokErr) {
      console.error('oauth-google token upsert failed', tokErr);
      return redirectWith(returnTo, 'error', 'database');
    }

    await admin.from('audit_log').insert({
      user_id: userId,
      action: 'integration_connect',
      entity: 'google_calendar',
      metadata: {},
    });

    return redirectWith(returnTo, 'success', 'google_calendar');
  } catch (e) {
    console.error('oauth-google error', e);
    return redirectWith(returnTo, 'error', 'server');
  }
});
