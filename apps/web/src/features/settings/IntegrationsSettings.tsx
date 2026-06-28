import { useEffect } from 'react';
import { useIntegrations, useDisconnectIntegration } from '@/features/integrations/hooks';
import { logAudit } from '@/lib/audit';
import { toast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function buildOAuthState(userId: string): string {
  return btoa(JSON.stringify({
    userId,
    returnTo: `${window.location.origin}/settings/integrations`,
  }));
}

function buildGoogleOAuthUrl(userId: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) return '';
  const redirectUri = `${SUPABASE_URL}/functions/v1/oauth-google`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: buildOAuthState(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function buildStravaOAuthUrl(userId: string): string {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined;
  if (!clientId) return '';
  const redirectUri = `${SUPABASE_URL}/functions/v1/oauth-strava`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'force',
    scope: 'activity:read_all',
    state: buildOAuthState(userId),
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export function IntegrationsSettings() {
  const intQ = useIntegrations();
  const disconnect = useDisconnectIntegration();

  // Show success/error from OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    if (success) {
      toast.success(`Połączono: ${success === 'google_calendar' ? 'Google Calendar' : 'Strava'}`);
      window.history.replaceState({}, '', window.location.pathname);
      intQ.refetch();
    }
    if (error) {
      toast.error(`Błąd połączenia: ${error}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const gcal = intQ.data?.find((i) => i.provider === 'google_calendar');
  const strava = intQ.data?.find((i) => i.provider === 'strava');

  async function handleConnect(provider: 'google_calendar' | 'strava') {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    const url = provider === 'google_calendar' ? buildGoogleOAuthUrl(userId) : buildStravaOAuthUrl(userId);
    if (!url) {
      toast.error(
        provider === 'google_calendar'
          ? 'Ustaw VITE_GOOGLE_CLIENT_ID w .env'
          : 'Ustaw VITE_STRAVA_CLIENT_ID w .env',
      );
      return;
    }
    window.location.href = url;
  }

  async function handleDisconnect(provider: 'google_calendar' | 'strava') {
    await disconnect.mutateAsync(provider);
    await logAudit('integration_disconnect', { entity: provider });
    toast.success('Rozłączono');
  }

  const integrations: { provider: 'google_calendar' | 'strava'; label: string; icon: string; desc: string }[] = [
    {
      provider: 'google_calendar',
      label: 'Google Calendar',
      icon: '📅',
      desc: 'Synchronizuje wydarzenia kalendarza z widokiem na Start.',
    },
    {
      provider: 'strava',
      label: 'Strava',
      icon: '🏃',
      desc: 'Importuje aktywności (biegi, rowery) do modułu Sport.',
    },
  ];

  return (
    <>
      {integrations.map(({ provider, label, icon, desc }) => {
        const int = provider === 'google_calendar' ? gcal : strava;
        const connected = int?.status === 'connected';
        return (
          <article key={provider} className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <div className="lhs">
                <span style={{ fontSize: 20, marginRight: 8 }}>{icon}</span>
                <span className="card-title">{label}</span>
              </div>
              <span className="pill" style={{
                background: connected ? 'var(--acc-a-soft)' : 'var(--surface-inset)',
                color: connected ? 'var(--acc-a-ink)' : 'var(--ink-3)',
              }}>
                {connected ? 'Połączono' : 'Rozłączono'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>{desc}</p>
            {connected && int?.connected_at && (
              <p style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', margin: '0 0 12px' }}>
                Połączono: {new Date(int.connected_at).toLocaleDateString('pl-PL')}
              </p>
            )}
            {connected ? (
              <button
                type="button"
                onClick={() => handleDisconnect(provider)}
                disabled={disconnect.isPending}
                className="btn-ghost"
              >
                Rozłącz
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConnect(provider)}
                className="btn-primary"
              >
                Połącz
              </button>
            )}
          </article>
        );
      })}

      <article className="card" style={{ background: 'var(--surface-inset)' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink-2)' }}>Konfiguracja (jednorazowo):</strong>
          <ol style={{ paddingLeft: 18, margin: '8px 0 0' }}>
            <li>Google: utwórz projekt w Google Cloud Console → włącz Calendar API → utwórz OAuth 2.0 Client ID → dodaj <code>VITE_GOOGLE_CLIENT_ID</code> do Netlify env</li>
            <li>Strava: utwórz aplikację na strava.com/settings/api → dodaj <code>VITE_STRAVA_CLIENT_ID</code></li>
            <li>W Supabase Secrets: <code>GOOGLE_CLIENT_SECRET</code>, <code>STRAVA_CLIENT_SECRET</code>, <code>TOKEN_ENC_KEY</code>, <code>APP_URL</code></li>
            <li>Deploy Edge Functions: <code>supabase functions deploy --no-verify-jwt</code></li>
          </ol>
        </div>
      </article>
    </>
  );
}
