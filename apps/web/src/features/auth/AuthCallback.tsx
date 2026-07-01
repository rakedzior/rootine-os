import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';

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

    async function finish() {
      const oauthError = params.get('error_description') ?? params.get('error');
      if (oauthError) {
        setMessage(oauthError);
        window.setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setMessage('Nie udalo sie zapisac sesji. Sprobuj ponownie.');
          window.setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }
      }

      const session = await waitForSession();
      if (!active) return;
      if (!session) {
        setMessage('Nie udalo sie potwierdzic logowania. Sprobuj ponownie.');
        window.setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      navigate('/', { replace: true });
    }

    void finish();

    return () => {
      active = false;
    };
  }, [navigate, params]);

  return (
    <AuthShell title="Logowanie" subtitle="Rootine OS">
      <div className="auth-banner ok">{message}</div>
    </AuthShell>
  );
}
