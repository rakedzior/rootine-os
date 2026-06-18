import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { loginSchema, fieldErrors } from './schema';
import { AuthShell } from './AuthShell';
import { OAuthButtons } from './OAuthButtons';

export function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      // Generic message — never reveal whether the email exists.
      setFormError('Nieprawidłowy e-mail lub hasło.');
      return;
    }
    await logAudit('login', { metadata: { method: 'password' } });
    nav('/');
  };

  return (
    <AuthShell title="Witaj ponownie" subtitle="Zaloguj się do Rootine OS">
      {formError && <div className="auth-banner warn">{formError}</div>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">E-mail</label>
          <input id="email" className="auth-input" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <span className="auth-err">{errors.email}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="password">Hasło</label>
          <input id="password" className="auth-input" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <span className="auth-err">{errors.password}</span>}
        </div>
        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>

      <div className="auth-alt">
        <Link className="auth-link" to="/forgot-password">Nie pamiętasz hasła?</Link>
      </div>

      <div className="auth-divider">lub</div>
      <OAuthButtons />

      <div className="auth-alt">
        Nie masz konta? <Link className="auth-link" to="/register">Zarejestruj się</Link>
      </div>
    </AuthShell>
  );
}
