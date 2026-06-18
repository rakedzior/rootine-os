import { FEATURES, MODULES, type ModuleKey } from '@/features/config/registry';
import { useIsFeatureVisible } from '@/features/config/useConfig';

/** Generic placeholder screen for Phase 0. Each module's real widgets are
 *  built per-commit in Phase 1; here we render the module's feature catalog
 *  as "coming soon" cards so the shell + design system are visible end-to-end. */
export function ModuleScreen({ moduleKey }: { moduleKey: ModuleKey }) {
  const mod = MODULES.find((m) => m.key === moduleKey)!;
  const features = FEATURES[moduleKey];
  return (
    <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 1100 }}>
      <section className="col">
        <article className="card session">
          <div className="greet">
            {mod.label} <span className="em">·</span> moduł
          </div>
          <div className="greet-sub">Faza 0 — szkielet. Widgety pojawią się w Fazie 1.</div>
        </article>

        {features.map((f) => (
          <FeatureCard key={f.key} featureKey={f.key} label={f.label} />
        ))}
      </section>
    </main>
  );
}

function FeatureCard({ featureKey, label }: { featureKey: string; label: string }) {
  const visible = useIsFeatureVisible(featureKey);
  if (!visible) return null;
  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs">
          <span className="card-title">{label}</span>
        </div>
        <span className="pill">Wkrótce</span>
      </div>
      <div className="note-peek">{featureKey}</div>
    </article>
  );
}
