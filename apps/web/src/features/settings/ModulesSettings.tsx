import { FEATURES } from '@/features/config/registry';
import {
  useAllModulesOrdered, useFeatureSettings,
  useSetModuleVisible, useReorderModules, useSetFeatureVisible, useResetConfig,
} from '@/features/config/useConfig';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`pill${on ? ' accent' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {on ? 'Wł.' : 'Wył.'}
    </button>
  );
}

const arrowBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--ink-2)', cursor: 'pointer', lineHeight: 1,
};

export function ModulesSettings() {
  const modules = useAllModulesOrdered();
  const { data: featRows } = useFeatureSettings();
  const setMod = useSetModuleVisible();
  const reorder = useReorderModules();
  const setFeat = useSetFeatureVisible();
  const reset = useResetConfig();

  const featVisible = (key: string) => {
    const r = (featRows ?? []).find((f) => f.feature_key === key);
    return r ? r.visible : true;
  };

  const move = (index: number, dir: -1 | 1) => {
    const keys = modules.map((m) => m.key);
    const j = index + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[index], keys[j]] = [keys[j], keys[index]];
    reorder.mutate(keys);
  };

  return (
    <>
      <article className="card">
        <div className="card-head">
          <div className="lhs"><span className="card-title">Moduły i widoczność</span></div>
          <button className="he-btn ghost" type="button" onClick={() => reset.mutate()}>
            Przywróć domyślne
          </button>
        </div>
        <div className="note-peek">
          Włącz/wyłącz moduły i poszczególne widgety oraz zmień kolejność modułów w nawigacji.
          Zmiany zapisują się od razu (per użytkownik).
        </div>
      </article>

      {modules.map((m, i) => (
        <article className="card" key={m.key}>
          <div className="card-head">
            <div className="lhs"><span className="card-title">{m.label}</span></div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button style={arrowBtn} type="button" aria-label="W górę" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button style={arrowBtn} type="button" aria-label="W dół" onClick={() => move(i, 1)} disabled={i === modules.length - 1}>↓</button>
              <Toggle on={m.visible} onClick={() => setMod.mutate({ key: m.key, visible: !m.visible })} />
            </div>
          </div>

          {m.visible && (
            <div className="todos">
              {FEATURES[m.key].map((f) => {
                const on = featVisible(f.key);
                return (
                  <div className="todo" key={f.key} style={{ cursor: 'default' }}>
                    <span className="t">{f.label}</span>
                    <Toggle on={on} onClick={() => setFeat.mutate({ featureKey: f.key, visible: !on })} />
                  </div>
                );
              })}
            </div>
          )}
        </article>
      ))}
    </>
  );
}
