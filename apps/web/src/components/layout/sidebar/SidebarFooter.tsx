import { NavLink } from 'react-router-dom';
import { Icon } from './icons';
import { SETTINGS_ITEM } from './navConfig';
import { WeatherWidget } from './WeatherWidget';
import { TimeWidget } from './TimeWidget';
import { UserProfileWidget } from './UserProfileWidget';

/** Bottom cluster: weather · time · profile · settings · lock. */
export function SidebarFooter({ expanded }: { expanded: boolean }) {
  return (
    <div className="sidebar-footer">
      <div className="sb-ambient">
        <WeatherWidget expanded={expanded} />
        <TimeWidget expanded={expanded} />
      </div>

      <div className="sb-divider" />

      <UserProfileWidget expanded={expanded} />

      <div className="sb-footer-actions">
        <NavLink
          to={SETTINGS_ITEM.path}
          className={({ isActive }) => `sb-item sb-item-sm${isActive ? ' is-active' : ''}`}
          title={expanded ? undefined : SETTINGS_ITEM.label}
        >
          <span className="sb-item-ic"><Icon name={SETTINGS_ITEM.icon} size={18} /></span>
          <span className="sb-item-label">{SETTINGS_ITEM.label}</span>
          {!expanded && <span className="sb-tooltip" role="tooltip">{SETTINGS_ITEM.label}</span>}
        </NavLink>
      </div>
    </div>
  );
}
