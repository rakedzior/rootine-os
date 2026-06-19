import { useState, useMemo, useRef, useEffect } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, ProgressBar } from '@/components/common';
import {
  useTodayMealItems,
  useTodayMeals,
  useNutritionToday,
  useAddMealItem,
  useDeleteMealItem,
  useUpsertMeal,
  useAddWater,
  useUpsertNutritionDaily,
  useFoodItems,
  useInsertFoodItem,
  useMealItemsHistory,
  useNutritionHistory,
  useFoodSearch,
} from '@/features/diet/hooks';
import type { FoodItem, FoodSearchResult, NewFoodItemInput } from '@/features/diet/types';
import { lookupBarcode } from '@/features/diet/api';
import { useBarcode } from '@/features/diet/useBarcode';

const TABS = [
  { id: 'dzisiaj',  label: 'Dzisiaj',   icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
  { id: 'historia', label: 'Historia',  icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
  { id: 'produkty', label: 'Produkty',  icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id: 'cele',     label: 'Cele',      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
];

const MEAL_KEYS = ['Sniadanie', 'Obiad', 'Kolacja', 'Przekaska'] as const;
type MealName = typeof MEAL_KEYS[number];

const MEAL_LABELS: Record<MealName, string> = {
  'Sniadanie': 'Sniadanie',
  'Obiad':     'Obiad',
  'Kolacja':   'Kolacja',
  'Przekaska': 'Przekaska',
};

const MEAL_ICONS: Record<MealName, string> = {
  'Sniadanie': '🌅',
  'Obiad':     '☀️',
  'Kolacja':   '🌙',
  'Przekaska': '🍎',
};

const DEFAULTS = { kcal: 2500, protein: 180, carb: 240, fat: 70, water: 2500 };

// ─── MacroBadge ──────────────────────────────────────────────
function MacroBadge({ kcal, protein, carb, fat }: { kcal: number; protein: number; carb: number; fat: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, background: 'var(--surface-3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, flexWrap: 'wrap' }}>
      <span>🔥 <strong>{Math.round(kcal)}</strong> kcal</span>
      <span style={{ color: '#3B82F6' }}>B <strong>{protein.toFixed(1)}g</strong></span>
      <span style={{ color: '#F59E0B' }}>W <strong>{carb.toFixed(1)}g</strong></span>
      <span style={{ color: '#EF4444' }}>T <strong>{fat.toFixed(1)}g</strong></span>
    </div>
  );
}

// ─── FoodSearchDropdown ───────────────────────────────────────
type SearchEntry =
  | { source: 'local'; item: FoodItem }
  | { source: 'builtin'; item: FoodSearchResult }
  | { source: 'xl'; item: FoodSearchResult }
  | { source: 'external'; item: FoodSearchResult };

interface FoodSearchDropdownProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (entry: SearchEntry) => void;
  placeholder?: string;
}

function FoodSearchDropdown({ query, onQueryChange, onSelect, placeholder }: FoodSearchDropdownProps) {
  const { results, isSearching } = useFoodSearch(query);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          value={query}
          onChange={e => { onQueryChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Szukaj produktu...'}
          autoComplete="off"
        />
        {isSearching && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-3)' }}>
            Szukam...
          </span>
        )}
      </div>
      {showDropdown && (
        <div style={{
          position: 'absolute', zIndex: 100, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 260, overflowY: 'auto',
        }}>
          {results.length === 0 && !isSearching && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink-3)' }}>Brak wynikow dla "{query}"</div>
          )}
          {results.map((entry, i) => {
            const name = entry.item.name;
            const macros = entry.source === 'local'
              ? { kcal: entry.item.kcal, protein: entry.item.protein, carb: entry.item.carb, fat: entry.item.fat, per_amount: entry.item.per_amount, unit: entry.item.unit }
              : { kcal: entry.item.kcal, protein: entry.item.protein, carb: entry.item.carb, fat: entry.item.fat, per_amount: entry.item.per_amount, unit: entry.item.unit };
            return (
              <button
                key={`${entry.source}-${i}`}
                onMouseDown={() => { onSelect(entry); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--ink)',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-inset)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                  {Math.round(macros.kcal)} kcal / {macros.per_amount}{macros.unit}
                </span>
                {(entry.source === 'builtin' || entry.source === 'xl' || entry.source === 'external') && (
                  <span style={{ fontSize: 10, background: 'var(--surface-3)', color: 'var(--ink-2)', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{entry.source === 'builtin' || entry.source === 'xl' ? 'PL' : 'OFF'}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const { data: items = [], isLoading: loadingItems } = useTodayMealItems();
  const { data: meals = [] } = useTodayMeals();
  const { data: nutrition } = useNutritionToday();
  const deleteMealItem = useDeleteMealItem();
  const addWater200 = useAddWater(200);
  const addWater300 = useAddWater(300);
  const addWater500 = useAddWater(500);

  const [showAdd, setShowAdd] = useState(false);
  const [defaultMeal, setDefaultMeal] = useState<MealName>('Sniadanie');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const kcalTarget  = nutrition?.kcal_target    ?? DEFAULTS.kcal;
  const protTarget  = nutrition?.protein_target ?? DEFAULTS.protein;
  const carbTarget  = nutrition?.carb_target    ?? DEFAULTS.carb;
  const fatTarget   = nutrition?.fat_target     ?? DEFAULTS.fat;
  const waterTarget = DEFAULTS.water;
  const waterMl     = nutrition?.water_ml ?? 0;

  const totals = items.reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carb: acc.carb + e.carb, fat: acc.fat + e.fat }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 }
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
      <div className="col">
        {loadingItems
          ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 12 }} />)
          : MEAL_KEYS.map(mealName => {
              const mealRecord = meals.find(m => m.name === mealName);
              const entries = mealRecord ? items.filter(e => e.meal_id === mealRecord.id) : [];
              const mealKcal = entries.reduce((s, e) => s + e.kcal, 0);
              return (
                <div key={mealName} className="card">
                  <div className="card-head">
                    <span className="card-title">{MEAL_ICONS[mealName]} {MEAL_LABELS[mealName]}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>{Math.round(mealKcal)} kcal</span>
                      <button className="btn btn-primary btn-sm" onClick={() => { setDefaultMeal(mealName); setShowAdd(true); }}>+ Dodaj</button>
                    </div>
                  </div>
                  {entries.length === 0
                    ? <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '8px 0', textAlign: 'center' }}>Brak wpisow</div>
                    : (
                      <table className="table">
                        <thead><tr><th>PRODUKT</th><th style={{ textAlign: 'right' }}>ILOSC</th><th style={{ textAlign: 'right' }}>KCAL</th><th style={{ textAlign: 'right' }}>B</th><th style={{ textAlign: 'right' }}>W</th><th style={{ textAlign: 'right' }}>T</th><th></th></tr></thead>
                        <tbody>
                          {entries.map(e => (
                            <tr key={e.id}>
                              <td style={{ fontWeight: 500 }}>{e.name}</td>
                              <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 13 }}>{e.amount}g</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(e.kcal)}</td>
                              <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.protein.toFixed(1)}g</td>
                              <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.carb.toFixed(1)}g</td>
                              <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.fat.toFixed(1)}g</td>
                              <td><button className="icon-btn" style={{ fontSize: 12 }} onClick={() => setDeleteId(e.id)}>x</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>
              );
            })
        }
      </div>

      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Podsumowanie</span></div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-3)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green-mid)" strokeWidth="3"
                  strokeDasharray={`${Math.min((totals.kcal / kcalTarget) * 100, 100)} 100`}
                  strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{Math.round(totals.kcal)}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>kcal</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 14 }}>
            Cel: {kcalTarget} · Pozostalo: <strong style={{ color: 'var(--green-text)' }}>{Math.max(0, kcalTarget - Math.round(totals.kcal))}</strong> kcal
          </div>
          {[
            { label: 'Bialko',       val: totals.protein, goal: protTarget, color: '#3B82F6' },
            { label: 'Weglowodany', val: totals.carb,    goal: carbTarget, color: '#F59E0B' },
            { label: 'Tluszcze',    val: totals.fat,     goal: fatTarget,  color: '#EF4444' },
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
          <div className="card-head"><span className="card-title">Nawodnienie</span></div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{(waterMl / 1000).toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)' }}> / {(waterTarget / 1000).toFixed(1)} L</span></div>
          </div>
          <ProgressBar value={waterMl} max={waterTarget} size="md" />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => addWater200.mutate()}>+200ml</button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => addWater300.mutate()}>+300ml</button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => addWater500.mutate()}>+500ml</button>
          </div>
        </div>
      </div>

      <AddMealModal open={showAdd} defaultMeal={defaultMeal} onClose={() => setShowAdd(false)} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteMealItem.mutate(deleteId!); setDeleteId(null); }} label="ten wpis" />
    </div>
  );
}

// ─── AddMealModal ─────────────────────────────────────────────

function AddMealModal({ open, defaultMeal, onClose }: { open: boolean; defaultMeal: MealName; onClose: () => void }) {
  const addMealItem = useAddMealItem();
  const upsertMeal = useUpsertMeal();
  const insertFoodItemMut = useInsertFoodItem();

  const [meal, setMeal] = useState<MealName>(defaultMeal);
  const [query, setQuery] = useState('');
  const [amount, setAmount] = useState(100);
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carb, setCarb] = useState(0);
  const [fat, setFat] = useState(0);
  const [perAmount, setPerAmount] = useState(100);
  const [selectedName, setSelectedName] = useState('');
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);
  const [mode, setMode] = useState<'search' | 'manual' | 'scan'>('search');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  useEffect(() => { setMeal(defaultMeal); }, [defaultMeal]);

  function handleSelect(entry: SearchEntry) {
    const item = entry.item;
    setQuery(item.name);
    setSelectedName(item.name);
    setPerAmount(item.per_amount);
    setSelectedExternalId(entry.source !== 'local' ? (entry.item as FoodSearchResult).external_id : null);
    const ratio = amount / item.per_amount;
    setKcal(Math.round(item.kcal * ratio));
    setProtein(+(item.protein * ratio).toFixed(1));
    setCarb(+(item.carb * ratio).toFixed(1));
    setFat(+(item.fat * ratio).toFixed(1));
  }

  function handleAmountChange(val: number) {
    setAmount(val);
    if (selectedName) {
      const ratio = val / perAmount;
      const base = { kcal: kcal / (amount / perAmount), protein: protein / (amount / perAmount), carb: carb / (amount / perAmount), fat: fat / (amount / perAmount) };
      setKcal(Math.round(base.kcal * ratio));
      setProtein(+(base.protein * ratio).toFixed(1));
      setCarb(+(base.carb * ratio).toFixed(1));
      setFat(+(base.fat * ratio).toFixed(1));
    }
  }

  const barcode = useBarcode(async (code) => {
    setBarcodeLoading(true);
    setBarcodeError(null);
    try {
      const result = await lookupBarcode(code);
      if (!result) {
        setBarcodeError(`Nie znaleziono produktu o kodzie ${code}`);
      } else {
        const ratio = amount / result.per_amount;
        setSelectedName(result.name);
        setQuery(result.name);
        setPerAmount(result.per_amount);
        setSelectedExternalId(result.external_id);
        setKcal(Math.round(result.kcal * ratio));
        setProtein(+(result.protein * ratio).toFixed(1));
        setCarb(+(result.carb * ratio).toFixed(1));
        setFat(+(result.fat * ratio).toFixed(1));
        setMode('search');
      }
    } catch {
      setBarcodeError('Błąd podczas wyszukiwania produktu');
    } finally {
      setBarcodeLoading(false);
    }
  });

  function resetForm() {
    setQuery(''); setSelectedName(''); setSelectedExternalId(null);
    setAmount(100); setKcal(0); setProtein(0); setCarb(0); setFat(0); setPerAmount(100);
    setBarcodeError(null); barcode.stop();
  }

  async function handleSave() {
    const name = mode === 'search' ? (selectedName || query) : query;
    if (!name.trim()) return;
    const mealRecord = await upsertMeal.mutateAsync(meal);
    await addMealItem.mutateAsync({ name, kcal, protein, carb, fat, amount, meal_id: mealRecord.id });
    resetForm();
    onClose();
  }

  const saving = upsertMeal.isPending || addMealItem.isPending;
  const macrosReady = kcal > 0 || protein > 0 || carb > 0 || fat > 0;

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Dodaj produkt"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={() => { resetForm(); onClose(); }}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !(query.trim() || selectedName)}>
          {saving ? 'Zapisuje...' : 'Dodaj'}
        </button>
      </>}>
      <Field label="Posilek">
        <select className="select" value={meal} onChange={e => setMeal(e.target.value as MealName)}>
          {MEAL_KEYS.map(k => <option key={k} value={k}>{MEAL_ICONS[k]} {MEAL_LABELS[k]}</option>)}
        </select>
      </Field>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {([
          ['search', 'Szukaj'],
          ['scan', '📷 Skanuj'],
          ['manual', 'Ręcznie'],
        ] as const).map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); if (m === 'scan') { barcode.start(); } else { barcode.stop(); } }}
            style={{ padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === m ? 'var(--acc-solid)' : 'var(--surface-3)', color: mode === m ? 'var(--on-acc)' : 'var(--ink-2)' }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'scan' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
            <video ref={barcode.videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: barcode.scanning ? 'block' : 'none' }} />
            {!barcode.scanning && !barcodeLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#fff' }}>
                <span style={{ fontSize: 36 }}>📷</span>
                <button className="btn btn-primary btn-sm" onClick={() => barcode.start()}>Uruchom kamerę</button>
              </div>
            )}
            {barcodeLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: '#fff', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14 }}>Szukam produktu…</span>
              </div>
            )}
            {barcode.scanning && (
              <div style={{ position: 'absolute', left: '10%', right: '10%', top: '40%', bottom: '40%', border: '2px solid var(--acc-solid)', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
            )}
          </div>
          {(barcode.error || barcodeError) && (
            <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>{barcode.error ?? barcodeError}</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>Skieruj kamerę na kod kreskowy EAN lub QR produktu</p>
        </div>
      ) : mode === 'search' ? (
        <>
          <Field label="Produkt" required>
            <FoodSearchDropdown query={query} onQueryChange={q => { setQuery(q); if (q !== selectedName) setSelectedName(''); }} onSelect={handleSelect} />
          </Field>
          <Field label="Ilosc (g)">
            <input type="number" className="input" value={amount} onChange={e => handleAmountChange(+e.target.value)} min={1} />
          </Field>
          {macrosReady && <MacroBadge kcal={kcal} protein={protein} carb={carb} fat={fat} />}
          {selectedExternalId && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8, fontSize: 11 }}
              onClick={async () => {
                if (!selectedName) return;
                await insertFoodItemMut.mutateAsync({ name: selectedName, kcal: Math.round(kcal / (amount / perAmount) * 100) / 100, protein: +(protein / (amount / perAmount)).toFixed(2), carb: +(carb / (amount / perAmount)).toFixed(2), fat: +(fat / (amount / perAmount)).toFixed(2), per_amount: perAmount, unit: 'g' });
                setSelectedExternalId(null);
              }}
              disabled={insertFoodItemMut.isPending}
            >
              {insertFoodItemMut.isPending ? 'Zapisuje...' : 'Zapisz do mojej biblioteki'}
            </button>
          )}
        </>
      ) : (
        <div className="form-grid">
          <Field label="Nazwa produktu" required><input className="input" value={query} onChange={e => setQuery(e.target.value)} /></Field>
          <Field label="Ilosc (g)"><input type="number" className="input" value={amount} onChange={e => setAmount(+e.target.value)} /></Field>
          <Field label="Kcal"><input type="number" className="input" value={kcal} onChange={e => setKcal(+e.target.value)} /></Field>
          <Field label="Bialko (g)"><input type="number" className="input" value={protein} onChange={e => setProtein(+e.target.value)} step={0.1} /></Field>
          <Field label="Weglowodany (g)"><input type="number" className="input" value={carb} onChange={e => setCarb(+e.target.value)} step={0.1} /></Field>
          <Field label="Tluszcze (g)"><input type="number" className="input" value={fat} onChange={e => setFat(+e.target.value)} step={0.1} /></Field>
        </div>
      )}
    </Modal>
  );
}

// ─── HISTORIA ─────────────────────────────────────────────────

function DietHistoria() {
  const { data: items = [], isLoading } = useMealItemsHistory();
  const { data: nutritionHistory = [] } = useNutritionHistory();

  const nutritionByDate = useMemo(() => {
    const m: Record<string, typeof nutritionHistory[0]> = {};
    nutritionHistory.forEach(n => { m[n.date] = n; });
    return m;
  }, [nutritionHistory]);

  const byDate = useMemo(() => {
    const map: Record<string, typeof items> = {};
    items.forEach(e => {
      const d = e.created_at.split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [items]);

  if (isLoading) return <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />;
  if (byDate.length === 0) return <EmptyState title="Brak historii" desc="Zacznij logowac posilki." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
      {byDate.map(([date, entries]) => {
        const t = entries.reduce(
          (acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carb: acc.carb + e.carb, fat: acc.fat + e.fat }),
          { kcal: 0, protein: 0, carb: 0, fat: 0 }
        );
        const kcalTarget = nutritionByDate[date]?.kcal_target ?? DEFAULTS.kcal;
        const pct = Math.round((t.kcal / kcalTarget) * 100);
        return (
          <div key={date} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, fontWeight: 700 }}>{new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--ink-3)' }}>
                <span>🔥 <strong style={{ color: 'var(--ink)' }}>{Math.round(t.kcal)}</strong> kcal</span>
                <span>B: {t.protein.toFixed(0)}g</span>
                <span>W: {t.carb.toFixed(0)}g</span>
                <span>T: {t.fat.toFixed(0)}g</span>
              </div>
            </div>
            <ProgressBar value={t.kcal} max={kcalTarget} size="sm" color={pct > 110 ? 'var(--p-high)' : 'var(--green-mid)'} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>{pct}% celu</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PRODUKTY ─────────────────────────────────────────────────

function DietProdukty() {
  const { data: foodItems = [], isLoading } = useFoodItems();
  const insertFoodItem = useInsertFoodItem();
  const [search, setSearch] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [form, setForm] = useState<NewFoodItemInput>({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, per_amount: 100, unit: 'g' });

  // FatSecret search panel
  const [fsQuery, setFsQuery] = useState('');
  const { results: fsResults, isSearching: fsSearching, error: fsError } = useFoodSearch(fsQuery);
  const externalOnly = fsResults.filter(r => r.source === 'builtin' || r.source === 'xl' || r.source === 'external');

  const filtered = foodItems.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSaveManual() {
    if (!form.name.trim()) return;
    await insertFoodItem.mutateAsync(form);
    setForm({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, per_amount: 100, unit: 'g' });
    setShowAddManual(false);
  }

  async function handleSaveExternal(item: FoodSearchResult) {
    await insertFoodItem.mutateAsync({ name: item.name, kcal: item.kcal, protein: item.protein, carb: item.carb, fat: item.fat, per_amount: item.per_amount, unit: item.unit });
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {/* My library */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <input className="input" style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj w mojej bibliotece..." />
        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddManual(true)}>+ Recznie</button>
      </div>
      {isLoading ? (
        <div className="skeleton" style={{ height: 150, borderRadius: 12, marginBottom: 16 }} />
      ) : filtered.length === 0 && !search ? null : filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>Brak wynikow w bibliotece.</p>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head"><span className="card-title">Moja biblioteka</span></div>
          <table className="table">
            <thead>
              <tr><th>PRODUKT</th><th style={{ textAlign: 'right' }}>NA</th><th style={{ textAlign: 'right' }}>KCAL</th><th style={{ textAlign: 'right' }}>B</th><th style={{ textAlign: 'right' }}>W</th><th style={{ textAlign: 'right' }}>T</th></tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.name}</td>
                  <td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{f.per_amount}{f.unit}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{f.kcal}</td>
                  <td style={{ textAlign: 'right', color: '#3B82F6', fontSize: 13 }}>{f.protein}g</td>
                  <td style={{ textAlign: 'right', color: '#F59E0B', fontSize: 13 }}>{f.carb}g</td>
                  <td style={{ textAlign: 'right', color: '#EF4444', fontSize: 13 }}>{f.fat}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FatSecret search */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Szukaj w bazie FatSecret</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>baza polska</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input className="input" value={fsQuery} onChange={e => setFsQuery(e.target.value)} placeholder="Np. kurczak, jajko, chleb..." />
        </div>
        {fsSearching && <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '8px 0' }}>Szukam...</div>}
        {fsError && <div style={{ fontSize: 12, color: 'var(--p-high)', padding: '8px 12px', background: 'var(--surface-3)', borderRadius: 8 }}>Blad: {fsError}</div>}
        {!fsSearching && fsQuery && externalOnly.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>Brak wynikow.</p>
        )}
        {externalOnly.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {externalOnly.map((entry, i) => {
              const item = entry.item as FoodSearchResult;
              const alreadySaved = foodItems.some(f => f.name.toLowerCase() === item.name.toLowerCase());
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      {Math.round(item.kcal)} kcal · B {item.protein.toFixed(1)}g · W {item.carb.toFixed(1)}g · T {item.fat.toFixed(1)}g / {item.per_amount}{item.unit}
                    </div>
                  </div>
                  {alreadySaved ? (
                    <span style={{ fontSize: 11, color: 'var(--green-text)' }}>Zapisano</span>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSaveExternal(item)}
                      disabled={insertFoodItem.isPending}
                      style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                    >
                      + Dodaj do biblioteki
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual add modal */}
      <Modal open={showAddManual} onClose={() => setShowAddManual(false)} title="Dodaj produkt recznie"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddManual(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveManual} disabled={insertFoodItem.isPending}>
            {insertFoodItem.isPending ? 'Zapisuje...' : 'Zapisz'}
          </button>
        </>}>
        <div className="form-grid">
          <Field label="Nazwa" required><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Na ilosc"><input type="number" className="input" value={form.per_amount} onChange={e => setForm(f => ({ ...f, per_amount: +e.target.value }))} /></Field>
          <Field label="Jednostka"><input className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></Field>
          <Field label="Kcal"><input type="number" className="input" value={form.kcal} onChange={e => setForm(f => ({ ...f, kcal: +e.target.value }))} /></Field>
          <Field label="Bialko (g)"><input type="number" className="input" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: +e.target.value }))} step={0.1} /></Field>
          <Field label="Weglowodany (g)"><input type="number" className="input" value={form.carb} onChange={e => setForm(f => ({ ...f, carb: +e.target.value }))} step={0.1} /></Field>
          <Field label="Tluszcze (g)"><input type="number" className="input" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: +e.target.value }))} step={0.1} /></Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── CELE ─────────────────────────────────────────────────────

function DietCele() {
  const { data: nutrition } = useNutritionToday();
  const upsert = useUpsertNutritionDaily();

  const [kcal, setKcal] = useState(DEFAULTS.kcal);
  const [protein, setProtein] = useState(DEFAULTS.protein);
  const [carb, setCarb] = useState(DEFAULTS.carb);
  const [fat, setFat] = useState(DEFAULTS.fat);
  const [water, setWater] = useState(DEFAULTS.water);
  const [saved, setSaved] = useState(false);
  const [synced, setSynced] = useState(false);

  if (nutrition && !synced) {
    setKcal(nutrition.kcal_target);
    setProtein(nutrition.protein_target);
    setCarb(nutrition.carb_target);
    setFat(nutrition.fat_target);
    setSynced(true);
  }

  const totalMacroKcal = protein * 4 + carb * 4 + fat * 9;

  async function handleSave() {
    await upsert.mutateAsync({ kcal_target: kcal, protein_target: protein, carb_target: carb, fat_target: fat, water_ml: water });
    setSaved(true);
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="card">
        <div className="card-head"><span className="card-title">Cele zywieniowe</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Kalorie dziennie (kcal)"><input type="number" className="input" value={kcal} onChange={e => { setKcal(+e.target.value); setSaved(false); }} step={50} /></Field>
          <Field label="Bialko (g)"><input type="number" className="input" value={protein} onChange={e => { setProtein(+e.target.value); setSaved(false); }} step={5} /></Field>
          <Field label="Weglowodany (g)"><input type="number" className="input" value={carb} onChange={e => { setCarb(+e.target.value); setSaved(false); }} step={5} /></Field>
          <Field label="Tluszcze (g)"><input type="number" className="input" value={fat} onChange={e => { setFat(+e.target.value); setSaved(false); }} step={5} /></Field>
          <Field label="Woda (ml/dzien)"><input type="number" className="input" value={water} onChange={e => { setWater(+e.target.value); setSaved(false); }} step={250} /></Field>
          {totalMacroKcal > 0 && (
            <div style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Rozklad makroskladnikow</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Bialko',   pct: Math.round((protein * 4 / totalMacroKcal) * 100), color: '#3B82F6' },
                  { label: 'Wegle',    pct: Math.round((carb * 4 / totalMacroKcal) * 100),    color: '#F59E0B' },
                  { label: 'Tluszcze', pct: Math.round((fat * 9 / totalMacroKcal) * 100),     color: '#EF4444' },
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
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? 'Zapisuje...' : 'Zapisz cele'}
            </button>
          </div>
          {saved && <div style={{ color: 'var(--acc-a-ink)', fontSize: 12, textAlign: 'right' }}>Zapisano</div>}
        </div>
      </div>
    </div>
  );
}
