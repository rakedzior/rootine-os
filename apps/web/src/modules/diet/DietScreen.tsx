import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useTodayMealItems,
  useNutritionToday,
  useAddMealItem,
  useDeleteMealItem,
  useUpsertNutritionDaily,
  useAddWater,
} from '@/features/diet/hooks';
import '@/styles/nutrition.css';

const GLASS_ML = 250;
const WATER_TARGET_ML = 3000;

export function DietScreen() {
  const showTargets = useIsFeatureVisible('diet.daily_targets');
  const showMacros = useIsFeatureVisible('diet.macros');
  const showMeals = useIsFeatureVisible('diet.meals');
  const showBalance = useIsFeatureVisible('diet.calorie_balance');
  const showFoods = useIsFeatureVisible('diet.food_items');

  const itemsQ = useTodayMealItems();
  const dailyQ = useNutritionToday();
  const addItem = useAddMealItem();
  const delItem = useDeleteMealItem();
  const upsertDaily = useUpsertNutritionDaily();
  const addWater = useAddWater(GLASS_ML);

  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [editTargets, setEditTargets] = useState(false);
  const [tKcal, setTKcal] = useState('');
  const [tProt, setTProt] = useState('');
  const [tCarb, setTCarb] = useState('');
  const [tFat, setTFat] = useState('');

  const items = itemsQ.data ?? [];
  const daily = dailyQ.data;

  const sumKcal = items.reduce((s, i) => s + i.kcal, 0);
  const sumProt = items.reduce((s, i) => s + i.protein, 0);
  const sumCarb = items.reduce((s, i) => s + i.carb, 0);
  const sumFat = items.reduce((s, i) => s + i.fat, 0);

  const kcalTarget = daily?.kcal_target ?? 2500;
  const protTarget = daily?.protein_target ?? 180;
  const carbTarget = daily?.carb_target ?? 240;
  const fatTarget = daily?.fat_target ?? 70;
  const waterMl = daily?.water_ml ?? 0;

  const kcalPct = Math.min(100, (sumKcal / kcalTarget) * 100);
  const dash = 270.2;
  const offset = dash - (dash * kcalPct) / 100;
  const glasses = Math.floor(waterMl / GLASS_ML);

  function handleAdd() {
    const n = name.trim();
    const k = parseFloat(kcal);
    if (!n || isNaN(k)) return;
    addItem.mutate({
      name: n,
      kcal: k,
      protein: parseFloat(protein) || 0,
      carb: parseFloat(carb) || 0,
      fat: parseFloat(fat) || 0,
    });
    setName(''); setKcal(''); setProtein(''); setCarb(''); setFat('');
  }

  function openTargetEdit() {
    setTKcal(String(kcalTarget));
    setTProt(String(protTarget));
    setTCarb(String(carbTarget));
    setTFat(String(fatTarget));
    setEditTargets(true);
  }

  function saveTargets() {
    upsertDaily.mutate({
      kcal_target: parseFloat(tKcal) || kcalTarget,
      protein_target: parseFloat(tProt) || protTarget,
      carb_target: parseFloat(tCarb) || carbTarget,
      fat_target: parseFloat(tFat) || fatTarget,
    });
    setEditTargets(false);
  }

  return (
    <main className="grid">
      {/* ---------- LEFT: targets ---------- */}
      <section className="col">
        {showTargets && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">01</span><span className="card-title">Cele na dziś</span></div>
              <button className="pill" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }} type="button" onClick={openTargetEdit}>
                Edytuj
              </button>
            </div>

            {editTargets ? (
              <div className="he-grid" style={{ gap: 8, marginBottom: 12 }}>
                <div className="he-field">
                  <label className="he-lbl">Kalorie</label>
                  <input className="he-input" type="number" value={tKcal} onChange={(e) => setTKcal(e.target.value)} inputMode="numeric" />
                </div>
                <div className="he-field">
                  <label className="he-lbl">Białko (g)</label>
                  <input className="he-input" type="number" value={tProt} onChange={(e) => setTProt(e.target.value)} inputMode="numeric" />
                </div>
                <div className="he-field">
                  <label className="he-lbl">Węglowodany (g)</label>
                  <input className="he-input" type="number" value={tCarb} onChange={(e) => setTCarb(e.target.value)} inputMode="numeric" />
                </div>
                <div className="he-field">
                  <label className="he-lbl">Tłuszcze (g)</label>
                  <input className="he-input" type="number" value={tFat} onChange={(e) => setTFat(e.target.value)} inputMode="numeric" />
                </div>
                <div className="he-actions">
                  <button className="he-btn ghost" type="button" onClick={() => setEditTargets(false)}>Anuluj</button>
                  <button className="he-btn primary" type="button" onClick={saveTargets}>Zapisz</button>
                </div>
              </div>
            ) : (
              <>
                <div className="nt-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="43" fill="none" stroke="var(--surface-inset)" strokeWidth="9" />
                    <circle cx="50" cy="50" r="43" fill="none" stroke="var(--acc-a)" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={dash} strokeDashoffset={offset} />
                  </svg>
                  <div className="c">
                    <b className="tnum">{Math.round(sumKcal)}</b>
                    <span className="of">{Math.round(kcalTarget)} kcal</span>
                    <small>spożyte</small>
                  </div>
                </div>
                <div className="nt-remain">{Math.max(0, Math.round(kcalTarget - sumKcal))} kcal pozostało</div>
              </>
            )}

            {showMacros && !editTargets && (
              <div className="nt-macros">
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-prot)' }} />Białko</span><span className="v"><b>{Math.round(sumProt)}</b> / {Math.round(protTarget)}g</span></div>
                  <div className="nt-track"><i style={{ width: `${Math.min(100, (sumProt / protTarget) * 100)}%`, background: 'var(--m-prot)' }} /></div>
                </div>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-carb)' }} />Węglowodany</span><span className="v"><b>{Math.round(sumCarb)}</b> / {Math.round(carbTarget)}g</span></div>
                  <div className="nt-track"><i style={{ width: `${Math.min(100, (sumCarb / carbTarget) * 100)}%`, background: 'var(--m-carb)' }} /></div>
                </div>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-fat)' }} />Tłuszcze</span><span className="v"><b>{Math.round(sumFat)}</b> / {Math.round(fatTarget)}g</span></div>
                  <div className="nt-track"><i style={{ width: `${Math.min(100, (sumFat / fatTarget) * 100)}%`, background: 'var(--m-fat)' }} /></div>
                </div>
              </div>
            )}
          </article>
        )}

        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="idx">02</span><span className="card-title">Nawodnienie</span></div>
            <span className="pill">{Math.round(waterMl / 1000 * 10) / 10} / {WATER_TARGET_ML / 1000} L</span>
          </div>
          <div className="hydro-big">
            <div className="hydro-glass">
              {Array.from({ length: 8 }).map((_, i) => (
                <i
                  key={i}
                  onClick={() => addWater.mutate()}
                  style={{ cursor: 'pointer', opacity: i < glasses ? 1 : 0.3 }}
                  title="Kliknij: +250ml"
                />
              ))}
            </div>
            <div className="hydro-info">
              <div className="v tnum">{waterMl < 1000 ? waterMl : (waterMl / 1000).toFixed(1)}<small> {waterMl < 1000 ? 'ml' : 'L'}</small></div>
              <div className="k">Kliknij szklankę · 250ml</div>
            </div>
          </div>
          <div className="snap-grid">
            <div className="snap"><div className="v tnum">{Math.round(sumKcal)}<small> kcal</small></div><div className="k">Dziś</div></div>
            <div className="snap"><div className="v tnum">{Math.round(sumProt)}<small> g</small></div><div className="k">Białko</div></div>
            <div className="snap"><div className="v tnum">{glasses} / {Math.floor(WATER_TARGET_ML / GLASS_ML)}</div><div className="k">Szklanki</div></div>
            <div className="snap"><div className="v tnum">{daily?.weight_kg ?? '—'}<small> kg</small></div><div className="k">Waga</div></div>
          </div>
        </article>
      </section>

      {/* ---------- CENTER: food log ---------- */}
      <section className="col">
        {showMeals && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">03</span><span className="card-title">Dziennik dziś</span></div>
              <span className="pill">{items.length} pozycji</span>
            </div>
            <div className="log-add">
              <div className="field" style={{ display: 'grid', gap: 4 }}>
                <input
                  type="text"
                  placeholder="Nazwa produktu / posiłku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" className="kcal" placeholder="kcal*" value={kcal} onChange={(e) => setKcal(e.target.value)} inputMode="numeric" />
                  <input type="number" className="kcal" placeholder="B(g)" value={protein} onChange={(e) => setProtein(e.target.value)} inputMode="numeric" />
                  <input type="number" className="kcal" placeholder="W(g)" value={carb} onChange={(e) => setCarb(e.target.value)} inputMode="numeric" />
                  <input type="number" className="kcal" placeholder="T(g)" value={fat} onChange={(e) => setFat(e.target.value)} inputMode="numeric" />
                </div>
              </div>
              <button className="add-btn" type="button" onClick={handleAdd} disabled={addItem.isPending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Dodaj
              </button>
            </div>

            {itemsQ.isLoading ? (
              <div className="agenda-empty">Ładowanie…</div>
            ) : items.length === 0 ? (
              <div className="agenda-empty">Brak wpisów — dodaj pierwszy posiłek powyżej.</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((item) => (
                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>
                        {Math.round(item.protein)}B · {Math.round(item.carb)}W · {Math.round(item.fat)}T
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="tnum" style={{ fontWeight: 600, color: 'var(--acc-a)' }}>{Math.round(item.kcal)} kcal</span>
                      <button
                        type="button"
                        onClick={() => delItem.mutate(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 16 }}
                      >×</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}

        {showBalance && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">04</span><span className="card-title">Bilans dziś</span></div>
            </div>
            <div className="trend-top">
              <div>
                <div className="lbl">Spożyte</div>
                <div className="big tnum">{Math.round(sumKcal)}<small> kcal</small></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="lbl">Pozostało</div>
                <div className="big tnum" style={{ color: kcalTarget - sumKcal >= 0 ? 'var(--acc-a)' : 'var(--acc-b)' }}>
                  {Math.abs(Math.round(kcalTarget - sumKcal))}<small> kcal {kcalTarget - sumKcal < 0 ? 'ponad' : ''}</small>
                </div>
              </div>
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
              <div className="row"><span className="k">Kalorie do celu</span><span className="v tnum">{Math.max(0, Math.round(kcalTarget - sumKcal))}<small> kcal</small></span></div>
              <div className="row"><span className="k">Białko do celu</span><span className="v tnum">{Math.max(0, Math.round(protTarget - sumProt))}<small> g</small></span></div>
              <div className="row"><span className="k">Węgle do celu</span><span className="v tnum">{Math.max(0, Math.round(carbTarget - sumCarb))}<small> g</small></span></div>
              <div className="row"><span className="k">Tłuszcze do celu</span><span className="v tnum">{Math.max(0, Math.round(fatTarget - sumFat))}<small> g</small></span></div>
            </div>
          </article>
        )}

        {showFoods && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">06</span><span className="card-title">Podsumowanie makro</span></div>
              <span className="pill">Dziś</span>
            </div>
            {items.length === 0 ? (
              <div className="agenda-empty">Dodaj posiłki, aby zobaczyć makro.</div>
            ) : (
              <div className="nt-macros" style={{ marginTop: 8 }}>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-prot)' }} />Białko</span><span className="v"><b>{Math.round(sumProt)}g</b></span></div>
                  <div className="nt-track"><i style={{ width: `${Math.min(100, (sumProt / protTarget) * 100)}%`, background: 'var(--m-prot)' }} /></div>
                </div>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-carb)' }} />Węglowodany</span><span className="v"><b>{Math.round(sumCarb)}g</b></span></div>
                  <div className="nt-track"><i style={{ width: `${Math.min(100, (sumCarb / carbTarget) * 100)}%`, background: 'var(--m-carb)' }} /></div>
                </div>
                <div className="nt-macro">
                  <div className="mh"><span className="k"><i style={{ background: 'var(--m-fat)' }} />Tłuszcze</span><span className="v"><b>{Math.round(sumFat)}g</b></span></div>
                  <div className="nt-track"><i style={{ width: `${Math.min(100, (sumFat / fatTarget) * 100)}%`, background: 'var(--m-fat)' }} /></div>
                </div>
              </div>
            )}
          </article>
        )}
      </section>
    </main>
  );
}
