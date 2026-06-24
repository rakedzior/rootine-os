import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from './SidebarContext';
import { NAV_ITEMS } from './navConfig';
import { SidebarItem } from './SidebarItem';
import { SidebarToggleButton } from './SidebarToggleButton';
import { SidebarFooter } from './SidebarFooter';

/** The left navigation rail. When unlocked, hover expands it (pushing content);
 *  a short close delay keeps it from collapsing on an accidental cursor graze. */
export function Sidebar() {
  const { expanded, setHover } = useSidebar();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  function enter() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setHover(true);
  }
  function leave() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHover(false), 240);
  }

  return (
    <aside
      className="sidebar"
      data-collapsed={!expanded}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      {/* Brand */}
      <div className="sidebar-head">
        <Link to="/" className="sb-brand" aria-label="Rootine OS">
          <span className="sb-logo">R</span>
          <span className="sb-brand-text"><b>Rootine</b> OS</span>
        </Link>
        <SidebarToggleButton />
      </div>

      {/* Primary nav */}
      <nav className="sidebar-nav" aria-label="Główna nawigacja">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.key} item={item} expanded={expanded} />
        ))}
      </nav>

      <SidebarFooter expanded={expanded} />
    </aside>
  );
}
