import { Icon } from './icons';
import { useSidebar } from './SidebarContext';

/** Cycles sidebar mode: auto hover -> pinned open -> pinned closed. */
export function SidebarLockButton({ expanded }: { expanded: boolean }) {
  const { lockMode, cycleLockMode } = useSidebar();

  const iconName = lockMode === 'auto' ? 'unlock' : 'lock';
  const text = lockMode === 'auto'
    ? 'Auto'
    : (lockMode === 'pinned-open' ? 'Widoczne' : 'Ukryte');
  const label = lockMode === 'auto'
    ? 'Tryb auto (hover). Kliknij, aby przypiąć menu jako widoczne.'
    : (lockMode === 'pinned-open'
      ? 'Menu zawsze widoczne. Kliknij, aby przypiąć ukryte.'
      : 'Menu zawsze ukryte. Kliknij, aby wrócić do trybu auto.');

  return (
    <button
      type="button"
      className={`sb-item sb-item-sm sb-lock${lockMode === 'auto' ? '' : ' is-on'}`}
      onClick={cycleLockMode}
      aria-pressed={lockMode !== 'auto'}
      aria-label={label}
      title={expanded ? undefined : label}
    >
      <span className="sb-item-ic"><Icon name={iconName} size={20} /></span>
      <span className="sb-item-label">{text}</span>
      {!expanded && <span className="sb-tooltip" role="tooltip">{label}</span>}
    </button>
  );
}
