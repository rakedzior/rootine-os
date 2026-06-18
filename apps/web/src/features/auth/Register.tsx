import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { registerSchema, fieldErrors, passwordStrength, isPasswordPwned } from './schema';
import { AuthShell, PasswordMeter } from './AuthShell';
import { OAuthButtons } from './OAuthButtons';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pwnedWarn, setPwnedWarn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const strength = passwordStrength(password);

  const onPasswordBlur = async () => {
    if (password.length >= 12) {
      const pwned = await isPasswordPwned(password);
      setPwnedWarn(pwned === true);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = registerSchema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      setFormError('Nie udało się utworzyć konta. Spróbuj ponownie później.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Sprawdź skrzynkę" subtitle="Potwierdzenie e-mail">
        <div className="auth-banner ok">
          Wysłaliśmy link potwierdzający na <b>{email}</b>. Otwórz go, aby aktywować konto —
          dostęp do danych aplikacji wymaga potwierdzonego adresu e-mail.
        </div>
        <div className="auth-alt">
          <Link className="auth-link" to="/login">Wróć do logowania</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Załóż konto" subtitle="Zacznij z Rootine OS">
      {formError && <div className="auth-banner warn">{formError}</div>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">E-mail</label>
          <input id="email" className="auth-input" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <span className="auth-err">{errors.email}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="password">Hasło (min. 12 znaków)</label>
          <input id="password" className="auth-input" type="password" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} onBlur={onPasswordBlur} />
          {password && <PasswordMeter score={strength.score} label={strength.label} />}
          {errors.password && <span className="auth-err">{errors.password}</span>}
          {pwnedWarn && (
            <span className="auth-err">
              To hasło pojawiło się w znanych wyciekach — wybierz inne.
            </span>
          )}
        </div>
        <div className="auth-field">
          <label htmlFor="confirm">Powtórz hasło</label>
          <input id="confirm" className="auth-input" type="password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {errors.confirm && <span className="auth-err">{errors.confirm}</span>}
        </div>
        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? 'Tworzenie konta…' : 'Zarejestruj się'}
        </button>
      </form>

      <div className="auth-divider">lub</div>
      <OAuthButtons />

      <div className="auth-alt">
        Masz już konto? <Link className="auth-link" to="/login">Zaloguj się</Link>
      </div>
    </AuthShell>
  );
}
