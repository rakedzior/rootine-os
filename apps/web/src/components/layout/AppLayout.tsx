import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

/** App shell: sticky topbar + routed content + mobile bottom nav. */
export function AppLayout() {
  return (
    <div className="app">
      <Topbar />
      <Outlet />
      <MobileNav />
    </div>
  );
}
