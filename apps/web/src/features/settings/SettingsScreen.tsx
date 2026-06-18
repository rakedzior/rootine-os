import { NavLink } from 'react-router-dom';
import { SecuritySettings } from './SecuritySettings';
import { ModulesSettings } from './ModulesSettings';
import { AccountSettings } from './AccountSettings';
import { IntegrationsSettings } from './IntegrationsSettings';

type Tab = 'account' | 'integrations' | 'security' | 'modules';

const TABS: { tab: Tab; to: string; label: string }[] = [
  { tab: 'account', to: '/settings', label: 'Konto' },
  { tab: 'security', to: '/settings/security', label: 'Bezpieczeństwo' },
  { tab: 'modules', to: '/settings/modules', label: 'Moduły' },
  { tab: 'integrations', to: '/settings/integrations', label: 'Integracje' },
];

export function SettingsScreen({ tab = 'account' }: { tab?: Tab }) {
  return (
    <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 760 }}>
      <section className="col">
        <article className="card session">
          <div className="greet">Ustawienia</div>
          <nav className="nav" style={{ marginTop: 16, flexWrap: 'wrap' }}>
            {TABS.map((t) => (
              <NavLink
                key={t.tab}
                to={t.to}
                end
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </article>

        {tab === 'security' ? (
          <SecuritySettings />
        ) : tab === 'modules' ? (
          <ModulesSettings />
        ) : tab === 'integrations' ? (
          <IntegrationsSettings />
        ) : (
          <AccountSettings />
        )}
      </section>
    </main>
  );
}
