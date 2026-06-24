import { Outlet } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { MobileBottomNav } from './MobileBottomNav';
import { Sidebar } from './sidebar/Sidebar';
import { SidebarProvider, useSidebar } from './sidebar/SidebarContext';

const COLLAPSED_W = 76;
const EXPANDED_W = 252;

/** App shell: fixed left sidebar + fluid content. Content reserves the
 *  *effective* sidebar width, so expanding pushes content rather than covering it. */
function Shell() {
  const { expanded } = useSidebar();
  const style = {
    '--sb-w': `${expanded ? EXPANDED_W : COLLAPSED_W}px`,
  } as CSSProperties;

  return (
    <div className="app-shell" style={style}>
      <div className="sidebar-spacer" aria-hidden />
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}

export function AppShell() {
  return (
    <SidebarProvider>
      <Shell />
    </SidebarProvider>
  );
}
