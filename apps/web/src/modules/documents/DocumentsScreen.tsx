import { PageHeader } from '@/components/common';
import { EmptyState } from '@/components/layout/primitives';
import { Icon } from '@/components/layout/sidebar/icons';

/**
 * Placeholder for the upcoming Dokumenty module. Uses the shared shell so it
 * already matches the rest of the app; real content arrives with its own brief.
 */
export function DocumentsScreen() {
  return (
    <div className="module-page">
      <PageHeader
        icon={<Icon name="documents" size={26} />}
        title="Dokumenty"
        desc="Centralne miejsce na dokumenty, pliki i skany."
      />
      <div>
        <EmptyState
          icon={<Icon name="documents" size={30} />}
          title="Moduł w przygotowaniu"
          description="Ten widok dostanie własny układ na podstawie projektu, który prześlesz."
        />
      </div>
    </div>
  );
}
