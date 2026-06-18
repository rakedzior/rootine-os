import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { verifyTotpCode } from '@/features/auth/mfa';

interface Enrollment {
  factorId: string;
  qr: string;
  secret: string;
}

export function MfaSettings() {
  const [hasVerified, setHasVerified] = useState<boolean | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setHasVerified(Boolean(data?.totp?.some((f) => f.status === 'verified')));
  };

  useEffect(() => {
    void refresh();
  }, []);

  const startEnroll = async () => {
    setStatus(null);
    setBusy(true);
    // Clear any stale unverified factor so a retry doesn't hit a duplicate name.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.totp ?? []) {
      if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Rootine OS',
    });
    setBusy(false);
    if (error || !data) {
      setStatus({ kind: 'warn', text: 'Nie udało się rozpocząć konfiguracji MFA.' });
      return;
    }
    setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    setStatus(null);
    setBusy(true);
    const { error } = await verifyTotpCode(enrollment.factorId, code.trim());
    setBusy(false);
    if (error) {
      setStatus({ kind: 'warn', text: 'Nieprawidłowy kod. Spróbuj ponownie.' });
      return;
    }
    setEnrollment(null);
    setCode('');
    setStatus({ kind: 'ok', text: 'MFA zostało włączone.' });
    await refresh();
  };

  const cancelEnroll = async () => {
    if (enrollment) await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    setEnrollment(null);
    setCode('');
    setStatus(null);
  };

  const disableMfa = async () => {
    setBusy(true);
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setBusy(false);
    setStatus({ kind: 'ok', text: 'MFA zostało wyłączone.' });
    await refresh();
  };

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Weryfikacja dwuetapowa (MFA)</span></div>
        {hasVerified !== null && (
          <span className={`pill${hasVerified ? ' accent' : ''}`}>
            {hasVerified ? 'Aktywne' : 'Wyłączone'}
          </span>
        )}
      </div>

      {status && <div className={`auth-banner ${status.kind}`}>{status.text}</div>}

      {/* Enrollment in progress */}
      {enrollment ? (
        <div>
          <div className="note-peek" style={{ marginBottom: 12 }}>
            Zeskanuj kod w aplikacji TOTP (Google Authenticator, Authy, 1Password), potem wpisz 6-cyfrowy kod.
          </div>
          <img
            src={enrollment.qr}
            alt="Kod QR MFA"
            width={180}
            height={180}
            style={{ background: '#fff', borderRadius: 12, padding: 8, border: '1px solid var(--border)' }}
          />
          <div className="diet-hint" style={{ marginTop: 10 }}>
            Klucz ręczny: <span className="mono">{enrollment.secret}</span>
          </div>
          <form className="auth-form" onSubmit={activate} style={{ marginTop: 12 }}>
            <div className="auth-field">
              <label htmlFor="mfacode">Kod z aplikacji</label>
              <input id="mfacode" className="auth-input mono" inputMode="numeric" autoComplete="one-time-code"
                value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" />
            </div>
            <div className="hydro-actions">
              <button className="auth-btn" type="submit" disabled={busy} style={{ maxWidth: 200 }}>
                {busy ? 'Weryfikacja…' : 'Potwierdź i włącz'}
              </button>
              <button className="he-btn ghost" type="button" onClick={cancelEnroll}>Anuluj</button>
            </div>
          </form>
        </div>
      ) : hasVerified ? (
        <div>
          <div className="note-peek">MFA jest włączone. Przy logowaniu poprosimy o kod z aplikacji.</div>
          <div className="hydro-actions" style={{ marginTop: 14 }}>
            <button className="he-btn ghost" type="button" onClick={disableMfa} disabled={busy}>
              Wyłącz MFA
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="note-peek">
            Dodaj drugą warstwę zabezpieczenia kodem TOTP (Google Authenticator / Authy / 1Password).
          </div>
          <div className="hydro-actions" style={{ marginTop: 14 }}>
            <button className="auth-btn" type="button" onClick={startEnroll} disabled={busy} style={{ maxWidth: 200 }}>
              {busy ? 'Przygotowywanie…' : 'Włącz MFA'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
