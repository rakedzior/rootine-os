import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

// ─── ICONS ────────────────────────────────────────────────────
const I = {
  start: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  sport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M7 17l-5 5M17 7l5-5" />
    </svg>
  ),
  diet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" />
    </svg>
  ),
  goals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  office: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  ),
  travel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16l20-6-7 11-3-4-4-1z" /><path d="M11 13l5-5" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  work: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" />
    </svg>
  ),
};

const PRIMARY: { to: string; label: string; end?: boolean; icon: ReactNode }[] = [
  { to: '/', label: 'Planer', end: true, icon: I.start },
  { to: '/sport', label: 'Sport', icon: I.sport },
  { to: '/diet', label: 'Dieta', icon: I.diet },
  { to: '/notes', label: 'Notatki', icon: I.notes },
];

// Full module list for the "More" sheet.
const ALL: { to: string; label: string; end?: boolean; icon: ReactNode }[] = [
  { to: '/', label: 'Planer', end: true, icon: I.start },
  { to: '/sport', label: 'Sport', icon: I.sport },
  { to: '/diet', label: 'Dieta', icon: I.diet },
  { to: '/finance', label: 'Finanse', icon: I.finance },
  { to: '/goals', label: 'Cele', icon: I.goals },
  { to: '/office', label: 'Biuro', icon: I.office },
  { to: '/travel', label: 'Podróże', icon: I.travel },
  { to: '/notes', label: 'Notatki', icon: I.notes },
  { to: '/work', label: 'Praca', icon: I.work },
  { to: '/settings', label: 'Ustawienia', icon: I.settings },
];

export function MobileBottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav className="mobile-nav">
        {PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
        <a
          role="button"
          tabIndex={0}
          className={sheetOpen ? 'active' : ''}
          onClick={() => setSheetOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSheetOpen(true); }}
        >
          {I.more}
          Więcej
        </a>
      </nav>

      {sheetOpen && (
        <div className="sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sheet-grab" />
            <div className="sheet-grid">
              {ALL.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={() => setSheetOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
