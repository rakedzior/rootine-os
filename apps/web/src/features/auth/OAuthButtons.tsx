import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function OAuthButtons() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError('Nie udało się rozpocząć logowania. Spróbuj ponownie.');
      setBusy(false);
    }
  };

  return (
    <div className="oauth-row">
      <button
        type="button"
        className="oauth-btn"
        disabled={busy}
        onClick={signIn}
      >
        Kontynuuj z Google
      </button>
      {error && <div className="auth-err">{error}</div>}
    </div>
  );
}
