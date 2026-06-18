import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { AuthShell } from './AuthShell';

/** Shown when a session exists but the email isn't confirmed yet. */
export function ConfirmEmail() {
  const nav = useNavigate();
  const { session } = useAuth();
  const email = session?.user.email ?? '';
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setBusy(false);
    setMsg(error ? 'Nie udało się wysłać. Spróbuj za chwilę.' : 'Wysłano nowy link potwierdzający.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav('/login');
  };

  return (
    <AuthShell title="Potwierdź e-mail" subtitle="Wymagane przed dostępem">
      <div className="auth-banner warn">
        Twój adres <b>{email}</b> nie jest jeszcze potwierdzony. Otwórz link z wiadomości,
        aby uzyskać dostęp do danych aplikacji.
      </div>
      {msg && <div className="auth-banner ok">{msg}</div>}
      <button className="auth-btn" type="button" onClick={resend} disabled={busy}>
        {busy ? 'Wysyłanie…' : 'Wyślij link ponownie'}
      </button>
      <div className="auth-alt">
        <button className="auth-link" type="button" onClick={signOut}>Wyloguj się</button>
      </div>
    </AuthShell>
  );
}
