import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';
import { newPasswordSchema, fieldErrors, passwordStrength } from './schema';
import { AuthShell, PasswordMeter } from './AuthShell';

/** Reached via the recovery link, which establishes a temporary session.
 *  Supabase's detectSessionInUrl handles the token exchange. */
export function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
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
      setFormError('Link wygasł lub jest nieprawidłowy. Poproś o nowy.');
      return;
    }
    await logAudit('password_change', { metadata: { via: 'reset' } });
    nav('/');
  };

  return (
    <AuthShell title="Nowe hasło" subtitle="Ustaw bezpieczne hasło">
      {formError && <div className="auth-banner warn">{formError}</div>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-field">
          <label htmlFor="password">Nowe hasło (min. 12 znaków)</label>
          <input id="password" className="auth-input" type="password" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {password && <PasswordMeter score={strength.score} label={strength.label} />}
          {errors.password && <span className="auth-err">{errors.password}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="confirm">Powtórz hasło</label>
          <input id="confirm" className="auth-input" type="password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {errors.confirm && <span className="auth-err">{errors.confirm}</span>}
        </div>
        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? 'Zapisywanie…' : 'Zapisz hasło'}
        </button>
      </form>
    </AuthShell>
  );
}
