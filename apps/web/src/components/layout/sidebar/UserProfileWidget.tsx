import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/config/useProfile';
import { Icon } from './icons';

/** Avatar + name. Collapses to avatar only. Opens a small account menu upward. */
export function UserProfileWidget({ expanded }: { expanded: boolean }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const email = session?.user?.email ?? '';
  const name = profile?.display_name?.trim() || email.split('@')[0] || 'Użytkownik';
  const initial = (name[0] ?? 'U').toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }
  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
  }

  return (
    <div className="sb-profile-wrap" ref={ref}>
      <button
        type="button"
        className="sb-profile"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={expanded ? undefined : name}
      >
        <span className="sb-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initial}</span>
        <span className="sb-profile-id">
          <strong>{name}</strong>
          <small>{email}</small>
        </span>
        {!expanded && <span className="sb-tooltip" role="tooltip">{name}</span>}
      </button>

      {open && (
        <div className="sb-profile-menu" role="menu">
          <button role="menuitem" onClick={() => go('/settings/profile')}>Profil użytkownika</button>
          <button role="menuitem" onClick={() => go('/settings')}>Ustawienia</button>
          <button role="menuitem" onClick={() => go('/settings/integrations')}>Integracje</button>
          <div className="sb-profile-menu-foot">
            <button role="menuitem" className="danger" onClick={signOut}><Icon name="logout" size={15} /> Wyloguj</button>
          </div>
        </div>
      )}
    </div>
  );
}
