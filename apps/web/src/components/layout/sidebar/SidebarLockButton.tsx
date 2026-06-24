import { Icon } from './icons';
import { useSidebar } from './SidebarContext';

/** Locks / unlocks the current state — when locked, hover no longer auto-expands. */
export function SidebarLockButton({ expanded }: { expanded: boolean }) {
  const { locked, toggleLock } = useSidebar();
  const label = locked ? 'Odblokuj menu (hover rozwija)' : 'Zablokuj aktualny stan menu';
  return (
    <button
      type="button"
      className={`sb-iconbtn sb-lock${locked ? ' is-on' : ''}`}
      onClick={toggleLock}
      aria-pressed={locked}
      aria-label={label}
      title={expanded ? undefined : label}
    >
      <Icon name={locked ? 'lock' : 'unlock'} size={17} />
      {expanded && <span className="sb-lock-label">{locked ? 'Zablokowane' : 'Zablokuj'}</span>}
      {!expanded && <span className="sb-tooltip" role="tooltip">{label}</span>}
    </button>
  );
}
