import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import { Modal, PageHeader, ProgressBar, SubTabs } from '@/components/common';
import { PageLayout } from '@/components/layout/primitives';
import { toast } from '@/lib/toast';
import {
  useAddMealItem,
  useAddWater,
  useCountMealCategoryItems,
  useCreateCustomMeal,
  useCreateMealCategory,
  useCustomMeals,
  useDeleteCategoryEntries,
  useDeleteCustomMeal,
  useDeleteMealCategory,
  useDeleteMealItem,
  useFoodSearch,
  useHydrationEntries,
  useMealCategories,
  useMealItemsHistory,
  useMoveCategoryEntries,
  useNutritionHistory,
  useNutritionTarget,
  useNutritionToday,
  useReorderMealCategories,
  useRestoreDefaultMealCategories,
  useTodayMealItems,
  useTodayMeals,
  useUpdateCustomMeal,
  useUpdateMealCategory,
  useUpdateMealItem,
  useUpsertMealForCategory,
  type FoodSearchEntry,
} from '@/features/diet/hooks';
import type { CustomMeal, Meal, MealCategory, MealItem, NewMealCategoryInput, NutritionDaily, NutritionTarget } from '@/features/diet/types';
import { DEFAULT_MEAL_CATEGORIES, lookupBarcode } from '@/features/diet/api';

type SummaryMode = 'day' | 'week' | 'month' | 'range';
type AddMode = 'search' | 'recent' | 'favorites' | 'custom' | 'quick';
type CustomMealTab = 'recent' | 'favorites' | 'mine';
type CategoryDeleteAction = 'hide' | 'move' | 'delete';

const DEFAULT_TARGETS: Pick<NutritionTarget, 'kcal_target' | 'protein_target' | 'carb_target' | 'fat_target' | 'water_target_ml'> = {
  kcal_target: 2500,
  protein_target: 180,
  carb_target: 240,
  fat_target: 70,
  water_target_ml: 2500,
};

const SHORT_DAYS = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
const UNIT_OPTIONS = ['g', 'ml', 'porcja', 'szt.'];
const CATEGORY_ICON_OPTIONS = ['utensils', 'book', 'soup', 'coffee', 'droplets', 'sun', 'moon', 'star'] as const;

function SvgIcon({ size = 16, children }: { size?: number; children: ReactNode }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

function Calendar({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></SvgIcon>; }
function ChevronLeft({ size }: { size?: number }) { return <SvgIcon size={size}><path d="m15 18-6-6 6-6" /></SvgIcon>; }
function ChevronRight({ size }: { size?: number }) { return <SvgIcon size={size}><path d="m9 18 6-6-6-6" /></SvgIcon>; }
function Droplets({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M7 13c0 2 1.5 4 4 4s4-2 4-4c0-2.7-4-7-4-7s-4 4.3-4 7Z" /><path d="M17 18c1.7 0 3-1.3 3-3 0-2-3-5.2-3-5.2" /></SvgIcon>; }
function Plus({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M12 5v14M5 12h14" /></SvgIcon>; }
function Search({ size }: { size?: number }) { return <SvgIcon size={size}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></SvgIcon>; }
function Settings({ size }: { size?: number }) { return <SvgIcon size={size}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></SvgIcon>; }
function Soup({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M5 12h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6Z" /><path d="M8 12V8M12 12V7M16 12V8" /></SvgIcon>; }
function Sun({ size }: { size?: number }) { return <SvgIcon size={size}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></SvgIcon>; }
function Moon({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></SvgIcon>; }
function Coffee({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M16 9h2a2 2 0 0 1 0 5h-2" /><path d="M8 2v2M11 2v2" /></SvgIcon>; }
function Book({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" /><path d="M8 3v18" /></SvgIcon>; }
function Trash2({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6" /></SvgIcon>; }
function Utensils({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M4 3v8M7 3v8M4 7h3M7 11v10M17 3v18M17 3c2.2 1.5 3 3.3 3 5.5 0 2.4-1.1 4-3 4" /></SvgIcon>; }
function X({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M18 6 6 18M6 6l12 12" /></SvgIcon>; }
function Star({ size }: { size?: number }) { return <SvgIcon size={size}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.2 6.4 20l1.1-6.1L3 9.6l6.2-.9L12 3Z" /></SvgIcon>; }
function Pencil({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></SvgIcon>; }
function Grip({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" /></SvgIcon>; }
function ArrowUp({ size }: { size?: number }) { return <SvgIcon size={size}><path d="m18 15-6-6-6 6" /></SvgIcon>; }
function ArrowDown({ size }: { size?: number }) { return <SvgIcon size={size}><path d="m6 9 6 6 6-6" /></SvgIcon>; }
function Lock({ size }: { size?: number }) { return <SvgIcon size={size}><path d="M7 11V8a5 5 0 0 1 10 0v3" /><rect x="5" y="11" width="14" height="10" rx="2" /></SvgIcon>; }

function iconFor(name?: string, size = 16) {
  switch (name) {
    case 'sun': return <Sun size={size} />;
    case 'soup': return <Soup size={size} />;
    case 'moon': return <Moon size={size} />;
    case 'coffee': return <Coffee size={size} />;
    case 'droplets': return <Droplets size={size} />;
    case 'book': return <Book size={size} />;
    case 'star': return <Star size={size} />;
    default: return <Utensils size={size} />;
  }
}

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
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
}

function round(value: number, digits = 0) {
  return Number(value || 0).toFixed(digits);
}

function normalizeMealName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź|ż/g, 'z');
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

function scaleMacros(base: { kcal: number; protein: number; carb: number; fat: number; perAmount: number }, amount: number) {
  const factor = amount / Math.max(base.perAmount || 100, 1);
  return {
    kcal: Math.round(base.kcal * factor),
    protein: Number((base.protein * factor).toFixed(1)),
    carb: Number((base.carb * factor).toFixed(1)),
    fat: Number((base.fat * factor).toFixed(1)),
  };
}

function rangeDays(endIso: string, count: number) {
  const end = new Date(`${endIso}T12:00:00`);
  return Array.from({ length: count }).map((_, index) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (count - index - 1));
    return dateToIso(d);
  });
}

function consumedDay(item: MealItem) {
  return (item.consumed_at ?? item.created_at).slice(0, 10);
}

function combineGoals(target?: NutritionTarget | null, daily?: NutritionDaily | null) {
  return {
    kcal_target: daily?.kcal_target ?? target?.kcal_target ?? DEFAULT_TARGETS.kcal_target,
    protein_target: daily?.protein_target ?? target?.protein_target ?? DEFAULT_TARGETS.protein_target,
    carb_target: daily?.carb_target ?? target?.carb_target ?? DEFAULT_TARGETS.carb_target,
    fat_target: daily?.fat_target ?? target?.fat_target ?? DEFAULT_TARGETS.fat_target,
    water_target_ml: target?.water_target_ml ?? DEFAULT_TARGETS.water_target_ml,
  };
}

function defaultTime(category: MealCategory) {
  return category.default_time?.slice(0, 5) || '12:00';
}

function iconForCategoryName(name: string) {
  const normalized = normalizeMealName(name);
  if (normalized.includes('sniad')) return 'sun';
  if (normalized.includes('kolac')) return 'moon';
  if (normalized.includes('przek') || normalized.includes('snack')) return 'coffee';
  return 'utensils';
}

function defaultMealCategoriesFallback(): MealCategory[] {
  const now = new Date().toISOString();
  return DEFAULT_MEAL_CATEGORIES.map((category) => ({
    id: `default-${normalizeMealName(category.name)}`,
    user_id: 'local-default',
    name: category.name,
    icon: category.icon,
    sort_order: category.sort_order,
    is_visible: true,
    is_default: false,
    default_time: category.default_time,
    created_at: now,
    updated_at: now,
  }));
}

function isFallbackCategory(category: MealCategory) {
  return category.id.startsWith('default-');
}

function buildConsumedAt(date: string, time: string) {
  return new Date(`${date}T${time || '12:00'}:00`).toISOString();
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DietScreen() {
  const [selectedDate, setSelectedDate] = useState(() => parseIsoDate(new URLSearchParams(window.location.search).get('date')));
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('day');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [addCategory, setAddCategory] = useState<MealCategory | null>(null);
  const [customMealsOpen, setCustomMealsOpen] = useState(false);
  const [customMealTarget, setCustomMealTarget] = useState<MealCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const repairedHiddenDefaultsRef = useRef(false);

  const { data: categories = [], isLoading: categoriesLoading } = useMealCategories();
  const restoreDefaultsMutation = useRestoreDefaultMealCategories();
  const visibleCategories = useMemo(() => categories.filter((category) => category.is_visible), [categories]);
  const fallbackCategories = useMemo(() => defaultMealCategoriesFallback(), []);
  const screenCategories = visibleCategories.length > 0 ? visibleCategories : fallbackCategories;
  const activeCategory = screenCategories.find((category) => category.id === activeCategoryId) ?? screenCategories[0] ?? null;
  const { data: items = [], isLoading: itemsLoading } = useTodayMealItems(selectedDate);
  const { data: meals = [] } = useTodayMeals(selectedDate);
  const { data: nutrition } = useNutritionToday(selectedDate);
  const { data: target } = useNutritionTarget();
  const { data: historyItems = [] } = useMealItemsHistory();
  const { data: nutritionHistory = [] } = useNutritionHistory();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('date', selectedDate);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [selectedDate]);

  useEffect(() => {
    if (!activeCategoryId && screenCategories[0]) setActiveCategoryId(screenCategories[0].id);
    if (activeCategoryId && screenCategories.length && !screenCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(screenCategories[0].id);
    }
  }, [activeCategoryId, screenCategories]);

  const restoreVisibleDefaults = async () => {
    await restoreDefaultsMutation.mutateAsync();
    toast.success('Przywrócono domyślne kategorie');
  };

  const handleRestoreVisibleDefaults = () => {
    restoreVisibleDefaults().catch(() => toast.error('Nie udało się przywrócić kategorii'));
  };

  useEffect(() => {
    if (categoriesLoading || categories.length === 0 || visibleCategories.length > 0 || repairedHiddenDefaultsRef.current) return;
    repairedHiddenDefaultsRef.current = true;
    handleRestoreVisibleDefaults();
  }, [categoriesLoading, categories.length, visibleCategories.length]);

  const mealById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals]);
  const mealGroups = useMemo(() => {
    const byCategory = new Map(screenCategories.map((category) => [category.id, [] as MealItem[]]));
    for (const item of items) {
      const meal = mealById.get(item.meal_id ?? '');
      let categoryId = meal?.meal_category_id ?? null;
      if (!categoryId && meal?.name) {
        categoryId = screenCategories.find((cat) => normalizeMealName(cat.name) === normalizeMealName(meal.name))?.id ?? null;
      }
      const fallbackId = screenCategories[0]?.id;
      const key = categoryId ?? fallbackId;
      if (key) byCategory.set(key, [...(byCategory.get(key) ?? []), item]);
    }
    return byCategory;
  }, [screenCategories, items, mealById]);

  const todayTotals = useMemo(() => sumItems(items), [items]);
  const goals = combineGoals(target, nutrition);

  return (
    <PageLayout
      className="diet-os"
      header={<PageHeader
        icon={<Utensils size={24} />}
        title="Dieta"
        desc="Dziennik posiłków, makroskładniki i nawodnienie w jednym miejscu."
        actions={<>
          <button className="btn btn-secondary btn-sm" disabled={categoriesLoading || itemsLoading} onClick={() => { setCustomMealTarget(null); setCustomMealsOpen(true); }}><Book size={15} /> Własne posiłki</button>
          <button className="btn btn-secondary btn-sm" disabled={categoriesLoading || itemsLoading} onClick={() => setSettingsOpen(true)}><Settings size={15} /> Ustawienia</button>
        </>}
      />}
    >

      <DateBar
        date={selectedDate}
        loading={categoriesLoading || itemsLoading}
        onChange={setSelectedDate}
      />

      <div className="diet-shell">
        <main className="diet-meals-col" aria-busy={itemsLoading || categoriesLoading}>
          {categoriesLoading ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="diet-meal-card is-loading" />)
          ) : screenCategories.length === 0 ? (
            <EmptyPanel
              title="Brak widocznych kategorii"
              desc="Przywróć domyślny zestaw albo dodaj własne kategorie w ustawieniach."
              action={restoreDefaultsMutation.isPending ? 'Przywracanie...' : 'Przywróć domyślne'}
              onAction={handleRestoreVisibleDefaults}
              disabled={restoreDefaultsMutation.isPending}
            />
          ) : screenCategories.map((category) => (
            <MealSection
              key={category.id}
              category={category}
              items={mealGroups.get(category.id) ?? []}
              active={activeCategory?.id === category.id}
              date={selectedDate}
              onActivate={() => setActiveCategoryId(category.id)}
              onAdd={() => { setAddCategory(category); setActiveCategoryId(category.id); }}
              onEdit={setEditingItem}
            />
          ))}
        </main>

        <aside className="diet-side-col">
          <NutritionSummaryPanel
            mode={summaryMode}
            setMode={setSummaryMode}
            totals={todayTotals}
            nutrition={nutrition}
            target={target}
            onOpenDetails={() => setSummaryOpen(true)}
          />
          <HydrationPanel date={selectedDate} nutrition={nutrition} target={target} />
          <MealRhythmPanel
            categories={screenCategories}
            groups={mealGroups}
            items={items}
            totals={todayTotals}
            goals={goals}
            onAdd={(category) => { setAddCategory(category); setActiveCategoryId(category.id); }}
          />
        </aside>
      </div>

      {summaryOpen && (
        <div className="diet-summary-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setSummaryOpen(false); }}>
          <section className="diet-summary-dialog" role="dialog" aria-modal="true" aria-label="Szczegółowe podsumowanie">
            <button className="icon-btn diet-summary-close" onClick={() => setSummaryOpen(false)} aria-label="Zamknij"><X size={16} /></button>
            <AnalyticsPanel
              mode={summaryMode}
              setMode={setSummaryMode}
              date={selectedDate}
              items={historyItems}
              nutrition={nutritionHistory}
              goals={goals}
              todayTotals={todayTotals}
              onOpenHistory={() => setHistoryOpen(true)}
            />
          </section>
        </div>
      )}

      <AddMealDrawer
        open={addCategory !== null}
        category={addCategory}
        date={selectedDate}
        meals={meals}
        recentItems={historyItems}
        categories={screenCategories}
        onClose={() => setAddCategory(null)}
        onOpenCustomMeals={(category) => { setCustomMealTarget(category); setCustomMealsOpen(true); }}
      />

      <CustomMealsDrawer
        open={customMealsOpen}
        date={selectedDate}
        targetCategory={customMealTarget}
        fallbackCategory={activeCategory}
        categories={screenCategories}
        meals={meals}
        onClose={() => { setCustomMealsOpen(false); setCustomMealTarget(null); }}
      />

      <EditMealModal item={editingItem} open={editingItem !== null} onClose={() => setEditingItem(null)} date={selectedDate} />

      <CategorySettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} categories={screenCategories} />

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Pełna historia diety" size="lg">
        <div className="diet-history-list">
          {historyItems.length === 0 ? <EmptyPanel title="Brak historii" desc="Dodane wpisy żywieniowe pojawią się tutaj automatycznie." /> : historyItems.slice(0, 80).map((item) => (
            <div key={item.id} className="diet-history-row">
              <span>{formatDateShort(consumedDay(item))}</span>
              <strong>{item.name}</strong>
              <span>{round(item.amount)} {item.unit}</span>
              <span>{round(item.kcal)} kcal</span>
            </div>
          ))}
        </div>
        <p className="diet-todo-note">Historia pokazuje ostatnie wpisy. Pełny zakres wybierzesz w analityce dziennej, tygodniowej i miesięcznej.</p>
      </Modal>
    </PageLayout>
  );
}

function DateBar({ date, loading, onChange }: { date: string; loading: boolean; onChange: (date: string) => void }) {
  return (
    <div className="diet-datebar">
      <div className="diet-datebar-nav">
        <button className="icon-btn" disabled={loading} onClick={() => onChange(shiftDate(date, -1))} aria-label="Poprzedni dzień"><ChevronLeft size={16} /></button>
        <button className="diet-date-label" disabled={loading} onClick={() => {
          const picker = document.getElementById('diet-date-picker') as (HTMLInputElement & { showPicker?: () => void }) | null;
          if (picker?.showPicker) picker.showPicker();
          else picker?.click();
        }}>
          {prettyDate(date)}
        </button>
        <button className="icon-btn" disabled={loading} onClick={() => onChange(shiftDate(date, 1))} aria-label="Następny dzień"><ChevronRight size={16} /></button>
        <button className="btn btn-secondary btn-sm" disabled={loading} onClick={() => onChange(dateToIso(new Date()))}>Dzisiaj</button>
        <label className="icon-btn diet-date-picker" aria-label="Wybierz datę">
          <Calendar size={15} />
          <input id="diet-date-picker" type="date" value={date} disabled={loading} onChange={(event) => onChange(event.target.value)} />
        </label>
      </div>
    </div>
  );
}

function MealSection({ category, items, active, date, onActivate, onAdd, onEdit }: { category: MealCategory; items: MealItem[]; active: boolean; date: string; onActivate: () => void; onAdd: () => void; onEdit: (item: MealItem) => void }) {
  const totals = sumItems(items);
  const remove = useDeleteMealItem(date);

  return (
    <section className={`diet-meal-card ${active ? 'is-active' : ''}`} onFocus={onActivate} onClick={onActivate}>
      <header className="diet-meal-head">
        <div className="diet-meal-title">
          <span className="diet-meal-icon">{iconFor(category.icon)}</span>
          <strong>{category.name}</strong>
        </div>
        <div className="diet-meal-totals">
          <strong>{round(totals.kcal)} kcal</strong>
          <MacroMini label="B" value={totals.protein} tone="protein" />
          <MacroMini label="W" value={totals.carb} tone="carb" />
          <MacroMini label="T" value={totals.fat} tone="fat" />
          <button className="btn btn-secondary btn-sm diet-add-btn" disabled={remove.isPending} onClick={(event) => { event.stopPropagation(); onAdd(); }}>
            <Plus size={14} /> Dodaj
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
        <button className="diet-empty-row" onClick={(event) => { event.stopPropagation(); onAdd(); }}>Brak wpisów</button>
      ) : (
        <div className="diet-entry-list">
          {items.map((item) => (
            <button key={item.id} className="diet-entry-row" onClick={(event) => { event.stopPropagation(); onEdit(item); }}>
              <span className="diet-entry-name">
                <span
                  className="diet-row-delete"
                  role="button"
                  tabIndex={0}
                  aria-label={`Usuń wpis ${item.name}`}
                  onClick={(event) => { event.stopPropagation(); remove.mutate(item.id); }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    remove.mutate(item.id);
                  }}
                ><X size={13} /></span>
                <span className="diet-entry-thumb"><Utensils size={15} /></span>
                <span>{item.name}</span>
              </span>
              <span className="diet-entry-amount">{round(item.amount)} {item.unit || 'g'}</span>
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

function NutritionSummaryPanel({ mode, setMode, totals, nutrition, target, onOpenDetails }: { mode: SummaryMode; setMode: (mode: SummaryMode) => void; totals: ReturnType<typeof sumItems>; nutrition?: NutritionDaily | null; target?: NutritionTarget | null; onOpenDetails: () => void }) {
  const goals = combineGoals(target, nutrition);
  const kcalPct = Math.min(100, (totals.kcal / Math.max(goals.kcal_target, 1)) * 100);

  return (
    <section className="diet-side-card diet-summary-card">
      <header className="diet-panel-head"><strong>Podsumowanie</strong><span className="diet-panel-meta">cel dzienny</span></header>
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
      {mode === 'range' && <p className="diet-todo-note">Zakres własny korzysta z bieżących danych dnia. Tygodniowe i miesięczne agregacje są dostępne w sąsiednich widokach.</p>}
      <div className="diet-kcal-line">
        <div className="diet-ring" style={{ '--pct': `${kcalPct}%` } as CSSProperties} />
        <div>
          <div className="diet-kcal-main"><strong>{round(totals.kcal)}</strong> / {round(goals.kcal_target)} kcal</div>
          <span>Pozostało {round(Math.max(goals.kcal_target - totals.kcal, 0))} kcal</span>
          <span>Nawodnienie {round((nutrition?.water_ml ?? 0) / 1000, 1)} / {round(goals.water_target_ml / 1000, 1)} L</span>
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

function HydrationPanel({ date, nutrition, target }: { date: string; nutrition?: NutritionDaily | null; target?: NutritionTarget | null }) {
  const [active, setActive] = useState<number | null>(null);
  const add200 = useAddWater(200, date);
  const add300 = useAddWater(300, date);
  const add500 = useAddWater(500, date);
  const { data: entries = [] } = useHydrationEntries(date);
  const amount = nutrition?.water_ml ?? entries.reduce((acc, entry) => acc + entry.amount_ml, 0);
  const goal = target?.water_target_ml ?? DEFAULT_TARGETS.water_target_ml;
  const pending = add200.isPending || add300.isPending || add500.isPending;

  const add = (ml: number) => {
    setActive(ml);
    const mutation = ml === 200 ? add200 : ml === 500 ? add500 : add300;
    mutation.mutate(undefined, {
      onSuccess: () => toast.success(`Dodano ${ml} ml wody`),
      onError: () => toast.error('Nie udało się zapisać nawodnienia'),
      onSettled: () => window.setTimeout(() => setActive(null), 650),
    });
  };

  return (
    <section className="diet-side-card">
      <header className="diet-panel-head"><strong>Nawodnienie</strong><Droplets size={15} /></header>
      <div className="diet-water-value"><strong>{round(amount / 1000, 1)}</strong> / {round(goal / 1000, 1)} L</div>
      <ProgressBar value={amount} max={goal} color="var(--water, #38BDF8)" size="md" />
      <div className="diet-water-actions">
        {[200, 300, 500].map((ml) => (
          <button key={ml} className={`btn btn-secondary btn-sm ${active === ml ? 'is-active' : ''}`} disabled={pending} onClick={() => add(ml)}>+{ml} ml</button>
        ))}
      </div>
      {entries.length > 0 && <span className="diet-panel-meta">{entries.length} wpisów dzisiaj</span>}
    </section>
  );
}

function MealRhythmPanel({ categories, groups, items, totals, goals, onAdd }: { categories: MealCategory[]; groups: Map<string, MealItem[]>; items: MealItem[]; totals: ReturnType<typeof sumItems>; goals: ReturnType<typeof combineGoals>; onAdd: (category: MealCategory) => void }) {
  const filledCategories = categories.filter((category) => (groups.get(category.id) ?? []).length > 0);
  const emptyCategories = categories.filter((category) => (groups.get(category.id) ?? []).length === 0);
  const nextCategory = emptyCategories[0] ?? categories[0] ?? null;
  const completion = categories.length ? Math.round((filledCategories.length / categories.length) * 100) : 0;
  const macroGaps = [
    { label: 'białka', value: goals.protein_target - totals.protein },
    { label: 'węglowodanów', value: goals.carb_target - totals.carb },
    { label: 'tłuszczów', value: goals.fat_target - totals.fat },
  ].sort((a, b) => b.value - a.value);
  const macroHint = macroGaps[0]?.value > 5 ? `Do uzupełnienia: ${round(macroGaps[0].value)} g ${macroGaps[0].label}` : 'Makro wygląda równo';

  return (
    <section className="diet-side-card diet-rhythm-card">
      <header className="diet-panel-head">
        <div>
          <strong>Rytm posiłków</strong>
          <span className="diet-panel-meta">{items.length} wpisów dzisiaj</span>
        </div>
        <span className="diet-rhythm-score">{completion}%</span>
      </header>

      <div className="diet-rhythm-progress">
        <ProgressBar value={filledCategories.length} max={Math.max(categories.length, 1)} color="var(--accent-ice)" size="sm" />
        <span>{filledCategories.length}/{categories.length || 0} kategorii uzupełnionych</span>
      </div>

      <div className="diet-rhythm-focus">
        {nextCategory ? (
          <>
            <span>Następny posiłek</span>
            <strong>{nextCategory.name}</strong>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => onAdd(nextCategory)}>Dodaj wpis</button>
          </>
        ) : (
          <>
            <span>Plan dnia</span>
            <strong>Brak widocznych kategorii</strong>
          </>
        )}
      </div>

      <div className="diet-rhythm-hint">
        <span>{macroHint}</span>
        <strong>{round(totals.kcal)} / {round(goals.kcal_target)} kcal</strong>
      </div>
    </section>
  );
}

function AddMealDrawer({ open, category, date, meals, recentItems, categories, onClose, onOpenCustomMeals }: { open: boolean; category: MealCategory | null; date: string; meals: Meal[]; recentItems: MealItem[]; categories: MealCategory[]; onClose: () => void; onOpenCustomMeals: (category: MealCategory) => void }) {
  const [mode, setMode] = useState<AddMode>('search');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodSearchEntry | null>(null);
  const [amount, setAmount] = useState(100);
  const [unit, setUnit] = useState('g');
  const [time, setTime] = useState('12:00');
  const [barcode, setBarcode] = useState('');
  const [quickText, setQuickText] = useState('');
  const [manual, setManual] = useState({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, amount: 100, unit: 'g' });
  const { results, isSearching } = useFoodSearch(query);
  const upsertMeal = useUpsertMealForCategory(date);
  const addItem = useAddMealItem(date);
  const createCustom = useCreateCustomMeal();
  const { data: customMeals = [] } = useCustomMeals();

  useEffect(() => {
    if (!open || !category) return;
    setTargetCategoryId(category.id);
    setSelected(null);
    setMode('search');
    setQuery('');
    setAmount(100);
    setUnit('g');
    setTime(defaultTime(category));
    setManual({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, amount: 100, unit: 'g' });
  }, [category, open]);

  const targetCategory = categories.find((item) => item.id === targetCategoryId) ?? category ?? categories[0] ?? null;
  const selectedMacros = selected ? foodMacros(selected) : null;
  const preview = selectedMacros ? scaleMacros(selectedMacros, amount) : { kcal: manual.kcal, protein: manual.protein, carb: manual.carb, fat: manual.fat };
  const recentUnique = useMemo(() => {
    const map = new Map<string, MealItem>();
    for (const item of recentItems) if (!map.has(item.name.toLowerCase())) map.set(item.name.toLowerCase(), item);
    return [...map.values()].slice(0, 10);
  }, [recentItems]);

  const changeMode = (nextMode: AddMode) => {
    setMode(nextMode);
    if (nextMode !== 'search') setSelected(null);
  };
  const updateManual = (patch: Partial<typeof manual>) => {
    setSelected(null);
    setManual((current) => ({ ...current, ...patch }));
  };

  const canSave = !!targetCategory && (selected || manual.name.trim() || quickText.trim()) && amount > 0;

  const addMeal = async () => {
    if (!targetCategory || !canSave) {
      toast.error('Uzupełnij kategorię, produkt i ilość');
      return;
    }
    try {
      const mealRow = meals.find((item) => item.meal_category_id === targetCategory.id) ?? await upsertMeal.mutateAsync(targetCategory);
      const payload = selectedMacros
        ? {
            meal_id: mealRow.id,
            food_item_id: selected?.source === 'local' ? selected.item.id : null,
            name: selected ? foodName(selected) : manual.name,
            amount,
            unit,
            consumed_at: buildConsumedAt(date, time),
            ...preview,
          }
        : {
            meal_id: mealRow.id,
            name: manual.name || quickText || 'Własny posiłek',
            amount: manual.amount || amount,
            unit: manual.unit || unit,
            consumed_at: buildConsumedAt(date, time),
            kcal: manual.kcal,
            protein: manual.protein,
            carb: manual.carb,
            fat: manual.fat,
          };
      await addItem.mutateAsync(payload);
      if (!selectedMacros && manual.name.trim()) {
        await createCustom.mutateAsync({
          name: manual.name.trim(),
          kcal: manual.kcal,
          protein: manual.protein,
          carb: manual.carb,
          fat: manual.fat,
          default_quantity: manual.amount || amount,
          default_unit: manual.unit || unit,
          last_used_at: new Date().toISOString(),
        });
      }
      toast.success('Dodano wpis do posiłku');
      onClose();
    } catch {
      toast.error('Nie udało się zapisać wpisu');
    }
  };

  const lookup = async () => {
    if (!barcode.trim()) return;
    const product = await lookupBarcode(barcode.trim());
    if (!product) {
      toast.error('Nie znaleziono produktu dla kodu');
      return;
    }
    setQuery(product.name);
    setMode('search');
  };

  const addCustomMeal = async (meal: CustomMeal) => {
    if (!targetCategory) return;
    const mealRow = meals.find((item) => item.meal_category_id === targetCategory.id) ?? await upsertMeal.mutateAsync(targetCategory);
    await addItem.mutateAsync({
      meal_id: mealRow.id,
      custom_meal_id: meal.id,
      name: meal.name,
      amount: meal.default_quantity,
      unit: meal.default_unit,
      kcal: meal.kcal,
      protein: meal.protein,
      carb: meal.carb,
      fat: meal.fat,
      consumed_at: buildConsumedAt(date, time),
    });
    toast.success('Dodano własny posiłek');
    onClose();
  };

  if (!open || !category) return null;

  return (
    <Drawer title="Dodaj posiłek" onClose={onClose} width={940}>
      <SubTabs
        tabs={[
          { id: 'search', label: 'Produkt' },
          { id: 'recent', label: 'Ostatnie' },
          { id: 'favorites', label: 'Ulubione' },
          { id: 'custom', label: 'Własny posiłek' },
          { id: 'quick', label: 'Szybkie' },
        ]}
        active={mode}
        onChange={(id) => changeMode(id as AddMode)}
      />
      <div className="diet-drawer-grid">
        <div className="diet-drawer-left">
          <MealPicker categories={categories} value={targetCategoryId} onChange={(next) => {
            setTargetCategoryId(next);
            const selectedCategory = categories.find((item) => item.id === next);
            if (selectedCategory) setTime(defaultTime(selectedCategory));
          }} />
          {mode === 'search' && (
            <>
              <label className="diet-search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj produktu..." />{query && <button onClick={() => setQuery('')}><X size={13} /></button>}</label>
              <div className="diet-search-results">
                {isSearching && <span className="muted">Szukam produktów...</span>}
                {!isSearching && query && results.length === 0 && <span className="muted">Brak wyników</span>}
                {results.slice(0, 10).map((entry) => {
                  const macros = foodMacros(entry);
                  return (
                    <button key={`${entry.source}-${foodName(entry)}`} className={selected === entry ? 'is-selected' : ''} onClick={() => { setSelected(entry); setManual({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, amount: 100, unit: 'g' }); setQuickText(''); setAmount(macros.perAmount); setUnit(macros.unit); }}>
                      <span className="diet-food-thumb"><Utensils size={15} /></span>
                      <span><strong>{foodName(entry)}</strong><small>{macros.perAmount} {macros.unit} | {round(macros.kcal)} kcal</small></span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {mode === 'recent' && <RecentItemsList items={recentUnique} onPick={(item) => { setSelected(null); setManual({ name: item.name, kcal: item.kcal, protein: item.protein, carb: item.carb, fat: item.fat, amount: item.amount, unit: item.unit || 'g' }); setAmount(item.amount); setUnit(item.unit || 'g'); }} />}
          {mode === 'favorites' && <CustomMealQuickList meals={customMeals.filter((meal) => meal.is_favorite)} onPick={addCustomMeal} />}
          {mode === 'custom' && (
            <div className="diet-form-stack">
              <button className="btn btn-secondary btn-sm" onClick={() => onOpenCustomMeals(targetCategory)}>Otwórz bibliotekę własnych posiłków</button>
              <label>Nazwa posiłku<input value={manual.name} onChange={(event) => updateManual({ name: event.target.value })} /></label>
              <div className="diet-form-grid">
                <label>Ilość<input type="number" min={1} value={manual.amount} onChange={(event) => updateManual({ amount: Number(event.target.value) })} /></label>
                <label>Jednostka<select value={manual.unit} onChange={(event) => updateManual({ unit: event.target.value })}>{UNIT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Kcal<input type="number" min={0} value={manual.kcal} onChange={(event) => updateManual({ kcal: Number(event.target.value) })} /></label>
                <label>Białko<input type="number" min={0} value={manual.protein} onChange={(event) => updateManual({ protein: Number(event.target.value) })} /></label>
                <label>Węgle<input type="number" min={0} value={manual.carb} onChange={(event) => updateManual({ carb: Number(event.target.value) })} /></label>
                <label>Tłuszcze<input type="number" min={0} value={manual.fat} onChange={(event) => updateManual({ fat: Number(event.target.value) })} /></label>
              </div>
            </div>
          )}
          {mode === 'quick' && (
            <div className="diet-form-stack">
              <label>Ręczny kod kreskowy<input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="np. 590..." /></label>
              <button className="btn btn-secondary btn-sm" onClick={lookup}>Sprawdź kod</button>
              <label>Szybki wpis<input value={quickText} onChange={(event) => { setSelected(null); setQuickText(event.target.value); }} placeholder="np. ryż 150g" /></label>
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(null); setQuery(quickText.replace(/(\d+(?:[,.]\d+)?)\s*(g|ml|szt\.?|porcja)?/i, '').trim() || quickText); setAmount(Number((quickText.match(/(\d+(?:[,.]\d+)?)/)?.[1] ?? '100').replace(',', '.'))); setMode('search'); }}>Szukaj z szybkiego wpisu</button>
            </div>
          )}
        </div>
        <div className="diet-drawer-right">
          <h3>{selected ? foodName(selected) : manual.name || quickText || 'Podgląd posiłku'}</h3>
          <span className="muted">{selectedMacros ? `${selectedMacros.perAmount} ${selectedMacros.unit} | ${round(selectedMacros.kcal)} kcal` : 'Na podstawie wprowadzonych wartości'}</span>
          <div className="diet-preview-photo"><Utensils size={36} /></div>
          <div className="diet-form-grid">
            <label>Kategoria<select value={targetCategoryId} onChange={(event) => setTargetCategoryId(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Data<input type="date" value={date} readOnly /></label>
            <label>Godzina<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
            <label>Ilość<input type="number" min={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
            <label>Jednostka<select value={unit} onChange={(event) => setUnit(event.target.value)}>{UNIT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="diet-preview-macros"><strong>{round(preview.kcal)} kcal</strong><MacroMini label="B" value={preview.protein} tone="protein" /><MacroMini label="W" value={preview.carb} tone="carb" /><MacroMini label="T" value={preview.fat} tone="fat" /></div>
        </div>
      </div>
      <footer className="diet-drawer-footer">
        <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" disabled={addItem.isPending || createCustom.isPending || upsertMeal.isPending || !canSave} onClick={addMeal}>{addItem.isPending ? 'Zapisuję...' : 'Dodaj do posiłku'}</button>
      </footer>
    </Drawer>
  );
}

function MealPicker({ categories, value, onChange }: { categories: MealCategory[]; value: string; onChange: (id: string) => void }) {
  return <div className="diet-meal-picker">{categories.map((category) => <button key={category.id} className={value === category.id ? 'active' : ''} onClick={() => onChange(category.id)}>{category.name}</button>)}</div>;
}

function RecentItemsList({ items, onPick }: { items: MealItem[]; onPick: (item: MealItem) => void }) {
  if (!items.length) return <EmptyPanel title="Brak ostatnich produktów" desc="Po kilku wpisach lista zacznie działać jako szybki skrót." />;
  return <div className="diet-search-results">{items.map((item) => <button key={item.id} onClick={() => onPick(item)}><span className="diet-food-thumb"><Utensils size={15} /></span><span><strong>{item.name}</strong><small>{round(item.amount)} {item.unit} | {round(item.kcal)} kcal</small></span></button>)}</div>;
}

function CustomMealQuickList({ meals, onPick }: { meals: CustomMeal[]; onPick: (meal: CustomMeal) => void }) {
  if (!meals.length) return <EmptyPanel title="Brak ulubionych" desc="Oznacz własne posiłki gwiazdką, aby pojawiły się tutaj." />;
  return <div className="diet-search-results">{meals.map((meal) => <button key={meal.id} onClick={() => onPick(meal)}><span className="diet-food-thumb"><Star size={15} /></span><span><strong>{meal.name}</strong><small>{round(meal.kcal)} kcal | B {round(meal.protein)} W {round(meal.carb)} T {round(meal.fat)}</small></span></button>)}</div>;
}

function CustomMealsDrawer({ open, date, targetCategory, fallbackCategory, categories, meals, onClose }: { open: boolean; date: string; targetCategory: MealCategory | null; fallbackCategory: MealCategory | null; categories: MealCategory[]; meals: Meal[]; onClose: () => void }) {
  const [tab, setTab] = useState<CustomMealTab>('recent');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [editing, setEditing] = useState<CustomMeal | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomMeal | null>(null);
  const { data: customMeals = [] } = useCustomMeals();
  const createMeal = useCreateCustomMeal();
  const updateMeal = useUpdateCustomMeal();
  const deleteMeal = useDeleteCustomMeal();
  const upsertMeal = useUpsertMealForCategory(date);
  const addItem = useAddMealItem(date);

  useEffect(() => {
    if (open) setCategoryId((targetCategory ?? fallbackCategory ?? categories[0])?.id ?? '');
  }, [categories, fallbackCategory, open, targetCategory]);

  const filtered = customMeals
    .filter((meal) => tab === 'favorites' ? meal.is_favorite : tab === 'recent' ? meal.last_used_at : true)
    .filter((meal) => meal.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => tab === 'recent' ? String(b.last_used_at ?? '').localeCompare(String(a.last_used_at ?? '')) : a.name.localeCompare(b.name));
  const selected = customMeals.find((meal) => meal.id === selectedId) ?? filtered[0] ?? null;
  const target = categories.find((category) => category.id === categoryId) ?? targetCategory ?? fallbackCategory ?? categories[0] ?? null;

  const addSelected = async () => {
    if (!selected || !target) {
      toast.error('Wybierz posiłek i kategorię');
      return;
    }
    try {
      const mealRow = meals.find((item) => item.meal_category_id === target.id) ?? await upsertMeal.mutateAsync(target);
      await addItem.mutateAsync({
        meal_id: mealRow.id,
        custom_meal_id: selected.id,
        name: selected.name,
        amount: selected.default_quantity,
        unit: selected.default_unit,
        kcal: selected.kcal,
        protein: selected.protein,
        carb: selected.carb,
        fat: selected.fat,
        consumed_at: buildConsumedAt(date, defaultTime(target)),
      });
      await updateMeal.mutateAsync({ id: selected.id, patch: { last_used_at: new Date().toISOString() } });
      toast.success('Dodano własny posiłek do dziennika');
      onClose();
    } catch {
      toast.error('Nie udało się dodać własnego posiłku');
    }
  };

  if (!open) return null;

  return (
    <Drawer title="Własne posiłki" onClose={onClose} width={780}>
      <div className="diet-custom-toolbar">
        <label className="diet-search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj własnego posiłku..." /><span /></label>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={14} /> Utwórz nowy</button>
      </div>
      <SubTabs tabs={[{ id: 'recent', label: 'Ostatnie' }, { id: 'favorites', label: 'Ulubione' }, { id: 'mine', label: 'Moje' }]} active={tab} onChange={(id) => setTab(id as CustomMealTab)} />
      <div className="diet-custom-grid">
        <div className="diet-template-list">
          {filtered.length === 0 ? (
            <EmptyPanel title="Nie masz jeszcze własnych posiłków." desc="Dodaj pierwszy posiłek, aby szybciej uzupełniać dziennik." />
          ) : filtered.map((meal) => (
            <button key={meal.id} className={`diet-template-row ${selected?.id === meal.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(meal.id)}>
              <span className="diet-template-thumb">{meal.is_favorite ? <Star size={15} /> : <Utensils size={15} />}</span>
              <span><strong>{meal.name}</strong><small>{round(meal.kcal)} kcal | B {round(meal.protein)} W {round(meal.carb)} T {round(meal.fat)}</small></span>
            </button>
          ))}
        </div>
        <div className="diet-custom-detail">
          {selected ? (
            <>
              <div className="diet-panel-head"><strong>{selected.name}</strong><button className={`icon-btn ${selected.is_favorite ? 'is-active' : ''}`} onClick={() => updateMeal.mutate({ id: selected.id, patch: { is_favorite: !selected.is_favorite } })}><Star size={15} /></button></div>
              <div className="diet-preview-macros"><strong>{round(selected.kcal)} kcal</strong><MacroMini label="B" value={selected.protein} tone="protein" /><MacroMini label="W" value={selected.carb} tone="carb" /><MacroMini label="T" value={selected.fat} tone="fat" /></div>
              <label className="diet-select-label">Dodaj do kategorii<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <div className="diet-custom-actions">
                <button className="btn btn-primary" disabled={addItem.isPending || upsertMeal.isPending} onClick={addSelected}>Dodaj do posiłku</button>
                <button className="btn btn-secondary" onClick={() => setEditing(selected)}><Pencil size={14} /> Edytuj</button>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(selected)}><Trash2 size={14} /> Usuń</button>
              </div>
            </>
          ) : <EmptyPanel title="Wybierz posiłek" desc="Po zaznaczeniu zobaczysz szczegóły i akcje." />}
        </div>
      </div>
      <CustomMealEditor
        meal={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          if (editing && editing !== 'new') await updateMeal.mutateAsync({ id: editing.id, patch: input });
          else await createMeal.mutateAsync(input);
          setEditing(null);
          toast.success('Własny posiłek zapisany');
        }}
      />
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Usuń własny posiłek" size="sm" footer={<><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Anuluj</button><button className="btn btn-danger" onClick={async () => { if (confirmDelete) await deleteMeal.mutateAsync(confirmDelete.id); setConfirmDelete(null); toast.success('Usunięto własny posiłek'); }}>Usuń</button></>}>
        <p className="muted">Usunięcie nie kasuje historycznych wpisów w dzienniku.</p>
      </Modal>
    </Drawer>
  );
}

function CustomMealEditor({ meal, open, onClose, onSave }: { meal: CustomMeal | 'new' | null; open: boolean; onClose: () => void; onSave: (input: { name: string; kcal: number; protein: number; carb: number; fat: number; default_quantity: number; default_unit: string; is_favorite: boolean }) => Promise<void> }) {
  const existing = meal && meal !== 'new' ? meal : null;
  const [form, setForm] = useState({ name: '', kcal: 0, protein: 0, carb: 0, fat: 0, default_quantity: 100, default_unit: 'g', is_favorite: false });
  useEffect(() => {
    if (!open) return;
    setForm(existing ? {
      name: existing.name,
      kcal: existing.kcal,
      protein: existing.protein,
      carb: existing.carb,
      fat: existing.fat,
      default_quantity: existing.default_quantity,
      default_unit: existing.default_unit,
      is_favorite: existing.is_favorite,
    } : { name: '', kcal: 0, protein: 0, carb: 0, fat: 0, default_quantity: 100, default_unit: 'g', is_favorite: false });
  }, [existing, open]);
  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edytuj własny posiłek' : 'Utwórz własny posiłek'} footer={<><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" disabled={!form.name.trim()} onClick={() => onSave(form)}>Zapisz</button></>}>
      <div className="diet-form-stack">
        <label>Nazwa<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <div className="diet-form-grid">
          <label>Domyślna ilość<input type="number" min={1} value={form.default_quantity} onChange={(event) => setForm({ ...form, default_quantity: Number(event.target.value) })} /></label>
          <label>Jednostka<select value={form.default_unit} onChange={(event) => setForm({ ...form, default_unit: event.target.value })}>{UNIT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Kcal<input type="number" min={0} value={form.kcal} onChange={(event) => setForm({ ...form, kcal: Number(event.target.value) })} /></label>
          <label>Białko<input type="number" min={0} value={form.protein} onChange={(event) => setForm({ ...form, protein: Number(event.target.value) })} /></label>
          <label>Węgle<input type="number" min={0} value={form.carb} onChange={(event) => setForm({ ...form, carb: Number(event.target.value) })} /></label>
          <label>Tłuszcze<input type="number" min={0} value={form.fat} onChange={(event) => setForm({ ...form, fat: Number(event.target.value) })} /></label>
        </div>
        <label className="diet-toggle"><span>Ulubiony</span><input type="checkbox" checked={form.is_favorite} onChange={(event) => setForm({ ...form, is_favorite: event.target.checked })} /></label>
      </div>
    </Modal>
  );
}

function EditMealModal({ item, open, onClose, date }: { item: MealItem | null; open: boolean; onClose: () => void; date: string }) {
  const [form, setForm] = useState({ name: '', amount: 0, unit: 'g', kcal: 0, protein: 0, carb: 0, fat: 0 });
  const update = useUpdateMealItem(date);
  const remove = useDeleteMealItem(date);

  useEffect(() => {
    if (item) setForm({ name: item.name, amount: item.amount, unit: item.unit || 'g', kcal: item.kcal, protein: item.protein, carb: item.carb, fat: item.fat });
  }, [item]);

  const save = async () => {
    if (!item) return;
    await update.mutateAsync({ id: item.id, patch: form });
    toast.success('Wpis zaktualizowany');
    onClose();
  };

  const del = async () => {
    if (!item) return;
    await remove.mutateAsync(item.id);
    toast.success('Wpis usunięty');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edytuj wpis posiłku" size="md" footer={<><button className="btn btn-danger" disabled={remove.isPending} onClick={del}><Trash2 size={14} /> Usuń</button><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" disabled={update.isPending || !form.name.trim()} onClick={save}>Zapisz</button></>}>
      <div className="diet-form-stack">
        <label>Nazwa<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <div className="diet-form-grid">
          <label>Ilość<input type="number" min={1} value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} /></label>
          <label>Jednostka<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>{UNIT_OPTIONS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
          <label>Kcal<input type="number" min={0} value={form.kcal} onChange={(event) => setForm({ ...form, kcal: Number(event.target.value) })} /></label>
          <label>Białko<input type="number" min={0} value={form.protein} onChange={(event) => setForm({ ...form, protein: Number(event.target.value) })} /></label>
          <label>Węgle<input type="number" min={0} value={form.carb} onChange={(event) => setForm({ ...form, carb: Number(event.target.value) })} /></label>
          <label>Tłuszcze<input type="number" min={0} value={form.fat} onChange={(event) => setForm({ ...form, fat: Number(event.target.value) })} /></label>
        </div>
      </div>
    </Modal>
  );
}

function CategorySettingsDrawer({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: MealCategory[] }) {
  const createCategory = useCreateMealCategory();
  const updateCategory = useUpdateMealCategory();
  const restoreDefaultsMutation = useRestoreDefaultMealCategories();
  const reorderCategories = useReorderMealCategories();
  const deleteCategory = useDeleteMealCategory();
  const countItems = useCountMealCategoryItems();
  const moveEntries = useMoveCategoryEntries();
  const deleteEntries = useDeleteCategoryEntries();
  const [form, setForm] = useState<NewMealCategoryInput>({ name: '', icon: 'utensils', default_time: '', is_visible: true });
  const [editing, setEditing] = useState<MealCategory | null>(null);
  const [deleteState, setDeleteState] = useState<{ category: MealCategory; count: number; action: CategoryDeleteAction; targetId: string; confirm: boolean } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', icon: 'utensils', default_time: '', is_visible: true });
  };

  const saveCategory = async () => {
    const name = form.name?.trim() ?? '';
    if (!name) {
      toast.error('Nazwa kategorii jest wymagana');
      return;
    }
    const defaultTime = form.default_time?.trim() ?? '';
    if (defaultTime && !/^\d{2}:\d{2}$/.test(defaultTime)) {
      toast.error('Godzina musi mieć format HH:MM');
      return;
    }
    if (categories.some((cat) => cat.id !== editing?.id && cat.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Taka kategoria już istnieje');
      return;
    }
    const payload = {
      name,
      is_visible: form.is_visible ?? true,
      icon: form.icon || iconForCategoryName(name),
      default_time: defaultTime || null,
      sort_order: editing?.sort_order ?? (categories.length + 1) * 10,
    };
    if (editing && !isFallbackCategory(editing)) await updateCategory.mutateAsync({ id: editing.id, patch: payload });
    else await createCategory.mutateAsync(payload);
    resetForm();
    toast.success('Kategoria zapisana');
  };

  const move = async (category: MealCategory, direction: -1 | 1) => {
    const index = sorted.findIndex((item) => item.id === category.id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    await reorderCategories.mutateAsync(next.map((item, i) => ({ id: item.id, sort_order: (i + 1) * 10 })));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (String(active.id).startsWith('default-') || String(over.id).startsWith('default-')) {
      await restoreDefaults();
      return;
    }
    const oldIndex = sorted.findIndex((item) => item.id === active.id);
    const newIndex = sorted.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sorted, oldIndex, newIndex);
    await reorderCategories.mutateAsync(next.map((item, i) => ({ id: item.id, sort_order: (i + 1) * 10 })));
  };

  const askDelete = async (category: MealCategory) => {
    const count = await countItems.mutateAsync(category.id);
    setDeleteState({ category, count, action: count ? 'hide' : 'delete', targetId: sorted.find((item) => item.id !== category.id)?.id ?? '', confirm: false });
  };

  const applyDelete = async () => {
    if (!deleteState) return;
    const { category, action, targetId, confirm } = deleteState;
    if (action === 'hide') {
      await updateCategory.mutateAsync({ id: category.id, patch: { is_visible: false } });
    } else if (action === 'move') {
      if (!targetId) {
        toast.error('Wybierz kategorię docelową');
        return;
      }
      await moveEntries.mutateAsync({ categoryId: category.id, targetCategoryId: targetId });
      await deleteCategory.mutateAsync(category.id);
    } else {
      if (deleteState.count > 0 && !confirm) {
        toast.error('Potwierdź usunięcie wpisów');
        return;
      }
      if (deleteState.count > 0) await deleteEntries.mutateAsync(category.id);
      await deleteCategory.mutateAsync(category.id);
    }
    setDeleteState(null);
    toast.success('Zmieniono kategorię');
  };

  const restoreDefaults = async () => {
    try {
      await restoreDefaultsMutation.mutateAsync();
      toast.success('Dodano domyślne kategorie');
    } catch {
      toast.error('Nie udało się dodać domyślnych kategorii');
    }
  };

  if (!open) return null;

  return (
    <div className="diet-settings-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="diet-settings-dialog" role="dialog" aria-modal="true" aria-label="Ustawienia - kategorie posiłków">
        <header className="diet-settings-dialog-head">
          <strong>Ustawienia - kategorie posiłków</strong>
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij"><X size={16} /></button>
        </header>
      <div className="diet-settings-grid">
        <section className="diet-settings-list">
          <div className="diet-category-table-head">
            <span>Kategoria</span>
            <span>Godzina domyślna</span>
            <span>Widoczność</span>
            <span>Akcje</span>
          </div>
          <div className="diet-category-table-scroll">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sorted.map((category) => category.id)} strategy={verticalListSortingStrategy}>
                {sorted.map((category, index) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    index={index}
                    total={sorted.length}
                    disabled={reorderCategories.isPending}
                    onToggle={() => isFallbackCategory(category) ? restoreDefaults() : updateCategory.mutate({ id: category.id, patch: { is_visible: !category.is_visible } })}
                    onTimeChange={(time) => isFallbackCategory(category) ? restoreDefaults() : updateCategory.mutate({ id: category.id, patch: { default_time: time || null } })}
                    onMove={(direction) => isFallbackCategory(category) ? restoreDefaults() : move(category, direction)}
                    onEdit={() => { setEditing(category); setForm({ name: category.name, icon: category.icon || 'utensils', default_time: category.default_time?.slice(0, 5) ?? '', is_visible: category.is_visible }); }}
                    onDelete={() => isFallbackCategory(category) ? restoreDefaults() : askDelete(category)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div className="diet-settings-restore">
            <button className="btn btn-secondary" disabled={restoreDefaultsMutation.isPending} onClick={restoreDefaults}>{restoreDefaultsMutation.isPending ? 'Dodawanie...' : 'Przywróć domyślne'}</button>
          </div>
        </section>

        <section className="diet-settings-form">
          <div className="diet-panel-head"><strong>{editing ? 'Edytuj kategorię' : 'Dodaj nową kategorię'}</strong>{editing && <button className="btn btn-secondary btn-sm" onClick={resetForm}>Anuluj</button>}</div>
          <div className="diet-form-stack">
            <label>Nazwa kategorii<input placeholder="Np. Deser" value={form.name ?? ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <div className="diet-icon-field">
              <span>Ikona</span>
              <div className="diet-icon-options">
                {CATEGORY_ICON_OPTIONS.map((icon) => (
                  <button key={icon} type="button" className={form.icon === icon ? 'is-selected' : ''} onClick={() => setForm({ ...form, icon })} aria-label={`Ikona ${icon}`}>
                    {iconFor(icon, 16)}
                  </button>
                ))}
              </div>
            </div>
            <label>Godzina domyślna <small>(opcjonalnie)</small><input type="time" value={form.default_time ?? ''} onChange={(event) => setForm({ ...form, default_time: event.target.value })} /></label>
            <label className="diet-toggle"><span>Widoczność<small>Pokaż kategorię na ekranie diety</small></span><input type="checkbox" checked={form.is_visible ?? true} onChange={(event) => setForm({ ...form, is_visible: event.target.checked })} /></label>
            <button className="btn btn-primary diet-settings-submit" disabled={createCategory.isPending || updateCategory.isPending} onClick={saveCategory}>{editing ? 'Zapisz kategorię' : 'Dodaj kategorię'}</button>
          </div>
        </section>
      </div>

      <Modal open={!!deleteState} onClose={() => setDeleteState(null)} title="Usuń kategorię" size="md" footer={<><button className="btn btn-secondary" onClick={() => setDeleteState(null)}>Anuluj</button><button className="btn btn-primary" onClick={applyDelete}>Potwierdź</button></>}>
        {deleteState && (
          <div className="diet-form-stack">
            <p className="muted">Kategoria „{deleteState.category.name}” zawiera {deleteState.count} wpisów.</p>
            {deleteState.count === 0 ? <p className="muted">Możesz ją bezpiecznie usunąć.</p> : (
              <>
                <label><input type="radio" checked={deleteState.action === 'move'} onChange={() => setDeleteState({ ...deleteState, action: 'move' })} /> Przenieś wpisy do innej kategorii</label>
                {deleteState.action === 'move' && <label>Kategoria docelowa<select value={deleteState.targetId} onChange={(e) => setDeleteState({ ...deleteState, targetId: e.target.value })}>{sorted.filter((cat) => cat.id !== deleteState.category.id).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>}
                <label><input type="radio" checked={deleteState.action === 'hide'} onChange={() => setDeleteState({ ...deleteState, action: 'hide' })} /> Ukryj kategorię zamiast usuwać</label>
                <label><input type="radio" checked={deleteState.action === 'delete'} onChange={() => setDeleteState({ ...deleteState, action: 'delete' })} /> Usuń kategorię i powiązane wpisy</label>
                {deleteState.action === 'delete' && <label className="diet-toggle"><span>Rozumiem, że wpisy zostaną usunięte</span><input type="checkbox" checked={deleteState.confirm} onChange={(e) => setDeleteState({ ...deleteState, confirm: e.target.checked })} /></label>}
              </>
            )}
          </div>
        )}
      </Modal>
      </section>
    </div>
  );
}

function SortableCategoryRow({ category, index, total, disabled, onToggle, onTimeChange, onMove, onEdit, onDelete }: { category: MealCategory; index: number; total: number; disabled: boolean; onToggle: () => void; onTimeChange: (time: string) => void; onMove: (direction: -1 | 1) => void; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id, disabled });
  const style: CSSProperties = {
    transform: DndCSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`diet-category-row ${!category.is_visible ? 'is-muted' : ''} ${isDragging ? 'is-dragging' : ''}`}>
      <button ref={setActivatorNodeRef} className="diet-grip" disabled={disabled} aria-label={`Przeciągnij kategorię ${category.name}`} {...attributes} {...listeners}><Grip size={15} /></button>
      <div className="diet-category-name-cell">
        <span className="diet-meal-icon">{iconFor(category.icon)}</span>
        <strong>{category.name}</strong>
      </div>
      <input className="diet-category-time" type="time" value={category.default_time?.slice(0, 5) ?? ''} onChange={(event) => onTimeChange(event.target.value)} />
      <label className="diet-switch" aria-label={`Widoczność kategorii ${category.name}`}>
        <input type="checkbox" checked={category.is_visible} onChange={onToggle} />
        <span />
      </label>
      <div className="diet-category-actions">
        <button className="icon-btn" disabled={index === 0 || disabled} onClick={() => onMove(-1)}><ArrowUp size={15} /></button>
        <button className="icon-btn" disabled={index === total - 1 || disabled} onClick={() => onMove(1)}><ArrowDown size={15} /></button>
        <button className="icon-btn" onClick={onEdit}><Pencil size={15} /></button>
        <button className="icon-btn danger" onClick={onDelete}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

function AnalyticsPanel({ mode, setMode, date, items, nutrition, goals, todayTotals, onOpenHistory }: { mode: SummaryMode; setMode: (mode: SummaryMode) => void; date: string; items: MealItem[]; nutrition: NutritionDaily[]; goals: ReturnType<typeof combineGoals>; todayTotals: ReturnType<typeof sumItems>; onOpenHistory: () => void }) {
  const [rangeStart, setRangeStart] = useState(shiftDate(date, -6));
  const [rangeEnd, setRangeEnd] = useState(date);
  const days = useMemo(() => {
    if (mode === 'range') {
      const start = new Date(`${rangeStart}T12:00:00`);
      const end = new Date(`${rangeEnd}T12:00:00`);
      const count = Math.max(1, Math.min(62, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1));
      return rangeDays(rangeEnd, count);
    }
    return rangeDays(date, mode === 'month' ? 30 : mode === 'week' ? 7 : 1);
  }, [date, mode, rangeEnd, rangeStart]);

  const dailyCalories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const day = consumedDay(item);
      map.set(day, (map.get(day) ?? 0) + Number(item.kcal || 0));
    }
    if (mode === 'day') map.set(date, todayTotals.kcal);
    return days.map((day) => ({ day, kcal: Math.round(map.get(day) ?? 0) }));
  }, [date, days, items, mode, todayTotals.kcal]);
  const chartCalories = useMemo(() => {
    if (mode !== 'month') {
      return dailyCalories.map((item) => ({
        key: item.day,
        label: `${SHORT_DAYS[new Date(`${item.day}T12:00:00`).getDay()]} ${new Date(`${item.day}T12:00:00`).getDate()}`,
        kcal: item.kcal,
        days: [item.day],
      }));
    }
    const chunks: Array<typeof dailyCalories> = [];
    for (let i = 0; i < dailyCalories.length; i += 7) chunks.push(dailyCalories.slice(i, i + 7));
    return chunks.map((chunk) => {
      const first = chunk[0]?.day ?? date;
      const last = chunk[chunk.length - 1]?.day ?? first;
      const sum = chunk.reduce((acc, item) => acc + item.kcal, 0);
      return {
        key: `${first}-${last}`,
        label: `${formatDateShort(first)}-${formatDateShort(last)}`,
        kcal: Math.round(sum / Math.max(chunk.length, 1)),
        days: chunk.map((item) => item.day),
      };
    });
  }, [dailyCalories, date, mode]);
  const max = Math.max(...chartCalories.map((item) => item.kcal), goals.kcal_target, 1);
  const total = dailyCalories.reduce((acc, item) => acc + item.kcal, 0);
  const avg = total / Math.max(dailyCalories.length, 1);
  const highest = dailyCalories.reduce((a, b) => (b.kcal > a.kcal ? b : a), dailyCalories[0]);
  const lowest = dailyCalories.reduce((a, b) => (b.kcal < a.kcal ? b : a), dailyCalories[0]);
  const macroTotalRaw = mode === 'day' ? todayTotals : sumItems(items.filter((item) => days.includes(consumedDay(item))));
  const macroDisplay = mode === 'day'
    ? macroTotalRaw
    : {
        kcal: macroTotalRaw.kcal / Math.max(days.length, 1),
        protein: macroTotalRaw.protein / Math.max(days.length, 1),
        carb: macroTotalRaw.carb / Math.max(days.length, 1),
        fat: macroTotalRaw.fat / Math.max(days.length, 1),
      };
  const macroSum = Math.max(macroDisplay.protein + macroDisplay.carb + macroDisplay.fat, 1);
  const waterRows = useMemo(() => days.map((day) => nutrition.find((row) => row.date === day) ?? { id: day, date: day, water_ml: 0 }), [days, nutrition]);
  const waterChartRows = useMemo(() => {
    if (mode !== 'month') return waterRows.map((row) => ({ key: row.date, label: SHORT_DAYS[new Date(`${row.date}T12:00:00`).getDay()], water_ml: Number(row.water_ml || 0) }));
    const chunks: Array<typeof waterRows> = [];
    for (let i = 0; i < waterRows.length; i += 7) chunks.push(waterRows.slice(i, i + 7));
    return chunks.map((chunk) => {
      const first = chunk[0]?.date ?? date;
      const last = chunk[chunk.length - 1]?.date ?? first;
      const sum = chunk.reduce((acc, row) => acc + Number(row.water_ml || 0), 0);
      return { key: `${first}-${last}`, label: `${formatDateShort(first)}-${formatDateShort(last)}`, water_ml: sum / Math.max(chunk.length, 1) };
    });
  }, [date, mode, waterRows]);
  const maxWater = Math.max(...waterChartRows.map((row) => Number(row.water_ml || 0)), goals.water_target_ml, 1);
  const waterAverage = waterRows.reduce((acc, row) => acc + Number(row.water_ml || 0), 0) / Math.max(waterRows.length, 1);
  const rangeLabel = `${formatDateShort(days[0])} - ${formatDateShort(days[days.length - 1])}`;
  const highestDate = highest?.day ? formatDateShort(highest.day) : '-';
  const lowestDate = lowest?.day ? formatDateShort(lowest.day) : '-';
  const proteinPct = Math.round((macroDisplay.protein / macroSum) * 100);
  const carbPct = Math.round((macroDisplay.carb / macroSum) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbPct);
  const periodName = mode === 'month' ? 'miesiąca' : mode === 'week' ? 'tygodnia' : mode === 'range' ? 'zakresu' : 'dnia';

  const exportCsv = () => {
    const header = 'date,kcal\n';
    const rows = dailyCalories.map((row) => `${row.day},${row.kcal}`).join('\n');
    downloadText(`rootine-dieta-${date}.csv`, header + rows, 'text/csv;charset=utf-8');
  };

  return (
    <section className="diet-analytics">
      <header className="diet-analytics-toolbar">
        <div className="diet-analytics-tabs">
          {(['day', 'week', 'month', 'range'] as SummaryMode[]).map((tab) => (
            <button key={tab} type="button" className={mode === tab ? 'is-active' : ''} onClick={() => setMode(tab)}>
              {tab === 'day' ? 'Podsumowanie' : tab === 'week' ? 'Tydzień' : tab === 'month' ? 'Miesiąc' : 'Zakres'}
            </button>
          ))}
        </div>
        <div className="diet-analytics-range">
          <button className="icon-btn" type="button" disabled><ChevronLeft size={15} /></button>
          <strong>{rangeLabel}</strong>
          <button className="icon-btn" type="button" disabled><ChevronRight size={15} /></button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={exportCsv}><Lock size={14} /> Eksportuj</button>
      </header>

      {mode === 'range' && <div className="diet-analytics-range-fields"><input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} /><input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} /></div>}

      <div className="diet-analytics-layout">
        <div className="diet-chart-card diet-calorie-card">
          <span className="diet-chart-title">{mode === 'month' ? 'Spożycie kalorii (średnia tygodniowa)' : 'Spożycie kalorii'}</span>
          <div className="diet-calorie-chart">
            <div className="diet-y-axis"><span>3k</span><span>2k</span><span>1k</span><span>0</span></div>
            <div className="diet-bars">
              {chartCalories.map((item) => (
                <div key={item.key} className={`diet-bar-col ${item.days.includes(date) ? 'is-today' : ''}`}>
                  <span>{item.kcal || ''}</span>
                  <i style={{ height: `${Math.max(5, (item.kcal / max) * 100)}%` }} />
                  <small>{item.label}</small>
                </div>
              ))}
              <em className="diet-goal-line" style={{ bottom: `${Math.min(95, (goals.kcal_target / max) * 100)}%` }}>Cel {round(goals.kcal_target)} kcal</em>
            </div>
          </div>
        </div>

        <aside className="diet-chart-card diet-weekly-stats">
          <span className="diet-chart-title">Statystyki {periodName}</span>
          <div><span>Średnio dziennie</span><strong>{round(avg)} <small>kcal</small></strong></div>
          <div><span>Razem w {periodName}</span><strong>{round(total)} <small>kcal</small></strong></div>
          <div><span>Najwyższy dzień</span><strong>{highest ? `${highest.kcal} kcal` : '0 kcal'}</strong><small>{highestDate}</small></div>
          <div><span>Najniższy dzień</span><strong>{lowest ? `${lowest.kcal} kcal` : '0 kcal'}</strong><small>{lowestDate}</small></div>
          <button className="btn btn-secondary btn-sm" onClick={onOpenHistory}>Zobacz pełną historię</button>
        </aside>

        <div className="diet-chart-card diet-macro-card">
          <span className="diet-chart-title">Rozkład makroskładników <small>(średnio)</small></span>
          <div className="diet-macro-layout">
            <div className="diet-donut" style={{ '--protein': `${(macroDisplay.protein / macroSum) * 100}%`, '--carbs': `${((macroDisplay.protein + macroDisplay.carb) / macroSum) * 100}%` } as CSSProperties} />
            <div className="diet-macro-legend">
              <span><i className="protein" />Białko <strong>{proteinPct}%</strong> {round(macroDisplay.protein)} g</span>
              <span><i className="carb" />Węglowodany <strong>{carbPct}%</strong> {round(macroDisplay.carb)} g</span>
              <span><i className="fat" />Tłuszcze <strong>{fatPct}%</strong> {round(macroDisplay.fat)} g</span>
            </div>
          </div>
        </div>

        <div className="diet-chart-card diet-water-chart-card">
          <span className="diet-chart-title">{mode === 'month' ? 'Historia nawodnienia (średnia tygodniowa)' : 'Historia nawodnienia'}</span>
          <span className="diet-chart-subtitle">Średnio dziennie <strong>{round(waterAverage / 1000, 1)} L</strong></span>
          <div className="diet-water-bars">
            {waterChartRows.map((row) => (
              <div key={row.key} className="diet-water-bar">
                <i style={{ height: `${Math.max(4, (Number(row.water_ml || 0) / maxWater) * 100)}%` }} />
                <small>{row.label}</small>
              </div>
            ))}
            <em className="diet-water-goal" style={{ bottom: `${Math.min(90, (goals.water_target_ml / maxWater) * 100)}%` }}>Cel {round(goals.water_target_ml / 1000, 1)} L</em>
          </div>
        </div>
      </div>
    </section>
  );
}

function Drawer({ title, onClose, width, children }: { title: string; onClose: () => void; width: number; children: ReactNode }) {
  return (
    <div className="diet-drawer-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="diet-drawer" style={{ '--drawer-width': `${width}px` } as CSSProperties} role="dialog" aria-modal="true" aria-label={title}>
        <header className="diet-drawer-head"><strong>{title}</strong><button className="icon-btn" onClick={onClose} aria-label="Zamknij"><X size={16} /></button></header>
        {children}
      </aside>
    </div>
  );
}

function EmptyPanel({ title, desc, action, onAction, disabled }: { title: string; desc: string; action?: string; onAction?: () => void; disabled?: boolean }) {
  return <div className="diet-empty-panel"><strong>{title}</strong><span>{desc}</span>{action && <button className="btn btn-secondary btn-sm" disabled={disabled} onClick={onAction}>{action}</button>}</div>;
}
