import { useState, useMemo } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, ProgressBar } from '@/components/common';
import { useLocalStore, type MealEntry } from '@/store/localStore';

const TABS = [
  { id: 'dzisiaj',  label: 'Dzisiaj',   icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
  { id: 'historia', label: 'Historia',  icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
  { id: 'produkty', label: 'Produkty',  icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id: 'cele',     label: 'Cele',      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
];

const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Śniadanie',
  lunch:     '☀️ Obiad',
  dinner:    '🌙 Kolacja',
  snack:     '🍎 Przekąska',
};
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export function DietScreen() {
  const [tab, setTab] = useState('dzisiaj');
  return (
    <div className="module-page">
      <div className="module-header">
        <span className="module-title">Dieta</span>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'dzisiaj'  && <DietDzisiaj />}
      {tab === 'historia' && <DietHistoria />}
      {tab === 'produkty' && <DietProdukty />}
      {tab === 'cele'     && <DietCele />}
    </div>
  );
}

// ─── DZISIAJ ─────────────────────────────────────────────────

function DietDzisiaj() {
  const { mealEntries, waterLogs, dietGoals, addMealEntry, deleteMealEntry, logWater } = useLocalStore();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = mealEntries.filter(e => e.date === todayStr);
  const todayWater = waterLogs.find(w => w.date === todayStr)?.ml ?? 0;
  const [showAdd, setShowAdd] = useState(false);
  const [defaultMeal, setDefaultMeal] = useState<'breakfast'|'lunch'|'dinner'|'snack'>('breakfast');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totals = todayEntries.reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
      <div className="col">
        {MEAL_ORDER.map(meal => {
          const entries = todayEntries.filter(e => e.meal === meal);
          const mealKcal = entries.reduce((s, e) => s + e.kcal, 0);
          return (
            <div key={meal} className="card">
              <div className="card-head">
                <span className="card-title">{MEAL_LABELS[meal]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>{Math.round(mealKcal)} kcal</span>
                  <button className="btn btn-primary btn-sm" onClick={() => { setDefaultMeal(meal as 'breakfast'|'lunch'|'dinner'|'snack'); setShowAdd(true); }}>+ Dodaj</button>
                </div>
              </div>
              {entries.length === 0
                ? <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '8px 0', textAlign: 'center' }}>Brak wpisów</div>
                : (
                  <table className="table">
                    <thead><tr><th>PRODUKT</th><th style={{ textAlign: 'right' }}>ILOŚĆ</th><th style={{ textAlign: 'right' }}>KCAL</th><th style={{ textAlign: 'right' }}>B</th><th style={{ textAlign: 'right' }}>W</th><th style={{ textAlign: 'right' }}>T</th><th></th></tr></thead>
                    <tbody>
                      {entries.map(e => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 500 }}>{e.foodName}</td>
                          <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 13 }}>{e.amount}{e.unit}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(e.kcal)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.protein.toFixed(1)}g</td>
                          <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.carbs.toFixed(1)}g</td>
                          <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.fat.toFixed(1)}g</td>
                          <td><button className="icon-btn" style={{ fontSize: 12 }} onClick={() => setDeleteId(e.id)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          );
        })}
      </div>

      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Podsumowanie</span></div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-3)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green-mid)" strokeWidth="3"
                  strokeDasharray={`${Math.min((totals.kcal / dietGoals.kcal) * 100, 100)} 100`}
                  strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{Math.round(totals.kcal)}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>kcal</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 14 }}>
            Cel: {dietGoals.kcal} · Pozostało: <strong style={{ color: 'var(--green-text)' }}>{Math.max(0, dietGoals.kcal - Math.round(totals.kcal))}</strong> kcal
          </div>
          {[
            { label: 'Białko', val: totals.protein, goal: dietGoals.protein, color: '#3B82F6' },
            { label: 'Węglowodany', val: totals.carbs, goal: dietGoals.carbs, color: '#F59E0B' },
            { label: 'Tłuszcze', val: totals.fat, goal: dietGoals.fat, color: '#EF4444' },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{m.label}</span>
                <span style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{m.val.toFixed(0)}/{m.goal}g</span>
              </div>
              <ProgressBar value={m.val} max={m.goal} size="sm" color={m.color} />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">💧 Nawodnienie</span></div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{(todayWater / 1000).toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)' }}> / {(dietGoals.water / 1000).toFixed(1)} L</span></div>
          </div>
          <ProgressBar value={todayWater} max={dietGoals.water} size="md" />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {[200, 300, 500].map(ml => (
              <button key={ml} className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                onClick={() => logWater(todayStr, ml)}>+{ml}ml</button>
            ))}
          </div>
        </div>
      </div>

      <AddMealModal open={showAdd} defaultMeal={defaultMeal} onClose={() => setShowAdd(false)} onSave={e => { addMealEntry(e); setShowAdd(false); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteMealEntry(deleteId!); setDeleteId(null); }} label="ten wpis" />
    </div>
  );
}

function AddMealModal({ open, defaultMeal, onClose, onSave }: {
  open: boolean; defaultMeal: 'breakfast'|'lunch'|'dinner'|'snack';
  onClose: () => void; onSave: (e: Omit<MealEntry, 'id'>) => void;
}) {
  const { foodItems } = useLocalStore();
  const todayStr = new Date().toISOString().split('T')[0];
  const [meal, setMeal] = useState(defaultMeal);
  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState(100);
  const [unit, setUnit] = useState('g');
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [mode, setMode] = useState<'quick'|'manual'>('quick');

  const matched = foodItems.find(f => f.name.toLowerCase() === foodName.toLowerCase());

  function handleFoodSelect(name: string) {
    setFoodName(name);
    const item = foodItems.find(f => f.name === name);
    if (item) {
      setUnit(item.unit);
      const ratio = amount / 100;
      setKcal(Math.round(item.per100g.kcal * ratio));
      setProtein(+(item.per100g.protein * ratio).toFixed(1));
      setCarbs(+(item.per100g.carbs * ratio).toFixed(1));
      setFat(+(item.per100g.fat * ratio).toFixed(1));
    }
  }

  function handleAmountChange(val: number) {
    setAmount(val);
    if (matched) {
      const ratio = val / 100;
      setKcal(Math.round(matched.per100g.kcal * ratio));
      setProtein(+(matched.per100g.protein * ratio).toFixed(1));
      setCarbs(+(matched.per100g.carbs * ratio).toFixed(1));
      setFat(+(matched.per100g.fat * ratio).toFixed(1));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Dodaj produkt"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!foodName.trim()) return;
          onSave({ date: todayStr, meal, foodName, amount, unit, kcal, protein, carbs, fat });
          setFoodName(''); setAmount(100); setKcal(0); setProtein(0); setCarbs(0); setFat(0);
        }}>Dodaj</button>
      </>}>
      <Field label="Posiłek">
        <select className="select" value={meal} onChange={e => setMeal(e.target.value as typeof meal)}>
          {Object.entries(MEAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['quick','manual'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === m ? 'var(--green)' : 'var(--surface-3)', color: mode === m ? 'white' : 'var(--ink-2)' }}>
            {m === 'quick' ? '🔍 Szukaj' : '✏️ Ręcznie'}
          </button>
        ))}
      </div>
      {mode === 'quick' ? (
        <>
          <Field label="Produkt" required>
            <input className="input" list="food-list" value={foodName} onChange={e => handleFoodSelect(e.target.value)} placeholder="Wpisz nazwę produktu…" />
            <datalist id="food-list">{foodItems.map(f => <option key={f.id} value={f.name} />)}</datalist>
          </Field>
          <div className="form-grid">
            <Field label="Ilość"><input type="number" className="input" value={amount} onChange={e => handleAmountChange(+e.target.value)} min={1} /></Field>
            <Field label="Jednostka"><input className="input" value={unit} onChange={e => setUnit(e.target.value)} /></Field>
          </div>
          {matched && (
            <div style={{ display: 'flex', gap: 12, background: 'var(--surface-3)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <span>🔥 <strong>{kcal}</strong> kcal</span>
              <span>💪 <strong>{protein}g</strong> B</span>
              <span>🌾 <strong>{carbs}g</strong> W</span>
              <span>🧈 <strong>{fat}g</strong> T</span>
            </div>
          )}
        </>
      ) : (
        <div className="form-grid">
          <Field label="Nazwa produktu" required><input className="input" value={foodName} onChange={e => setFoodName(e.target.value)} /></Field>
          <Field label="Ilość"><input type="number" className="input" value={amount} onChange={e => setAmount(+e.target.value)} /></Field>
          <Field label="Jednostka"><input className="input" value={unit} onChange={e => setUnit(e.target.value)} /></Field>
          <Field label="Kcal"><input type="number" className="input" value={kcal} onChange={e => setKcal(+e.target.value)} /></Field>
          <Field label="Białko (g)"><input type="number" className="input" value={protein} onChange={e => setProtein(+e.target.value)} step={0.1} /></Field>
          <Field label="Węglowodany (g)"><input type="number" className="input" value={carbs} onChange={e => setCarbs(+e.target.value)} step={0.1} /></Field>
          <Field label="Tłuszcze (g)"><input type="number" className="input" value={fat} onChange={e => setFat(+e.target.value)} step={0.1} /></Field>
        </div>
      )}
    </Modal>
  );
}

// ─── HISTORIA ─────────────────────────────────────────────────

function DietHistoria() {
  const { mealEntries, dietGoals } = useLocalStore();
  const byDate = useMemo(() => {
    const map: Record<string, typeof mealEntries> = {};
    mealEntries.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [mealEntries]);

  if (byDate.length === 0) return <EmptyState title="Brak historii" desc="Zacznij logować posiłki." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
      {byDate.map(([date, entries]) => {
        const t = entries.reduce((acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
        const pct = Math.round((t.kcal / dietGoals.kcal) * 100);
        return (
          <div key={date} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, fontWeight: 700 }}>{new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--ink-3)' }}>
                <span>🔥 <strong style={{ color: 'var(--ink)' }}>{Math.round(t.kcal)}</strong> kcal</span>
                <span>B: {t.protein.toFixed(0)}g</span>
                <span>W: {t.carbs.toFixed(0)}g</span>
                <span>T: {t.fat.toFixed(0)}g</span>
              </div>
            </div>
            <ProgressBar value={t.kcal} max={dietGoals.kcal} size="sm" color={pct > 110 ? 'var(--p-high)' : 'var(--green-mid)'} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>{pct}% celu</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PRODUKTY ─────────────────────────────────────────────────

function DietProdukty() {
  const { foodItems } = useLocalStore();
  const [search, setSearch] = useState('');
  const filtered = foodItems.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 16 }}>
        <input className="input" style={{ width: '100%' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj produktu…" />
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>PRODUKT</th><th style={{ textAlign: 'right' }}>KCAL/100g</th><th style={{ textAlign: 'right' }}>BIAŁKO</th><th style={{ textAlign: 'right' }}>WĘGL.</th><th style={{ textAlign: 'right' }}>TŁUSZCZ</th></tr></thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.name}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{f.per100g.kcal}</td>
                <td style={{ textAlign: 'right', color: '#3B82F6', fontSize: 13 }}>{f.per100g.protein}g</td>
                <td style={{ textAlign: 'right', color: '#F59E0B', fontSize: 13 }}>{f.per100g.carbs}g</td>
                <td style={{ textAlign: 'right', color: '#EF4444', fontSize: 13 }}>{f.per100g.fat}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CELE ─────────────────────────────────────────────────────

function DietCele() {
  const { dietGoals, updateDietGoals } = useLocalStore();
  const [kcal, setKcal] = useState(dietGoals.kcal);
  const [protein, setProtein] = useState(dietGoals.protein);
  const [carbs, setCarbs] = useState(dietGoals.carbs);
  const [fat, setFat] = useState(dietGoals.fat);
  const [water, setWater] = useState(dietGoals.water);
  const [saved, setSaved] = useState(false);

  const totalMacroKcal = protein * 4 + carbs * 4 + fat * 9;

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="card">
        <div className="card-head"><span className="card-title">Cele żywieniowe</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Kalorie dziennie (kcal)"><input type="number" className="input" value={kcal} onChange={e => setKcal(+e.target.value)} step={50} /></Field>
          <Field label="Białko (g)"><input type="number" className="input" value={protein} onChange={e => setProtein(+e.target.value)} step={5} /></Field>
          <Field label="Węglowodany (g)"><input type="number" className="input" value={carbs} onChange={e => setCarbs(+e.target.value)} step={5} /></Field>
          <Field label="Tłuszcze (g)"><input type="number" className="input" value={fat} onChange={e => setFat(+e.target.value)} step={5} /></Field>
          <Field label="Woda (ml/dzień)"><input type="number" className="input" value={water} onChange={e => setWater(+e.target.value)} step={250} /></Field>
          {totalMacroKcal > 0 && (
            <div style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Rozkład makroskładników</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Białko', pct: Math.round((protein * 4 / totalMacroKcal) * 100), color: '#3B82F6' },
                  { label: 'Węgle', pct: Math.round((carbs * 4 / totalMacroKcal) * 100), color: '#F59E0B' },
                  { label: 'Tłuszcze', pct: Math.round((fat * 9 / totalMacroKcal) * 100), color: '#EF4444' },
                ].map(m => (
                  <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: m.color }}>{m.pct}%</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSaved(false)}>Anuluj</button>
            <button className="btn btn-primary btn-sm" onClick={() => {
              updateDietGoals({ kcal, protein, carbs, fat, water });
              setSaved(true);
            }}>Zapisz cele</button>
          </div>
          {saved && <div style={{ color: 'var(--acc-a-ink)', fontSize: 12, textAlign: 'right' }}>✓ Zapisano</div>}
        </div>
      </div>
    </div>
  );
}
