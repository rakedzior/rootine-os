import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';

function getOAuthError(params: URLSearchParams) {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    params.get('error_description') ??
    params.get('error') ??
    hash.get('error_description') ??
    hash.get('error')
  );
}

function getHashKeys() {
  return Array.from(new URLSearchParams(window.location.hash.replace(/^#/, '')).keys());
}

async function applySessionFromHash(): Promise<Session | null> {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  return data.session;
}

async function waitForSession(): Promise<Session | null> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 5000) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }

  return null;
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Finalizuje logowanie...');

  useEffect(() => {
    let active = true;
    let redirectTimer: number | undefined;

    async function finish() {
      try {
        const oauthError = getOAuthError(params);
        if (oauthError) {
          setMessage(oauthError);
          redirectTimer = window.setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        let session = window.location.hash ? await applySessionFromHash() : null;
        session ??= await waitForSession();
        if (!active) return;
        if (!session) {
          const marker = params.get('code') ? 'code' : window.location.hash ? `hash: ${getHashKeys().join(', ') || 'empty'}` : 'brak parametrow OAuth';
          setMessage(`Nie udalo sie potwierdzic logowania (${marker}).`);
          redirectTimer = window.setTimeout(() => navigate('/login', { replace: true }), 8000);
          return;
        }

        navigate('/', { replace: true });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : String(error);
        setMessage(`Blad callback OAuth: ${message}`);
        redirectTimer = window.setTimeout(() => navigate('/login', { replace: true }), 6000);
      }
    }

    void finish();

    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [navigate, params]);

  return (
    <AuthShell title="Logowanie" subtitle="Rootine OS">
      <div className="auth-banner ok">{message}</div>
    </AuthShell>
  );
}
