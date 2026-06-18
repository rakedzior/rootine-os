import { NavLink } from 'react-router-dom';
import { SecuritySettings } from './SecuritySettings';
import { ModulesSettings } from './ModulesSettings';

type Tab = 'account' | 'integrations' | 'security' | 'modules';

const TABS: { tab: Tab; to: string; label: string }[] = [
  { tab: 'account', to: '/settings', label: 'Konto' },
  { tab: 'security', to: '/settings/security', label: 'Bezpieczeństwo' },
  { tab: 'modules', to: '/settings/modules', label: 'Moduły' },
  { tab: 'integrations', to: '/settings/integrations', label: 'Integracje' },
];

const TITLES: Record<Tab, string> = {
  account: 'Ustawienia konta',
  integrations: 'Integracje',
  security: 'Bezpieczeństwo konta',
  modules: 'Moduły i widoczność',
};

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
        ) : (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">{TITLES[tab]}</span></div>
              <span className="pill">Wkrótce</span>
            </div>
            <div className="note-peek">
              {tab === 'integrations'
                ? 'Google Calendar i Strava — Faza 3.'
                : 'Ustawienia konta — wkrótce.'}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
