import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { emailSchema } from './schema';
import { AuthShell } from './AuthShell';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError('Podaj poprawny adres e-mail.');
      return;
    }
    setBusy(true);
    // Fire and forget; we never reveal whether the address exists.
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell title="Sprawdź skrzynkę" subtitle="Reset hasła">
        <div className="auth-banner ok">
          Jeśli konto z tym adresem istnieje, wysłaliśmy link do zresetowania hasła.
          Link wygasa po krótkim czasie.
        </div>
        <div className="auth-alt">
          <Link className="auth-link" to="/login">Wróć do logowania</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset hasła" subtitle="Wyślemy link na e-mail">
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">E-mail</label>
          <input id="email" className="auth-input" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <span className="auth-err">{error}</span>}
        </div>
        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? 'Wysyłanie…' : 'Wyślij link'}
        </button>
      </form>
      <div className="auth-alt">
        <Link className="auth-link" to="/login">Wróć do logowania</Link>
      </div>
    </AuthShell>
  );
}
