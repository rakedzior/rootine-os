import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { setTheme, getCurrentTheme, type Theme } from '@/lib/theme';

const NAV_ITEMS = [
  { to: '/', label: 'Planer', exact: true },
  { to: '/sport', label: 'Sport' },
  { to: '/diet', label: 'Dieta' },
  { to: '/finance', label: 'Finanse' },
  { to: '/goals', label: 'Cele' },
  { to: '/office', label: 'Biuro' },
  { to: '/travel', label: 'Podróże' },
  { to: '/notes', label: 'Notatki' },
  { to: '/work', label: 'Praca' },
];

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: 'white-lotus', label: 'Beżowy', swatch: '#9a6a42' },
  { id: 'green', label: 'Chłodny', swatch: '#4257d4' },
  { id: 'dark', label: 'Grafit', swatch: '#161c26' },
  { id: 'coastal', label: 'Nadmorski', swatch: '#335765' },
  { id: 'aqua', label: 'Laguna', swatch: '#16a3b8' },
  { id: 'lavender', label: 'Lawenda', swatch: '#8a737d' },
  { id: 'coral', label: 'Koralowy', swatch: '#bc6266' },
  { id: 'steel', label: 'Stalowy', swatch: '#405278' },
  { id: 'magenta', label: 'Magenta', swatch: '#cf2487' },
  { id: 'mono', label: 'Monochrom', swatch: '#4d4d4d' },
];

const DAY_PL = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const MONTH_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

export function Topbar() {
  const [now, setNow] = useState(new Date());
  const [theme, setThemeState] = useState<Theme>(getCurrentTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const dateStr = `${DAY_PL[now.getDay()]}, ${now.getDate()} ${MONTH_PL[now.getMonth()]}`;

  function handleTheme(t: Theme) {
    setTheme(t);
    setThemeState(t);
    setMenuOpen(false);
  }

  return (
    <header className="topbar">
      {/* Brand */}
      <div className="brand">
        <div className="dot" />
        <span className="wm"><b>Rootine</b> <span>OS</span></span>
      </div>

      {/* Nav */}
      <nav className="nav">
        {NAV_ITEMS.map(({ to, label, exact }) => (
          <NavLink key={to} to={to} end={exact} className={({ isActive }) => isActive ? 'active' : undefined}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="spacer" />

      {/* Search */}
      <div className="tb-search">
        <svg className="tb-srch-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input className="tb-srch-inp" type="text" placeholder="Szukaj…" />
        <span className="tb-kbd">⌘K</span>
      </div>

      <button className="tb-add" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Dodaj
      </button>

      {/* Right cluster */}
      <div className="tcluster">
        <div className="tmini">
          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <div className="tt"><b>22°C</b><small>Słonecznie</small></div>
        </div>
        <div className="tdiv" />
        <div className="tclock-col">
          <div className="tclock">{hh}:{mm}<span className="s">:{ss}</span></div>
          <div className="tclock-date">{dateStr}</div>
        </div>
        <div className="tdiv" />
        <div className="avatar-wrap" ref={menuRef} onClick={() => setMenuOpen(v => !v)}>
          <div className="avatar">R</div>
          <svg className="avatar-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
          {menuOpen && (
            <div className="theme-menu" onClick={e => e.stopPropagation()}>
              <div style={{ padding: '4px 10px 8px', borderBottom: '1px solid var(--border-soft)', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Motyw</span>
              </div>
              {THEMES.map(t => (
                <button key={t.id} className={theme === t.id ? 'active' : ''} onClick={() => handleTheme(t.id)}>
                  <span className="theme-swatch" style={{ background: t.swatch }} />
                  {t.label}
                  {theme === t.id && (
                    <svg style={{ marginLeft: 'auto', width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
