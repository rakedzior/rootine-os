import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';

/** App shell: sticky topbar + routed content. */
export function AppLayout() {
  return (
    <div className="app">
      <Topbar />
      <Outlet />
    </div>
  );
}
