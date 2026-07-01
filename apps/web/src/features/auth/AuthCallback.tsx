import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthShell } from './AuthShell';

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
      } else {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (!data.session) {
          setMessage('Nie udalo sie potwierdzic logowania. Sprobuj ponownie.');
          window.setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }
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
