import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

async function waitForSession() {
  const existing = await supabase.auth.getSession();
  if (existing.data.session) return existing.data.session;

  return new Promise((resolve) => {
    let done = false;
    const finish = (session: unknown) => {
      if (done) return;
      done = true;
      sub.data.subscription.unsubscribe();
      window.clearTimeout(timeout);
      resolve(session);
    };

    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session);
    });

    const timeout = window.setTimeout(async () => {
      const latest = await supabase.auth.getSession();
      finish(latest.data.session);
    }, 4000);
  });
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Finalizuje logowanie...');

  useEffect(() => {
    let active = true;
    let redirectTimer: number | undefined;

    async function finish() {
      const oauthError = getOAuthError(params);
      if (oauthError) {
        setMessage(oauthError);
        redirectTimer = window.setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      const session = await waitForSession();
      if (!active) return;
      if (!session) {
        const marker = params.get('code') ? 'code' : window.location.hash ? 'hash' : 'brak parametrow OAuth';
        setMessage(`Nie udalo sie potwierdzic logowania (${marker}). Sprawdz konfiguracje Supabase Redirect URLs.`);
        redirectTimer = window.setTimeout(() => navigate('/login', { replace: true }), 6000);
        return;
      }

      navigate('/', { replace: true });
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
