import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const email = session?.user?.email ?? '';
  const name = profile?.display_name?.trim() || email.split('@')[0] || 'Użytkownik';
  const initial = (name[0] ?? 'U').toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  function toggle() {
    // Anchor the menu with fixed positioning from the trigger's rect so it
    // escapes the sidebar's `overflow: hidden` (which was clipping it in half).
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const menuW = 220;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - menuW - 8));
      setPos({ left, bottom: window.innerHeight - r.top + 8 });
    }
    setOpen((v) => !v);
  }

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }
  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
  }

  return (
    <div className="sb-profile-wrap" ref={wrapRef}>
      <button
        type="button"
        className="sb-profile"
        onClick={toggle}
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

      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="sb-profile-menu is-portal"
          role="menu"
          style={{ position: 'fixed', left: pos.left, bottom: pos.bottom }}
        >
          <button role="menuitem" onClick={() => go('/settings/profile')}>Profil użytkownika</button>
          <button role="menuitem" onClick={() => go('/settings')}>Ustawienia</button>
          <button role="menuitem" onClick={() => go('/settings/integrations')}>Integracje</button>
          <div className="sb-profile-menu-foot">
            <button role="menuitem" className="danger" onClick={signOut}><Icon name="logout" size={15} /> Wyloguj</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
