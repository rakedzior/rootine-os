import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { setTheme, getCurrentTheme, type Theme } from '@/lib/theme';
import { logAudit } from '@/lib/audit';
import { toast } from '@/lib/toast';

export function AccountSettings() {
  const [theme, setThemeState] = useState<Theme>(getCurrentTheme);
  const [email, setEmail] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'white-lotus' : 'dark';
    setThemeState(next);
    await setTheme(next);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Brak sesji');
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-export`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rootine-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Eksport pobrany');
    } catch (e) {
      toast.error('Błąd eksportu');
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'USUŃ KONTO') {
      toast.error('Wpisz poprawne potwierdzenie');
      return;
    }
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Brak sesji');
      await logAudit('account_delete');
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT' }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await supabase.auth.signOut();
    } catch (e) {
      toast.error('Błąd usuwania konta');
      console.error(e);
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Theme */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="lhs"><span className="card-title">Wygląd</span></div>
        </div>
        <div style={{ padding: '4px 0 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Motyw</span>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface-inset)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)',
              letterSpacing: '.05em', textTransform: 'uppercase',
            }}
          >
            <span style={{ fontSize: 15 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Jasny' : 'Ciemny'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Aktualnie: {theme === 'dark' ? 'ciemny' : 'jasny'}
          </span>
        </div>
      </article>

      {/* Account info */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="lhs"><span className="card-title">Konto</span></div>
        </div>
        <div style={{ padding: '4px 0 8px', fontSize: 13, color: 'var(--ink-2)' }}>
          <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>E-MAIL</span>
          <div style={{ marginTop: 4, fontWeight: 500 }}>{email || '—'}</div>
        </div>
      </article>

      {/* Export */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="lhs"><span className="card-title">Eksport danych</span></div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>
          Pobierz wszystkie swoje dane jako plik JSON (RODO — prawo do przenoszenia danych).
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary"
        >
          {exporting ? 'Eksportowanie…' : 'Pobierz moje dane'}
        </button>
      </article>

      {/* Delete account */}
      <article className="card" style={{ border: '1px solid var(--acc-b-soft)' }}>
        <div className="card-head">
          <div className="lhs"><span className="card-title" style={{ color: 'var(--acc-b-ink)' }}>Usuń konto</span></div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>
          Trwale usuwa wszystkie Twoje dane i konto. Tej operacji nie można cofnąć.
        </p>
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            style={{
              background: 'none', border: '1px solid var(--acc-b)',
              borderRadius: 'var(--r-sm)', padding: '7px 14px',
              color: 'var(--acc-b-ink)', fontSize: 12, fontFamily: 'var(--mono)',
              cursor: 'pointer', letterSpacing: '.05em', textTransform: 'uppercase',
            }}
          >
            Usuń konto
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--acc-b-ink)', margin: 0 }}>
              Wpisz <strong>USUŃ KONTO</strong> aby potwierdzić:
            </p>
            <input
              className="fi"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="USUŃ KONTO"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== 'USUŃ KONTO'}
                style={{
                  background: 'var(--acc-b)', border: 'none', borderRadius: 'var(--r-sm)',
                  padding: '7px 14px', color: '#fff', fontSize: 12, fontFamily: 'var(--mono)',
                  cursor: 'pointer', opacity: deleteConfirm !== 'USUŃ KONTO' ? 0.4 : 1,
                  letterSpacing: '.05em', textTransform: 'uppercase',
                }}
              >
                {deleting ? 'Usuwanie…' : 'Potwierdź usunięcie'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                className="btn-ghost"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </article>
    </>
    );
}
