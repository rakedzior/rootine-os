import { useIsFeatureVisible } from '@/features/config/useConfig';
import '@/styles/nutrition.css';

/* Faithful port of Nutrition.html layout (3-column). Content is static /
 * empty-state for now; the food log and targets are wired to live data in the
 * Dieta CRUD step. Every card is gated by its feature_key. */
export function DietScreen() {
  const showTargets = useIsFeatureVisible('diet.daily_targets');
  const showMacros = useIsFeatureVisible('diet.macros');
  const showMeals = useIsFeatureVisible('diet.meals');
  const showBalance = useIsFeatureVisible('diet.calorie_balance');
  const showFoods = useIsFeatureVisible('diet.food_items');

  return (
    <main className="grid">
      {/* ---------- LEFT: targets ---------- */}
      <section className="col">
        {showTargets && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">01</span><span className="card-title">Cele na dziś</span></div>
              <span className="pill accent"><span className="led" />Redukcja</span>
            </div>
            <div className="nt-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="43" fill="none" stroke="var(--surface-inset)" strokeWidth="9" />
                <circle cx="50" cy="50" r="43" fill="none" stroke="var(--acc-a)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray="270.2" strokeDashoffset="270.2" />
              </svg>
              <div className="c"><b className="tnum">0</b><span className="of">2500 kcal</span><small>spożyte</small></div>
            </div>
            <div className="nt-remain">2500 kcal pozostało</div>

            {showMacros && (
              <div className="nt-macros">
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-prot)' }} />Białko</span><span className="v"><b>0</b> / 180g</span></div>
                  <div className="nt-track"><i style={{ width: '0%', background: 'var(--m-prot)' }} /></div>
                </div>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-carb)' }} />Węglowodany</span><span className="v"><b>0</b> / 240g</span></div>
                  <div className="nt-track"><i style={{ width: '0%', background: 'var(--m-carb)' }} /></div>
                </div>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-fat)' }} />Tłuszcze</span><span className="v"><b>0</b> / 70g</span></div>
                  <div className="nt-track"><i style={{ width: '0%', background: 'var(--m-fat)' }} /></div>
                </div>
              </div>
            )}
          </article>
        )}

        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="idx">02</span><span className="card-title">Nawodnienie i tydzień</span></div>
            <span className="pill">śr. 7 dni</span>
          </div>
          <div className="hydro-big">
            <div className="hydro-glass">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="hydro-info">
              <div className="v tnum">0<small> / 3.0 L</small></div>
              <div className="k">Dotknij szklankę · 250ml</div>
            </div>
          </div>
          <div className="snap-grid">
            <div className="snap"><div className="v tnum">—<small> kcal</small></div><div className="k">Śr. spożycie</div></div>
            <div className="snap"><div className="v tnum">—<small> g</small></div><div className="k">Śr. białko</div></div>
            <div className="snap"><div className="v tnum">0 / 7</div><div className="k">Dni w celu</div></div>
            <div className="snap"><div className="v tnum">—<small> kg</small></div><div className="k">Waga 30 dni</div></div>
          </div>
        </article>
      </section>

      {/* ---------- CENTER: food log ---------- */}
      <section className="col">
        {showMeals && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">03</span><span className="card-title">Dziennik dziś</span></div>
              <span className="pill">0 pozycji</span>
            </div>
            <div className="log-add">
              <div className="field">
                <input type="text" placeholder="Szybko dodaj — np. jogurt grecki" aria-label="Nazwa produktu" />
                <input type="number" className="kcal" placeholder="kcal" aria-label="Kalorie" inputMode="numeric" />
              </div>
              <button className="add-btn" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Dodaj
              </button>
            </div>
            <div className="agenda-empty" style={{ marginTop: 12 }}>Brak wpisów — dziennik zostanie podłączony w kroku CRUD.</div>
          </article>
        )}

        {showBalance && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">04</span><span className="card-title">Trend kalorii</span></div>
              <div className="trend-legend">
                <span><i style={{ background: 'var(--m-prot)' }} />W celu</span>
                <span><i style={{ background: 'var(--acc-b)' }} />Powyżej</span>
              </div>
            </div>
            <div className="trend-top">
              <div>
                <div className="lbl">Średnia z 7 dni</div>
                <div className="big tnum">—<small> kcal / dzień</small></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="lbl">Śr. białko</div>
                <div className="big tnum">—<small> g</small></div>
              </div>
            </div>
            <div className="trend-chart">
              {[40, 62, 55, 70, 48, 80, 58, 66, 52, 74, 60, 45, 68, 50].map((h, i) => (
                <div key={i} className="trend-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="pattern">
              <span className="tag">Wzorzec</span>
              <span className="txt">Analiza pojawi się, gdy zbierzemy dane z dziennika.</span>
            </div>
          </article>
        )}
      </section>

      {/* ---------- RIGHT: plan ---------- */}
      <section className="col">
        {showTargets && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">05</span><span className="card-title">Trafić w cele</span></div>
              <span className="pill">Pozostało</span>
            </div>
            <div className="fill-gap">
              <div className="row"><span className="k">Kalorie do celu</span><span className="v tnum">2 500<small> kcal</small></span></div>
              <div className="row"><span className="k">Białko do celu</span><span className="v tnum">180<small> g</small></span></div>
            </div>
            <button className="autofill-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
              Uzupełnij mój dzień
            </button>
          </article>
        )}

        {showFoods && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">06</span><span className="card-title">Moje posiłki</span></div>
              <span className="pill">Zapisane</span>
            </div>
            <div className="agenda-empty">Zapisane posiłki pojawią się tutaj.</div>
          </article>
        )}

        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="idx">07</span><span className="card-title">Inspiracje</span></div>
            <span className="pill">Wysokobiałkowe</span>
          </div>
          <div className="insp-grid">
            <div className="insp"><div className="ph"><span>zdjęcie posiłku</span></div><div className="ib"><div className="n">Miska z łososiem teriyaki</div><div className="m"><b>610 kcal</b> · 48P 52C 18F</div></div></div>
            <div className="insp"><div className="ph"><span>zdjęcie posiłku</span></div><div className="ib"><div className="n">Placki z twarogu</div><div className="m"><b>420 kcal</b> · 38P 44C 9F</div></div></div>
            <div className="insp"><div className="ph"><span>zdjęcie posiłku</span></div><div className="ib"><div className="n">Pad thai z tofu</div><div className="m"><b>540 kcal</b> · 32P 64C 16F</div></div></div>
            <div className="insp"><div className="ph"><span>zdjęcie posiłku</span></div><div className="ib"><div className="n">Wrap z wołowiną i halloumi</div><div className="m"><b>580 kcal</b> · 44P 40C 24F</div></div></div>
          </div>
        </article>
      </section>
    </main>
  );
}
