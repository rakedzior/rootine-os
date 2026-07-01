import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { setTheme, getCurrentTheme, setAccentColor, getCurrentAccentColor, type AccentColor, type Theme } from '@/lib/theme';
import { logAudit } from '@/lib/audit';
import { toast } from '@/lib/toast';
import { useMfaStepUp } from '@/features/auth/useMfaStepUp';

type AppearancePreset = {
  id: 'dark-emerald' | 'dark-blue' | 'light-emerald' | 'light-ice' | 'white-lotus';
  label: string;
  theme: Theme;
  accent: AccentColor;
  swatch: string;
};

const APPEARANCE_PRESETS: AppearancePreset[] = [
  { id: 'dark-emerald', label: 'Dark Emerald', theme: 'dark', accent: 'emerald', swatch: 'linear-gradient(135deg, #181d1f 0 58%, #4bae88 58%)' },
  { id: 'dark-blue', label: 'Dark Blue', theme: 'dark', accent: 'cool-ice', swatch: 'linear-gradient(135deg, #181d1f 0 58%, #76b7ff 58%)' },
  { id: 'light-emerald', label: 'Light Emerald', theme: 'light', accent: 'emerald', swatch: 'linear-gradient(135deg, #fdfcfa 0 58%, #2f9e73 58%)' },
  { id: 'light-ice', label: 'Light Ice', theme: 'light', accent: 'cool-ice', swatch: 'linear-gradient(135deg, #fdfcfa 0 58%, #3f82bd 58%)' },
  { id: 'white-lotus', label: 'White Lotus', theme: 'lotus', accent: 'emerald', swatch: 'linear-gradient(135deg, #faf6ef 0 58%, #7a9b6e 58%)' },
];

export function AccountSettings() {
  const { ensureMfa, mfaStepUpModal } = useMfaStepUp();
  const [theme, setThemeState] = useState<Theme>(getCurrentTheme);
  const [accent, setAccentState] = useState<AccentColor>(getCurrentAccentColor);
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

  const activePreset: AppearancePreset['id'] = theme === 'lotus'
    ? 'white-lotus'
    : theme === 'light'
      ? (accent === 'cool-ice' ? 'light-ice' : 'light-emerald')
      : (accent === 'cool-ice' ? 'dark-blue' : 'dark-emerald');

  function pickAppearance(preset: AppearancePreset) {
    setThemeState(preset.theme);
    setAccentState(preset.accent);
    setTheme(preset.theme);
    setAccentColor(preset.accent);
  }


  async function handleExport() {
    if (!(await ensureMfa())) return;
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
    if (!(await ensureMfa())) return;
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
      {/* Theme / accent */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="lhs"><span className="card-title">Motyw i kolor akcentu</span></div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px' }}>
          Wybierz paletę aplikacji. Ustawienie jest zapisywane na koncie i synchronizowane między urządzeniami.
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '-6px 0 14px' }}>
          Kolor akcentu jest zapisywany lokalnie w tej przeglądarce.
        </p>
        <div className="settings-choice-block">
          <span className="settings-choice-label">Preset</span>
          <div className="settings-choice-grid">
            {APPEARANCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => pickAppearance(preset)}
                className={activePreset === preset.id ? 'theme-card active' : 'theme-card'}
              >
                <span className="theme-swatch" style={{ background: preset.swatch }} />
                <span>{preset.label}</span>
                {activePreset === preset.id && (
                  <svg style={{ marginLeft: 'auto', width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </button>
            ))}
          </div>
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
      {mfaStepUpModal}
    </>
    );
}
