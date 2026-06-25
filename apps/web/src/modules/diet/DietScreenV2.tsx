import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Modal, ProgressBar, SubTabs } from '@/components/common';
import {
  useAddMealItem,
  useAddWater,
  useDeleteMealItem,
  useFoodSearch,
  useMealItemsHistory,
  useNutritionHistory,
  useNutritionToday,
  useTodayMealItems,
  useTodayMeals,
  useUpdateMealItem,
  useUpsertMeal,
  useUpsertNutritionDaily,
  type FoodSearchEntry,
} from '@/features/diet/hooks';
import type { Meal, MealItem, NutritionDaily } from '@/features/diet/types';
import { lookupBarcode } from '@/features/diet/api';

const MEAL_ORDER = ['Śniadanie', 'Obiad', 'Kolacja', 'Przekąska'] as const;
type MealName = typeof MEAL_ORDER[number];
type SummaryMode = 'day' | 'week' | 'month' | 'range';
type DrawerMode = 'search' | 'quick' | 'custom';

function SvgIcon({ size = 16, children }: { size?: number; children: ReactNode }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

function Calendar({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></SvgIcon>;
}

function ChevronLeft({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="m15 18-6-6 6-6" /></SvgIcon>;
}

function ChevronRight({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="m9 18 6-6-6-6" /></SvgIcon>;
}

function Droplets({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M7 13c0 2 1.5 4 4 4s4-2 4-4c0-2.7-4-7-4-7s-4 4.3-4 7Z" /><path d="M17 18c1.7 0 3-1.3 3-3 0-2-3-5.2-3-5.2" /></SvgIcon>;
}

function MoreHorizontal({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M5 12h.01M12 12h.01M19 12h.01" /></SvgIcon>;
}

function Plus({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M12 5v14M5 12h14" /></SvgIcon>;
}

function Search({ size }: { size?: number }) {
  return <SvgIcon size={size}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></SvgIcon>;
}

function Settings({ size }: { size?: number }) {
  return <SvgIcon size={size}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></SvgIcon>;
}

function Soup({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M5 12h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6Z" /><path d="M8 12V8M12 12V7M16 12V8" /></SvgIcon>;
}

function Sun({ size }: { size?: number }) {
  return <SvgIcon size={size}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></SvgIcon>;
}

function Moon({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></SvgIcon>;
}

function Coffee({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M16 9h2a2 2 0 0 1 0 5h-2" /><path d="M8 2v2M11 2v2" /></SvgIcon>;
}

function Book({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" /><path d="M8 3v18" /></SvgIcon>;
}

function mealIcon(name: MealName, size = 16) {
  switch (name) {
    case 'Śniadanie': return <Sun size={size} />;
    case 'Obiad': return <Soup size={size} />;
    case 'Kolacja': return <Moon size={size} />;
    case 'Przekąska': return <Coffee size={size} />;
    default: return <Soup size={size} />;
  }
}

function Trash2({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6" /></SvgIcon>;
}

function Utensils({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M4 3v8M7 3v8M4 7h3M7 11v10M17 3v18M17 3c2.2 1.5 3 3.3 3 5.5 0 2.4-1.1 4-3 4" /></SvgIcon>;
}

function X({ size }: { size?: number }) {
  return <SvgIcon size={size}><path d="M18 6 6 18M6 6l12 12" /></SvgIcon>;
}

interface SavedMeal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

const DEFAULT_TARGETS = {
  kcal_target: 2500,
  protein_target: 180,
  carb_target: 240,
  fat_target: 70,
  water_ml: 1000,
};

const SHORT_DAYS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

function dateToIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return dateToIso(new Date());
  return value;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateToIso(date);
}

function prettyDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
}

function sumItems(items: MealItem[]) {
  return items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + Number(item.kcal || 0),
      protein: acc.protein + Number(item.protein || 0),
      carb: acc.carb + Number(item.carb || 0),
      fat: acc.fat + Number(item.fat || 0),
    }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 },
  );
}

function round(value: number, digits = 0) {
  return Number(value || 0).toFixed(digits);
}

function foodName(entry: FoodSearchEntry) {
  return entry.item.name;
}

function foodMacros(entry: FoodSearchEntry) {
  return {
    kcal: Number(entry.item.kcal || 0),
    protein: Number(entry.item.protein || 0),
    carb: Number(entry.item.carb || 0),
    fat: Number(entry.item.fat || 0),
    perAmount: Number(entry.item.per_amount || 100),
    unit: entry.item.unit || 'g',
  };
}

function makeTotals(base: { kcal: number; protein: number; carb: number; fat: number; perAmount: number }, amount: number) {
  const factor = amount / Math.max(base.perAmount || 100, 1);
  return {
    kcal: Math.round(base.kcal * factor),
    protein: Number((base.protein * factor).toFixed(1)),
    carb: Number((base.carb * factor).toFixed(1)),
    fat: Number((base.fat * factor).toFixed(1)),
  };
}

function getSavedMeals() {
  try {
    return JSON.parse(localStorage.getItem('diet_meal_templates') || '[]') as SavedMeal[];
  } catch {
    return [];
  }
}

function saveMealTemplate(meal: SavedMeal) {
  const current = getSavedMeals();
  const next = [meal, ...current.filter((item) => item.id !== meal.id)].slice(0, 12);
  localStorage.setItem('diet_meal_templates', JSON.stringify(next));
  window.dispatchEvent(new Event('diet-templates-updated'));
}

export function DietScreen() {
  const [selectedDate, setSelectedDate] = useState(() => parseIsoDate(new URLSearchParams(window.location.search).get('date')));
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('day');
  const [activeMeal, setActiveMeal] = useState<MealName>('Śniadanie');
  const [drawerMeal, setDrawerMeal] = useState<MealName | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data: items = [], isLoading: itemsLoading } = useTodayMealItems(selectedDate);
  const { data: meals = [] } = useTodayMeals(selectedDate);
  const { data: nutrition } = useNutritionToday(selectedDate);
  const { data: historyItems = [] } = useMealItemsHistory();
  const { data: nutritionHistory = [] } = useNutritionHistory();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('date', selectedDate);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [selectedDate]);

  const mealGroups = useMemo(() => {
    const byId = new Map(meals.map((meal) => [meal.id, meal.name]));
    const groups = new Map<MealName, MealItem[]>(MEAL_ORDER.map((meal) => [meal, []]));
    for (const item of items) {
      const name = byId.get(item.meal_id ?? '') as MealName | undefined;
      const key: MealName = name && MEAL_ORDER.includes(name) ? name : 'Śniadanie';
      groups.get(key)?.push(item);
    }
    return groups;
  }, [items, meals]);

  const totals = useMemo(() => sumItems(items), [items]);

  return (
    <div className="diet-os">
      <DateBar
        date={selectedDate}
        onChange={setSelectedDate}
        onManageMeals={() => setDrawerMeal(activeMeal)}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="diet-shell">
        <main className="diet-meals-col" aria-busy={itemsLoading}>
          {MEAL_ORDER.map((mealName) => (
            <MealSection
              key={mealName}
              name={mealName}
              items={mealGroups.get(mealName) ?? []}
              active={activeMeal === mealName}
              onActivate={() => setActiveMeal(mealName)}
              onAdd={() => setDrawerMeal(mealName)}
              onEdit={setEditingItem}
              date={selectedDate}
            />
          ))}
        </main>

        <aside className="diet-side-col">
          <NutritionSummaryPanel
            mode={summaryMode}
            setMode={setSummaryMode}
            totals={totals}
            nutrition={nutrition}
            onSettings={() => setSettingsOpen(true)}
            onOpenDetails={() => setSummaryOpen(true)}
          />
          <HydrationPanel date={selectedDate} nutrition={nutrition} />
        </aside>
      </div>

      <Modal open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Szczegółowe podsumowanie" size="lg">
        <AnalyticsPanel mode={summaryMode} date={selectedDate} items={historyItems} nutrition={nutritionHistory} goals={nutrition} variant="modal" />
      </Modal>

      <AddMealDrawer
        open={drawerMeal !== null}
        meal={drawerMeal ?? activeMeal}
        date={selectedDate}
        meals={meals}
        onClose={() => setDrawerMeal(null)}
      />

      <EditMealModal
        item={editingItem}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        date={selectedDate}
      />

      <NutritionSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        date={selectedDate}
        nutrition={nutrition}
      />
    </div>
  );
}

function DateBar({ date, onChange, onManageMeals, onSettings }: { date: string; onChange: (date: string) => void; onManageMeals: () => void; onSettings: () => void }) {
  return (
    <div className="diet-datebar">
      <div className="diet-datebar-nav">
        <button className="icon-btn" onClick={() => onChange(shiftDate(date, -1))} aria-label="Poprzedni dzień">
          <ChevronLeft size={16} />
        </button>
        <button className="diet-date-label" onClick={() => {
          const picker = document.getElementById('diet-date-picker') as (HTMLInputElement & { showPicker?: () => void }) | null;
          if (picker?.showPicker) picker.showPicker();
          else picker?.click();
        }}>
          {prettyDate(date)}
        </button>
        <button className="icon-btn" onClick={() => onChange(shiftDate(date, 1))} aria-label="Następny dzień">
          <ChevronRight size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onChange(dateToIso(new Date()))}>Dzisiaj</button>
        <label className="icon-btn diet-date-picker">
          <Calendar size={15} />
          <input id="diet-date-picker" type="date" value={date} onChange={(event) => onChange(event.target.value)} />
        </label>
      </div>
      <div className="diet-datebar-actions">
        <button className="btn btn-secondary btn-sm" onClick={onManageMeals}><Book size={15} /> Własne posiłki</button>
        <button className="btn btn-secondary btn-sm" onClick={onSettings}><Settings size={15} /> Ustawienia</button>
      </div>
    </div>
  );
}

function MealSection({
  name,
  items,
  active,
  onActivate,
  onAdd,
  onEdit,
  date,
}: {
  name: MealName;
  items: MealItem[];
  active: boolean;
  onActivate: () => void;
  onAdd: () => void;
  onEdit: (item: MealItem) => void;
  date: string;
}) {
  const totals = sumItems(items);
  const remove = useDeleteMealItem(date);

  return (
    <section className={`diet-meal-card ${active ? 'is-active' : ''}`} onFocus={onActivate} onClick={onActivate}>
      <header className="diet-meal-head">
        <div className="diet-meal-title">
          <span className="diet-meal-icon">{mealIcon(name)}</span>
          <strong>{name.toUpperCase()}</strong>
        </div>
        <div className="diet-meal-totals">
          <strong>{round(totals.kcal)} kcal</strong>
          <MacroMini label="B" value={totals.protein} tone="protein" />
          <MacroMini label="W" value={totals.carb} tone="carb" />
          <MacroMini label="T" value={totals.fat} tone="fat" />
          <button className="btn btn-secondary btn-sm diet-add-btn" onClick={(event) => { event.stopPropagation(); onAdd(); }}>
            <Plus size={14} /> Dodaj
          </button>
          <button className="icon-btn" aria-label={`Menu ${name}`}>
            <MoreHorizontal size={15} />
          </button>
        </div>
      </header>

      <div className="diet-meal-table-head">
        <span>Produkt</span>
        <span>Ilość</span>
        <span>Kcal</span>
        <span>B</span>
        <span>W</span>
        <span>T</span>
      </div>

      {items.length === 0 ? (
        <button className="diet-empty-row" onClick={(event) => { event.stopPropagation(); onAdd(); }}>
          Brak wpisów
        </button>
      ) : (
        <div className="diet-entry-list">
          {items.map((item) => (
            <button key={item.id} className="diet-entry-row" onClick={(event) => { event.stopPropagation(); onEdit(item); }}>
              <span className="diet-entry-name">
                <span className="diet-row-delete" onClick={(event) => { event.stopPropagation(); remove.mutate(item.id); }}><X size={13} /></span>
                <span className="diet-entry-thumb"><Utensils size={15} /></span>
                {item.name}
              </span>
              <span className="diet-entry-amount">{round(item.amount)} g</span>
              <strong>{round(item.kcal)}</strong>
              <span>{round(item.protein, 1)}g</span>
              <span>{round(item.carb, 1)}g</span>
              <span>{round(item.fat, 1)}g</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function MacroMini({ label, value, tone }: { label: string; value: number; tone: 'protein' | 'carb' | 'fat' }) {
  return <span className={`diet-macro-mini is-${tone}`}>{label} {round(value)}g</span>;
}

function NutritionSummaryPanel({
  mode,
  setMode,
  totals,
  nutrition,
  onSettings,
  onOpenDetails,
}: {
  mode: SummaryMode;
  setMode: (mode: SummaryMode) => void;
  totals: { kcal: number; protein: number; carb: number; fat: number };
  nutrition: NutritionDaily | null | undefined;
  onSettings: () => void;
  onOpenDetails: () => void;
}) {
  const goals = nutrition ?? DEFAULT_TARGETS;
  const kcalPct = Math.min(100, (totals.kcal / Math.max(goals.kcal_target, 1)) * 100);

  return (
    <section className="diet-side-card diet-summary-card">
      <header className="diet-panel-head">
        <strong>Podsumowanie</strong>
        <button className="icon-btn" onClick={onSettings} aria-label="Cele żywieniowe"><Settings size={15} /></button>
      </header>
      <SubTabs
        tabs={[
          { id: 'day', label: 'Dzień' },
          { id: 'week', label: 'Tydzień' },
          { id: 'month', label: 'Miesiąc' },
          { id: 'range', label: 'Zakres' },
        ]}
        active={mode}
        onChange={(id) => setMode(id as SummaryMode)}
      />
      <div className="diet-kcal-line">
        <div className="diet-ring" style={{ '--pct': `${kcalPct}%` } as CSSProperties} />
        <div>
          <div className="diet-kcal-main"><strong>{round(totals.kcal)}</strong> / {round(goals.kcal_target)} kcal</div>
          <span>Pozostało {round(Math.max(goals.kcal_target - totals.kcal, 0))} kcal</span>
          <span>Nawodnienie {round((nutrition?.water_ml ?? 0) / 1000, 1)} / 2.5 L</span>
        </div>
      </div>
      <MacroProgress label="Białko" value={totals.protein} max={goals.protein_target} color="var(--macro-protein, #7DD3FC)" />
      <MacroProgress label="Węglowodany" value={totals.carb} max={goals.carb_target} color="var(--macro-carbs, #FBBF24)" />
      <MacroProgress label="Tłuszcze" value={totals.fat} max={goals.fat_target} color="var(--macro-fat, #F472B6)" />
      <button className="diet-summary-details" onClick={onOpenDetails}>
        Szczegółowe podsumowanie
        <ChevronRight size={14} />
      </button>
    </section>
  );
}

function MacroProgress({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="diet-macro-progress">
      <div><strong>{label}</strong><span>{round(value)}/{round(max)}g</span></div>
      <ProgressBar value={value} max={max || 1} color={color} size="sm" />
    </div>
  );
}

function HydrationPanel({ date, nutrition }: { date: string; nutrition: NutritionDaily | null | undefined }) {
  const [active, setActive] = useState<number | null>(null);
  const add200 = useAddWater(200, date);
  const add300 = useAddWater(300, date);
  const add500 = useAddWater(500, date);
  const amount = nutrition?.water_ml ?? 0;

  const add = (ml: number) => {
    setActive(ml);
    ({ 200: add200, 300: add300, 500: add500 }[ml] ?? add300).mutate();
    window.setTimeout(() => setActive(null), 650);
  };

  return (
    <section className="diet-side-card">
      <header className="diet-panel-head">
        <strong>Nawodnienie</strong>
        <Droplets size={15} />
      </header>
      <div className="diet-water-value"><strong>{round(amount / 1000, 1)}</strong> / 2.5 L</div>
      <ProgressBar value={amount} max={2500} color="var(--water, #38BDF8)" size="md" />
      <div className="diet-water-actions">
        {[200, 300, 500].map((ml) => (
          <button key={ml} className={`btn btn-secondary btn-sm ${active === ml ? 'is-active' : ''}`} onClick={() => add(ml)}>
            +{ml} ml
          </button>
        ))}
      </div>
    </section>
  );
}

function AnalyticsPanel({
  mode,
  date,
  items,
  nutrition,
  goals,
  variant = 'page',
}: {
  mode: SummaryMode;
  date: string;
  items: MealItem[];
  nutrition: NutritionDaily[];
  goals: NutritionDaily | null | undefined;
  variant?: 'page' | 'modal';
}) {
  const days = useMemo(() => {
    const end = new Date(`${date}T12:00:00`);
    const count = mode === 'month' ? 30 : mode === 'day' ? 7 : 14;
    return Array.from({ length: count }).map((_, index) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (count - index - 1));
      return dateToIso(d);
    });
  }, [date, mode]);

  const calories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const day = item.created_at.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + Number(item.kcal || 0));
    }
    return days.map((day) => ({ day, kcal: Math.round(map.get(day) ?? 0) }));
  }, [days, items]);

  const max = Math.max(...calories.map((item) => item.kcal), goals?.kcal_target ?? 2500, 1);
  const total = calories.reduce((acc, item) => acc + item.kcal, 0);
  const avg = total / Math.max(calories.length, 1);
  const highest = calories.reduce((a, b) => (b.kcal > a.kcal ? b : a), calories[0]);
  const lowest = calories.reduce((a, b) => (b.kcal < a.kcal ? b : a), calories[0]);
  const water = nutrition.slice(0, 7);

  return (
    <section className={`diet-analytics ${variant === 'modal' ? 'is-modal' : ''}`}>
      <header className="diet-panel-head">
        <strong>Podsumowanie i przegląd kalorii</strong>
        <span>{formatDateShort(days[0])} - {formatDateShort(days[days.length - 1])}</span>
      </header>
      <div className="diet-analytics-grid">
        <div className="diet-chart-card diet-chart-wide">
          <span className="diet-chart-title">Spożycie kalorii</span>
          <div className="diet-bars">
            {calories.map((item) => (
              <div key={item.day} className="diet-bar-col">
                <span>{item.kcal || ''}</span>
                <i style={{ height: `${Math.max(5, (item.kcal / max) * 100)}%` }} />
                <small>{SHORT_DAYS[new Date(`${item.day}T12:00:00`).getDay()]}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="diet-chart-card">
          <span>Średnio dziennie</span>
          <strong>{round(avg)} kcal</strong>
          <span>Razem w okresie</span>
          <strong>{round(total)} kcal</strong>
          <span>Najwyższe</span>
          <strong>{highest ? `${highest.kcal} kcal` : '0 kcal'}</strong>
          <span>Najniższe</span>
          <strong>{lowest ? `${lowest.kcal} kcal` : '0 kcal'}</strong>
        </div>
        <div className="diet-chart-card">
          <span className="diet-chart-title">Rozkład makroskładników</span>
          <div className="diet-donut" />
          <MacroMini label="B" value={85} tone="protein" />
          <MacroMini label="W" value={147} tone="carb" />
          <MacroMini label="T" value={68} tone="fat" />
        </div>
        <div className="diet-chart-card">
          <span className="diet-chart-title">Historia nawodnienia</span>
          {water.length === 0 ? <span className="muted">Brak historii</span> : water.map((row) => (
            <div key={row.id} className="diet-water-history">
              <Droplets size={13} />
              <span>{row.date}</span>
              <strong>{round(row.water_ml / 1000, 1)} / 2.5 L</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddMealDrawer({ open, meal, date, meals, onClose }: { open: boolean; meal: MealName; date: string; meals: Meal[]; onClose: () => void }) {
  const [mode, setMode] = useState<DrawerMode>('search');
  const [targetMeal, setTargetMeal] = useState<MealName>(meal);
  const [query, setQuery] = useState('kurczak curry');
  const [selected, setSelected] = useState<FoodSearchEntry | null>(null);
  const [amount, setAmount] = useState(200);
  const [barcode, setBarcode] = useState('');
  const [quickText, setQuickText] = useState('');
  const [manual, setManual] = useState({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, amount: 100 });
  const [saveTemplate, setSaveTemplate] = useState(true);
  const { results, isSearching } = useFoodSearch(query);
  const upsertMeal = useUpsertMeal(date);
  const addItem = useAddMealItem(date);

  useEffect(() => {
    if (open) {
      setTargetMeal(meal);
      setSelected(null);
      setMode('search');
      setAmount(200);
    }
  }, [meal, open]);

  const selectedMacros = selected ? foodMacros(selected) : null;
  const preview = selectedMacros
    ? makeTotals(selectedMacros, amount)
    : { kcal: manual.kcal, protein: manual.protein, carb: manual.carb, fat: manual.fat };

  const addMeal = async () => {
    const mealRow = meals.find((item) => item.name === targetMeal) ?? await upsertMeal.mutateAsync(targetMeal);
    const input = selectedMacros
      ? {
          meal_id: mealRow.id,
          food_item_id: selected?.source === 'local' ? selected.item.id : null,
          name: selected ? foodName(selected) : manual.name,
          amount,
          ...preview,
        }
      : {
          meal_id: mealRow.id,
          name: manual.name || quickText || 'Własny posiłek',
          amount: manual.amount || amount,
          kcal: manual.kcal,
          protein: manual.protein,
          carb: manual.carb,
          fat: manual.fat,
        };
    await addItem.mutateAsync(input);
    if (!selectedMacros && saveTemplate && input.name.trim()) {
      saveMealTemplate({ id: crypto.randomUUID(), name: input.name, kcal: input.kcal, protein: input.protein ?? 0, carb: input.carb ?? 0, fat: input.fat ?? 0 });
    }
    onClose();
  };

  const lookup = async () => {
    if (!barcode.trim()) return;
    const product = await lookupBarcode(barcode.trim());
    if (product) {
      setQuery(product.name);
      setMode('search');
    }
  };

  const parseQuick = () => {
    const amountMatch = quickText.match(/(\d+(?:[,.]\d+)?)/);
    const nextAmount = amountMatch ? Number(amountMatch[1].replace(',', '.')) : 100;
    const nextName = quickText.replace(/(\d+(?:[,.]\d+)?)\s*(g|ml|szt\.?|porcja)?/i, '').trim();
    setQuery(nextName || quickText);
    setAmount(nextAmount);
    setMode('search');
  };

  if (!open) return null;

  return (
    <div className="diet-drawer-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="diet-drawer" role="dialog" aria-modal="true" aria-label="Dodaj posiłek">
        <header className="diet-drawer-head">
          <strong>Dodaj posiłek</strong>
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij"><X size={16} /></button>
        </header>
        <SubTabs
          tabs={[
            { id: 'search', label: 'Wyszukaj produkt' },
            { id: 'quick', label: 'Skanuj / szybkie' },
            { id: 'custom', label: 'Własny posiłek' },
          ]}
          active={mode}
          onChange={(id) => setMode(id as DrawerMode)}
        />

        <div className="diet-drawer-grid">
          <div className="diet-drawer-left">
            <MealPicker value={targetMeal} onChange={setTargetMeal} />
            {mode === 'search' && (
              <>
                <label className="diet-search-box">
                  <Search size={15} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj produktu..." />
                  {query && <button onClick={() => setQuery('')}><X size={13} /></button>}
                </label>
                <div className="diet-result-tabs"><span className="active">Wyniki ({results.length})</span><span>Ostatnie</span><span>Ulubione</span></div>
                <div className="diet-search-results">
                  {isSearching && <span className="muted">Szukam produktów...</span>}
                  {results.slice(0, 8).map((entry) => {
                    const macros = foodMacros(entry);
                    return (
                      <button key={`${entry.source}-${foodName(entry)}`} className={selected === entry ? 'is-selected' : ''} onClick={() => setSelected(entry)}>
                        <span className="diet-food-thumb"><Utensils size={15} /></span>
                        <span><strong>{foodName(entry)}</strong><small>100 g • {round(macros.kcal)} kcal</small></span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {mode === 'quick' && (
              <div className="diet-form-stack">
                <label>Ręczny kod kreskowy<input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="np. 590..." /></label>
                <button className="btn btn-secondary btn-sm" onClick={lookup}>Sprawdź kod</button>
                <label>Szybki wpis<input value={quickText} onChange={(event) => setQuickText(event.target.value)} placeholder="np. ryż 150g" /></label>
                <button className="btn btn-secondary btn-sm" onClick={parseQuick}>Szukaj z szybkiego wpisu</button>
              </div>
            )}

            {mode === 'custom' && (
              <div className="diet-form-stack">
                <label>Nazwa posiłku<input value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} /></label>
                <div className="diet-form-grid">
                  <label>Ilość<input type="number" min={1} value={manual.amount} onChange={(event) => setManual({ ...manual, amount: Number(event.target.value) })} /></label>
                  <label>Kcal<input type="number" min={0} value={manual.kcal} onChange={(event) => setManual({ ...manual, kcal: Number(event.target.value) })} /></label>
                  <label>Białko<input type="number" min={0} value={manual.protein} onChange={(event) => setManual({ ...manual, protein: Number(event.target.value) })} /></label>
                  <label>Węgle<input type="number" min={0} value={manual.carb} onChange={(event) => setManual({ ...manual, carb: Number(event.target.value) })} /></label>
                  <label>Tłuszcze<input type="number" min={0} value={manual.fat} onChange={(event) => setManual({ ...manual, fat: Number(event.target.value) })} /></label>
                </div>
                <label className="diet-toggle"><span>Zapisz jako własny posiłek</span><input type="checkbox" checked={saveTemplate} onChange={(event) => setSaveTemplate(event.target.checked)} /></label>
              </div>
            )}
          </div>

          <div className="diet-drawer-right">
            <h3>{selected ? foodName(selected) : manual.name || 'Podgląd posiłku'}</h3>
            <span className="muted">{selectedMacros ? `100 g • ${round(selectedMacros.kcal)} kcal` : 'Na podstawie wprowadzonych wartości'}</span>
            <div className="diet-preview-photo"><Utensils size={36} /></div>
            <div className="diet-form-grid">
              <label>Posiłek<select value={targetMeal} onChange={(event) => setTargetMeal(event.target.value as MealName)}>{MEAL_ORDER.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Data<input type="date" value={date} readOnly /></label>
              <label>Ilość<input type="number" min={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
              <label>Jednostka<select><option>g</option><option>ml</option><option>szt.</option><option>porcja</option></select></label>
            </div>
            <div className="diet-preview-macros">
              <strong>{round(preview.kcal)} kcal</strong>
              <MacroMini label="B" value={preview.protein} tone="protein" />
              <MacroMini label="W" value={preview.carb} tone="carb" />
              <MacroMini label="T" value={preview.fat} tone="fat" />
            </div>
          </div>
        </div>

        <footer className="diet-drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" disabled={addItem.isPending || (!selected && !manual.name && !quickText)} onClick={addMeal}>Dodaj do posiłku</button>
        </footer>
      </aside>
    </div>
  );
}

function MealPicker({ value, onChange }: { value: MealName; onChange: (meal: MealName) => void }) {
  return (
    <div className="diet-meal-picker">
      {MEAL_ORDER.map((meal) => (
        <button key={meal} className={value === meal ? 'active' : ''} onClick={() => onChange(meal)}>{meal}</button>
      ))}
    </div>
  );
}

function EditMealModal({ item, open, onClose, date }: { item: MealItem | null; open: boolean; onClose: () => void; date: string }) {
  const [form, setForm] = useState({ name: '', amount: 0, kcal: 0, protein: 0, carb: 0, fat: 0 });
  const update = useUpdateMealItem(date);
  const remove = useDeleteMealItem(date);

  useEffect(() => {
    if (item) setForm({ name: item.name, amount: item.amount, kcal: item.kcal, protein: item.protein, carb: item.carb, fat: item.fat });
  }, [item]);

  const save = async () => {
    if (!item) return;
    await update.mutateAsync({ id: item.id, patch: form });
    onClose();
  };

  const del = () => {
    if (!item) return;
    remove.mutate(item.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edytuj wpis posiłku"
      size="md"
      footer={<><button className="btn btn-danger" onClick={del}><Trash2 size={14} /> Usuń</button><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={save}>Zapisz</button></>}
    >
      <div className="diet-form-stack">
        <label>Nazwa<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <div className="diet-form-grid">
          <label>Ilość<input type="number" min={1} value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} /></label>
          <label>Kcal<input type="number" min={0} value={form.kcal} onChange={(event) => setForm({ ...form, kcal: Number(event.target.value) })} /></label>
          <label>Białko<input type="number" min={0} value={form.protein} onChange={(event) => setForm({ ...form, protein: Number(event.target.value) })} /></label>
          <label>Węgle<input type="number" min={0} value={form.carb} onChange={(event) => setForm({ ...form, carb: Number(event.target.value) })} /></label>
          <label>Tłuszcze<input type="number" min={0} value={form.fat} onChange={(event) => setForm({ ...form, fat: Number(event.target.value) })} /></label>
        </div>
      </div>
    </Modal>
  );
}

function NutritionSettingsModal({ open, onClose, date, nutrition }: { open: boolean; onClose: () => void; date: string; nutrition: NutritionDaily | null | undefined }) {
  const [form, setForm] = useState({ kcal_target: 2500, protein_target: 180, carb_target: 240, fat_target: 70 });
  const upsert = useUpsertNutritionDaily(date);

  useEffect(() => {
    setForm({
      kcal_target: nutrition?.kcal_target ?? 2500,
      protein_target: nutrition?.protein_target ?? 180,
      carb_target: nutrition?.carb_target ?? 240,
      fat_target: nutrition?.fat_target ?? 70,
    });
  }, [nutrition]);

  const save = async () => {
    await upsert.mutateAsync(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Cele żywieniowe" footer={<><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={save}>Zapisz</button></>}>
      <div className="diet-form-grid">
        <label>Cel kcal<input type="number" min={1} value={form.kcal_target} onChange={(event) => setForm({ ...form, kcal_target: Number(event.target.value) })} /></label>
        <label>Białko g<input type="number" min={0} value={form.protein_target} onChange={(event) => setForm({ ...form, protein_target: Number(event.target.value) })} /></label>
        <label>Węglowodany g<input type="number" min={0} value={form.carb_target} onChange={(event) => setForm({ ...form, carb_target: Number(event.target.value) })} /></label>
        <label>Tłuszcze g<input type="number" min={0} value={form.fat_target} onChange={(event) => setForm({ ...form, fat_target: Number(event.target.value) })} /></label>
      </div>
    </Modal>
  );
}
