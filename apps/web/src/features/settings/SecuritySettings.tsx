import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/features/auth/AuthProvider';
import { newPasswordSchema, fieldErrors, passwordStrength } from '@/features/auth/schema';
import { PasswordMeter } from '@/features/auth/AuthShell';
import { MfaSettings } from './MfaSettings';

export function SecuritySettings() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const parsed = newPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setBusy(false);
    if (error) {
      setStatus({ kind: 'warn', text: 'Nie udało się zmienić hasła.' });
      return;
    }
    await logAudit('password_change', { metadata: { via: 'settings' } });
    setPassword('');
    setConfirm('');
    setStatus({ kind: 'ok', text: 'Hasło zostało zmienione.' });
  };

  const signOut = async () => {
    await logAudit('logout');
    await supabase.auth.signOut();
    nav('/login');
  };

  return (
    <>
      <article className="card">
        <div className="card-head">
          <div className="lhs"><span className="card-title">Konto</span></div>
        </div>
        <div className="note-peek">Zalogowano jako {session?.user.email}</div>
        <div className="hydro-actions" style={{ marginTop: 14 }}>
          <button className="he-btn ghost" type="button" onClick={signOut}>Wyloguj się</button>
        </div>
      </article>

      <article className="card">
        <div className="card-head">
          <div className="lhs"><span className="card-title">Zmiana hasła</span></div>
        </div>
        {status && <div className={`auth-banner ${status.kind}`}>{status.text}</div>}
        <form className="auth-form" onSubmit={changePassword} noValidate>
          <div className="auth-field">
            <label htmlFor="np">Nowe hasło (min. 12 znaków)</label>
            <input id="np" className="auth-input" type="password" autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {password && <PasswordMeter score={strength.score} label={strength.label} />}
            {errors.password && <span className="auth-err">{errors.password}</span>}
          </div>
          <div className="auth-field">
            <label htmlFor="nc">Powtórz hasło</label>
            <input id="nc" className="auth-input" type="password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {errors.confirm && <span className="auth-err">{errors.confirm}</span>}
          </div>
          <button className="auth-btn" type="submit" disabled={busy} style={{ maxWidth: 220 }}>
            {busy ? 'Zapisywanie…' : 'Zmień hasło'}
          </button>
        </form>
      </article>

      <MfaSettings />
    </>
  );
}
