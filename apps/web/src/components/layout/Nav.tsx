import { NavLink } from 'react-router-dom';
import { MODULES } from '@/features/config/registry';
import { useVisibleModules } from '@/features/config/useConfig';

/** Top navigation. Renders only modules the user has visible, in their order. */
export function Nav() {
  const modules = useVisibleModules();
  return (
    <nav className="nav">
      {modules.map((m) => (
        <NavLink
          key={m.key}
          to={m.path}
          end={m.path === '/'}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          {m.label}
        </NavLink>
      ))}
    </nav>
  );
}

// Re-export so callers can import the static list if needed.
export { MODULES };
