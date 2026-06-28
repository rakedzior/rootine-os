import { NavLink } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { SecuritySettings } from './SecuritySettings';
import { ModulesSettings } from './ModulesSettings';
import { AccountSettings } from './AccountSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { ProfileSettings } from './ProfileSettings';

type Tab = 'profile' | 'account' | 'integrations' | 'security' | 'modules';

const TABS: { tab: Tab; to: string; label: string }[] = [
  { tab: 'profile', to: '/settings/profile', label: 'Profil' },
  { tab: 'account', to: '/settings', label: 'Konto' },
  { tab: 'security', to: '/settings/security', label: 'Bezpieczeństwo' },
  { tab: 'modules', to: '/settings/modules', label: 'Moduły' },
  { tab: 'integrations', to: '/settings/integrations', label: 'Integracje' },
];

function SettingsHeaderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.2-2-3.4-2.3.7a8 8 0 0 0-1.7-1l-.3-2.4H9.9l-.3 2.4a8 8 0 0 0-1.7 1l-2.3-.7-2 3.4L5.6 11a7.97 7.97 0 0 0 0 2l-2 1.2 2 3.4 2.3-.7c.5.4 1.1.8 1.7 1l.3 2.4h4.2l.3-2.4c.6-.2 1.2-.6 1.7-1l2.3.7 2-3.4-2-1.2Z" />
    </svg>
  );
}

export function SettingsScreen({ tab = 'account' }: { tab?: Tab }) {
  return (
    <main className="module-page settings-os">
      <PageHeader
        icon={<SettingsHeaderIcon />}
        title="Ustawienia"
        desc="Profil, konto, bezpieczeństwo, moduły i integracje aplikacji."
      />
      <section className="col" style={{ width: '100%', minWidth: 0 }}>
        <article className="card session">
          <nav className="nav" style={{ flexWrap: 'wrap' }}>
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

        {tab === 'profile' ? (
          <ProfileSettings />
        ) : tab === 'security' ? (
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
