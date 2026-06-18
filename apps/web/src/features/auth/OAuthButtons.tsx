import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Provider = 'google' | 'apple' | 'facebook';

const LABELS: Record<Provider, string> = {
  google: 'Kontynuuj z Google',
  apple: 'Kontynuuj z Apple',
  facebook: 'Kontynuuj z Facebookiem',
};

export function OAuthButtons() {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: Provider) => {
    setError(null);
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError('Nie udało się rozpocząć logowania. Spróbuj ponownie.');
      setBusy(null);
    }
    // On success the browser redirects to the provider.
  };

  return (
    <div className="oauth-row">
      {(['google', 'apple', 'facebook'] as Provider[]).map((p) => (
        <button
          key={p}
          type="button"
          className="oauth-btn"
          disabled={busy !== null}
          onClick={() => signIn(p)}
        >
          {LABELS[p]}
        </button>
      ))}
      {error && <div className="auth-err">{error}</div>}
    </div>
  );
}
