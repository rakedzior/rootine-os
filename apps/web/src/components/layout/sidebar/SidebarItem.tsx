import { NavLink } from 'react-router-dom';
import { Icon } from './icons';
import type { NavItem } from './navConfig';

/**
 * A single nav row. Shows icon + label when expanded, icon-only when collapsed
 * (with a hover tooltip). Active state is driven by the router.
 */
export function SidebarItem({ item, expanded }: { item: NavItem; expanded: boolean }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
      title={expanded ? undefined : item.label}
    >
      <span className="sb-item-ic"><Icon name={item.icon} /></span>
      <span className="sb-item-label">{item.label}</span>
      {item.badge != null && item.badge > 0 && <span className="sb-item-badge">{item.badge}</span>}
      {!expanded && <span className="sb-tooltip" role="tooltip">{item.label}</span>}
    </NavLink>
  );
}
