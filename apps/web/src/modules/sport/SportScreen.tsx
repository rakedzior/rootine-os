import { useState, useEffect, useRef, useMemo } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, SectionHead, IcoTrash } from '@/components/common';
import {
  useLocalStore,
  type WorkoutTemplate, type WorkoutSet, type WorkoutExercise, type WorkoutSession, type SportExercise,
  type ScheduledWorkout, type WorkoutRecurrenceRule, type FeelingEntry, type FeelingStatus, type PainPoint,
} from '@/store/localStore';
import { BodyMap, muscleSetFromExercises, type HighlightLevel } from '@/features/sport/BodyMap';
import {
  TEMPLATE_CATEGORIES, EQUIPMENT_OPTIONS, MUSCLES, MUSCLE_LABEL, DIFFICULTY_LABEL,
  type SportKey, type MuscleKey, type Difficulty,
} from '@/features/sport/catalog';
import {
  volFromSets, sessionVolume, sessionSetCount, filterBySport, templateMuscles, templateStats,
  computePRs, topExercisesByVolume, muscleSetCounts, streakDays, dailyBuckets, runningStats,
  byCategoryCount, mostFrequentExercises, generateInsights, exercisesMuscles, sessionsMuscles, muscleCountsToHighlight,
  monthSummary, monthHeatmapData, compareRanges, sportDistribution, weeklyTrend, sessionsInLastNDays, avgRir,
  feelingTrend, avgFeeling, feelingTips, mergeMuscleHighlights, mergeUniqueStrings, mostFrequentPainPoints,
} from '@/features/sport/analytics';
import { LineChart, DonutChart, MonthHeatmap } from '@/features/sport/charts';
import {
  todayStr, addDaysStr, startOfWeekStr, weekdayOf,
  WEEKDAY_LABELS, WEEKDAY_LABELS_LONG, describeRecurrence,
} from '@/features/sport/schedule';
import { useWorkoutImage } from '@/features/sport/workoutImage';

const SPORT_TABS = [
  { id: 'dzisiaj',   label: 'Dzisiaj',       icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'planowanie', label: 'Planowanie',   icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2"/></svg> },
  { id: 'cwiczenia', label: 'Ćwiczenia',    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M3 12h4l2 6 4-12 2 6h4"/></svg> },
  { id: 'szablony',  label: 'Szablony',      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'historia',  label: 'Historia',      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
  { id: 'analiza',   label: 'Analiza',       icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'odczucia',  label: 'Odczucia',     icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { id: 'sesja',     label: 'Aktywna sesja', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
];

function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function SportBadge({ sport }: { sport: string }) {
  return <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><SportTileIcon label={sport} kind="sport" size={14} /> {sport}</span>;
}

function plCount(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `1 ${one}`;
  if (n >= 2 && n <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}


type TileIconKind = 'all' | 'sport' | 'category';
type TileIconVariant = 'all' | 'gym' | 'pull' | 'legs' | 'run' | 'climb' | 'mobility' | 'rehab' | 'category';

function iconToken(label: string): string {
  return label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function iconVariantForLabel(label: string, kind: TileIconKind): TileIconVariant {
  const token = iconToken(label);
  if (kind === 'all' || token === 'wszystko') return 'all';
  if (token.includes('pull') || token.includes('plecy') || token.includes('biceps')) return 'pull';
  if (token.includes('legs') || token.includes('nogi') || token.includes('lower') || token.includes('uda') || token.includes('poslad')) return 'legs';
  if (token.includes('bieg') || token.includes('run') || token.includes('tempo') || token.includes('interwal')) return 'run';
  if (token.includes('wspin') || token.includes('boulder') || token.includes('lina')) return 'climb';
  if (token.includes('mobil') || token.includes('biodra') || token.includes('kregoslup') || token.includes('nadgarst') || token.includes('kostki')) return 'mobility';
  if (token.includes('rehab') || token.includes('kolano') || token.includes('bark') || token.includes('lokiec') || token.includes('skokowy')) return 'rehab';
  if (token.includes('silownia') || token.includes('push') || token.includes('upper') || token.includes('full') || token.includes('sila') || token.includes('hypertrof') || token.includes('deload')) return 'gym';
  return kind === 'sport' ? 'gym' : 'category';
}

function SportTileIcon({ label, kind = 'sport', active = false, size = 32 }: { label: string; kind?: TileIconKind; active?: boolean; size?: number }) {
  const variant = iconVariantForLabel(label, kind);
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  function paths() {
    if (variant === 'all') return (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </>
    );
    if (variant === 'pull') return (
      <>
        <path d="M5 5h14" />
        <path d="M8 5v5" />
        <path d="M16 5v5" />
        <circle cx="12" cy="10" r="2" />
        <path d="M12 12v4" />
        <path d="M9 14l-2 4" />
        <path d="M15 14l2 4" />
      </>
    );
    if (variant === 'legs') return (
      <>
        <path d="M8 5l4 4 4-4" />
        <path d="M12 9v5" />
        <path d="M12 14l-4 6" />
        <path d="M12 14l5 5" />
        <path d="M6 20h5" />
        <path d="M15 19h4" />
      </>
    );
    if (variant === 'run') return (
      <>
        <circle cx="14" cy="5" r="2" />
        <path d="M12 8l-3 3 4 2 2 6" />
        <path d="M13 13l-4 6" />
        <path d="M10 10l5 1 3-2" />
        <path d="M4 18h3" />
      </>
    );
    if (variant === 'climb') return (
      <>
        <path d="M3 20L10 6l4 8 3-4 4 10H3z" />
        <circle cx="14" cy="8" r="1.6" />
        <path d="M14 10l-2 3 3 2" />
        <path d="M12 13l-3 1" />
        <path d="M15 15l2 2" />
      </>
    );
    if (variant === 'mobility') return (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v5" />
        <path d="M7 10h10" />
        <path d="M12 12l-4 6" />
        <path d="M12 12l5 5" />
        <path d="M6 18h5" />
      </>
    );
    if (variant === 'rehab') return (
      <>
        <path d="M20 8.5c0 5.5-8 10.5-8 10.5S4 14 4 8.5A4.2 4.2 0 0 1 12 6a4.2 4.2 0 0 1 8 2.5z" />
        <path d="M12 9v6" />
        <path d="M9 12h6" />
      </>
    );
    if (variant === 'category') return (
      <>
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
        <circle cx="9" cy="7" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="11" cy="17" r="1.5" />
      </>
    );
    return (
      <>
        <path d="M5 12h14" />
        <path d="M7 9v6" />
        <path d="M17 9v6" />
        <path d="M3 10v4" />
        <path d="M21 10v4" />
        <path d="M9 7v10" />
        <path d="M15 7v10" />
      </>
    );
  }

  return (
    <span style={{ width: size, height: size, display: 'inline-grid', placeItems: 'center', color: active ? 'var(--acc)' : 'var(--ink-2)' }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...common}>
        {paths()}
      </svg>
    </span>
  );
}

interface SportSelectorRowProps {
  active: string | 'Wszystko';
  onSelect: (s: string | 'Wszystko') => void;
  countLabel: (s: string | 'Wszystko') => string;
  includeAll?: boolean;
}

function SportSelectorRow({ active, onSelect, countLabel, includeAll = true }: SportSelectorRowProps) {
  const { sportCategories } = useLocalStore();
  const items: { key: string | 'Wszystko'; label: string }[] = [
    ...(includeAll ? [{ key: 'Wszystko' as const, label: 'Wszystko' }] : []),
    ...[...sportCategories].sort((a, b) => a.order - b.order).map((c) => ({ key: c.name, label: c.name })),
  ];
  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10 }}>
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onSelect(it.key)}
            className="sport-select-card"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 8px', borderRadius: 'var(--r-mid)',
              border: `1.5px solid ${isActive ? 'var(--acc)' : 'var(--border)'}`,
              background: isActive ? 'var(--acc-soft)' : 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <SportTileIcon label={it.label} kind={it.key === 'Wszystko' ? 'all' : 'sport'} active={isActive} size={34} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? 'var(--acc-ink)' : 'var(--ink)' }}>{it.label}</span>
            <span style={{ fontSize: 10.5, color: 'var(--ink-3)', textAlign: 'center' }}>{countLabel(it.key)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SportScreen() {
  const [tab, setTab] = useState('dzisiaj');
  const [templatesSportFilter, setTemplatesSportFilter] = useState<string | 'Wszystko'>('Wszystko');
  const [feelingsSessionTarget, setFeelingsSessionTarget] = useState<string | null>(null);
  const { activeSession, startSession } = useLocalStore();

  useEffect(() => {
    if (activeSession && tab !== 'sesja') setTab('sesja');
  }, [activeSession, tab]);

  function quickAction(target: string, sportPreset?: SportKey) {
    if (sportPreset) setTemplatesSportFilter(sportPreset);
    setTab(target);
  }

  function startFromTemplate(t: WorkoutTemplate) {
    startSession({
      templateId: t.id,
      templateName: t.name,
      sportType: t.sportType,
      currentExerciseIndex: 0,
      exercises: t.exercises.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, completed: false })) })),
    });
    setTab('sesja');
  }

  return (
    <div className="module-page">
      <div className="module-header no-title">
        <SubTabs tabs={SPORT_TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'dzisiaj'   && <SportToday onStartSession={() => setTab('sesja')} onQuickAction={quickAction} />}
      {tab === 'szablony'  && <SportTemplates sportFilter={templatesSportFilter} onSportFilterChange={setTemplatesSportFilter} onStartTemplate={startFromTemplate} />}
      {tab === 'sesja'     && <SportActiveSession onSessionEnd={() => setTab('historia')} />}
      {tab === 'historia'  && <SportHistory onRepeat={() => setTab('sesja')} onFillFeelings={(sessionId) => { setFeelingsSessionTarget(sessionId); setTab('odczucia'); }} />}
      {tab === 'planowanie' && <SportPlanning />}
      {tab === 'analiza'   && <SportAnalysis />}
      {tab === 'cwiczenia' && <SportExercises />}
      {tab === 'odczucia'  && <SportFeelings initialSessionId={feelingsSessionTarget} onConsumeInitialSession={() => setFeelingsSessionTarget(null)} />}
    </div>
  );
}

// ─── DZISIAJ ──────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 19, marginTop: 2 }}>{value}</div>
    </div>
  );
}

interface DayWorkout {
  scheduled: ScheduledWorkout;
  template: WorkoutTemplate | null;
  session?: WorkoutSession;
}

function workoutsForDate(date: string, scheduledWorkouts: ScheduledWorkout[], templates: WorkoutTemplate[], sessions: WorkoutSession[]): DayWorkout[] {
  return scheduledWorkouts
    .filter((w) => w.date === date && w.status !== 'skipped')
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
    .map((scheduled) => {
      const template = scheduled.templateId ? templates.find((t) => t.id === scheduled.templateId) ?? null : null;
      const session = sessions.find((s) => s.scheduledWorkoutId === scheduled.id)
        ?? (scheduled.status === 'done' ? sessions.find((s) => s.date === date && s.templateId === scheduled.templateId) : undefined);
      return { scheduled, template, session };
    });
}

function workoutDisplayName(item: DayWorkout): string {
  return item.scheduled.customName || item.template?.name || 'Trening';
}
function workoutDisplaySport(item: DayWorkout): string {
  return item.scheduled.type || item.template?.sportType || 'Inne';
}

function dayWorkoutStats(item: DayWorkout | null) {
  if (!item) return null;
  if (item.session) {
    return {
      duration: item.session.duration ?? item.template?.estimatedDuration ?? 0,
      exerciseCount: item.session.exercises.length,
      setCount: sessionSetCount(item.session),
      volumeKg: sessionVolume(item.session),
    };
  }
  if (item.template) return templateStats(item.template);
  return { duration: 0, exerciseCount: 0, setCount: 0, volumeKg: 0 };
}

function primaryMuscles(muscles: Partial<Record<MuscleKey, 'primary' | 'secondary' | 'stabilizer'>>) {
  return Object.entries(muscles)
    .filter(([, lvl]) => lvl === 'primary')
    .map(([k]) => k as MuscleKey);
}

const SPORT_FOCUS_DEFAULTS: Record<string, string[]> = {
  'Bieganie': ['Cardio', 'Wytrzymałość', 'Nogi'],
  'Wspinaczka': ['Przedramiona', 'Chwyt', 'Wytrzymałość'],
  'Mobilność': ['Zakres ruchu', 'Stawy'],
  'Rehabilitacja': ['Rehabilitacja', 'Stabilizacja'],
};
/** Text "work areas" shown alongside (running/rehab/mobility) or instead of (no exercises yet) the muscle map. */
function focusAreasFor(template: WorkoutTemplate | null): string[] {
  if (!template) return [];
  if (template.focusAreas?.length) return template.focusAreas;
  const base = SPORT_FOCUS_DEFAULTS[template.sportType] ?? [];
  if ((template.sportType === 'Rehabilitacja' || template.sportType === 'Mobilność') && template.category) {
    return [template.category, ...base];
  }
  return base;
}

const SPORT_COVER_GRADIENT: Record<string, string> = {
  'Siłownia': 'linear-gradient(135deg, rgba(224,42,139,.55), rgba(15,44,54,.94))',
  'Bieganie': 'linear-gradient(135deg, rgba(61,168,255,.5), rgba(15,44,54,.94))',
  'Wspinaczka': 'linear-gradient(135deg, rgba(245,182,66,.5), rgba(15,44,54,.94))',
  'Mobilność': 'linear-gradient(135deg, rgba(45,216,158,.45), rgba(15,44,54,.94))',
  'Rehabilitacja': 'linear-gradient(135deg, rgba(120,140,255,.45), rgba(15,44,54,.94))',
};

/** Cover photo for the "Dzisiejszy trening" hero — manual image wins, then an auto-fetched Pexels photo, then a generated gradient + icon when none is available/broken, so the layout never shows a broken-image icon. */
function WorkoutCover({ sportType, image, focusAreas, category }: { sportType: string; image?: string; focusAreas?: string[]; category?: string }) {
  const [broken, setBroken] = useState(false);
  const resolvedImage = useWorkoutImage(sportType, focusAreas, category, image);
  useEffect(() => { setBroken(false); }, [resolvedImage]);
  if (!resolvedImage || broken) {
    return (
      <div className="sport-cover-fallback" style={{ background: SPORT_COVER_GRADIENT[sportType] ?? SPORT_COVER_GRADIENT['Siłownia'] }}>
        <SportTileIcon label={sportType} kind="sport" size={64} />
      </div>
    );
  }
  return <img className="sport-cover" src={resolvedImage} alt="" onError={() => setBroken(true)} />;
}

interface ScheduleModalTarget { date: string; scheduled?: ScheduledWorkout }

/** Add/edit a single scheduled-workout occurrence. Editing a row from a recurring cycle only ever touches that row — the cycle itself is only changed/removed via the explicit "cały cykl" actions. */
function ScheduledWorkoutModal({ target, templates, onClose }: { target: ScheduleModalTarget | null; templates: WorkoutTemplate[]; onClose: () => void }) {
  const { addScheduledWorkout, updateScheduledWorkout, deleteScheduledWorkout, deleteRecurrenceRule, recurrenceRules, sportCategories } = useLocalStore();
  const editing = target?.scheduled ?? null;
  const [templateId, setTemplateId] = useState('');
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState('');
  const [categoryOverride, setCategoryOverride] = useState('');
  const [confirmOne, setConfirmOne] = useState(false);
  const [confirmCycle, setConfirmCycle] = useState(false);

  useEffect(() => {
    if (!target) return;
    setTemplateId(editing?.templateId ?? templates[0]?.id ?? '');
    setCustomName(editing?.customName ?? '');
    setDate(editing?.date ?? target.date);
    setCategoryOverride(editing?.type ?? '');
  }, [target, editing, templates]);

  const rule = editing?.recurrenceRuleId ? recurrenceRules.find((r) => r.id === editing.recurrenceRuleId) ?? null : null;
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const defaultCategory = selectedTemplate?.sportType ?? '';
  const categoryNames = [...sportCategories].sort((a, b) => a.order - b.order).map((c) => c.name);

  function save() {
    const type = categoryOverride && categoryOverride !== defaultCategory ? categoryOverride : undefined;
    if (!editing) {
      addScheduledWorkout({ templateId: templateId || null, customName: customName.trim() || undefined, date, order: 0, status: 'planned', recurrenceRuleId: null, type });
    } else {
      updateScheduledWorkout(editing.id, { templateId: templateId || null, customName: customName.trim() || undefined, date, type });
    }
    onClose();
  }
  function removeOne() {
    if (editing) deleteScheduledWorkout(editing.id);
    setConfirmOne(false);
    onClose();
  }
  function removeCycle() {
    if (rule) deleteRecurrenceRule(rule.id, 'all');
    setConfirmCycle(false);
    onClose();
  }

  return (
    <>
      <Modal open={!!target} onClose={onClose} title={editing ? 'Edytuj trening' : 'Dodaj trening'} size="sm"
        footer={<>
          {editing && <button className="btn btn-secondary btn-sm" onClick={() => setConfirmOne(true)}>Usuń to wystąpienie</button>}
          {rule && <button className="btn btn-secondary btn-sm" onClick={() => setConfirmCycle(true)}>Usuń cały cykl</button>}
          <button className="btn btn-primary btn-sm" onClick={save}>Zapisz</button>
        </>}>
        <Field label="Szablon">
          <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">— bez szablonu —</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Własna nazwa (opcjonalnie)"><input className="input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="np. Szybki bieg regeneracyjny" /></Field>
        <Field label="Data (przenieś na inny dzień, jeśli trzeba)"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={`Kategoria sportu${defaultCategory ? ` (domyślnie: ${defaultCategory})` : ''}`}>
          <select className="select" value={categoryOverride || defaultCategory} onChange={(e) => setCategoryOverride(e.target.value)}>
            {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        {rule && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>Część cyklu: {describeRecurrence(rule)}. Zapis dotyczy tylko tego dnia.</p>}
      </Modal>
      <ConfirmDelete open={confirmOne} onClose={() => setConfirmOne(false)} onConfirm={removeOne} label="ten trening" />
      <ConfirmDelete open={confirmCycle} onClose={() => setConfirmCycle(false)} onConfirm={removeCycle} label={rule ? `cały cykl (${describeRecurrence(rule)})` : 'cały cykl'} />
    </>
  );
}

function WeekStrip({ scheduledWorkouts, templates, sessions, selectedDate, selectedId, onSelect }: {
  scheduledWorkouts: ScheduledWorkout[]; templates: WorkoutTemplate[]; sessions: WorkoutSession[];
  selectedDate: string; selectedId: string | null; onSelect: (date: string, id: string) => void;
}) {
  const { ensureScheduleMaterialized } = useLocalStore();
  const today = todayStr();
  const [weekStart, setWeekStart] = useState(() => startOfWeekStr(today));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));
  const weekEnd = weekDays[6];
  const isCurrentWeek = weekStart === startOfWeekStr(today);
  const [editTarget, setEditTarget] = useState<ScheduleModalTarget | null>(null);

  function shiftWeek(deltaWeeks: number) {
    const next = addDaysStr(weekStart, deltaWeeks * 7);
    setWeekStart(next);
    ensureScheduleMaterialized(addDaysStr(next, 13));
  }

  const monthFmt = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString('pl-PL', { month: 'long' });
  const rangeLabel = monthFmt(weekStart) === monthFmt(weekEnd)
    ? `${parseInt(weekStart.slice(8), 10)}-${parseInt(weekEnd.slice(8), 10)} ${monthFmt(weekStart)} ${weekEnd.slice(0, 4)}`
    : `${parseInt(weekStart.slice(8), 10)} ${monthFmt(weekStart)} - ${parseInt(weekEnd.slice(8), 10)} ${monthFmt(weekEnd)} ${weekEnd.slice(0, 4)}`;

  return (
    <div className="card">
      <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="card-title">Podsumowanie tygodnia</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{rangeLabel}</span>
          <button className="icon-btn" onClick={() => shiftWeek(-1)} aria-label="Poprzedni tydzień">‹</button>
          {!isCurrentWeek && <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(startOfWeekStr(today))}>Dziś</button>}
          <button className="icon-btn" onClick={() => shiftWeek(1)} aria-label="Następny tydzień">›</button>
        </div>
      </div>
      <div className="sport-week-grid">
        {weekDays.map((dateStr) => {
          const isToday = dateStr === today;
          const dayItems = workoutsForDate(dateStr, scheduledWorkouts, templates, sessions);
          return (
            <div key={dateStr} style={{
              borderRadius: 'var(--r-mid)', padding: '10px 8px', minHeight: 136,
              border: `1.5px solid ${isToday ? 'var(--acc)' : 'var(--border-soft)'}`,
              background: isToday ? 'linear-gradient(180deg, rgba(224,42,139,.16), rgba(10,31,38,.86))' : 'var(--surface-inset)',
              boxShadow: isToday ? '0 0 0 1px rgba(224,42,139,.22), 0 10px 25px rgba(224,42,139,.12)' : undefined,
              display: 'flex', flexDirection: 'column', gap: 7,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 700 }}>
                  {WEEKDAY_LABELS[weekdayOf(dateStr)]} {parseInt(dateStr.slice(8), 10)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isToday && <span className="badge badge-green" style={{ fontSize: 8 }}>Dziś</span>}
                  <button className="icon-btn" style={{ width: 20, height: 20, fontSize: 11 }} onClick={() => setEditTarget({ date: dateStr })} aria-label="Dodaj trening tego dnia">+</button>
                </div>
              </div>
              {dayItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
                  {dayItems.map((item) => {
                    const isSelected = selectedDate === dateStr && selectedId === item.scheduled.id;
                    const done = item.scheduled.status === 'done';
                    return (
                      <button key={item.scheduled.id} type="button" onClick={() => onSelect(dateStr, item.scheduled.id)} style={{
                        position: 'relative', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
                        borderRadius: 10, padding: '8px 26px 8px 9px',
                        background: done ? 'rgba(45,216,158,.11)' : 'rgba(255,255,255,.045)',
                        border: `1px solid ${isSelected ? 'var(--acc)' : done ? 'rgba(45,216,158,.25)' : 'var(--border-soft)'}`,
                      }}>
                        <span
                          role="button" tabIndex={0} aria-label="Edytuj trening"
                          onClick={(e) => { e.stopPropagation(); setEditTarget({ date: dateStr, scheduled: item.scheduled }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEditTarget({ date: dateStr, scheduled: item.scheduled }); } }}
                          style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 6, color: 'var(--ink-3)', cursor: 'pointer' }}
                        >⋯</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <SportTileIcon label={workoutDisplaySport(item)} kind="sport" active={done} size={18} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workoutDisplayName(item)}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>
                              {workoutDisplaySport(item)} · {item.session?.duration ?? item.template?.estimatedDuration ?? 0} min
                            </div>
                          </div>
                        </div>
                        {done && <span className="badge badge-green" style={{ marginTop: 6, alignSelf: 'flex-start', fontSize: 8.5 }}>✓ Zrobione</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button type="button" onClick={() => setEditTarget({ date: dateStr })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
                  Odpoczynek · + dodaj
                </button>
              )}
            </div>
          );
        })}
      </div>
      <ScheduledWorkoutModal target={editTarget} templates={templates} onClose={() => setEditTarget(null)} />
    </div>
  );
}

function SportToday({ onStartSession, onQuickAction }: { onStartSession: () => void; onQuickAction: (tab: string, sport?: SportKey) => void }) {
  const { templates, sessions, scheduledWorkouts, startSession, exercises } = useLocalStore();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const dayItems = useMemo(() => workoutsForDate(selectedDate, scheduledWorkouts, templates, sessions), [selectedDate, scheduledWorkouts, templates, sessions]);
  const dayKeyList = dayItems.map((d) => d.scheduled.id).join('|');
  useEffect(() => {
    if (!dayItems.some((d) => d.scheduled.id === selectedId)) setSelectedId(dayItems[0]?.scheduled.id ?? null);
  }, [dayKeyList, selectedId, dayItems]);

  const idx = dayItems.findIndex((d) => d.scheduled.id === selectedId);
  const selected = idx >= 0 ? dayItems[idx] : null;
  const selectedTemplate = selected?.template ?? null;
  const stats = dayWorkoutStats(selected);
  const muscles = useMemo(() => templateMuscles(selectedTemplate, exercises), [selectedTemplate, exercises]);
  const primaryMuscleKeys = primaryMuscles(muscles);
  const focusAreas = focusAreasFor(selectedTemplate);
  // "Co dziś pracuje?" aggregates ALL of the day's workouts, not just the one in the carousel above.
  const dayMuscles = useMemo(
    () => mergeMuscleHighlights(dayItems.map((d) => templateMuscles(d.template, exercises))),
    [dayItems, exercises],
  );
  const dayFocusAreas = useMemo(
    () => mergeUniqueStrings(dayItems.map((d) => focusAreasFor(d.template))),
    [dayItems],
  );
  const isToday = selectedDate === todayStr();

  function cycle(delta: number) {
    if (dayItems.length === 0) return;
    const next = ((idx + delta) % dayItems.length + dayItems.length) % dayItems.length;
    setSelectedId(dayItems[next].scheduled.id);
  }
  function handleSelectFromWeek(date: string, id: string) { setSelectedDate(date); setSelectedId(id); }

  function handleStart() {
    if (!selected) return;
    startSession({
      templateId: selectedTemplate?.id,
      templateName: workoutDisplayName(selected),
      sportType: workoutDisplaySport(selected),
      currentExerciseIndex: 0,
      exercises: (selectedTemplate?.exercises ?? []).map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, completed: false })) })),
      scheduledWorkoutId: selected.scheduled.id,
    });
    onStartSession();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="sport-hero-grid">
        <div className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: 430, padding: 0 }}>
          <WorkoutCover sportType={selected ? workoutDisplaySport(selected) : 'Siłownia'} image={selectedTemplate?.image} focusAreas={focusAreas} category={selectedTemplate?.category} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,24,30,.96) 0%, rgba(8,24,30,.8) 45%, rgba(8,24,30,.32) 74%, rgba(8,24,30,.74) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(224,42,139,.22)', borderRadius: 'inherit', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: 430, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  Dzisiejszy trening
                  {!isToday && <span style={{ color: 'var(--ink-2)', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>· {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</span>}
                  {!isToday && <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(todayStr())}>Wróć do dziś</button>}
                </div>
                <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.08, color: 'var(--ink)', letterSpacing: 0 }}>{selected ? workoutDisplayName(selected) : 'Brak treningu'}</h2>
                {selected && <div className="badge" style={{ marginTop: 12, background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.12)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><SportTileIcon label={workoutDisplaySport(selected)} kind="sport" size={15} /> {workoutDisplaySport(selected)}</div>}
              </div>
              {dayItems.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(6,19,24,.72)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: 6 }}>
                  <button className="icon-btn" onClick={() => cycle(-1)} aria-label="Poprzedni trening">‹</button>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{idx + 1}/{dayItems.length}</span>
                  <button className="icon-btn" onClick={() => cycle(1)} aria-label="Następny trening">›</button>
                </div>
              )}
            </div>

            {selected && stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(92px, 1fr))', maxWidth: 560, gap: 1, marginTop: 28, borderTop: '1px solid rgba(255,255,255,.08)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  {[
                    ['Czas', `~${stats.duration} min`],
                    ['Ćwiczenia', `${stats.exerciseCount}`],
                    ['Serie robocze', `${stats.setCount}`],
                    ['Objętość', stats.volumeKg > 0 ? `${(stats.volumeKg / 1000).toFixed(1)} t` : '-'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '14px 12px 14px 0', borderRight: '1px solid rgba(255,255,255,.08)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', marginTop: 3 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ maxWidth: 560, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', margin: '20px 0 0' }}>
                  {selectedTemplate?.description || selectedTemplate?.goal || 'Trening zaplanowany na ten dzień. Przejdź przez sesję i zapisz wyniki do historii.'}
                </p>
                {primaryMuscleKeys.length > 0 && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-3)', marginBottom: 10 }}>Główne partie mięśniowe</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {primaryMuscleKeys.slice(0, 4).map((m) => <span key={m} className="badge" style={{ background: 'rgba(224,42,139,.16)', borderColor: 'rgba(224,42,139,.35)' }}>✦ {MUSCLE_LABEL[m]}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center', maxWidth: 430 }}>
                  <button className="btn btn-primary" style={{ flex: 1, minHeight: 50, fontSize: 15 }} onClick={handleStart}>▶ Rozpocznij sesję</button>
                  {selected.scheduled.status === 'done' && <span className="badge badge-green">✓ Zrobione</span>}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 24, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <EmptyState title={isToday ? 'Brak treningu na dziś' : 'Brak treningu tego dnia'} desc="Dodaj trening albo zaplanuj cały tydzień z poziomu zakładki Planowanie." />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Dodaj trening</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onQuickAction('planowanie')}>Zaplanuj tydzień</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ minHeight: 430, display: 'flex', flexDirection: 'column' }}>
          <div className="card-head"><span className="card-title">Co dziś pracuje?</span></div>
          {dayItems.length === 0 ? (
            <EmptyState title="Brak treningu" desc="Wybierz albo dodaj trening, żeby zobaczyć zaangażowane partie." />
          ) : Object.keys(dayMuscles).length > 0 || dayFocusAreas.length > 0 ? (
            <>
              {dayFocusAreas.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: Object.keys(dayMuscles).length > 0 ? 14 : 0 }}>
                  {dayFocusAreas.map((a) => <span key={a} className="badge" style={{ fontSize: 11 }}>{a}</span>)}
                </div>
              )}
              {Object.keys(dayMuscles).length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {(Object.keys(dayMuscles) as MuscleKey[]).map((m) => <span key={m} className="badge" style={{ fontSize: 11 }}>{MUSCLE_LABEL[m]}</span>)}
                  </div>
                  <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                    <BodyMap highlight={dayMuscles} size={118} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                    <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc)', marginRight: 4 }} />Główne partie</span>
                    <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc-b)', marginRight: 4 }} />Dodatkowe partie</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <EmptyState title="Brak danych o partiach" desc="Dodaj partie mięśniowe w ćwiczeniach lub szablonie." />
          )}
        </div>
      </div>

      <WeekStrip scheduledWorkouts={scheduledWorkouts} templates={templates} sessions={sessions} selectedDate={selectedDate} selectedId={selectedId} onSelect={handleSelectFromWeek} />

      <ScheduledWorkoutModal target={showAddModal ? { date: selectedDate } : null} templates={templates} onClose={() => setShowAddModal(false)} />
    </div>
  );
}

const RECURRENCE_DURATION_PRESETS = [
  { id: 'week', label: '1 tydzień' },
  { id: 'month', label: '1 miesiąc' },
  { id: 'weeks', label: 'N tygodni' },
  { id: '3months', label: '3 miesiące' },
  { id: 'indefinite', label: 'Bezterminowo' },
] as const;
type RecurrencePreset = typeof RECURRENCE_DURATION_PRESETS[number]['id'];

function RecurrenceRuleModal({ open, onClose, templates, editing, defaultSportType }: { open: boolean; onClose: () => void; templates: WorkoutTemplate[]; editing: WorkoutRecurrenceRule | null; defaultSportType?: string }) {
  const { addRecurrenceRule, updateRecurrenceRule } = useLocalStore();
  const [templateId, setTemplateId] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(todayStr());
  const [preset, setPreset] = useState<RecurrencePreset>('week');
  const [weeksCount, setWeeksCount] = useState(4);
  const [interval, setIntervalValue] = useState(1);

  useEffect(() => {
    if (!open) return;
    const preferred = defaultSportType && defaultSportType !== 'Wszystko' ? templates.find((t) => t.sportType === defaultSportType)?.id : undefined;
    setTemplateId(editing?.templateId ?? preferred ?? templates[0]?.id ?? '');
    setWeekdays(editing?.weekdays ?? []);
    setStartDate(editing?.startDate ?? todayStr());
    setIntervalValue(editing?.interval ?? 1);
    setPreset(editing ? (editing.isIndefinite ? 'indefinite' : 'month') : 'week');
  }, [open, editing, templates, defaultSportType]);

  function toggleDay(d: number) {
    setWeekdays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b));
  }

  function computeRange(): { endDate: string | null; isIndefinite: boolean } {
    if (preset === 'indefinite') return { endDate: null, isIndefinite: true };
    const days = preset === 'week' ? 6 : preset === 'month' ? 29 : preset === '3months' ? 89 : Math.max(weeksCount, 1) * 7 - 1;
    return { endDate: addDaysStr(startDate, days), isIndefinite: false };
  }

  function save() {
    if (!templateId || weekdays.length === 0) return;
    const { endDate, isIndefinite } = computeRange();
    const payload = { templateId, startDate, endDate, isIndefinite, weekdays, frequency: 'weekly' as const, interval: Math.max(interval, 1) };
    if (editing) updateRecurrenceRule(editing.id, payload);
    else addRecurrenceRule(payload);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edytuj cykl' : 'Nowy cykl treningowy'} size="md"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!templateId || weekdays.length === 0}>Zapisz</button>
      </>}>
      <Field label="Szablon">
        <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Dni tygodnia">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WEEKDAY_LABELS.map((label, dIdx) => (
            <button key={dIdx} type="button" className={`pill ${weekdays.includes(dIdx) ? 'accent' : ''}`} onClick={() => toggleDay(dIdx)}>{label}</button>
          ))}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Data startu"><input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="Co ile tygodni"><input className="input" type="number" min={1} value={interval} onChange={(e) => setIntervalValue(Math.max(1, +e.target.value))} /></Field>
      </div>
      <Field label="Zakres">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RECURRENCE_DURATION_PRESETS.map((p) => <button key={p.id} type="button" className={`pill ${preset === p.id ? 'accent' : ''}`} onClick={() => setPreset(p.id)}>{p.label}</button>)}
        </div>
      </Field>
      {preset === 'weeks' && <Field label="Liczba tygodni"><input className="input" type="number" min={1} value={weeksCount} onChange={(e) => setWeeksCount(Math.max(1, +e.target.value))} /></Field>}
    </Modal>
  );
}

/** Monday-first day order for display, indexing into WEEKDAY_LABELS (which is Sunday-first / JS Date convention). */
const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function ruleSportType(rule: WorkoutRecurrenceRule, templates: WorkoutTemplate[]): string {
  return templates.find((t) => t.id === rule.templateId)?.sportType ?? 'Inne';
}

/** A 7-day-wide view of which template trains on which weekday, for the active sport filter. */
function WeeklyPattern({ rules, templates }: { rules: WorkoutRecurrenceRule[]; templates: WorkoutTemplate[] }) {
  const byDay = useMemo(() => {
    const map: Record<number, { name: string; sportType: string }[]> = {};
    WEEK_DISPLAY_ORDER.forEach((d) => { map[d] = []; });
    rules.forEach((r) => {
      const template = templates.find((t) => t.id === r.templateId);
      r.weekdays.forEach((d) => { map[d]?.push({ name: template?.name ?? 'Trening', sportType: template?.sportType ?? 'Inne' }); });
    });
    return map;
  }, [rules, templates]);

  return (
    <div className="sport-week-grid">
      {WEEK_DISPLAY_ORDER.map((d) => (
        <div key={d} style={{ borderRadius: 'var(--r-mid)', padding: '10px 8px', minHeight: 88, border: '1px solid var(--border-soft)', background: 'var(--surface-inset)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 700 }}>{WEEKDAY_LABELS_LONG[d]}</span>
          {byDay[d].length === 0
            ? <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Odpoczynek</span>
            : byDay[d].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700 }}>
                <SportTileIcon label={item.sportType} kind="sport" size={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function SportPlanning() {
  const { recurrenceRules, templates, deleteRecurrenceRule, clearSchedule } = useLocalStore();
  const [sportFilter, setSportFilter] = useState<string | 'Wszystko'>('Wszystko');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkoutRecurrenceRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutRecurrenceRule | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  function templateName(id: string) { return templates.find((t) => t.id === id)?.name ?? 'Nieznany szablon'; }
  const filteredRules = sportFilter === 'Wszystko' ? recurrenceRules : recurrenceRules.filter((r) => ruleSportType(r, templates) === sportFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SportSelectorRow
        active={sportFilter}
        onSelect={setSportFilter}
        countLabel={(s) => plCount((s === 'Wszystko' ? recurrenceRules : recurrenceRules.filter((r) => ruleSportType(r, templates) === s)).length, 'cykl', 'cykle', 'cykli')}
      />

      <div className="card">
        <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="card-title">Tygodniowy wzorzec{sportFilter !== 'Wszystko' ? ` · ${sportFilter}` : ''}</span>
        </div>
        <WeeklyPattern rules={filteredRules} templates={templates} />
      </div>

      <div className="card">
        <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="card-title">Cykle treningowe{sportFilter !== 'Wszystko' ? ` · ${sportFilter}` : ''}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {recurrenceRules.length > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(true)}>Wyczyść kalendarz</button>}
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingRule(null); setShowModal(true); }}>+ Nowy cykl</button>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: -6, marginBottom: 14 }}>
          Zaplanuj trening na tydzień, miesiąc, kilka tygodni, trzy miesiące albo bezterminowo — wybierz dni tygodnia i zakres, a kalendarz wypełni się automatycznie.
        </p>
        {filteredRules.length === 0 ? (
          <EmptyState
            title="Brak zaplanowanych cykli"
            desc={sportFilter === 'Wszystko' ? 'Stwórz cykl, np. „Trening A w środy i piątki co tydzień".' : `Brak cykli dla: ${sportFilter}.`}
            cta="+ Nowy cykl" onCta={() => setShowModal(true)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredRules.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-inset)', border: '1px solid var(--border-soft)' }}>
                <SportTileIcon label={ruleSportType(r, templates)} kind="sport" size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>{templateName(r.templateId)}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{describeRecurrence(r)}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditingRule(r); setShowModal(true); }}>Edytuj</button>
                <button className="icon-btn" onClick={() => setDeleteTarget(r)}><IcoTrash /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <RecurrenceRuleModal open={showModal} onClose={() => setShowModal(false)} templates={templates} editing={editingRule} defaultSportType={sportFilter} />
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteRecurrenceRule(deleteTarget.id, 'all'); setDeleteTarget(null); }} label={`cykl "${deleteTarget ? templateName(deleteTarget.templateId) : ''}"`} />
      <ConfirmDelete open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={() => { clearSchedule(); setConfirmClear(false); }} label="cały zaplanowany kalendarz i wszystkie cykle (historia treningów zostaje)" />
    </div>
  );
}

// ─── SZABLONY ─────────────────────────────────────────────────

interface TemplateFilters {
  level: Difficulty | 'any'; duration: 'any' | 'short' | 'mid' | 'long';
  equipment: string; muscle: MuscleKey | 'any'; category: string;
}
const DEFAULT_FILTERS: TemplateFilters = { level: 'any', duration: 'any', equipment: 'any', muscle: 'any', category: 'any' };

function durationBucket(min: number): 'short' | 'mid' | 'long' {
  if (min < 30) return 'short';
  if (min <= 60) return 'mid';
  return 'long';
}

type TemplateSort = 'recent' | 'name' | 'duration';

const SYSTEM_ALL_CATEGORY = 'Wszystko';

type TemplateCategoryFilter =
  | { id: 'all'; label: 'Wszystko'; kind: 'all'; value: 'Wszystko'; editable: false }
  | { id: string; label: string; kind: 'sport'; value: string; editable: boolean; showFeelingsPrompt: boolean };

function countForCategoryFilter(filter: TemplateCategoryFilter, templates: WorkoutTemplate[]) {
  if (filter.kind === 'all') return templates.length;
  return templates.filter((t) => t.sportType === filter.value).length;
}

function SportTemplates({ sportFilter, onSportFilterChange, onStartTemplate }: { sportFilter: string | 'Wszystko'; onSportFilterChange: (s: string | 'Wszystko') => void; onStartTemplate: (t: WorkoutTemplate) => void }) {
  const { templates, addTemplate, updateTemplate, deleteTemplate, exercises, sportCategories, addSportCategory, renameSportCategory, deleteSportCategory, setSportCategorySettings } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [categoryEditor, setCategoryEditor] = useState<{ mode: 'add' | 'edit'; filter?: TemplateCategoryFilter } | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryFeelingsPrompt, setCategoryFeelingsPrompt] = useState(true);
  const [deleteCategory, setDeleteCategory] = useState<TemplateCategoryFilter | null>(null);
  const [sportError, setSportError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [filters, setFilters] = useState<TemplateFilters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<TemplateSort>('recent');

  const sortedCategories = [...sportCategories].sort((a, b) => a.order - b.order);
  const templateSportOptions = sortedCategories.length > 0 ? sortedCategories.map((c) => c.name) : ['Ogólne'];
  const categoryFilters: TemplateCategoryFilter[] = [
    { id: 'all', label: SYSTEM_ALL_CATEGORY, kind: 'all', value: SYSTEM_ALL_CATEGORY, editable: false },
    ...sortedCategories.map((c) => ({ id: c.id, label: c.name, kind: 'sport' as const, value: c.name, editable: true, showFeelingsPrompt: c.showFeelingsPrompt })),
  ];
  const activeCategory = categoryFilters.find((f) => f.id === activeCategoryId) ?? categoryFilters[0];
  const editingTemplate = templates.find(t => t.id === editId) ?? null;

  useEffect(() => {
    if (sportFilter === 'Wszystko') return;
    const match = categoryFilters.find((f) => f.kind === 'sport' && f.value === sportFilter);
    if (match) setActiveCategoryId(match.id);
  }, [sportFilter]);

  useEffect(() => {
    if (!editId && templates.length > 0) {
      const first = templates.find((t) => {
        if (activeCategory.kind === 'all') return true;
        return t.sportType === activeCategory.value;
      }) ?? templates[0];
      setEditId(first.id);
    }
  }, [editId, templates, activeCategory]);

  const filtered = templates.filter((t) => {
    if (activeCategory.kind === 'sport' && t.sportType !== activeCategory.value) return false;
    if (query.trim() && !t.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (filters.level !== 'any' && t.level !== filters.level) return false;
    if (filters.duration !== 'any' && durationBucket(t.estimatedDuration) !== filters.duration) return false;
    if (filters.equipment !== 'any' && !(t.equipmentTags ?? []).includes(filters.equipment)) return false;
    if (filters.muscle !== 'any') {
      const tplMuscles = templateMuscles(t, exercises);
      if (!tplMuscles[filters.muscle]) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'duration') return a.estimatedDuration - b.estimatedDuration;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const selectedTemplate = editingTemplate ?? filtered[0] ?? null;

  function selectCategory(filter: TemplateCategoryFilter) {
    setActiveCategoryId(filter.id);
    onSportFilterChange(filter.kind === 'sport' ? filter.value : SYSTEM_ALL_CATEGORY);
    setFilters(DEFAULT_FILTERS);
    const first = templates.find((t) => filter.kind === 'all' || t.sportType === filter.value);
    setEditId(first?.id ?? null);
  }

  function openCategoryEditor(mode: 'add' | 'edit', filter?: TemplateCategoryFilter) {
    if (filter?.kind === 'all') return;
    setCategoryEditor({ mode, filter });
    setCategoryName(mode === 'edit' && filter ? filter.label : '');
    setCategoryFeelingsPrompt(mode === 'edit' && filter ? filter.showFeelingsPrompt : true);
    setSportError('');
  }

  function handleSaveCategory() {
    const clean = categoryName.trim();
    if (!clean) return;
    if (clean.toLowerCase() === SYSTEM_ALL_CATEGORY.toLowerCase()) {
      setSportError('Wszystko jest wartością systemową i nie można jej nadpisać.');
      return;
    }
    const current = categoryEditor?.filter;
    const duplicate = categoryFilters.some((filter) => filter.id !== current?.id && filter.label.toLowerCase() === clean.toLowerCase());
    if (duplicate) {
      setSportError('Taki sport już istnieje.');
      return;
    }

    if (categoryEditor?.mode === 'edit' && current) {
      renameSportCategory(current.id, clean);
      setSportCategorySettings(current.id, { showFeelingsPrompt: categoryFeelingsPrompt });
      setActiveCategoryId(current.id);
      onSportFilterChange(clean);
    } else {
      const created = addSportCategory(clean);
      if (created) {
        setSportCategorySettings(created.id, { showFeelingsPrompt: categoryFeelingsPrompt });
        setActiveCategoryId(created.id);
        onSportFilterChange(clean);
      }
    }

    setCategoryName('');
    setCategoryEditor(null);
    setSportError('');
  }

  function handleConfirmDeleteCategory() {
    if (!deleteCategory || deleteCategory.kind === 'all') return;
    const fallback = categoryFilters.find((f) => f.kind === 'sport' && f.id !== deleteCategory.id);
    if (!fallback) return;
    deleteSportCategory(deleteCategory.id, fallback.id);
    setActiveCategoryId('all');
    onSportFilterChange(SYSTEM_ALL_CATEGORY);
    setDeleteCategory(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 12 }}>
        <div className="card-head" style={{ marginBottom: 10 }}>
          <span className="card-title">Sporty</span>
          <button className="btn btn-secondary btn-sm" onClick={() => openCategoryEditor('add')}>+ Dodaj sport</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))', gap: 10 }}>
          {categoryFilters.map((filter) => {
            const isActive = activeCategory.id === filter.id;
            const count = countForCategoryFilter(filter, templates);
            const canEdit = filter.editable;
            return (
              <div key={filter.id} role="button" tabIndex={0} className="sport-select-card" onClick={() => selectCategory(filter)} onKeyDown={(e) => { if (e.key === 'Enter') selectCategory(filter); }} style={{
                minHeight: 98, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '14px 10px', borderRadius: 'var(--r-mid)', position: 'relative', cursor: 'pointer',
                border: `1.5px solid ${isActive ? 'var(--acc)' : 'var(--border)'}`,
                background: isActive ? 'linear-gradient(180deg, rgba(224,42,139,.18), rgba(15,44,54,.88))' : 'var(--surface)',
                boxShadow: isActive ? '0 0 0 1px rgba(224,42,139,.22), inset 0 0 30px rgba(224,42,139,.08)' : undefined,
                outline: 'none',
              }}>
                {canEdit && (
                  <div style={{ position: 'absolute', top: 7, right: 7, display: 'flex', gap: 4 }}>
                    <button className="icon-btn" style={{ width: 24, height: 24, fontSize: 11 }} onClick={(e) => { e.stopPropagation(); openCategoryEditor('edit', filter); }} aria-label={`Zmień nazwę sportu ${filter.label}`}>✎</button>
                    <button className="icon-btn" style={{ width: 24, height: 24, fontSize: 13 }} onClick={(e) => { e.stopPropagation(); setDeleteCategory(filter); }} aria-label={`Usuń sport ${filter.label}`}>×</button>
                  </div>
                )}
                <SportTileIcon label={filter.label} kind={filter.kind === 'all' ? 'all' : filter.kind} active={isActive} size={34} />
                <span style={{ fontSize: 14, fontWeight: 900, color: isActive ? 'var(--ink)' : 'var(--ink-2)', textAlign: 'center' }}>{filter.label}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{filter.label} {count}</span>
              </div>
            );
          })}
        </div>
        {sportError && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--danger-ink)' }}>{sportError}</div>}
      </div>
      <div className="sport-templates-grid" style={{ gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ minHeight: 720 }}>
          <div className="card-head"><span className="card-title">Szablony</span></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input className="input" placeholder="Szukaj szablonu..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowy szablon</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as TemplateSort)}>
              <option value="recent">Sortuj: Ostatnio używane</option>
              <option value="name">Sortuj: Nazwa A-Z</option>
              <option value="duration">Sortuj: Czas trwania</option>
            </select>
            <select className="select" value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value as Difficulty | 'any' }))}>
              <option value="any">Poziom: wszystkie</option>
              {(['beginner', 'intermediate', 'advanced'] as const).map((l) => <option key={l} value={l}>{DIFFICULTY_LABEL[l]}</option>)}
            </select>
            <select className="select" value={filters.duration} onChange={(e) => setFilters((f) => ({ ...f, duration: e.target.value as TemplateFilters['duration'] }))}>
              <option value="any">Czas: wszystkie</option>
              <option value="short">&lt; 30 min</option>
              <option value="mid">30-60 min</option>
              <option value="long">&gt; 60 min</option>
            </select>
          </div>

          {filtered.length === 0
            ? <EmptyState title="Brak szablonów" desc="Zmień filtry albo dodaj nowy szablon." cta="Dodaj szablon" onCta={() => setShowAdd(true)} />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 610, overflowY: 'auto', paddingRight: 2 }}>{filtered.map(t => (
              <div key={t.id}
                className="template-row"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${selectedTemplate?.id===t.id ? 'var(--acc-line)' : 'var(--border-soft)'}`, background: selectedTemplate?.id===t.id ? 'linear-gradient(90deg, rgba(224,42,139,.18), rgba(15,44,54,.72))' : 'var(--surface-inset)' }}
                onClick={() => setEditId(t.id)}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--acc-soft)', display: 'grid', placeItems: 'center', fontSize: 19, flexShrink: 0 }}>
                  <SportTileIcon label={t.sportType} kind="sport" active={selectedTemplate?.id===t.id} size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                    {t.sportType} · ~{t.estimatedDuration} min · {t.exercises.length} ćw.
                  </div>
                </div>
                {t.isActive && <span className="badge badge-green" style={{ fontSize: 8.5, flexShrink: 0 }}>AKTYWNY</span>}
                <button className="icon-btn" onClick={e => { e.stopPropagation(); setDeleteId(t.id); }}><IcoTrash /></button>
              </div>
            ))}</div>
          }
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink-4)' }}>
            Wyświetlam {filtered.length} z {templates.length} szablonów
          </div>
        </div>

        {selectedTemplate
          ? <TemplateDetail template={selectedTemplate} catalogExercises={exercises} sportOptions={templateSportOptions} onUpdate={p => updateTemplate(selectedTemplate.id, p)} onStart={() => onStartTemplate(selectedTemplate)} />
          : <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:420 }}>
              <EmptyState title="Wybierz szablon" desc="Kliknij szablon po lewej albo dodaj nowy." />
            </div>
        }
      </div>

      <AddTemplateModal open={showAdd} onClose={() => setShowAdd(false)} defaultSport={activeCategory.kind === 'sport' ? activeCategory.value : templateSportOptions[0]} sportOptions={templateSportOptions}
        onSave={data => { addTemplate(data); setShowAdd(false); setEditId(null); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTemplate(deleteId!); setEditId(null); setDeleteId(null); }} label="ten szablon" />
      <ConfirmDelete open={!!deleteCategory} onClose={() => setDeleteCategory(null)}
        onConfirm={handleConfirmDeleteCategory} label={`sport "${deleteCategory?.label ?? ''}"`} />
      <Modal open={!!categoryEditor} onClose={() => { setCategoryEditor(null); setCategoryName(''); setSportError(''); }} title={categoryEditor?.mode === 'edit' ? 'Zmień nazwę sportu' : 'Nowy sport'}
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setCategoryEditor(null)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveCategory}>{categoryEditor?.mode === 'edit' ? 'Zapisz' : 'Dodaj'}</button>
        </>}
      >
        <Field label="Nazwa" required><input className="input" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Np. Pływanie" autoFocus /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={categoryFeelingsPrompt} onChange={(e) => setCategoryFeelingsPrompt(e.target.checked)} />
          Pokaż formularz odczuć po zakończeniu sesji
        </label>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 12.5 }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function TemplateSettingsModal({ open, onClose, template, sportOptions, onUpdate }: { open: boolean; onClose: () => void; template: WorkoutTemplate; sportOptions: string[]; onUpdate: (p: Partial<WorkoutTemplate>) => void }) {
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('');
  const [duration, setDuration] = useState(60);
  const [goal, setGoal] = useState('');
  const [desc, setDesc] = useState('');
  const [equipment, setEquipment] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(template.name);
    setSportType(template.sportType);
    setDuration(template.estimatedDuration);
    setGoal(template.goal ?? '');
    setDesc(template.description ?? '');
    setEquipment((template.equipmentTags ?? []).join(', '));
    setImage(template.image ?? '');
  }, [open, template]);

  function save() {
    if (!name.trim()) return;
    onUpdate({
      name: name.trim(), sportType, estimatedDuration: duration, goal, description: desc,
      equipmentTags: equipment.split(',').map((x) => x.trim()).filter(Boolean),
      image: image.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Ustawienia szablonu" size="md"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!name.trim()}>Zapisz</button>
      </>}>
      <Field label="Nazwa" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Sport"><select className="select" value={sportType} onChange={(e) => setSportType(e.target.value)}>
          {sportOptions.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
        </select></Field>
        <Field label={`Czas: ${duration} min`}><input type="range" min={5} max={180} step={5} value={duration} onChange={(e) => setDuration(+e.target.value)} style={{ width: '100%' }} /></Field>
      </div>
      <Field label="Cel"><input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Np. Hipertrofia klatki i barków" /></Field>
      <Field label="Opis"><textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></Field>
      <Field label="Zdjęcie treningu (URL, opcjonalnie)"><input className="input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Wklej link do zdjęcia — w innym wypadku dobierzemy je automatycznie" /></Field>
      <Field label="Sprzęt (oddziel przecinkami)"><input className="input" value={equipment} onChange={(e) => setEquipment(e.target.value)} /></Field>
    </Modal>
  );
}

function ExercisePickerModal({ open, onClose, sportType, catalogExercises, onPick }: { open: boolean; onClose: () => void; sportType: string; catalogExercises: SportExercise[]; onPick: (ex: SportExercise) => void }) {
  const { addExercise } = useLocalStore();
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [newEquipment, setNewEquipment] = useState('');

  useEffect(() => {
    if (!open) { setQuery(''); setShowNew(false); setNewName(''); setNewMuscle(''); setNewEquipment(''); }
  }, [open]);

  const results = catalogExercises.filter((e) => e.sportType === sportType && (!query.trim() || e.name.toLowerCase().includes(query.trim().toLowerCase())));

  function saveNew() {
    if (!newName.trim()) return;
    const created = addExercise({ name: newName.trim(), sportType, muscleGroup: newMuscle.trim(), equipment: newEquipment.trim(), notes: '' });
    onPick(created);
    setNewName(''); setNewMuscle(''); setNewEquipment(''); setShowNew(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Wybierz ćwiczenie" size="md" footer={<button className="btn btn-secondary btn-sm" onClick={onClose}>Zamknij</button>}>
      <input className="input" placeholder="Szukaj ćwiczenia..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, maxHeight: 300, overflowY: 'auto' }}>
        {results.length === 0 && <EmptyState title="Brak wyników" desc={`Nie znaleziono ćwiczenia w bazie (${sportType}). Dodaj nowe poniżej.`} />}
        {results.map((e) => (
          <button key={e.id} type="button" className="template-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, border: '1px solid var(--border-soft)', background: 'var(--surface-inset)', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)' }} onClick={() => onPick(e)}>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{e.name}</span>
            {e.muscleGroup && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{e.muscleGroup}</span>}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
        {!showNew ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(true)}>+ Nowe ćwiczenie</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field label="Nazwa" required><input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Np. Przysiad bułgarski" autoFocus /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Partia mięśniowa"><input className="input" value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)} /></Field>
              <Field label="Sprzęt"><input className="input" value={newEquipment} onChange={(e) => setNewEquipment(e.target.value)} /></Field>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Anuluj</button>
              <button className="btn btn-primary btn-sm" onClick={saveNew} disabled={!newName.trim()}>Zapisz i dodaj</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function num(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function TemplateDetail({ template, catalogExercises, sportOptions, onUpdate, onStart }: { template: WorkoutTemplate; catalogExercises: SportExercise[]; sportOptions: string[]; onUpdate: (p: Partial<WorkoutTemplate>) => void; onStart: () => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const muscles = templateMuscles(template, catalogExercises);
  const stats = templateStats(template);

  function patchExercise(exerciseId: string, patch: (ex: WorkoutExercise) => WorkoutExercise) {
    onUpdate({ exercises: template.exercises.map((ex) => ex.exerciseId === exerciseId ? patch(ex) : ex) });
  }
  function updateSet(exerciseId: string, setIdx: number, setPatch: Partial<WorkoutSet>) {
    patchExercise(exerciseId, (ex) => ({ ...ex, sets: ex.sets.map((s, i) => i === setIdx ? { ...s, ...setPatch } : s) }));
  }
  function addSet(exerciseId: string) {
    patchExercise(exerciseId, (ex) => {
      const last = ex.sets[ex.sets.length - 1];
      const next: WorkoutSet = last ? { ...last, setNumber: last.setNumber + 1 } : { setNumber: 1, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' };
      return { ...ex, sets: [...ex.sets, next] };
    });
  }
  function removeSet(exerciseId: string, setIdx: number) {
    patchExercise(exerciseId, (ex) => ({ ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) }));
  }
  function setMode(exerciseId: string, mode: 'reps' | 'time') {
    patchExercise(exerciseId, (ex) => ({ ...ex, mode }));
  }
  function addExerciseFromPicker(picked: SportExercise) {
    onUpdate({
      exercises: [...template.exercises, {
        exerciseId: picked.id, exerciseName: picked.name, mode: 'reps',
        sets: [
          { setNumber: 1, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' },
          { setNumber: 2, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' },
          { setNumber: 3, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' },
        ],
      }],
    });
  }
  function removeExercise(exerciseId: string) {
    onUpdate({ exercises: template.exercises.filter((e) => e.exerciseId !== exerciseId) });
  }

  return (
    <div className="card" style={{ minHeight: 720, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="card-head" style={{ marginBottom: 18 }}><span className="card-title">Wybierz szablon</span></div>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--acc-soft)', display: 'grid', placeItems: 'center', fontSize: 25, flexShrink: 0 }}>
              <SportTileIcon label={template.sportType} kind="sport" active size={30} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize:22, fontWeight:900, margin: 0 }}>{template.name}</h2>
                {template.isActive && <span className="badge badge-green" style={{ fontSize: 8.5 }}>AKTYWNY</span>}
              </div>
              <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:5 }}>{template.sportType} · ~{template.estimatedDuration} min · {template.exercises.length} ćwiczeń</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-primary btn-sm" onClick={onStart}>▶ Użyj szablonu</button>
            <button className="btn btn-secondary btn-sm" onClick={() => onUpdate({ isActive: !template.isActive })}>{template.isActive ? 'Dezaktywuj' : 'Aktywuj'}</button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Ustawienia szablonu">⚙</button>
          </div>
        </div>
        {(template.goal || template.description) && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '18px 0 0', maxWidth: 720, lineHeight: 1.6 }}>
            {template.description || template.goal}
          </p>
        )}
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>Liczba ćwiczeń: <strong style={{ color: 'var(--ink-2)' }}>{template.exercises.length}</strong></div>
        {(template.equipmentTags ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {(template.equipmentTags ?? []).map((eq) => <span key={eq} className="badge" style={{ fontSize: 10.5 }}>{eq}</span>)}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 18, border: '1px solid var(--border-soft)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            ['Czas', `~${stats.duration} min`],
            ['Serie robocze', `${stats.setCount}`],
            ['Objętość', stats.volumeKg > 0 ? `${(stats.volumeKg / 1000).toFixed(1)} t` : '-'],
          ].map(([label, value], i) => (
            <div key={label} style={{ padding: '12px 14px', background: 'var(--surface-3)', borderRight: i < 2 ? '1px solid var(--border-soft)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
              <div style={{ fontWeight: 800, fontSize: 19, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sport-hero-grid" style={{ minHeight: 430 }}>
        <div style={{ padding: 22, borderRight: '1px solid var(--border-soft)' }}>
          <SectionHead title={`Ćwiczenia (${template.exercises.length})`} />
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {template.exercises.map((ex, i) => {
              const mode = ex.mode ?? 'reps';
              return (
                <div key={ex.exerciseId} style={{ background:'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0, fontWeight:800, fontSize:13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.exerciseName}</div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button type="button" className={`pill ${mode === 'reps' ? 'accent' : ''}`} style={{ padding: '4px 9px', fontSize: 10.5 }} onClick={() => setMode(ex.exerciseId, 'reps')}>Powtórzenia</button>
                      <button type="button" className={`pill ${mode === 'time' ? 'accent' : ''}`} style={{ padding: '4px 9px', fontSize: 10.5 }} onClick={() => setMode(ex.exerciseId, 'time')}>Czas</button>
                    </div>
                    <button className="icon-btn" onClick={() => removeExercise(ex.exerciseId)}><IcoTrash /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '24px 72px 110px 52px 1fr 28px', gap: 6, padding: '0 0 2px' }}>
                      <span />
                      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)' }}>{mode === 'reps' ? 'Powt.' : 'Czas (s)'}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)' }}>Ciężar</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)' }}>RIR</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-3)' }}>Uwagi</span>
                      <span />
                    </div>
                    {ex.sets.map((set, si) => (
                      <div key={si} style={{ display: 'grid', gridTemplateColumns: '24px 72px 110px 52px 1fr 28px', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>#{set.setNumber}</span>
                        {mode === 'reps' ? (
                          <input className="input" type="number" min={1} value={set.reps} onChange={(e) => updateSet(ex.exerciseId, si, { reps: num(e.target.value, 1) })} placeholder="Powt." style={{ height: 32, padding: '4px 8px', fontSize: 12.5 }} />
                        ) : (
                          <input className="input" type="number" min={0} value={set.durationSec ?? 0} onChange={(e) => updateSet(ex.exerciseId, si, { durationSec: num(e.target.value, 0) })} placeholder="Sek." style={{ height: 32, padding: '4px 8px', fontSize: 12.5 }} />
                        )}
                        <input className="input" type="number" min={0} step={2.5} value={set.weight || ''} onChange={(e) => updateSet(ex.exerciseId, si, { weight: num(e.target.value, 0) })} placeholder="kg (opcjonalnie)" style={{ height: 32, padding: '4px 8px', fontSize: 12.5 }} />
                        <input className="input" type="number" min={0} max={10} value={set.rir || ''} onChange={(e) => updateSet(ex.exerciseId, si, { rir: num(e.target.value, 0) })} placeholder="RIR" style={{ height: 32, padding: '4px 8px', fontSize: 12.5 }} />
                        <input className="input" type="text" value={set.notes} onChange={(e) => updateSet(ex.exerciseId, si, { notes: e.target.value })} placeholder="Uwagi (opcjonalnie)" style={{ height: 32, padding: '4px 8px', fontSize: 12.5 }} />
                        <button className="icon-btn" style={{ width: 28, height: 28, fontSize: 12 }} onClick={() => removeSet(ex.exerciseId, si)} aria-label="Usuń serię">×</button>
                      </div>
                    ))}
                    <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 2 }} onClick={() => addSet(ex.exerciseId)}>+ Seria</button>
                  </div>
                </div>
              );
            })}
            {template.exercises.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Ten szablon nie ma jeszcze ćwiczeń.</div>}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowPicker(true)}>+ Wybierz ćwiczenie z bazy</button>
        </div>

        <div style={{ padding: 22 }}>
          <SectionHead title="Partie mięśniowe" />
          <BodyMap highlight={muscles} size={104} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc)', marginRight: 4 }} />Główne partie</span>
            <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc-b)', marginRight: 4 }} />Dodatkowe partie</span>
          </div>
        </div>
      </div>

      <TemplateSettingsModal open={showSettings} onClose={() => setShowSettings(false)} template={template} sportOptions={sportOptions} onUpdate={onUpdate} />
      <ExercisePickerModal open={showPicker} onClose={() => setShowPicker(false)} sportType={template.sportType} catalogExercises={catalogExercises} onPick={addExerciseFromPicker} />
    </div>
  );
}

function AddTemplateModal({ open, onClose, defaultSport, sportOptions, onSave }: { open: boolean; onClose: () => void; defaultSport: string; sportOptions: string[]; onSave: (t: Omit<WorkoutTemplate,'id'|'createdAt'|'updatedAt'>) => void }) {
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState(defaultSport);
  const [goal, setGoal] = useState('');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState(60);
  const [equipmentTags, setEquipmentTags] = useState<string[]>([]);
  const [image, setImage] = useState('');

  useEffect(() => {
    if (open) setSportType(defaultSport);
  }, [open, defaultSport]);

  function toggleEquipment(eq: string) {
    setEquipmentTags((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);
  }

  return (
    <Modal open={open} onClose={onClose} title="Nowy szablon"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!name.trim()) return;
          onSave({ name, sportType, description: desc, estimatedDuration: duration, exercises: [], isActive: true, goal, equipmentTags, image: image.trim() || undefined });
          setName(''); setDesc(''); setGoal(''); setEquipmentTags([]); setImage('');
        }}>Zapisz</button>
      </>}>
      <Field label="Nazwa" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Push A — Klatka" /></Field>
      <div className="form-grid">
        <Field label="Sport"><select className="select" value={sportType} onChange={e => setSportType(e.target.value)}>
          {sportOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select></Field>
        <Field label={`Czas: ${duration} min`}><input type="range" min={15} max={180} step={5} value={duration} onChange={e => setDuration(+e.target.value)} style={{ width:'100%' }} /></Field>
      </div>
      <Field label="Cel treningu"><input className="input" value={goal} onChange={e => setGoal(e.target.value)} placeholder="Np. Hipertrofia klatki i barków" /></Field>
      <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
      <Field label="Zdjęcie treningu (URL, opcjonalnie)"><input className="input" value={image} onChange={e => setImage(e.target.value)} placeholder="Wklej link do zdjęcia — w innym wypadku dobierzemy je automatycznie" /></Field>
      <Field label="Sprzęt">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button key={eq} type="button" className={`pill ${equipmentTags.includes(eq) ? 'accent' : ''}`} onClick={() => toggleEquipment(eq)}>{eq}</button>
          ))}
        </div>
      </Field>
    </Modal>
  );
}

// ─── AKTYWNA SESJA ────────────────────────────────────────────

function SportActiveSession({ onSessionEnd }: { onSessionEnd: () => void }) {
  const { activeSession, updateActiveSession, completeSession, cancelSession, exercises: storeExercises, sportCategories, addFeeling } = useLocalStore();
  const [feelingsPrompt, setFeelingsPrompt] = useState<WorkoutSession | null>(null);
  const [feelingsDraft, setFeelingsDraft] = useState<FeelingsDraft>(defaultFeelingsDraft());
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [notes, setNotes] = useState('');
  const [completionPain, setCompletionPain] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sessionPaused, setSessionPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionPaused) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [sessionPaused]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSec(s => { if (s <= 1) { setTimerRunning(false); return 0; } return s - 1; }), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  if (!activeSession) {
    return (
      <div className="card" style={{ maxWidth:500 }}>
        <EmptyState title="Brak aktywnej sesji" desc="Przejdź do zakładki Dzisiaj i kliknij Rozpocznij sesję." />
      </div>
    );
  }

  const { templateName, sportType, currentExerciseIndex, exercises } = activeSession;
  const currentEx = exercises[currentExerciseIndex];
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
  const doneRirs = exercises.flatMap(e => e.sets).filter(s => s.completed).map(s => s.rir);
  const avgRir = doneRirs.length ? (doneRirs.reduce((a, r) => a + r, 0) / doneRirs.length).toFixed(1) : '–';
  const engagedMuscles = useMemo(() => exercisesMuscles(exercises, storeExercises), [exercises, storeExercises]);

  function updateSet(exIdx: number, setIdx: number, field: keyof WorkoutSet, value: number | boolean | string) {
    const newEx = exercises.map((ex, i) =>
      i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) } : ex
    );
    updateActiveSession({ exercises: newEx });
  }

  function markSetDone(exIdx: number, setIdx: number) {
    updateSet(exIdx, setIdx, 'completed', true);
    const rest = exercises[exIdx].sets[setIdx].restTime;
    setTimerSec(rest); setTimerRunning(true);
  }

  function addSet(exIdx: number) {
    const ex = exercises[exIdx];
    const last = ex.sets[ex.sets.length - 1];
    const newSet: WorkoutSet = last
      ? { ...last, setNumber: last.setNumber + 1, completed: false }
      : { setNumber: 1, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' };
    const newEx = exercises.map((e, i) => i === exIdx ? { ...e, sets: [...e.sets, newSet] } : e);
    updateActiveSession({ exercises: newEx });
  }

  function goToNextExercise() {
    if (currentExerciseIndex < exercises.length - 1) updateActiveSession({ currentExerciseIndex: currentExerciseIndex + 1 });
    else setShowComplete(true);
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'230px 1fr 300px', gap:16, alignItems:'start' }}>
      {/* Exercise sidebar */}
      <div className="card">
        <div className="card-head"><span className="card-title">Trening</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <SportTileIcon label={sportType} kind="sport" size={20} />
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25 }}>{templateName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {exercises.map((ex, i) => {
            const done = ex.sets.every(s => s.completed);
            const isCurrent = i === currentExerciseIndex;
            return (
              <button key={ex.exerciseId}
                onClick={() => updateActiveSession({ currentExerciseIndex: i })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: 0, textAlign: 'left', cursor: 'pointer',
                  background: isCurrent ? 'var(--acc-soft)' : 'transparent', color: 'inherit',
                }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700,
                  background: done ? 'var(--acc)' : isCurrent ? 'var(--surface)' : 'var(--surface-3)',
                  color: done ? 'var(--on-acc)' : isCurrent ? 'var(--acc-ink)' : 'var(--ink-3)',
                  border: isCurrent && !done ? '1.5px solid var(--acc)' : 'none',
                }}>{done ? '✓' : i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: isCurrent ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.exerciseName}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{ex.sets.filter(s => s.completed).length}/{ex.sets.length} serii</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main column */}
      <div className="col">
        <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px' }}>
          <div>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)' }}>Czas sesji</div>
            <div style={{ fontFamily:'var(--mono)', fontWeight:800, fontSize:26, letterSpacing:-1 }}>{fmtTime(elapsed)}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSessionPaused((p) => !p)}>{sessionPaused ? '▶ Wznów' : '⏸ Pauza'}</button>
            <button className="btn btn-danger btn-sm" onClick={() => setShowComplete(true)}>● ZAKOŃCZ</button>
          </div>
        </div>

        {currentEx && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-3)' }}>Aktualne ćwiczenie</div>
                <div style={{ fontWeight:700, fontSize:17, marginTop: 2 }}>{currentEx.exerciseName}</div>
              </div>
              {timerRunning && (
                <div style={{ textAlign: 'center', background: 'var(--acc-soft)', borderRadius: 10, padding: '6px 14px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 18, color: 'var(--acc-ink)' }}>{fmtTime(timerSec)}</div>
                  <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>odpoczynek</div>
                </div>
              )}
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="table" style={{ minWidth:480 }}>
                <thead>
                  <tr>
                    <th style={{ width:50 }}>SERIA</th>
                    <th>POWT.</th>
                    <th>CIĘŻAR (kg)</th>
                    <th>RIR</th>
                    <th>ODPOCZYNEK</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEx.sets.map((set, si) => (
                    <tr key={si} style={{ background: set.completed ? 'var(--acc-soft)' : undefined }}>
                      <td style={{ fontWeight:600 }}>{set.setNumber}</td>
                      <td><input type="number" defaultValue={set.reps} min={1}
                        onChange={e => updateSet(currentExerciseIndex, si, 'reps', +e.target.value)}
                        style={{ width:52, padding:'3px 6px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, textAlign:'center' }} /></td>
                      <td><input type="number" defaultValue={set.weight} min={0} step={2.5}
                        onChange={e => updateSet(currentExerciseIndex, si, 'weight', +e.target.value)}
                        style={{ width:68, padding:'3px 6px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, textAlign:'center' }} /></td>
                      <td><input type="number" defaultValue={set.rir} min={0} max={5}
                        onChange={e => updateSet(currentExerciseIndex, si, 'rir', +e.target.value)}
                        style={{ width:48, padding:'3px 6px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, textAlign:'center' }} /></td>
                      <td style={{ fontSize:13 }}>{Math.floor(set.restTime/60)}:{String(set.restTime%60).padStart(2,'0')}</td>
                      <td>{set.completed
                        ? <span className="badge badge-green">✓ Zrobione</span>
                        : <button className="btn btn-primary btn-sm" onClick={() => markSetDone(currentExerciseIndex, si)}>START</button>
                      }</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => addSet(currentExerciseIndex)}>+ Dodaj serię</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={goToNextExercise}>
                {currentExerciseIndex < exercises.length - 1 ? 'Następne ćwiczenie →' : '✓ Zakończ ostatnie ćwiczenie'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session summary sidebar */}
      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Podsumowanie sesji</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <StatBox label="Czas" value={fmtTime(elapsed)} />
            <StatBox label="Objętość" value={`${(exercises.reduce((a,e)=>a+volFromSets(e.sets),0)/1000).toFixed(1)} t`} />
            <StatBox label="Wykonane serie" value={`${doneSets}/${totalSets}`} />
            <StatBox label="Średnie RIR" value={`${avgRir}`} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Notatki</span></div>
          <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notatki z sesji…" />
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Zaangażowane mięśnie</span></div>
          <BodyMap highlight={engagedMuscles} size={64} compact />
        </div>
      </div>

      {/* Complete modal */}
      <Modal open={showComplete} onClose={() => setShowComplete(false)} title="Zakończ trening"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowComplete(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            const session = completeSession(notes, completionPain);
            setShowComplete(false);
            if (!session) { onSessionEnd(); return; }
            const category = sportCategories.find((c) => c.name === session.sportType);
            if (category?.showFeelingsPrompt ?? true) { setFeelingsDraft(defaultFeelingsDraft()); setFeelingsPrompt(session); }
            else onSessionEnd();
          }}>Zakończ i zapisz</button>
        </>}>
        <div style={{ background:'var(--surface-3)', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, textAlign:'center' }}>
            <div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Czas</div><div style={{ fontWeight:700 }}>{fmtTime(elapsed)}</div></div>
            <div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Serie</div><div style={{ fontWeight:700 }}>{doneSets}</div></div>
            <div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Objętość</div><div style={{ fontWeight:700 }}>{(exercises.reduce((a,e)=>a+volFromSets(e.sets),0)/1000).toFixed(1)}t</div></div>
          </div>
        </div>
        <Field label="Komentarz"><textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></Field>
        <Field label={`Ból po treningu: ${completionPain}/10`}><input type="range" min={0} max={10} value={completionPain} onChange={e => setCompletionPain(+e.target.value)} style={{ width:'100%' }} /></Field>
        <button className="btn btn-ghost btn-sm" onClick={() => { cancelSession(); onSessionEnd(); }} style={{ color:'var(--p-high)', marginTop:4 }}>
          Porzuć bez zapisywania
        </button>
      </Modal>

      {/* Post-session feelings prompt */}
      <Modal open={!!feelingsPrompt} onClose={() => { setFeelingsPrompt(null); onSessionEnd(); }} title="Jak poszła sesja?" size="lg"
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFeelingsPrompt(null); onSessionEnd(); }}>Pomiń</button>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            if (feelingsPrompt) addFeeling(feelingEntryFromDraft(feelingsPrompt, feelingsDraft, 'pending'));
            setFeelingsPrompt(null); onSessionEnd();
          }}>Dodaj później</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (feelingsPrompt) addFeeling(feelingEntryFromDraft(feelingsPrompt, feelingsDraft, 'completed'));
            setFeelingsPrompt(null); onSessionEnd();
          }}>Zapisz</button>
        </>}>
        {feelingsPrompt && <FeelingsForm value={feelingsDraft} onChange={setFeelingsDraft} />}
      </Modal>
    </div>
  );
}

// ─── HISTORIA ─────────────────────────────────────────────────

type HistoryRange = 'all' | '30d' | 'month' | '3m';
type HistorySort = 'newest' | 'oldest' | 'longest' | 'volume';

function SportHistory({ onRepeat, onFillFeelings }: { onRepeat: () => void; onFillFeelings: (sessionId: string) => void }) {
  const { sessions, repeatSession, feelings, exercises } = useLocalStore();
  const [sportFilter, setSportFilter] = useState<SportKey | 'Wszystko'>('Wszystko');
  const [range, setRange] = useState<HistoryRange>('all');
  const [sort, setSort] = useState<HistorySort>('newest');
  const [calMonth, setCalMonth] = useState(() => new Date());

  const countForSport = (s: SportKey | 'Wszystko') => sessions.filter((x) => s === 'Wszystko' || x.sportType === s).length;

  const rangeFiltered = sessions.filter((s) => {
    if (range === 'all') return true;
    const days = (Date.now() - new Date(s.date).getTime()) / 86400000;
    if (range === '30d') return days <= 30;
    if (range === '3m') return days <= 90;
    if (range === 'month') return s.date.startsWith(new Date().toISOString().slice(0, 7));
    return true;
  });
  const filtered = filterBySport(rangeFiltered, sportFilter).sort((a, b) => {
    if (sort === 'oldest') return a.date.localeCompare(b.date);
    if (sort === 'longest') return (b.duration ?? 0) - (a.duration ?? 0);
    if (sort === 'volume') return sessionVolume(b) - sessionVolume(a);
    return b.date.localeCompare(a.date);
  });

  const summary = monthSummary(filterBySport(sessions, sportFilter), calMonth);
  const heatmapData = monthHeatmapData(filterBySport(sessions, sportFilter), calMonth);
  const engagedMuscles = sessionsMuscles(filtered, exercises);
  function feelingsStatusFor(sessionId: string) {
    return feelings.find((f) => f.sessionId === sessionId)?.status ?? null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SportSelectorRow
        active={sportFilter}
        onSelect={(s) => setSportFilter(s as SportKey | 'Wszystko')}
        countLabel={(s) => plCount(countForSport(s as SportKey | 'Wszystko'), 'sesja', 'sesje', 'sesji')}
      />

      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="select" value={range} onChange={(e) => setRange(e.target.value as HistoryRange)}>
          <option value="all">Zakres: wszystkie</option>
          <option value="30d">Ostatnie 30 dni</option>
          <option value="month">Ten miesiąc</option>
          <option value="3m">Ostatnie 3 miesiące</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as HistorySort)}>
          <option value="newest">Sortuj: Najnowsze</option>
          <option value="oldest">Sortuj: Najstarsze</option>
          <option value="longest">Sortuj: Najdłuższe</option>
          <option value="volume">Sortuj: Największa objętość</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0
            ? <EmptyState title="Brak historii treningów" desc="Ukończ pierwszą sesję, aby zobaczyć historię." />
            : filtered.map((s) => (
              <SessionCard key={s.id} session={s} onRepeat={() => { repeatSession(s.id); onRepeat(); }}
                feelingsStatus={feelingsStatusFor(s.id)} onFillFeelings={() => onFillFeelings(s.id)} />
            ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head"><span className="card-title">Podsumowanie miesiąca</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatBox label="Łączny czas" value={`${Math.floor(summary.totalMinutes / 60)} h ${summary.totalMinutes % 60} min`} />
              <StatBox label="Łączna objętość" value={`${(summary.totalVolumeKg / 1000).toFixed(1)} t`} />
              <StatBox label="Łączna liczba serii" value={`${summary.totalSets}`} />
              <StatBox label="Najczęstszy" value={summary.mostFrequentSport ?? '—'} />
            </div>
          </div>

          <div className="card">
            <div className="card-head" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span className="card-title">Kalendarz aktywności</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{calMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
                <button className="icon-btn" onClick={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
                <button className="icon-btn" onClick={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
              </div>
            </div>
            <MonthHeatmap month={calMonth} data={heatmapData} />
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">Zaangażowane mięśnie</span></div>
            {Object.keys(engagedMuscles).length > 0 ? <BodyMap highlight={engagedMuscles} size={64} compact /> : <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Brak danych w tym zakresie.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, onRepeat, feelingsStatus, onFillFeelings }: { session: WorkoutSession; onRepeat: () => void; feelingsStatus?: FeelingStatus | null; onFillFeelings?: () => void }) {
  const totalVol = sessionVolume(session);
  const totalSets = sessionSetCount(session);
  const completedRirs = session.exercises.flatMap((e) => e.sets).filter((s) => s.completed).map((s) => s.rir);
  const avgRir = completedRirs.length ? Math.round(completedRirs.reduce((a, r) => a + r, 0) / completedRirs.length) : null;
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{session.templateName}</span>
            <SportBadge sport={session.sportType} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{new Date(session.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}{session.startTime && ` · ${session.startTime}`}</div>
        </div>
        {avgRir != null && <span className="badge badge-gray">RIR {avgRir}</span>}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ink-3)', marginBottom: 8 }}>
        {session.duration && <span>⏱ {session.duration} min</span>}
        {session.distanceKm != null && <span>📏 {session.distanceKm} km</span>}
        {totalSets > 0 && <span>📦 {totalSets} serii</span>}
        {totalVol > 0 && <span>💪 {totalVol.toLocaleString('pl-PL')} kg obj.</span>}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', padding: '0 4px' }} onClick={onRepeat}>Powtórz</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {session.exercises.map(ex => (
          <span key={ex.exerciseId} style={{ fontSize: 12, padding: '3px 8px', background: 'var(--surface-3)', borderRadius: 6 }}>{ex.exerciseName}</span>
        ))}
      </div>
      {session.notesAfterTraining && <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, fontStyle: 'italic' }}>"{session.notesAfterTraining}"</div>}
      {feelingsStatus === 'pending' && onFillFeelings && (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={onFillFeelings}>Uzupełnij odczucia</button>
      )}
    </div>
  );
}

// ─── ANALIZA ──────────────────────────────────────────────────

function VolumeChart({ sessions }: { sessions: WorkoutSession[] }) {
  const last8 = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).reverse();
  const totalVols = last8.map(sessionVolume);
  const maxVol = Math.max(...totalVols, 1);
  if (last8.length === 0) return <EmptyState title="Brak danych" desc="Ukończ treningi, aby zobaczyć analizę." />;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
      {last8.map((s, i) => {
        const pct = totalVols[i] / maxVol;
        return (
          <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(totalVols[i] / 1000)}k</div>
            <div style={{ width: '100%', background: 'var(--acc-soft)', borderRadius: '4px 4px 0 0', height: `${Math.max(pct * 80, 4)}px`, transition: 'height 0.3s' }} />
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{new Date(s.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</div>
          </div>
        );
      })}
    </div>
  );
}

function Heatmap({ sessions, days = 84 }: { sessions: WorkoutSession[]; days?: number }) {
  const buckets = dailyBuckets(sessions, days);
  const maxVol = Math.max(...buckets.map((b) => b.volume), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.ceil(days / 7)}, 1fr)`, gridAutoFlow: 'column', gap: 3 }}>
      {buckets.map((b) => {
        const intensity = b.count === 0 ? 0 : Math.max(0.25, b.volume / maxVol);
        return (
          <div key={b.date} title={`${b.date}: ${b.count} sesji`}
            style={{ width: 11, height: 11, borderRadius: 2, background: b.count > 0 ? 'var(--acc)' : 'var(--surface-3)', opacity: b.count > 0 ? intensity : 1 }} />
        );
      })}
    </div>
  );
}

function MuscleBalanceBars({ sessions }: { sessions: WorkoutSession[] }) {
  const counts = muscleSetCounts(sessions);
  const entries = Object.entries(counts) as [MuscleKey, number][];
  const max = Math.max(...entries.map(([, v]) => v), 1);
  if (entries.length === 0) return <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Brak danych o seriach na partię.</div>;
  return (
    <div>
      {entries.sort((a, b) => b[1] - a[1]).map(([key, count]) => (
        <div key={key} style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
            <span style={{ color: 'var(--ink-2)' }}>{MUSCLE_LABEL[key]}</span>
            <span style={{ fontWeight: 700 }}>{count}</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: 'var(--acc-b)', borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const SPORT_DONUT_COLORS: Record<SportKey, string> = {
  'Siłownia': 'var(--acc)', 'Bieganie': 'var(--ev-blue)', 'Wspinaczka': 'var(--acc-b)',
  'Mobilność': 'var(--ev-lav)', 'Rehabilitacja': 'var(--ev-clay)',
};

function exportSessionsJson(sessions: WorkoutSession[]) {
  const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `sesje-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function DeltaStat({ label, value, deltaPct }: { label: string; value: string; deltaPct: number | null }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{value}</div>
      {deltaPct != null && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3, color: deltaPct >= 0 ? 'var(--success-ink)' : 'var(--danger-ink)' }}>
          {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}%
        </div>
      )}
    </div>
  );
}

function SportAnalysis() {
  const { sessions, feelings, templates, sportCategories } = useLocalStore();
  const [sport, setSport] = useState<SportKey | 'Wszystko'>('Wszystko');
  const [windowDays, setWindowDays] = useState<7 | 28 | 90>(28);
  const categoryNames = [...sportCategories].sort((a, b) => a.order - b.order).map((c) => c.name);

  const scoped = filterBySport(sessions, sport);
  const windowed = scoped.filter((s) => (Date.now() - new Date(s.date).getTime()) / 86400000 <= windowDays);
  const insights = generateInsights(sessions, feelings, categoryNames);
  const comparison = compareRanges(scoped, windowDays);
  const distribution = sportDistribution(sessionsInLastNDays(sessions, windowDays));
  const muscleCounts = muscleSetCounts(windowed);
  const weeks = Math.max(1, Math.ceil(windowDays / 7));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SportSelectorRow
        active={sport}
        onSelect={(s) => setSport(s as SportKey | 'Wszystko')}
        countLabel={(s) => plCount(filterBySport(sessions, s as SportKey | 'Wszystko').length, 'sesja', 'sesje', 'sesji')}
      />

      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="select" value={windowDays} onChange={(e) => setWindowDays(+e.target.value as 7 | 28 | 90)}>
            <option value={7}>Zakres: Ostatnie 7 dni</option>
            <option value={28}>Zakres: Ostatnie 4 tygodnie</option>
            <option value={90}>Zakres: Ostatnie ~12 tygodni</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Porównanie z: poprzednie {windowDays} dni</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportSessionsJson(scoped)}>⬇ Eksportuj</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <DeltaStat label="Łączny czas" value={`${Math.floor(comparison.current.minutes / 60)} h ${comparison.current.minutes % 60} min`} deltaPct={comparison.deltaPct.minutes} />
        <DeltaStat label="Łączna objętość" value={`${(comparison.current.volumeKg / 1000).toFixed(1)} t`} deltaPct={comparison.deltaPct.volumeKg} />
        <DeltaStat label="Łączna liczba serii" value={`${comparison.current.sets}`} deltaPct={comparison.deltaPct.sets} />
        <DeltaStat label="Treningi" value={`${comparison.current.count}`} deltaPct={comparison.deltaPct.count} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Dystrybucja aktywności</span></div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 10 }}>Wszystkie sporty, niezależnie od wybranej karty powyżej</div>
          <DonutChart slices={categoryNames.map((s) => ({ label: s, value: distribution[s] ?? 0, color: SPORT_DONUT_COLORS[s] ?? 'var(--acc)' }))} />
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Wnioski</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-2)' }}>
                <span style={{ color: 'var(--acc-ink)', flexShrink: 0 }}>✓</span>{line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Trend objętości (kg)</span></div>
          <LineChart points={weeklyTrend(scoped, weeks, (b) => b.reduce((a, s) => a + sessionVolume(s), 0))} color="var(--acc)" />
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Trend czasu (min)</span></div>
          <LineChart points={weeklyTrend(scoped, weeks, (b) => b.reduce((a, s) => a + (s.duration ?? 0), 0))} color="var(--ev-blue)" />
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Najczęściej trenowane partie</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20 }}>
          <BodyMap highlight={muscleCountsToHighlight(muscleCounts)} size={64} compact />
          <MuscleBalanceBars sessions={windowed} />
        </div>
      </div>

      {(sport === 'Wszystko' || sport === 'Siłownia') && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-head"><span className="card-title">Objętość (ostatnie 8 treningów)</span></div>
              <VolumeChart sessions={sport === 'Wszystko' ? sessions.filter((s) => s.sportType === 'Siłownia') : scoped} />
            </div>
            <div className="card">
              <div className="card-head"><span className="card-title">Średnie RIR</span></div>
              <div style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', padding: '14px 0' }}>{avgRir(windowed) != null ? avgRir(windowed)!.toFixed(1) : '–'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-4)', textAlign: 'center' }}>Reps In Reserve — średnio z wykonanych serii w wybranym oknie</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-head"><span className="card-title">Top ćwiczenia (objętość)</span></div>
              {topExercisesByVolume(windowed).map((e) => (
                <div key={e.exerciseName} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                  <span>{e.exerciseName}</span><span style={{ fontWeight: 700 }}>{Math.round(e.volume)} kg</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-head"><span className="card-title">Rekordy (PR)</span></div>
              {computePRs(windowed).map((pr) => (
                <div key={pr.exerciseName} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                  <span>{pr.exerciseName}</span><span style={{ fontWeight: 700 }}>{pr.weight} kg × {pr.reps}</span>
                </div>
              ))}
              {computePRs(windowed).length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Brak rekordów w tym oknie.</div>}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Heatmapa dni treningowych</span></div>
            <Heatmap sessions={sport === 'Wszystko' ? sessions.filter((s) => s.sportType === 'Siłownia') : scoped} />
          </div>
        </>
      )}

      {sport === 'Bieganie' && (() => {
        const rs = runningStats(scoped);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26, fontWeight: 800 }}>{rs.kmWeek.toFixed(1)}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>km / tydzień</div></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26, fontWeight: 800 }}>{rs.kmMonth.toFixed(1)}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>km / miesiąc</div></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26, fontWeight: 800 }}>{rs.avgPace ? `${rs.avgPace.toFixed(1)}` : '–'}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>min/km śr.</div></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26, fontWeight: 800 }}>{rs.longestKm.toFixed(1)}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>najdłuższy (km)</div></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 26, fontWeight: 800 }}>{rs.sessionCount}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>sesji</div></div>
          </div>
        );
      })()}

      {sport === 'Wspinaczka' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-head"><span className="card-title">Sesje wg typu</span></div>
            {Object.entries(byCategoryCount(scoped, templates)).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}><span>{cat}</span><span style={{ fontWeight: 700 }}>{count}</span></div>
            ))}
            {scoped.length === 0 && <EmptyState title="Brak sesji" desc="Ukończ pierwszą sesję wspinaczkową." />}
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Czas sesji i trend</span></div>
            <StatBox label="Liczba sesji" value={`${scoped.length}`} />
            <div style={{ marginTop: 10 }}><Heatmap sessions={scoped} days={56} /></div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 8 }}>Trudności i liczba prób/topów nie są jeszcze zapisywane przy sesji — propozycja: dodać ocenę drogi (np. skala V/UIAA) w formularzu zakończenia sesji.</div>
          </div>
        </div>
      )}

      {sport === 'Mobilność' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-head"><span className="card-title">Regularność</span></div>
            <StatBox label="Sesje (okno)" value={`${windowed.length}`} />
            <div style={{ marginTop: 10 }}><Heatmap sessions={scoped} days={56} /></div>
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Obszary ciała</span></div>
            <MuscleBalanceBars sessions={windowed} />
          </div>
        </div>
      )}

      {sport === 'Rehabilitacja' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-head"><span className="card-title">Regularność i ból</span></div>
            <StatBox label="Sesje (okno)" value={`${windowed.length}`} />
            <div style={{ marginTop: 10 }}>
              {windowed.slice(0, 8).reverse().map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                  <span style={{ color: 'var(--ink-3)' }}>{fmtDate(s.date)}</span>
                  <span>Ból: <strong>{s.painAfterTraining ?? '–'}</strong>/10</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Najczęściej wykonywane ćwiczenia</span></div>
            {mostFrequentExercises(windowed).map((e) => (
              <div key={e.exerciseName} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}><span>{e.exerciseName}</span><span style={{ fontWeight: 700 }}>{e.count}×</span></div>
            ))}
            {windowed.length === 0 && <EmptyState title="Brak sesji rehabilitacyjnych" />}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Treningi (łącznie)', val: scoped.length },
          { label: 'Ten miesiąc', val: scoped.filter(s => s.date.startsWith(new Date().toISOString().slice(0,7))).length },
          { label: 'Seria dni', val: streakDays(scoped) },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{stat.val}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ĆWICZENIA ────────────────────────────────────────────────

function DifficultyDots({ level }: { level?: Difficulty }) {
  const n = level === 'beginner' ? 1 : level === 'advanced' ? 3 : level === 'intermediate' ? 2 : 0;
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3].map((i) => <i key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= n ? 'var(--acc)' : 'var(--border)' }} />)}
    </span>
  );
}

type ExerciseDetailTab = 'opis' | 'wykonanie' | 'warianty' | 'mapa';

function ExerciseDetailPanel({ ex }: { ex: SportExercise }) {
  const [tab, setTab] = useState<ExerciseDetailTab>('opis');
  const primaryLabels = (ex.primaryMuscles ?? []).map((m) => MUSCLE_LABEL[m]);
  const secondaryLabels = (ex.secondaryMuscles ?? []).map((m) => MUSCLE_LABEL[m]);
  const stabilizerLabels = (ex.stabilizerMuscles ?? []).map((m) => MUSCLE_LABEL[m]);
  const muscles = useMemo(() => muscleSetFromExercises([ex]), [ex]);
  const description = `${ex.movementPattern ? `${ex.movementPattern}. ` : ''}Ćwiczenie ${ex.sportType.toLowerCase()}, które angażuje przede wszystkim ${primaryLabels.join(', ') || '—'}${secondaryLabels.length ? `, pomocniczo ${secondaryLabels.join(', ')}` : ''}${stabilizerLabels.length ? `, ze stabilizacją: ${stabilizerLabels.join(', ')}` : ''}.`;

  const TABS: { id: ExerciseDetailTab; label: string }[] = [
    { id: 'opis', label: 'OPIS' }, { id: 'wykonanie', label: 'WYKONANIE' },
    { id: 'warianty', label: 'WARIANTY' }, { id: 'mapa', label: 'MUSCLE MAP' },
  ];

  return (
    <div className="card">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{ex.name}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <InfoRow label="Główne" value={primaryLabels.join(', ') || ex.muscleGroup || '—'} />
          <InfoRow label="Drugorzędne" value={secondaryLabels.join(', ') || '—'} />
          <InfoRow label="Stabilizatory" value={stabilizerLabels.join(', ') || '—'} />
          <InfoRow label="Sprzęt" value={(ex.equipmentTags ?? []).join(', ') || ex.equipment || '—'} />
          <InfoRow label="Kategoria" value={ex.category ?? '—'} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>Trudność: {ex.difficulty ? DIFFICULTY_LABEL[ex.difficulty] : '—'}</div>
          <DifficultyDots level={ex.difficulty} />
          <div style={{ marginTop: 14 }}>
            <BodyMap highlight={muscles} size={56} compact />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-soft)', marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 12px', border: 0, background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.06em', fontWeight: 700,
              color: tab === t.id ? 'var(--acc-ink)' : 'var(--ink-3)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--acc)' : 'transparent'}`,
            }}>{t.label}</button>
        ))}
      </div>

      {tab === 'opis' && <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{description}</p>}
      {tab === 'wykonanie' && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          <p>{ex.instructions || 'Brak zapisanych instrukcji wykonania dla tego ćwiczenia.'}</p>
          {ex.tips && <p style={{ marginTop: 10 }}><strong>Wskazówka:</strong> {ex.tips}</p>}
          {ex.contraindications && <p style={{ marginTop: 10, color: 'var(--danger-ink)' }}><strong>Przeciwwskazania:</strong> {ex.contraindications}</p>}
        </div>
      )}
      {tab === 'warianty' && (
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          {(ex.aliases ?? []).length > 0 ? <p>Znane również jako: {(ex.aliases ?? []).join(', ')}.</p> : null}
          <p style={{ color: 'var(--ink-4)', fontSize: 12.5, marginTop: 8 }}>Brak zapisanych wariantów ruchu — propozycja: dodać pole z wariantami (np. „na maszynie”, „jednorącz”) w przyszłej rozbudowie bazy.</p>
        </div>
      )}
      {tab === 'mapa' && <BodyMap highlight={muscles} size={90} />}
    </div>
  );
}

type ExerciseSort = 'name' | 'sport' | 'difficulty';

function SportExercises() {
  const { exercises, addExercise, sportCategories } = useLocalStore();
  const categoryNames = [...sportCategories].sort((a, b) => a.order - b.order).map((c) => c.name);
  const [showAdd, setShowAdd] = useState(false);
  const [sportFilter, setSportFilter] = useState<SportKey | 'Wszystko'>('Wszystko');
  const [muscleFilter, setMuscleFilter] = useState<MuscleKey | 'any'>('any');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ExerciseSort>('name');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportKey>('Siłownia');
  const [primary, setPrimary] = useState<MuscleKey[]>([]);
  const [secondary, setSecondary] = useState<MuscleKey[]>([]);
  const [equipment, setEquipment] = useState('Sztanga');
  const [rehabSafe, setRehabSafe] = useState(false);

  const muscleFrequency = new Map<MuscleKey, number>();
  for (const ex of exercises) for (const m of ex.primaryMuscles ?? []) muscleFrequency.set(m, (muscleFrequency.get(m) ?? 0) + 1);
  const topMuscles = [...muscleFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  const restMuscles = MUSCLES.filter((m) => !topMuscles.includes(m.key));

  const filtered = exercises.filter((ex) => {
    if (sportFilter !== 'Wszystko' && ex.sportType !== sportFilter && !ex.sportCategories?.includes(sportFilter)) return false;
    if (muscleFilter !== 'any' && !(ex.primaryMuscles ?? []).includes(muscleFilter) && !(ex.secondaryMuscles ?? []).includes(muscleFilter)) return false;
    if (query.trim() && !ex.name.toLowerCase().includes(query.trim().toLowerCase()) && !(ex.aliases ?? []).some((a) => a.toLowerCase().includes(query.trim().toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'sport') return a.sportType.localeCompare(b.sportType);
    if (sort === 'difficulty') return (a.difficulty ?? '').localeCompare(b.difficulty ?? '');
    return a.name.localeCompare(b.name);
  });

  const selected = exercises.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  function toggleMuscle(list: MuscleKey[], setList: (v: MuscleKey[]) => void, key: MuscleKey) {
    setList(list.includes(key) ? list.filter((m) => m !== key) : [...list, key]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={`pill ${muscleFilter === 'any' ? 'accent' : ''}`} onClick={() => setMuscleFilter('any')}>Wszystkie</button>
        {topMuscles.map((m) => (
          <button key={m} className={`pill ${muscleFilter === m ? 'accent' : ''}`} onClick={() => setMuscleFilter(m)}>{MUSCLE_LABEL[m]}</button>
        ))}
        <select className="select" value={restMuscles.some((m) => m.key === muscleFilter) ? muscleFilter : ''} onChange={(e) => setMuscleFilter(e.target.value as MuscleKey)} style={{ minWidth: 110 }}>
          <option value="" disabled>Więcej ▾</option>
          {restMuscles.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Szukaj nazwy, partii, sprzętu…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="select" value={sportFilter} onChange={(e) => setSportFilter(e.target.value as SportKey | 'Wszystko')}>
          <option value="Wszystko">Sport: wszystkie</option>
          {categoryNames.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <span className="card-title">Ćwiczenia ({filtered.length})</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowe</button>
          </div>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as ExerciseSort)} style={{ width: '100%', marginBottom: 10 }}>
            <option value="name">Sortuj: Nazwa A–Z</option>
            <option value="sport">Sortuj: Sport</option>
            <option value="difficulty">Sortuj: Trudność</option>
          </select>
          <table className="table">
            <thead><tr><th>ĆWICZENIE</th><th>GŁÓWNE MIĘŚNIE</th><th>SPRZĘT</th><th>TRUDNOŚĆ</th></tr></thead>
            <tbody>
              {filtered.map(ex => (
                <tr key={ex.id} onClick={() => setSelectedId(ex.id)} style={{ cursor: 'pointer', background: selected?.id === ex.id ? 'var(--acc-soft)' : undefined }}>
                  <td style={{ fontWeight: 600 }}>{ex.name}</td>
                  <td style={{ fontSize: 12.5 }}>{(ex.primaryMuscles ?? []).map((m) => MUSCLE_LABEL[m]).join(', ') || ex.muscleGroup}</td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{ex.equipment}</td>
                  <td><DifficultyDots level={ex.difficulty} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState title="Brak wyników" desc="Zmień filtry wyszukiwania." />}
        </div>

        {selected
          ? <ExerciseDetailPanel ex={selected} />
          : <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <EmptyState title="Wybierz ćwiczenie" desc="Kliknij ćwiczenie po lewej." />
            </div>
        }
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowe ćwiczenie" size="lg"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim() || primary.length === 0) return;
            addExercise({
              name, sportType: sport, muscleGroup: MUSCLE_LABEL[primary[0]], equipment, notes: '',
              category: TEMPLATE_CATEGORIES[sport]?.[0] ?? 'Ogólne', equipmentTags: [equipment], difficulty: 'intermediate',
              movementPattern: '', primaryMuscles: primary, secondaryMuscles: secondary, stabilizerMuscles: [],
              instructions: '', tips: '', contraindications: '', rehabSafe, tags: [],
            });
            setName(''); setPrimary([]); setSecondary([]); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa ćwiczenia" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Wyciskanie sztangi" /></Field>
        <div className="form-grid">
          <Field label="Sport"><select className="select" value={sport} onChange={e => setSport(e.target.value as SportKey)}>{categoryNames.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Sprzęt"><select className="select" value={equipment} onChange={e => setEquipment(e.target.value)}>{EQUIPMENT_OPTIONS.map(e => <option key={e}>{e}</option>)}</select></Field>
        </div>
        <Field label="Główne partie (wymagane, można kilka)" required>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MUSCLES.map((m) => (
              <button key={m.key} type="button" className={`pill ${primary.includes(m.key) ? 'accent' : ''}`} onClick={() => toggleMuscle(primary, setPrimary, m.key)}>{m.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Partie pomocnicze (opcjonalnie)">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MUSCLES.map((m) => (
              <button key={m.key} type="button" className={`pill ${secondary.includes(m.key) ? 'accent' : ''}`} onClick={() => toggleMuscle(secondary, setSecondary, m.key)}>{m.label}</button>
            ))}
          </div>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={rehabSafe} onChange={(e) => setRehabSafe(e.target.checked)} />
          Bezpieczne w rehabilitacji / niski wpływ na stawy
        </label>
      </Modal>
    </div>
  );
}

// ─── ODCZUCIA ────────────────────────────────────────────────

interface FeelingsDraft {
  energyBefore: number; energyDuring: number; motivation: number; soreness: number;
  sleepHours: number; wellbeing: number; note: string; painPoints: PainPoint[];
}

function defaultFeelingsDraft(): FeelingsDraft {
  return { energyBefore: 3, energyDuring: 3, motivation: 3, soreness: 3, sleepHours: 7, wellbeing: 3, note: '', painPoints: [] };
}

function draftFromFeeling(f: FeelingEntry): FeelingsDraft {
  return {
    energyBefore: f.energyBefore, energyDuring: f.energyDuring, motivation: f.motivation, soreness: f.soreness,
    sleepHours: f.sleepHours, wellbeing: f.wellbeing, note: f.note ?? '', painPoints: f.painPoints,
  };
}

function feelingEntryFromDraft(session: WorkoutSession, draft: FeelingsDraft, status: FeelingStatus): Omit<FeelingEntry, 'id' | 'createdAt'> {
  return {
    sessionId: session.id, scheduledWorkoutId: session.scheduledWorkoutId,
    date: session.date, sportCategory: session.sportType, templateName: session.templateName,
    energyBefore: draft.energyBefore, energyDuring: draft.energyDuring, motivation: draft.motivation,
    soreness: draft.soreness, sleepHours: draft.sleepHours, wellbeing: draft.wellbeing,
    note: draft.note.trim() || undefined, painPoints: draft.painPoints, status,
  };
}

function Rating5Row({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            style={{
              width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${value === n ? 'var(--acc)' : 'var(--border)'}`,
              background: value === n ? 'var(--acc-soft)' : 'transparent',
              color: value === n ? 'var(--acc-ink)' : 'var(--ink-2)', fontWeight: 700, fontSize: 12.5,
            }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Compact, single-row-per-field post-session form — no Przed/Po toggle, matches the "fast to fill" requirement. */
function FeelingsForm({ value, onChange }: { value: FeelingsDraft; onChange: (v: FeelingsDraft) => void }) {
  function set<K extends keyof FeelingsDraft>(key: K, v: FeelingsDraft[K]) {
    onChange({ ...value, [key]: v });
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Rating5Row label="Energia przed treningiem" value={value.energyBefore} onChange={(v) => set('energyBefore', v)} />
      <Rating5Row label="Energia podczas treningu" value={value.energyDuring} onChange={(v) => set('energyDuring', v)} />
      <Rating5Row label="Motywacja" value={value.motivation} onChange={(v) => set('motivation', v)} />
      <Rating5Row label="Zakwasy" value={value.soreness} onChange={(v) => set('soreness', v)} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 0' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Sen (h)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="range" min={0} max={12} step={0.5} value={value.sleepHours} onChange={(e) => set('sleepHours', +e.target.value)} style={{ width: 130, accentColor: 'var(--acc)' }} />
          <input type="number" min={0} max={12} step={0.5} value={value.sleepHours} onChange={(e) => set('sleepHours', +e.target.value)} className="input" style={{ width: 56, padding: '4px 6px', fontSize: 12.5 }} />
        </div>
      </div>
      <Rating5Row label="Samopoczucie" value={value.wellbeing} onChange={(v) => set('wellbeing', v)} />
      <div style={{ marginTop: 10 }}>
        <Field label="Notatka (opcjonalnie)">
          <textarea className="input" rows={2} value={value.note} onChange={(e) => set('note', e.target.value)} placeholder="Coś więcej o sesji…" style={{ resize: 'none' }} />
        </Field>
      </div>
    </div>
  );
}

const QUICK_BODY_TAGS: { label: string; muscle: MuscleKey }[] = [
  { label: 'Łokieć', muscle: 'elbow' },
  { label: 'Kolano', muscle: 'knee' },
  { label: 'Bark', muscle: 'shoulder' },
  { label: 'Nadgarstek', muscle: 'wrist' },
  { label: 'Plecy', muscle: 'lower_back' },
  { label: 'Biodro', muscle: 'hip_flexors' },
  { label: 'Achilles', muscle: 'ankle' },
];

/** Bigger, search/quick-tag driven body map + an editable list of pain points (side, 0-10 intensity, note). */
function PainPointsEditor({ points, onChange }: { points: PainPoint[]; onChange: (p: PainPoint[]) => void }) {
  const [query, setQuery] = useState('');
  const matches = query.trim() ? MUSCLES.filter((m) => m.label.toLowerCase().includes(query.trim().toLowerCase())) : [];

  function addPoint(muscle: MuscleKey) {
    if (points.some((p) => p.muscle === muscle)) return;
    onChange([...points, { muscle, side: 'both', intensity: 5 }]);
    setQuery('');
  }
  function updatePoint(i: number, patch: Partial<PainPoint>) {
    onChange(points.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  }
  function removePoint(i: number) {
    onChange(points.filter((_, idx) => idx !== i));
  }
  function handleRegionClick(muscle: MuscleKey) {
    const i = points.findIndex((p) => p.muscle === muscle);
    if (i >= 0) removePoint(i); else addPoint(muscle);
  }

  const highlight: Partial<Record<MuscleKey, HighlightLevel>> = {};
  for (const p of points) highlight[p.muscle] = p.intensity >= 7 ? 'primary' : p.intensity >= 4 ? 'secondary' : 'stabilizer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Wpisz miejsce: łokieć, kolano, bark…" style={{ marginBottom: 8 }} />
        {matches.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {matches.map((m) => <button key={m.key} type="button" className="pill" onClick={() => addPoint(m.key)}>{m.label}</button>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_BODY_TAGS.map((t) => (
            <button key={t.muscle} type="button" className={`pill ${points.some((p) => p.muscle === t.muscle) ? 'accent' : ''}`} onClick={() => addPoint(t.muscle)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0' }}>
        <BodyMap highlight={highlight} onRegionClick={handleRegionClick} size={240} />
      </div>

      <div>
        <SectionHead title="Zaznaczone miejsca" />
        {points.length === 0 ? (
          <EmptyState title="Brak zaznaczonych miejsc" desc="Kliknij na mapie albo wyszukaj/wybierz część ciała powyżej." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {points.map((p, i) => (
              <div key={p.muscle} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-inset)', border: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 13, minWidth: 110 }}>{MUSCLE_LABEL[p.muscle]}</span>
                <select className="select" style={{ width: 100 }} value={p.side} onChange={(e) => updatePoint(i, { side: e.target.value as PainPoint['side'] })}>
                  <option value="left">Lewa</option><option value="right">Prawa</option><option value="both">Obie</option>
                </select>
                <input type="range" min={0} max={10} value={p.intensity} onChange={(e) => updatePoint(i, { intensity: +e.target.value })} style={{ width: 100, accentColor: 'var(--danger)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, width: 30 }}>{p.intensity}/10</span>
                <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="Notatka…" value={p.note ?? ''} onChange={(e) => updatePoint(i, { note: e.target.value })} />
                <button className="icon-btn" onClick={() => removePoint(i)} aria-label={`Usuń ${MUSCLE_LABEL[p.muscle]}`}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function sessionFeelingsLabel(session: WorkoutSession, feelings: FeelingEntry[]): string {
  const status = feelings.find((f) => f.sessionId === session.id)?.status;
  const mark = status === 'completed' ? '✓' : status === 'pending' ? '○' : status === 'skipped' ? '–' : '○';
  const date = new Date(session.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  return `${mark} ${date} · ${session.templateName ?? session.sportType}`;
}

function SportFeelings({ initialSessionId, onConsumeInitialSession }: { initialSessionId?: string | null; onConsumeInitialSession?: () => void }) {
  const { sessions, feelings, sportCategories, addFeeling, updateFeeling, deleteFeeling } = useLocalStore();
  const recentSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
  const categoryNames = [...sportCategories].sort((a, b) => a.order - b.order).map((c) => c.name);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessionId ?? recentSessions[0]?.id ?? null);
  const [editingFeelingId, setEditingFeelingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FeelingsDraft>(defaultFeelingsDraft());
  const [historyCategory, setHistoryCategory] = useState<string | 'Wszystko'>('Wszystko');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FeelingEntry | null>(null);

  function loadSession(sessionId: string | null) {
    setSelectedSessionId(sessionId);
    const existing = sessionId ? feelings.find((f) => f.sessionId === sessionId) ?? null : null;
    setDraft(existing ? draftFromFeeling(existing) : defaultFeelingsDraft());
    setEditingFeelingId(existing?.id ?? null);
  }

  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
      onConsumeInitialSession?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  function handleSave(status: FeelingStatus) {
    if (!selectedSession) return;
    const entry = feelingEntryFromDraft(selectedSession, draft, status);
    if (editingFeelingId) updateFeeling(editingFeelingId, entry);
    else addFeeling(entry);
  }

  function editEntry(f: FeelingEntry) {
    setSelectedSessionId(f.sessionId ?? null);
    setDraft(draftFromFeeling(f));
    setEditingFeelingId(f.id);
  }

  const filteredHistory = [...feelings]
    .filter((f) => historyCategory === 'Wszystko' || f.sportCategory === historyCategory)
    .filter((f) => !historyFrom || f.date >= historyFrom)
    .filter((f) => !historyTo || f.date <= historyTo)
    .sort((a, b) => b.date.localeCompare(a.date));

  const completed = feelings.filter((f) => f.status === 'completed');
  const avgEnergyDuring = avgFeeling(completed, 'energyDuring');
  const avgMotivation = avgFeeling(completed, 'motivation');
  const avgWellbeing = avgFeeling(completed, 'wellbeing');
  const avgSleep = avgFeeling(completed, 'sleepHours');
  const sorenessTrend = feelingTrend(completed, 'soreness');
  const topPainPoints = mostFrequentPainPoints(completed, 5);
  const tips = feelingTips(completed);
  const byCategory = new Map<string, number[]>();
  for (const f of completed) byCategory.set(f.sportCategory, [...(byCategory.get(f.sportCategory) ?? []), f.wellbeing]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Form */}
      <div className="card">
        <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="card-title">Odczucia po treningu</span>
          <select className="select" style={{ minWidth: 220 }} value={selectedSessionId ?? ''} onChange={(e) => loadSession(e.target.value || null)}>
            <option value="" disabled>Wybierz sesję…</option>
            {recentSessions.map((s) => <option key={s.id} value={s.id}>{sessionFeelingsLabel(s, feelings)}</option>)}
          </select>
        </div>
        {!selectedSession ? (
          <EmptyState title="Brak sesji" desc="Ukończ trening, aby dodać do niego odczucia." />
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
              {fmtDate(selectedSession.date)} · {selectedSession.templateName ?? selectedSession.sportType} · <SportBadge sport={selectedSession.sportType} />
            </div>
            <FeelingsForm value={draft} onChange={setDraft} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => loadSession(selectedSessionId)}>Anuluj</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSave('completed')}>Zapisz</button>
            </div>
          </>
        )}
      </div>

      {/* 2 + 3. Bigger body map + selected pain points list */}
      <div className="card">
        <div className="card-head"><span className="card-title">Mapa ciała — zaznacz ból / przeciążenie</span></div>
        <PainPointsEditor points={draft.painPoints} onChange={(p) => setDraft((d) => ({ ...d, painPoints: p }))} />
      </div>

      {/* 4. Trends — secondary, below the map */}
      <div className="card">
        <div className="card-head"><span className="card-title">Trendy i analiza</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          <StatBox label="Energia podczas (śr.)" value={avgEnergyDuring != null ? `${avgEnergyDuring.toFixed(1)}/5` : '–'} />
          <StatBox label="Motywacja (śr.)" value={avgMotivation != null ? `${avgMotivation.toFixed(1)}/5` : '–'} />
          <StatBox label="Samopoczucie (śr.)" value={avgWellbeing != null ? `${avgWellbeing.toFixed(1)}/5` : '–'} />
          <StatBox label="Sen (śr.)" value={avgSleep != null ? `${avgSleep.toFixed(1)} h` : '–'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 4 }}>Trend zakwasów</div>
            <LineChart points={sorenessTrend} color="var(--danger)" height={60} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>Najczęstsze miejsca bólu</div>
            {topPainPoints.length === 0 ? <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Brak danych.</span> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {topPainPoints.map((p) => (
                  <div key={p.muscle} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span>{MUSCLE_LABEL[p.muscle]}</span><span style={{ fontWeight: 700 }}>{p.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {byCategory.size > 1 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>Samopoczucie wg kategorii sportu</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...byCategory.entries()].map(([cat, values]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span>{cat}</span><span style={{ fontWeight: 700 }}>{(values.reduce((a, v) => a + v, 0) / values.length).toFixed(1)}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tips.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ink-2)', background: 'var(--surface-3)', borderRadius: 8, padding: '7px 10px' }}>
                <span style={{ flexShrink: 0 }}>💡</span>{tip}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History — edit/delete/filter */}
      <div className="card">
        <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="card-title">Historia odczuć</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select className="select" value={historyCategory} onChange={(e) => setHistoryCategory(e.target.value)}>
              <option value="Wszystko">Kategoria: wszystkie</option>
              {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input" type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} style={{ width: 140 }} />
            <input className="input" type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} style={{ width: 140 }} />
          </div>
        </div>
        {filteredHistory.length === 0 ? <EmptyState title="Brak wpisów" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredHistory.slice(0, 30).map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-inset)', border: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', minWidth: 70 }}>{new Date(f.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                <SportBadge sport={f.sportCategory} />
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 100 }}>{f.templateName ?? f.sportCategory}</span>
                <span className={`badge ${f.status === 'completed' ? 'badge-green' : f.status === 'pending' ? 'badge-gray' : ''}`}>
                  {f.status === 'completed' ? 'Uzupełnione' : f.status === 'pending' ? 'Do uzupełnienia' : 'Pominięte'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Samopoczucie {f.wellbeing}/5</span>
                <button className="btn btn-secondary btn-sm" onClick={() => editEntry(f)}>Edytuj</button>
                <button className="icon-btn" onClick={() => setDeleteTarget(f)} aria-label="Usuń wpis"><IcoTrash /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteFeeling(deleteTarget.id); setDeleteTarget(null); }} label="ten wpis odczuć" />
    </div>
  );
}
