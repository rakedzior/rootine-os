import { Link } from 'react-router-dom';
import { Nav } from './Nav';

/** Faithful port of the prototype top bar (uses existing styles.css classes). */
export function Topbar() {
  return (
    <header className="topbar" style={{ gap: 16 }}>
      <div className="brand">
        <span className="dot" />
        <span className="wm">
          <b>Rootine</b>&nbsp;OS&nbsp;<span>v3.0</span>
        </span>
      </div>

      <Nav />

      <div className="tb-search">
        <svg className="tb-srch-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input className="tb-srch-inp" type="text" placeholder="Szukaj lub wpisz polecenie…" />
        <span className="tb-kbd">⌘K</span>
      </div>

      <button className="tb-add" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Dodaj
      </button>

      <div className="tcluster">
        <div className="tclock-col">
          <div className="tclock tnum">
            <span>—:—</span>
          </div>
          <div className="tclock-date">Rootine OS</div>
        </div>
        <span className="tdiv" />
        <Link className="avatar-wrap" to="/settings/security" aria-label="Ustawienia konta" style={{ textDecoration: 'none' }}>
          <div className="avatar">YOU</div>
          <svg className="avatar-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
