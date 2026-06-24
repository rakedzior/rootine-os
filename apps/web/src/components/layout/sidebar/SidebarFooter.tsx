import { WeatherWidget } from './WeatherWidget';
import { TimeWidget } from './TimeWidget';
import { UserProfileWidget } from './UserProfileWidget';

/** Bottom cluster: weather · time · profile. */
export function SidebarFooter({ expanded }: { expanded: boolean }) {
  return (
    <div className="sidebar-footer">
      <div className="sb-ambient">
        <WeatherWidget expanded={expanded} />
        <TimeWidget expanded={expanded} />
      </div>

      <div className="sb-divider" />

      <UserProfileWidget expanded={expanded} />
    </div>
  );
}
