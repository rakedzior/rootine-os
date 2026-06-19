import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';

export function AppLayout() {
  return (
    <div className="app">
      <Topbar />
      <Outlet />
      <MobileBottomNav />
    </div>
  );
}
