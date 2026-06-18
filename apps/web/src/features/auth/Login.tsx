import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { loginSchema, fieldErrors } from './schema';
import { needsMfaStepUp, getVerifiedTotpFactorId, verifyTotpCode } from './mfa';
import { AuthShell } from './AuthShell';
import { OAuthButtons } from './OAuthButtons';

export function Login() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<'password' | 'mfa'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // MFA step-up
  const [factorId, setFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);

  const finishLogin = async (method: string) => {
    await logAudit('login', { metadata: { method } });
    nav('/');
  };

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
    if (error) {
      setBusy(false);
      setFormError('Nieprawidłowy e-mail lub hasło.');
      return;
    }
    if (await needsMfaStepUp()) {
      const fid = await getVerifiedTotpFactorId();
      setBusy(false);
      if (fid) {
        setFactorId(fid);
        setPhase('mfa');
        return;
      }
    }
    setBusy(false);
    await finishLogin('password');
  };

  const submitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setMfaError(null);
    setBusy(true);
    const { error } = await verifyTotpCode(factorId, mfaCode.trim());
    setBusy(false);
    if (error) {
      setMfaError('Nieprawidłowy kod. Spróbuj ponownie.');
      return;
    }
    await finishLogin('password+totp');
  };

  if (phase === 'mfa') {
    return (
      <AuthShell title="Weryfikacja dwuetapowa" subtitle="Wpisz kod z aplikacji">
        {mfaError && <div className="auth-banner warn">{mfaError}</div>}
        <form className="auth-form" onSubmit={submitMfa} noValidate>
          <div className="auth-field">
            <label htmlFor="otp">Kod TOTP</label>
            <input id="otp" className="auth-input mono" inputMode="numeric" autoComplete="one-time-code"
              value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="000000" autoFocus />
          </div>
          <button className="auth-btn" type="submit" disabled={busy}>
            {busy ? 'Weryfikacja…' : 'Potwierdź'}
          </button>
        </form>
      </AuthShell>
    );
  }

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
