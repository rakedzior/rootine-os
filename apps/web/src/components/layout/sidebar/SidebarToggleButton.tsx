import { Icon } from './icons';
import { useSidebar } from './SidebarContext';

/** Collapses / expands the sidebar (sets the committed state). */
export function SidebarToggleButton() {
  const { committedExpanded, toggleExpanded } = useSidebar();
  return (
    <button
      type="button"
      className="sb-iconbtn sb-toggle"
      onClick={toggleExpanded}
      aria-label={committedExpanded ? 'Zwiń menu' : 'Rozwiń menu'}
      title={committedExpanded ? 'Zwiń menu' : 'Rozwiń menu'}
      data-collapsed={!committedExpanded}
    >
      <Icon name="chevron-left" size={18} />
    </button>
  );
}
