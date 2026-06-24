import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile, useUpdateProfile, usePreferences, useUpdatePreferences } from '@/features/config/useProfile';

const COMMON_TZ = [
  'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Athens', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo',
  'Asia/Dubai', 'Australia/Sydney', 'UTC',
];

const LOCALES = [
  { id: 'pl', label: 'Polski' },
  { id: 'en', label: 'English' },
];

export function ProfileSettings() {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: prefs } = usePreferences();
  const updateProfile = useUpdateProfile();
  const updatePrefs = useUpdatePreferences();

  const detectedTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const tzOptions = useMemo(
    () => Array.from(new Set([detectedTz, ...COMMON_TZ])).filter(Boolean),
    [detectedTz],
  );

  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('pl');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setFirstName(profile.first_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
      setCity(profile.default_city ?? '');
      setTimezone(profile.timezone ?? detectedTz);
    }
  }, [profile, detectedTz]);

  useEffect(() => { if (prefs?.locale) setLocale(prefs.locale); }, [prefs]);
  useEffect(() => { if (session?.user?.email) setEmail(session.user.email); }, [session]);

  const initial = (displayName.trim()[0] ?? email[0] ?? 'U').toUpperCase();

  async function saveProfile() {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        default_city: city.trim() || null,
        timezone: timezone || null,
      });
      await updatePrefs.mutateAsync({ locale });
      toast.success('Profil zapisany');
    } catch {
      toast.error('Nie udało się zapisać profilu');
    }
  }

  async function changeEmail() {
    const next = email.trim();
    if (!next || next === session?.user?.email) return;
    const { error } = await supabase.auth.updateUser({ email: next });
    if (error) { toast.error('Nie udało się zmienić e-maila'); return; }
    toast.success('Wysłano link potwierdzający na nowy adres');
  }

  return (
    <>
      {/* Identity */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div className="lhs"><span className="card-title">Tożsamość</span></div></div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <span className="avatar avatar-lg" style={{ width: 64, height: 64, fontSize: 22, borderRadius: 'var(--r-card)' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initial}
          </span>
          <div style={{ flex: 1, minWidth: 240, display: 'grid', gap: 12 }}>
            <div className="field">
              <label>Avatar (URL zdjęcia)</label>
              <input className="input" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Nick / nazwa</label>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="np. raked" />
              </div>
              <div className="field">
                <label>Imię</label>
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="np. Rafał" />
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Localization */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div className="lhs"><span className="card-title">Lokalizacja i język</span></div></div>
        <div className="form-grid">
          <div className="field">
            <label>Domyślna miejscowość</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="np. Warszawa" />
          </div>
          <div className="field">
            <label>Strefa czasowa</label>
            <select className="select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {tzOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Język aplikacji</label>
            <select className="select" value={locale} onChange={(e) => setLocale(e.target.value)}>
              {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={saveProfile} disabled={updateProfile.isPending || updatePrefs.isPending}>
            {updateProfile.isPending ? 'Zapisywanie…' : 'Zapisz profil'}
          </button>
        </div>
      </article>

      {/* Email */}
      <article className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div className="lhs"><span className="card-title">Adres e-mail</span></div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label>E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={changeEmail} disabled={email.trim() === session?.user?.email}>Zmień e-mail</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '10px 0 0' }}>
          Zmiana e-maila wymaga potwierdzenia linkiem wysłanym na nowy adres.
        </p>
      </article>

      {/* Password (separate secure action) */}
      <article className="card">
        <div className="card-head"><div className="lhs"><span className="card-title">Hasło</span></div></div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>
          Zmiana hasła to osobna, bezpieczna akcja w sekcji Bezpieczeństwo.
        </p>
        <Link className="btn btn-secondary" to="/settings/security">Zmień hasło</Link>
      </article>
    </>
  );
}
