import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, ProgressBar, PageHeader, MoreMenu, SubTabs } from '@/components/common';
import {
  useAddMealItem,
  useAddWater,
  useDeleteFoodItem,
  useDeleteMealItem,
  useFoodItems,
  useFoodSearch,
  useInsertFoodItem,
  useMealItemsHistory,
  useNutritionHistory,
  useNutritionToday,
  useTodayMealItems,
  useTodayMeals,
  useUpdateFoodItem,
  useUpdateMealItem,
  useUpsertMeal,
  useUpsertNutritionDaily,
} from '@/features/diet/hooks';
import type { FoodItem, FoodSearchResult, MealItem, NewFoodItemInput, NutritionDaily } from '@/features/diet/types';
import { lookupBarcode } from '@/features/diet/api';
import { useBarcode } from '@/features/diet/useBarcode';

const DEFAULT_MEALS = ['Sniadanie', 'Obiad', 'Kolacja', 'Przekaska'];
const DEFAULTS = { kcal: 2500, protein: 180, carb: 240, fat: 70, water: 2500 };
const DIET_CONFIG_KEY = 'rootine.diet.config';
const MEAL_TEMPLATES_KEY = 'rootine.diet.mealTemplates';
const FOOD_META_KEY = 'rootine.diet.foodMeta';

type DietViewMode = 'day' | 'week' | 'month';
type SearchEntry =
  | { source: 'local'; item: FoodItem }
  | { source: 'builtin'; item: FoodSearchResult }
  | { source: 'xl'; item: FoodSearchResult }
  | { source: 'external'; item: FoodSearchResult };

type MealTemplateItem = Pick<MealItem, 'name' | 'kcal' | 'protein' | 'carb' | 'fat' | 'amount'>;
interface MealTemplate { id: string; name: string; items: MealTemplateItem[]; createdAt: string }
interface DietConfig { kcal: number; protein: number; carb: number; fat: number; water: number; meals: string[]; goalMode: 'fixed' | 'weight'; productCategories: string[] }
interface FoodMeta { brand?: string; category?: string }

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayStr() { return toDateStr(new Date()); }
function addDays(date: string, delta: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + delta); return toDateStr(d); }
function fmtDate(date: string, long = false) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' });
}
function loadJson<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; } }
function uid(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function computeTotals(items: Pick<MealItem, 'kcal' | 'protein' | 'carb' | 'fat'>[]) {
  return items.reduce((acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carb: acc.carb + e.carb, fat: acc.fat + e.fat }), { kcal: 0, protein: 0, carb: 0, fat: 0 });
}

function MacroBadge({ kcal, protein, carb, fat }: { kcal: number; protein: number; carb: number; fat: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, background: 'var(--surface-3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, flexWrap: 'wrap' }}>
      <span><strong>{Math.round(kcal)}</strong> kcal</span>
      <span style={{ color: 'var(--tone-blue)' }}>B <strong>{protein.toFixed(1)}g</strong></span>
      <span style={{ color: 'var(--tone-amber)' }}>W <strong>{carb.toFixed(1)}g</strong></span>
      <span style={{ color: 'var(--tone-pink)' }}>T <strong>{fat.toFixed(1)}g</strong></span>
    </div>
  );
}

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
    function onDown(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input className="input" value={query} onChange={e => { onQueryChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder ?? 'Szukaj produktu...'} autoComplete="off" />
      {isSearching && <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 11, color: 'var(--ink-3)' }}>Szukam...</span>}
      {open && query.trim() && (
        <div style={{ position: 'absolute', zIndex: 100, top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.18)', maxHeight: 260, overflowY: 'auto' }}>
          {results.length === 0 && !isSearching && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink-3)' }}>Brak wynikow dla "{query}"</div>}
          {results.map((entry, i) => (
            <button key={`${entry.source}-${i}`} onMouseDown={() => { onSelect(entry); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink)', borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{entry.item.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{Math.round(entry.item.kcal)} kcal / {entry.item.per_amount}{entry.item.unit}</span>
              {entry.source !== 'local' && <span style={{ fontSize: 10, background: 'var(--surface-3)', color: 'var(--ink-2)', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{entry.source === 'external' ? 'OFF' : 'PL'}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DietHeaderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 11v11M11 2v20M19 2c-1.66 0-3 2-3 5s1.34 5 3 5v10" />
    </svg>
  );
}

export function DietScreen() {
  return (
    <div className="module-page">
      <DietHub />
    </div>
  );
}

type DietTab = 'day' | 'week' | 'month' | 'products' | 'templates';
const DIET_TABS = [
  { id: 'day', label: 'Dzień' },
  { id: 'week', label: 'Tydzień' },
  { id: 'month', label: 'Miesiąc' },
  { id: 'products', label: 'Produkty' },
  { id: 'templates', label: 'Szablony' },
];

function DietHub() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState<DietViewMode>('day');
  const [tab, setTab] = useState<DietTab>('day');
  const [config, setConfig] = useState<DietConfig>(() => loadJson(DIET_CONFIG_KEY, { ...DEFAULTS, meals: DEFAULT_MEALS, goalMode: 'fixed', productCategories: ['Nabial', 'Mieso', 'Warzywa', 'Owoce', 'Produkty suche', 'Gotowe'] }));
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(() => loadJson(MEAL_TEMPLATES_KEY, []));
  const [foodMeta, setFoodMeta] = useState<Record<string, FoodMeta>>(() => loadJson(FOOD_META_KEY, {}));
  const { data: items = [], isLoading: loadingItems } = useTodayMealItems(selectedDate);
  const { data: meals = [] } = useTodayMeals(selectedDate);
  const { data: nutrition } = useNutritionToday(selectedDate);
  const { data: historyItems = [] } = useMealItemsHistory();
  const { data: nutritionHistory = [] } = useNutritionHistory();
  const { data: foodItems = [] } = useFoodItems();
  const deleteMealItem = useDeleteMealItem(selectedDate);
  const updateMealItem = useUpdateMealItem(selectedDate);
  const addMealItem = useAddMealItem(selectedDate);
  const upsertMeal = useUpsertMeal(selectedDate);
  const addWater200 = useAddWater(200, selectedDate);
  const addWater300 = useAddWater(300, selectedDate);
  const addWater500 = useAddWater(500, selectedDate);
  const [showAdd, setShowAdd] = useState(false);
  const [defaultMeal, setDefaultMeal] = useState(config.meals[0] ?? DEFAULT_MEALS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  useEffect(() => { localStorage.setItem(DIET_CONFIG_KEY, JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem(MEAL_TEMPLATES_KEY, JSON.stringify(mealTemplates)); }, [mealTemplates]);
  useEffect(() => { localStorage.setItem(FOOD_META_KEY, JSON.stringify(foodMeta)); }, [foodMeta]);
  const targets = { kcal: nutrition?.kcal_target ?? config.kcal, protein: nutrition?.protein_target ?? config.protein, carb: nutrition?.carb_target ?? config.carb, fat: nutrition?.fat_target ?? config.fat, water: config.water };
  const waterMl = nutrition?.water_ml ?? 0;
  const totals = computeTotals(items);
  function shiftDate(delta: number) { setSelectedDate(addDays(selectedDate, delta * (viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30))); }
  function saveTemplateFromMeal(mealName: string) {
    const mealRecord = meals.find(m => m.name === mealName);
    const entries = mealRecord ? items.filter(e => e.meal_id === mealRecord.id) : [];
    if (!entries.length) return;
    const name = window.prompt('Nazwa szablonu posilku', mealName);
    if (name?.trim()) setMealTemplates(prev => [...prev, { id: uid('meal_tpl'), name: name.trim(), createdAt: new Date().toISOString(), items: entries.map(e => ({ name: e.name, kcal: e.kcal, protein: e.protein, carb: e.carb, fat: e.fat, amount: e.amount })) }]);
  }
  async function copyMeal(mealName: string) {
    const mealRecord = meals.find(m => m.name === mealName);
    const entries = mealRecord ? items.filter(e => e.meal_id === mealRecord.id) : [];
    if (!entries.length) return;
    const meal = await upsertMeal.mutateAsync(mealName);
    for (const entry of entries) {
      await addMealItem.mutateAsync({
        meal_id: meal.id,
        food_item_id: entry.food_item_id,
        name: entry.name,
        amount: entry.amount,
        kcal: entry.kcal,
        protein: entry.protein,
        carb: entry.carb,
        fat: entry.fat,
      });
    }
  }
  async function addTemplateToDefaultMeal(tpl: MealTemplate) {
    const meal = await upsertMeal.mutateAsync(defaultMeal || config.meals[0] || DEFAULT_MEALS[0]);
    for (const item of tpl.items) {
      await addMealItem.mutateAsync({ ...item, meal_id: meal.id });
    }
  }
  async function clearMeal(mealName: string) {
    const mealRecord = meals.find(m => m.name === mealName);
    const entries = mealRecord ? items.filter(e => e.meal_id === mealRecord.id) : [];
    if (!entries.length) return;
    if (!window.confirm(`Wyczyścić wszystkie produkty z posiłku „${mealName}"?`)) return;
    for (const entry of entries) await deleteMealItem.mutateAsync(entry.id);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        icon={<DietHeaderIcon />}
        title="Dieta"
        desc="Posiłki, makroskładniki i nawodnienie w jednym miejscu."
        actions={(tab === 'day' || tab === 'week' || tab === 'month')
          ? <button className="btn btn-primary btn-sm" onClick={() => { setDefaultMeal(config.meals[0] ?? DEFAULT_MEALS[0]); setShowAdd(true); }}>+ Dodaj produkt</button>
          : tab === 'templates'
            ? <button className="btn btn-primary btn-sm" onClick={() => setShowTemplateModal(true)}>+ Nowy szablon</button>
            : undefined}
      />

      <SubTabs tabs={DIET_TABS} active={tab} onChange={(id) => { setTab(id as DietTab); if (id === 'day' || id === 'week' || id === 'month') setViewMode(id as DietViewMode); }} />

      {(tab === 'day' || tab === 'week' || tab === 'month') && (
        <DateToolbar selectedDate={selectedDate} onPrev={() => shiftDate(-1)} onNext={() => shiftDate(1)} onToday={() => setSelectedDate(todayStr())} onPick={setSelectedDate} />
      )}

      {tab === 'day' && (
        <div className="diet-day-grid">
          <div className="col" style={{ minWidth: 0 }}>
            {loadingItems ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12, marginBottom: 12 }} />) : config.meals.map(mealName => {
              const mealRecord = meals.find(m => m.name === mealName);
              const entries = mealRecord ? items.filter(e => e.meal_id === mealRecord.id) : [];
              return <MealCard key={mealName} mealName={mealName} entries={entries} totals={computeTotals(entries)} onAdd={() => { setDefaultMeal(mealName); setShowAdd(true); }} onCopy={() => copyMeal(mealName)} onSaveTemplate={() => saveTemplateFromMeal(mealName)} onClear={() => clearMeal(mealName)} onDelete={setDeleteId} onAmount={(entry, amount) => {
                if (amount <= 0 || amount === entry.amount) return;
                const ratio = amount / entry.amount;
                updateMealItem.mutate({ id: entry.id, patch: { amount, kcal: entry.kcal * ratio, protein: entry.protein * ratio, carb: entry.carb * ratio, fat: entry.fat * ratio } });
              }} />;
            })}
          </div>
          <div className="col diet-side-sticky">
            <SummaryCard totals={totals} targets={targets} waterMl={waterMl} onSettings={() => setShowSettings(true)} />
            <WaterCard waterMl={waterMl} target={targets.water} on200={() => addWater200.mutate()} on300={() => addWater300.mutate()} on500={() => addWater500.mutate()} />
            <MealTemplatesCard templates={mealTemplates} onUse={addTemplateToDefaultMeal} onDelete={(id) => setMealTemplates(prev => prev.filter(t => t.id !== id))} />
          </div>
        </div>
      )}

      {(tab === 'week' || tab === 'month') && (
        <PeriodSummary selectedDate={selectedDate} viewMode={viewMode} items={historyItems} nutrition={nutritionHistory} targets={targets} currentDayItems={items} />
      )}

      {tab === 'products' && (
        <ProductLibraryPanel foodItems={foodItems} meta={foodMeta} setMeta={setFoodMeta} categories={config.productCategories} setCategories={(productCategories) => setConfig(c => ({ ...c, productCategories }))} />
      )}

      {tab === 'templates' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-head"><span className="card-title">Własne posiłki (szablony)</span><button className="btn btn-primary btn-sm" onClick={() => setShowTemplateModal(true)}>+ Nowy szablon</button></div>
          {!mealTemplates.length ? (
            <EmptyState title="Brak szablonów" desc="Zapisz posiłek jako szablon, aby szybko go ponownie dodać." cta="Nowy szablon" onCta={() => setShowTemplateModal(true)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mealTemplates.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-3)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.items.length} produktów · {Math.round(computeTotals(t.items).kcal)} kcal</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => addTemplateToDefaultMeal(t)}>Dodaj do dnia</button>
                  <button className="icon-btn" onClick={() => setMealTemplates(prev => prev.filter(x => x.id !== t.id))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddMealModal open={showAdd} date={selectedDate} defaultMeal={defaultMeal} mealNames={config.meals} templates={mealTemplates} onClose={() => setShowAdd(false)} />
      <DietSettingsModal open={showSettings} onClose={() => setShowSettings(false)} config={config} setConfig={setConfig} selectedDate={selectedDate} nutrition={nutrition} />
      <MealTemplateModal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} onSave={(tpl) => setMealTemplates(prev => [...prev, tpl])} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteMealItem.mutate(deleteId!); setDeleteId(null); }} label="ten wpis" />
    </div>
  );
}

function DateToolbar({ selectedDate, onPrev, onNext, onToday, onPick }: { selectedDate: string; onPrev: () => void; onNext: () => void; onToday: () => void; onPick: (date: string) => void }) {
  return <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button className="icon-btn" onClick={onPrev}>‹</button><div style={{ minWidth: 240 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Wybrana data</div><div style={{ fontSize: 18, fontWeight: 800 }}>{fmtDate(selectedDate, true)}</div></div><button className="icon-btn" onClick={onNext}>›</button><button className="btn btn-secondary btn-sm" onClick={onToday}>Dzisiaj</button><div className="icon-btn" style={{ position: 'relative' }} title="Wybierz datę"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg><input type="date" value={selectedDate} onChange={e => { if (e.target.value) onPick(e.target.value); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} /></div></div></div>;
}

function MealCard({ mealName, entries, totals, onAdd, onCopy, onSaveTemplate, onClear, onDelete, onAmount }: { mealName: string; entries: MealItem[]; totals: ReturnType<typeof computeTotals>; onAdd: () => void; onCopy: () => void; onSaveTemplate: () => void; onClear: () => void; onDelete: (id: string) => void; onAmount: (entry: MealItem, amount: number) => void }) {
  return <div className="card"><div className="card-head" style={{ flexWrap: 'wrap', gap: 10 }}><span className="card-title">{mealName}</span><div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: 9, fontSize: 12, fontFamily: 'var(--mono)' }}><span style={{ fontWeight: 800, color: 'var(--ink)' }}>{Math.round(totals.kcal)} kcal</span><span style={{ color: 'var(--tone-blue)' }}>B {totals.protein.toFixed(0)}g</span><span style={{ color: 'var(--tone-amber)' }}>W {totals.carb.toFixed(0)}g</span><span style={{ color: 'var(--tone-pink)' }}>T {totals.fat.toFixed(0)}g</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><button className="btn btn-primary btn-sm" onClick={onAdd}>+ Dodaj</button><MoreMenu items={[{ label: 'Kopiuj posiłek', onClick: onCopy, disabled: !entries.length }, { label: 'Zapisz jako szablon', onClick: onSaveTemplate, disabled: !entries.length }, { label: 'Wyczyść posiłek', onClick: onClear, danger: true, disabled: !entries.length }]} /></div></div></div>{!entries.length ? <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '10px 0', textAlign: 'center' }}>Brak wpisów</div> : <table className="table"><thead><tr><th></th><th>PRODUKT</th><th style={{ textAlign: 'right' }}>ILOŚĆ</th><th style={{ textAlign: 'right' }}>KCAL</th><th style={{ textAlign: 'right' }}>B</th><th style={{ textAlign: 'right' }}>W</th><th style={{ textAlign: 'right', paddingRight: 0 }}>T</th></tr></thead><tbody>{entries.map(e => <tr key={e.id}><td style={{ width: 30 }}><button className="icon-btn" style={{ fontSize: 12 }} onClick={() => onDelete(e.id)}>x</button></td><td style={{ fontWeight: 600 }}>{e.name}</td><td style={{ textAlign: 'right' }}><input className="input" type="number" defaultValue={Math.round(e.amount)} onBlur={(ev) => onAmount(e, +ev.currentTarget.value)} style={{ width: 76, height: 30, textAlign: 'right', padding: '4px 8px' }} /></td><td style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(e.kcal)}</td><td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.protein.toFixed(1)}g</td><td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12 }}>{e.carb.toFixed(1)}g</td><td style={{ textAlign: 'right', color: 'var(--ink-3)', fontSize: 12, paddingRight: 0 }}>{e.fat.toFixed(1)}g</td></tr>)}</tbody></table>}</div>;
}

function SummaryCard({ totals, targets, waterMl, onSettings }: { totals: ReturnType<typeof computeTotals>; targets: typeof DEFAULTS; waterMl: number; onSettings: () => void }) {
  const pct = Math.min((totals.kcal / targets.kcal) * 100, 100);
  return <div className="card"><div className="card-head"><span className="card-title">Podsumowanie</span><button className="icon-btn" onClick={onSettings} aria-label="Ustawienia celów">⚙</button></div><div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}><svg viewBox="0 0 36 36" style={{ width: 84, height: 84, transform: 'rotate(-90deg)', flexShrink: 0 }}><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-3)" strokeWidth="3" /><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--green-mid)" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" /></svg><div><div style={{ fontSize: 24, fontWeight: 900 }}>{Math.round(totals.kcal)} / {targets.kcal}</div><div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Pozostało {Math.max(0, targets.kcal - Math.round(totals.kcal))} kcal</div><div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3 }}>Nawodnienie {(waterMl / 1000).toFixed(1)} / {(targets.water / 1000).toFixed(1)} L</div></div></div>{[{ label: 'Białko', val: totals.protein, goal: targets.protein, color: 'var(--tone-blue)' }, { label: 'Węglowodany', val: totals.carb, goal: targets.carb, color: 'var(--tone-amber)' }, { label: 'Tłuszcze', val: totals.fat, goal: targets.fat, color: 'var(--tone-pink)' }].map(m => <div key={m.label} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}><span style={{ fontWeight: 600 }}>{m.label}</span><span style={{ color: 'var(--ink-3)' }}>{m.val.toFixed(0)}/{m.goal}g</span></div><ProgressBar value={m.val} max={m.goal} size="sm" color={m.color} /></div>)}</div>;
}

function WaterCard({ waterMl, target, on200, on300, on500 }: { waterMl: number; target: number; on200: () => void; on300: () => void; on500: () => void }) {
  return <div className="card"><div className="card-head"><span className="card-title">Nawodnienie</span></div><div style={{ textAlign: 'center', marginBottom: 12 }}><div style={{ fontSize: 28, fontWeight: 800 }}>{(waterMl / 1000).toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)' }}> / {(target / 1000).toFixed(1)} L</span></div></div><ProgressBar value={waterMl} max={target} size="md" /><div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={on200}>+200ml</button><button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={on300}>+300ml</button><button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={on500}>+500ml</button></div></div>;
}

function MealTemplatesCard({ templates, onUse, onDelete }: { templates: MealTemplate[]; onUse: (tpl: MealTemplate) => void; onDelete: (id: string) => void }) {
  return <div className="card"><div className="card-head"><span className="card-title">Własne posiłki</span></div>{!templates.length ? <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Brak zapisanych szablonów.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{templates.map(t => <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-3)', borderRadius: 10, padding: '8px 10px' }}><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.items.length} produktów · {Math.round(computeTotals(t.items).kcal)} kcal</div></div><button className="btn btn-secondary btn-sm" onClick={() => onUse(t)}>Użyj</button><button className="icon-btn" onClick={() => onDelete(t.id)}>x</button></div>)}</div>}</div>;
}

function PeriodSummary({ selectedDate, viewMode, items, nutrition, targets, currentDayItems }: { selectedDate: string; viewMode: DietViewMode; items: MealItem[]; nutrition: { date: string; water_ml: number; weight_kg: number | null }[]; targets: typeof DEFAULTS; currentDayItems: MealItem[] }) {
  const dates = useMemo(() => { const len = viewMode === 'week' ? 7 : 30; const start = addDays(selectedDate, -(len - 1)); return Array.from({ length: len }, (_, i) => addDays(start, i)); }, [selectedDate, viewMode]);
  const byDate = useMemo(() => { const map: Record<string, MealItem[]> = {}; items.forEach(e => { const d = e.created_at.split('T')[0]; (map[d] ??= []).push(e); }); map[selectedDate] = currentDayItems; return map; }, [items, currentDayItems, selectedDate]);
  const nutritionByDate = Object.fromEntries(nutrition.map(n => [n.date, n]));
  const daily = dates.map(date => ({ date, totals: computeTotals(byDate[date] ?? []), water: nutritionByDate[date]?.water_ml ?? 0, weight: nutritionByDate[date]?.weight_kg ?? null }));
  const daysWithData = daily.filter(d => d.totals.kcal > 0);
  const divisor = Math.max(daysWithData.length, 1);
  const avg = daysWithData.reduce((a, d) => ({ kcal: a.kcal + d.totals.kcal, protein: a.protein + d.totals.protein, carb: a.carb + d.totals.carb, fat: a.fat + d.totals.fat, water: a.water + d.water }), { kcal: 0, protein: 0, carb: 0, fat: 0, water: 0 });
  const above = daysWithData.filter(d => d.totals.kcal > targets.kcal).length;
  const maxKcal = Math.max(...daily.map(d => d.totals.kcal), targets.kcal, 1);
  return <div className="card"><div className="card-head"><span className="card-title">Podsumowanie {viewMode === 'week' ? 'tygodnia' : 'miesiąca'}</span><span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fmtDate(dates[0])} - {fmtDate(dates[dates.length - 1])}</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 18 }}>{[{ label: 'Śr. kcal', value: Math.round(avg.kcal / divisor) }, { label: 'Śr. białko', value: `${Math.round(avg.protein / divisor)}g` }, { label: 'Śr. węgle', value: `${Math.round(avg.carb / divisor)}g` }, { label: 'Śr. tłuszcz', value: `${Math.round(avg.fat / divisor)}g` }, { label: 'Śr. woda', value: `${(avg.water / divisor / 1000).toFixed(1)} L` }].map(s => <div key={s.label} style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 900, marginTop: 3 }}>{s.value}</div></div>)}</div><div style={{ display: 'flex', gap: 16, marginBottom: 18, fontSize: 13, flexWrap: 'wrap' }}><span>Dni powyżej celu: <strong>{above}</strong></span><span>Dni poniżej celu: <strong>{Math.max(daysWithData.length - above, 0)}</strong></span>{daily.some(d => d.weight) && <span>Trend masy: <strong>{daily.find(d => d.weight)?.weight} kg</strong></span>}</div><div style={{ height: 180, display: 'flex', alignItems: 'end', gap: 4, borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>{daily.map(d => <div key={d.date} title={`${fmtDate(d.date)}: ${Math.round(d.totals.kcal)} kcal`} style={{ flex: 1, minWidth: 6, height: `${Math.max(4, (d.totals.kcal / maxKcal) * 150)}px`, background: d.totals.kcal > targets.kcal ? 'var(--acc)' : 'var(--green-mid)', borderRadius: '6px 6px 2px 2px', opacity: d.totals.kcal ? 1 : .25 }} />)}</div></div>;
}
type AddableFood = {
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  per_amount: number;
  unit: string;
  food_item_id?: string | null;
};

function num(value: string | number | undefined, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function entryToFood(entry: SearchEntry): AddableFood {
  return {
    name: entry.item.name,
    kcal: entry.item.kcal,
    protein: entry.item.protein,
    carb: entry.item.carb,
    fat: entry.item.fat,
    per_amount: entry.item.per_amount || 100,
    unit: entry.item.unit || 'g',
    food_item_id: entry.source === 'local' ? entry.item.id : null,
  };
}

function scaleFood(food: AddableFood, amount: number): MealTemplateItem {
  const ratio = amount / Math.max(food.per_amount, 1);
  return {
    name: food.name,
    amount,
    kcal: food.kcal * ratio,
    protein: food.protein * ratio,
    carb: food.carb * ratio,
    fat: food.fat * ratio,
  };
}

function AddMealModal({ open, date, defaultMeal, mealNames, templates, onClose }: { open: boolean; date: string; defaultMeal: string; mealNames: string[]; templates: MealTemplate[]; onClose: () => void }) {
  const [mode, setMode] = useState<'search' | 'template' | 'scan' | 'manual'>('search');
  const [mealName, setMealName] = useState(defaultMeal);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AddableFood | null>(null);
  const [amount, setAmount] = useState('100');
  const [manual, setManual] = useState({ name: '', amount: '100', kcal: '', protein: '', carb: '', fat: '' });
  const [barcodeMsg, setBarcodeMsg] = useState<string | null>(null);
  const addMealItem = useAddMealItem(date);
  const upsertMeal = useUpsertMeal(date);

  function selectFood(entry: SearchEntry) {
    const food = entryToFood(entry);
    setSelected(food);
    setAmount(String(food.per_amount || 100));
    setQuery(food.name);
    setMode('search');
  }

  const scanner = useBarcode(async (barcode) => {
    setBarcodeMsg(`Kod ${barcode}: szukam produktu...`);
    const found = await lookupBarcode(barcode);
    if (!found) {
      setBarcodeMsg('Nie znaleziono produktu w Open Food Facts.');
      return;
    }
    selectFood({ source: 'external', item: found });
    setBarcodeMsg(`Wczytano: ${found.name}`);
  });

  useEffect(() => {
    if (!open) {
      scanner.stop();
      return;
    }
    setMealName(defaultMeal);
    setMode('search');
    setQuery('');
    setSelected(null);
    setAmount('100');
    setBarcodeMsg(null);
  }, [defaultMeal, open, scanner.stop]);

  async function addScaled(food: AddableFood, rawAmount: number, targetMeal = mealName) {
    if (!targetMeal.trim()) return;
    const meal = await upsertMeal.mutateAsync(targetMeal.trim());
    const scaled = scaleFood(food, rawAmount);
    await addMealItem.mutateAsync({ ...scaled, meal_id: meal.id, food_item_id: food.food_item_id ?? null });
  }

  async function addSelected() {
    if (!selected) return;
    await addScaled(selected, Math.max(num(amount, selected.per_amount), 1));
    setSelected(null);
    setQuery('');
    setAmount('100');
  }

  async function addManual() {
    if (!manual.name.trim()) return;
    const meal = await upsertMeal.mutateAsync(mealName.trim());
    await addMealItem.mutateAsync({
      meal_id: meal.id,
      name: manual.name.trim(),
      amount: Math.max(num(manual.amount, 100), 1),
      kcal: Math.max(num(manual.kcal), 0),
      protein: Math.max(num(manual.protein), 0),
      carb: Math.max(num(manual.carb), 0),
      fat: Math.max(num(manual.fat), 0),
    });
    setManual({ name: '', amount: '100', kcal: '', protein: '', carb: '', fat: '' });
  }

  async function useTemplate(tpl: MealTemplate) {
    const meal = await upsertMeal.mutateAsync(mealName.trim());
    for (const item of tpl.items) {
      await addMealItem.mutateAsync({ ...item, meal_id: meal.id });
    }
  }

  const preview = selected ? scaleFood(selected, Math.max(num(amount, selected.per_amount), 1)) : null;

  return (
    <Modal open={open} onClose={onClose} title={`Dodaj do: ${fmtDate(date)}`} size="lg">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 18, maxWidth: '100%', overflowX: 'hidden' }}>
        <div className="col">
          <Field label="Posiłek">
            <select className="input" value={mealName} onChange={e => setMealName(e.target.value)}>
              {mealNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gap: 8 }}>
            {([
              ['search', 'Produkt'],
              ['template', 'Własny posiłek'],
              ['scan', 'Skaner'],
              ['manual', 'Ręcznie'],
            ] as const).map(([id, label]) => (
              <button key={id} className={`btn btn-sm ${mode === id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode(id)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          {mode === 'search' && (
            <div className="col">
              <Field label="Produkt">
                <FoodSearchDropdown query={query} onQueryChange={setQuery} onSelect={selectFood} />
              </Field>
              {selected ? (
                <div className="card" style={{ margin: 0 }}>
                  <div className="card-head"><span className="card-title">{selected.name}</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, alignItems: 'end' }}>
                    <Field label={`Ilość (${selected.unit})`}>
                      <input className="input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
                    </Field>
                    {preview && <MacroBadge kcal={preview.kcal} protein={preview.protein} carb={preview.carb} fat={preview.fat} />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={addSelected} disabled={addMealItem.isPending || upsertMeal.isPending}>Dodaj produkt</button>
                  </div>
                </div>
              ) : (
                <EmptyState title="Wyszukaj produkt" desc="Wpisz nazwę, wybierz wynik i ustaw gramaturę." />
              )}
            </div>
          )}

          {mode === 'template' && (
            <div className="col">
              {!templates.length ? <EmptyState title="Brak szablonów" desc="Utwórz własny posiłek z poziomu głównego widoku." /> : templates.map(tpl => {
                const totals = computeTotals(tpl.items);
                return (
                  <div key={tpl.id} className="card" style={{ margin: 0 }}>
                    <div className="card-head">
                      <span className="card-title">{tpl.name}</span>
                      <button className="btn btn-primary btn-sm" onClick={() => useTemplate(tpl)}>Dodaj</button>
                    </div>
                    <MacroBadge kcal={totals.kcal} protein={totals.protein} carb={totals.carb} fat={totals.fat} />
                    <div style={{ marginTop: 10, color: 'var(--ink-3)', fontSize: 12 }}>{tpl.items.map(i => i.name).join(', ')}</div>
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'scan' && (
            <div className="col">
              <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface-inset)' }}>
                <video ref={scanner.videoRef} autoPlay playsInline muted style={{ width: '100%', minHeight: 260, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={scanner.start} disabled={scanner.scanning}>Skanuj kod</button>
                <button className="btn btn-secondary btn-sm" onClick={scanner.stop} disabled={!scanner.scanning}>Stop</button>
              </div>
              {(scanner.error || barcodeMsg || scanner.lastBarcode) && <div style={{ color: scanner.error ? 'var(--p-high)' : 'var(--ink-2)', fontSize: 13 }}>{scanner.error ?? barcodeMsg ?? scanner.lastBarcode}</div>}
            </div>
          )}

          {mode === 'manual' && (
            <div className="col">
              <Field label="Nazwa produktu" required><input className="input" value={manual.name} onChange={e => setManual(v => ({ ...v, name: e.target.value }))} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
                <Field label="Ilość"><input className="input" type="number" value={manual.amount} onChange={e => setManual(v => ({ ...v, amount: e.target.value }))} /></Field>
                <Field label="Kcal"><input className="input" type="number" value={manual.kcal} onChange={e => setManual(v => ({ ...v, kcal: e.target.value }))} /></Field>
                <Field label="Białko"><input className="input" type="number" value={manual.protein} onChange={e => setManual(v => ({ ...v, protein: e.target.value }))} /></Field>
                <Field label="Węglowodany"><input className="input" type="number" value={manual.carb} onChange={e => setManual(v => ({ ...v, carb: e.target.value }))} /></Field>
                <Field label="Tłuszcz"><input className="input" type="number" value={manual.fat} onChange={e => setManual(v => ({ ...v, fat: e.target.value }))} /></Field>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={addManual} disabled={!manual.name.trim()}>Dodaj wpis</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
function DietSettingsModal({ open, onClose, config, setConfig, selectedDate, nutrition }: { open: boolean; onClose: () => void; config: DietConfig; setConfig: Dispatch<SetStateAction<DietConfig>>; selectedDate: string; nutrition?: NutritionDaily | null }) {
  const [draft, setDraft] = useState({ kcal: String(config.kcal), protein: String(config.protein), carb: String(config.carb), fat: String(config.fat), water: String(config.water), meals: config.meals.join(', '), productCategories: config.productCategories.join(', '), goalMode: config.goalMode });
  const upsertNutrition = useUpsertNutritionDaily(selectedDate);

  useEffect(() => {
    if (!open) return;
    setDraft({
      kcal: String(nutrition?.kcal_target ?? config.kcal),
      protein: String(nutrition?.protein_target ?? config.protein),
      carb: String(nutrition?.carb_target ?? config.carb),
      fat: String(nutrition?.fat_target ?? config.fat),
      water: String(config.water),
      meals: config.meals.join(', '),
      productCategories: config.productCategories.join(', '),
      goalMode: config.goalMode,
    });
  }, [config, nutrition, open]);

  function parseList(value: string, fallback: string[]) {
    const next = value.split(/[,;\n]/).map(v => v.trim()).filter(Boolean);
    return next.length ? next : fallback;
  }

  async function save() {
    const next: DietConfig = {
      kcal: Math.max(num(draft.kcal, config.kcal), 1),
      protein: Math.max(num(draft.protein, config.protein), 0),
      carb: Math.max(num(draft.carb, config.carb), 0),
      fat: Math.max(num(draft.fat, config.fat), 0),
      water: Math.max(num(draft.water, config.water), 1),
      meals: parseList(draft.meals, DEFAULT_MEALS),
      goalMode: draft.goalMode as DietConfig['goalMode'],
      productCategories: parseList(draft.productCategories, config.productCategories),
    };
    setConfig(next);
    await upsertNutrition.mutateAsync({ kcal_target: next.kcal, protein_target: next.protein, carb_target: next.carb, fat_target: next.fat });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Ustawienia diety" size="lg" footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button><button className="btn btn-primary btn-sm" onClick={save}>Zapisz</button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16, maxWidth: '100%', overflowX: 'hidden' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-head"><span className="card-title">Cele dzienne</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
            <Field label="Kcal"><input className="input" type="number" value={draft.kcal} onChange={e => setDraft(v => ({ ...v, kcal: e.target.value }))} /></Field>
            <Field label="Woda (ml)"><input className="input" type="number" value={draft.water} onChange={e => setDraft(v => ({ ...v, water: e.target.value }))} /></Field>
            <Field label="Białko (g)"><input className="input" type="number" value={draft.protein} onChange={e => setDraft(v => ({ ...v, protein: e.target.value }))} /></Field>
            <Field label="Węglowodany (g)"><input className="input" type="number" value={draft.carb} onChange={e => setDraft(v => ({ ...v, carb: e.target.value }))} /></Field>
            <Field label="Tłuszcz (g)"><input className="input" type="number" value={draft.fat} onChange={e => setDraft(v => ({ ...v, fat: e.target.value }))} /></Field>
          </div>
          <Field label="Sposób liczenia celu">
            <select className="input" value={draft.goalMode} onChange={e => setDraft(v => ({ ...v, goalMode: e.target.value as DietConfig['goalMode'] }))}>
              <option value="fixed">Stały</option>
              <option value="weight">Zależny od masy ciała</option>
            </select>
          </Field>
        </div>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-head"><span className="card-title">Konfiguracja</span></div>
          <Field label="Domyślne posiłki">
            <textarea className="input" value={draft.meals} onChange={e => setDraft(v => ({ ...v, meals: e.target.value }))} rows={4} />
          </Field>
          <Field label="Kategorie produktów">
            <textarea className="input" value={draft.productCategories} onChange={e => setDraft(v => ({ ...v, productCategories: e.target.value }))} rows={4} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

interface ProductForm {
  name: string;
  brand: string;
  category: string;
  kcal: string;
  protein: string;
  carb: string;
  fat: string;
  per_amount: string;
}

function ProductLibraryPanel({ foodItems, meta, setMeta, categories, setCategories }: { foodItems: FoodItem[]; meta: Record<string, FoodMeta>; setMeta: Dispatch<SetStateAction<Record<string, FoodMeta>>>; categories: string[]; setCategories: (categories: string[]) => void }) {
  const [form, setForm] = useState<ProductForm>({ name: '', brand: '', category: categories[0] ?? 'Inne', kcal: '', protein: '', carb: '', fat: '', per_amount: '100' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const insertFood = useInsertFoodItem();
  const updateFood = useUpdateFoodItem();
  const deleteFood = useDeleteFoodItem();

  function edit(item: FoodItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      brand: meta[item.id]?.brand ?? '',
      category: meta[item.id]?.category ?? categories[0] ?? 'Inne',
      kcal: String(item.kcal),
      protein: String(item.protein),
      carb: String(item.carb),
      fat: String(item.fat),
      per_amount: String(item.per_amount || 100),
    });
  }

  async function save() {
    if (!form.name.trim()) return;
    const payload: NewFoodItemInput = {
      name: form.name.trim(),
      kcal: Math.max(num(form.kcal), 0),
      protein: Math.max(num(form.protein), 0),
      carb: Math.max(num(form.carb), 0),
      fat: Math.max(num(form.fat), 0),
      per_amount: Math.max(num(form.per_amount, 100), 1),
      unit: 'g',
    };
    const cleanCategory = form.category.trim();
    if (cleanCategory && !categories.includes(cleanCategory)) setCategories([...categories, cleanCategory]);
    if (editingId) {
      const id = editingId;
      await updateFood.mutateAsync({ id, patch: payload });
      setMeta(prev => ({ ...prev, [id]: { brand: form.brand.trim() || undefined, category: cleanCategory || undefined } }));
    } else {
      const created = await insertFood.mutateAsync(payload);
      setMeta(prev => ({ ...prev, [created.id]: { brand: form.brand.trim() || undefined, category: cleanCategory || undefined } }));
    }
    setEditingId(null);
    setForm({ name: '', brand: '', category: categories[0] ?? 'Inne', kcal: '', protein: '', carb: '', fat: '', per_amount: '100' });
  }

  async function remove(id: string) {
    await deleteFood.mutateAsync(id);
    setMeta(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, maxWidth: '100%', overflowX: 'hidden' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-head"><span className="card-title">{editingId ? 'Edytuj produkt' : '+ Produkt własny'}</span></div>
          <Field label="Nazwa" required><input className="input" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} /></Field>
          <Field label="Marka"><input className="input" value={form.brand} onChange={e => setForm(v => ({ ...v, brand: e.target.value }))} /></Field>
          <Field label="Kategoria">
            <input className="input" list="diet-product-categories" value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))} />
            <datalist id="diet-product-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <Field label="Kcal / 100 g"><input className="input" type="number" value={form.kcal} onChange={e => setForm(v => ({ ...v, kcal: e.target.value }))} /></Field>
            <Field label="Domyślna porcja"><input className="input" type="number" value={form.per_amount} onChange={e => setForm(v => ({ ...v, per_amount: e.target.value }))} /></Field>
            <Field label="Białko"><input className="input" type="number" value={form.protein} onChange={e => setForm(v => ({ ...v, protein: e.target.value }))} /></Field>
            <Field label="Węglowodany"><input className="input" type="number" value={form.carb} onChange={e => setForm(v => ({ ...v, carb: e.target.value }))} /></Field>
            <Field label="Tłuszcze"><input className="input" type="number" value={form.fat} onChange={e => setForm(v => ({ ...v, fat: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            {editingId && <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Anuluj edycję</button>}
            <button className="btn btn-primary btn-sm" onClick={save} disabled={!form.name.trim()}>Zapisz produkt</button>
          </div>
        </div>

        <div className="card" style={{ margin: 0, minWidth: 0 }}>
          <div className="card-head"><span className="card-title">Baza produktów</span></div>
          {!foodItems.length ? <EmptyState title="Brak produktów" desc="Dodaj pierwszy własny produkt do szybkiego wyszukiwania." /> : (
            <div style={{ display: 'grid', gap: 8, maxHeight: 540, overflowY: 'auto', paddingRight: 4 }}>
              {foodItems.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center', background: 'var(--surface-3)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{meta[item.id]?.brand ? `${meta[item.id]?.brand} · ` : ''}{meta[item.id]?.category ?? 'Bez kategorii'} · {Math.round(item.kcal)} kcal / {item.per_amount}g</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => edit(item)}>Edytuj</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>Usuń</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}

function MealTemplateModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (tpl: MealTemplate) => void }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AddableFood | null>(null);
  const [amount, setAmount] = useState('100');
  const [items, setItems] = useState<MealTemplateItem[]>([]);

  useEffect(() => {
    if (!open) return;
    setName('');
    setQuery('');
    setSelected(null);
    setAmount('100');
    setItems([]);
  }, [open]);

  function addRow() {
    if (!selected) return;
    setItems(prev => [...prev, scaleFood(selected, Math.max(num(amount, selected.per_amount), 1))]);
    setSelected(null);
    setQuery('');
    setAmount('100');
  }

  function save() {
    if (!name.trim() || !items.length) return;
    onSave({ id: uid('meal_tpl'), name: name.trim(), items, createdAt: new Date().toISOString() });
    onClose();
  }

  const totals = computeTotals(items);

  return (
    <Modal open={open} onClose={onClose} title="+ Własny posiłek" size="lg" footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button><button className="btn btn-primary btn-sm" onClick={save} disabled={!name.trim() || !items.length}>Zapisz szablon</button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, maxWidth: '100%', overflowX: 'hidden' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-head"><span className="card-title">Skład posiłku</span></div>
          <Field label="Nazwa szablonu" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Owsianka białkowa" /></Field>
          <FoodSearchDropdown query={query} onQueryChange={setQuery} onSelect={(entry) => { const food = entryToFood(entry); setSelected(food); setAmount(String(food.per_amount || 100)); setQuery(food.name); }} />
          {selected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, alignItems: 'end', marginTop: 12 }}>
              <Field label={`Ilość (${selected.unit})`}><input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
              <MacroBadge {...scaleFood(selected, Math.max(num(amount, selected.per_amount), 1))} />
              <button className="btn btn-primary btn-sm" onClick={addRow}>Dodaj</button>
            </div>
          )}
        </div>

        <div className="card" style={{ margin: 0, minWidth: 0 }}>
          <div className="card-head"><span className="card-title">Podgląd szablonu</span></div>
          <MacroBadge kcal={totals.kcal} protein={totals.protein} carb={totals.carb} fat={totals.fat} />
          {!items.length ? <EmptyState title="Pusty szablon" desc="Dodaj produkty z wyszukiwarki po lewej." /> : (
            <table className="table" style={{ marginTop: 12 }}>
              <thead><tr><th>Produkt</th><th style={{ textAlign: 'right' }}>Ilość</th><th style={{ textAlign: 'right' }}>Kcal</th><th></th></tr></thead>
              <tbody>{items.map((item, index) => <tr key={`${item.name}-${index}`}><td style={{ fontWeight: 700 }}>{item.name}</td><td style={{ textAlign: 'right' }}>{Math.round(item.amount)}g</td><td style={{ textAlign: 'right' }}>{Math.round(item.kcal)}</td><td><button className="icon-btn" onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}>x</button></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
