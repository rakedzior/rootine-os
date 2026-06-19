import { useState, useEffect, useRef, useMemo } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, SectionHead, IcoTrash } from '@/components/common';
import { useLocalStore, type WorkoutTemplate, type WorkoutSet, type WorkoutSession, type SportExercise, type FeelingMode } from '@/store/localStore';
import { BodyMap } from '@/features/sport/BodyMap';
import {
  SPORTS, SPORT_KEYS, TEMPLATE_CATEGORIES, EQUIPMENT_OPTIONS, MUSCLES, MUSCLE_LABEL, DIFFICULTY_LABEL,
  EXERCISE_CATALOG, findExercise, type SportKey, type MuscleKey, type Difficulty,
} from '@/features/sport/catalog';
import {
  volFromSets, sessionVolume, sessionSetCount, filterBySport, weekSummary, templateMuscles, templateStats,
  computePRs, topExercisesByVolume, muscleSetCounts, streakDays, dailyBuckets, runningStats, weekOverWeek,
  byCategoryCount, mostFrequentExercises, generateInsights,
} from '@/features/sport/analytics';

const SPORT_TABS = [
  { id: 'dzisiaj',   label: 'Dzisiaj',       icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'szablony',  label: 'Szablony',      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'sesja',     label: 'Aktywna sesja', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: 'historia',  label: 'Historia',      icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
  { id: 'analiza',   label: 'Analiza',       icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'cwiczenia', label: 'Ćwiczenia',    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M3 12h4l2 6 4-12 2 6h4"/></svg> },
  { id: 'odczucia',  label: 'Odczucia',     icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
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
  const def = SPORTS.find((s) => s.key === sport);
  return <span className="badge badge-gray">{def?.emoji ?? '•'} {sport}</span>;
}

function plCount(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `1 ${one}`;
  if (n >= 2 && n <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}
function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() + (dow === 0 ? -6 : 1 - dow));
  return copy;
}

interface SportSelectorRowProps {
  active: SportKey | 'Wszystko';
  onSelect: (s: SportKey | 'Wszystko') => void;
  countLabel: (s: SportKey | 'Wszystko') => string;
  includeAll?: boolean;
}

function SportSelectorRow({ active, onSelect, countLabel, includeAll = true }: SportSelectorRowProps) {
  const items: { key: SportKey | 'Wszystko'; emoji: string; label: string }[] = [
    ...(includeAll ? [{ key: 'Wszystko' as const, emoji: '🗂️', label: 'Wszystko' }] : []),
    ...SPORTS.map((s) => ({ key: s.key, emoji: s.emoji, label: s.key })),
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
            <span style={{ fontSize: 24 }}>{it.emoji}</span>
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
  const [templatesSportFilter, setTemplatesSportFilter] = useState<SportKey | 'Wszystko'>('Wszystko');
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
      <div className="module-header">
        <span className="module-title">Sport</span>
        <SubTabs tabs={SPORT_TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'dzisiaj'   && <SportToday onStartSession={() => setTab('sesja')} onQuickAction={quickAction} />}
      {tab === 'szablony'  && <SportTemplates sportFilter={templatesSportFilter} onSportFilterChange={setTemplatesSportFilter} onStartTemplate={startFromTemplate} />}
      {tab === 'sesja'     && <SportActiveSession onSessionEnd={() => setTab('historia')} />}
      {tab === 'historia'  && <SportHistory onRepeat={() => setTab('sesja')} />}
      {tab === 'analiza'   && <SportAnalysis />}
      {tab === 'cwiczenia' && <SportExercises />}
      {tab === 'odczucia'  && <SportFeelings />}
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

function DayStateBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: 'var(--ink-2)' }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--acc)', borderRadius: 99 }} />
      </div>
    </div>
  );
}

function WeekStrip({ sessions, activeTemplates }: { sessions: WorkoutSession[]; activeTemplates: WorkoutTemplate[] }) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];
  const isCurrentWeek = toDateStr(weekStart) === toDateStr(startOfWeek(today));

  const monthFmt = (d: Date) => d.toLocaleDateString('pl-PL', { month: 'long' });
  const rangeLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()}–${weekEnd.getDate()} ${monthFmt(weekStart)} ${weekEnd.getFullYear()}`
    : `${weekStart.getDate()} ${monthFmt(weekStart)} – ${weekEnd.getDate()} ${monthFmt(weekEnd)} ${weekEnd.getFullYear()}`;

  return (
    <div className="card">
      <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="card-title">Podsumowanie tygodnia</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{rangeLabel}</span>
          <button className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Poprzedni tydzień">‹</button>
          {!isCurrentWeek && <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(startOfWeek(today))}>Dziś</button>}
          <button className="icon-btn" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Następny tydzień">›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {weekDays.map((date) => {
          const dateStr = toDateStr(date);
          const isToday = dateStr === todayStr;
          const session = sessions.find((s) => s.date === dateStr);
          const dayOffset = Math.round((date.getTime() - today.getTime()) / 86400000);
          const suggestion = !session && dayOffset >= 0 && activeTemplates.length > 0
            ? activeTemplates[((dayOffset % activeTemplates.length) + activeTemplates.length) % activeTemplates.length]
            : null;
          const isPastEmpty = !session && dayOffset < 0;
          return (
            <div key={dateStr} style={{
              borderRadius: 'var(--r-mid)', padding: '10px 8px', minHeight: 116,
              border: `1.5px solid ${isToday ? 'var(--acc)' : 'var(--border-soft)'}`,
              background: isToday ? 'var(--acc-soft)' : 'var(--surface-inset)',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 700 }}>
                  {date.toLocaleDateString('pl-PL', { weekday: 'short' })} {date.getDate()}
                </span>
                {isToday && <span className="badge badge-green" style={{ fontSize: 8 }}>Dziś</span>}
              </div>
              {session ? (
                <>
                  <span style={{ fontSize: 16 }}>{SPORTS.find((s) => s.key === session.sportType)?.emoji}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{session.templateName ?? session.sportType}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{session.sportType} · {session.duration ?? 0} min</div>
                  <span className="badge badge-green" style={{ marginTop: 'auto', alignSelf: 'flex-start', fontSize: 8.5 }}>✓ Zrobione</span>
                </>
              ) : suggestion ? (
                <>
                  <span style={{ fontSize: 16, opacity: .75 }}>{SPORTS.find((s) => s.key === suggestion.sportType)?.emoji}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25, color: 'var(--ink-2)' }}>{suggestion.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{suggestion.sportType} · {suggestion.estimatedDuration} min</div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink-4)' }}>
                  {isPastEmpty ? 'Odpoczynek' : '—'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekStatsRow({ sessions }: { sessions: WorkoutSession[] }) {
  const { current, deltaPct } = weekOverWeek(sessions);
  function deltaLabel(pct: number | null) {
    if (pct == null) return null;
    const up = pct >= 0;
    return <div style={{ fontSize: 10.5, color: up ? 'var(--success-ink)' : 'var(--danger-ink)', fontWeight: 700, marginTop: 2 }}>{up ? '▲' : '▼'} {Math.abs(pct)}% vs poprzedni tydzień</div>;
  }
  const boxes = [
    { label: 'Czas treningu', value: `${Math.floor(current.minutes / 60)} h ${current.minutes % 60} min`, delta: deltaPct.minutes },
    { label: 'Objętość', value: `${(current.volumeKg / 1000).toFixed(1)} t`, delta: deltaPct.volumeKg },
    { label: 'Treningi', value: `${current.count}`, delta: deltaPct.count },
    { label: 'Serii roboczych', value: `${current.sets}`, delta: deltaPct.sets },
  ];
  return (
    <div className="card">
      <div className="card-head"><span className="card-title">Statystyki tygodnia</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {boxes.map((b) => (
          <div key={b.label} style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{b.label}</div>
            <div style={{ fontWeight: 800, fontSize: 19, marginTop: 2 }}>{b.value}</div>
            {deltaLabel(b.delta)}
          </div>
        ))}
      </div>
    </div>
  );
}

function SportToday({ onStartSession, onQuickAction }: { onStartSession: () => void; onQuickAction: (tab: string, sport?: SportKey) => void }) {
  const { templates, sessions, feelings, startSession, repeatSession } = useLocalStore();
  const activeTemplates = templates.filter((t) => t.isActive);
  const [focusSport, setFocusSport] = useState<SportKey>(() => (activeTemplates[0]?.sportType as SportKey) ?? 'Siłownia');
  const sportTemplates = activeTemplates.filter((t) => t.sportType === focusSport);
  const [swapIdx, setSwapIdx] = useState(0);
  useEffect(() => { setSwapIdx(0); }, [focusSport]);
  const nextTemplate = sportTemplates.length > 0 ? sportTemplates[swapIdx % sportTemplates.length] : null;
  const lastSession = sessions[0];
  const week = weekSummary(sessions, SPORT_KEYS);
  const muscles = useMemo(() => templateMuscles(nextTemplate), [nextTemplate]);
  const lastFeeling = feelings[0];
  const stats = nextTemplate ? templateStats(nextTemplate) : null;
  const primaryMuscleKeys = Object.entries(muscles).filter(([, lvl]) => lvl === 'primary').map(([k]) => k as MuscleKey);

  function handleStart() {
    if (!nextTemplate) return;
    startSession({
      templateId: nextTemplate.id,
      templateName: nextTemplate.name,
      sportType: nextTemplate.sportType,
      currentExerciseIndex: 0,
      exercises: nextTemplate.exercises.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, completed: false })) })),
    });
    onStartSession();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SportSelectorRow
        active={focusSport}
        includeAll={false}
        onSelect={(s) => setFocusSport(s as SportKey)}
        countLabel={(s) => plCount(week.bySport[s as SportKey] ?? 0, 'trening', 'treningi', 'treningów') + ' w tym tygodniu'}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Dzisiejszy trening — duża karta */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Dzisiejszy trening</span>
          </div>
          {nextTemplate && stats ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--acc-soft)', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>
                  {SPORTS.find((s) => s.key === nextTemplate.sportType)?.emoji ?? '🏋️'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{nextTemplate.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{nextTemplate.sportType}{nextTemplate.level && ` · ${DIFFICULTY_LABEL[nextTemplate.level]}`}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                <StatBox label="Czas" value={`~${stats.duration} min`} />
                <StatBox label="Ćwiczenia" value={`${stats.exerciseCount}`} />
                <StatBox label="Serie robocze" value={`${stats.setCount}`} />
                <StatBox label="Objętość" value={stats.volumeKg > 0 ? `${(stats.volumeKg / 1000).toFixed(1)} t` : '–'} />
              </div>
              {nextTemplate.goal && <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 14 }}>{nextTemplate.goal}</p>}
              {primaryMuscleKeys.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', marginBottom: 8 }}>Główne partie mięśniowe</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {primaryMuscleKeys.map((m) => <span key={m} className="badge badge-green">💪 {MUSCLE_LABEL[m]}</span>)}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStart}>▶ Rozpocznij sesję</button>
                {sportTemplates.length > 1 && (
                  <button className="btn btn-secondary" onClick={() => setSwapIdx((i) => i + 1)}>⇄ Zamień</button>
                )}
              </div>
              {lastSession && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)' }}>
                  <span>Ostatnia: <strong style={{ color: 'var(--ink)' }}>{lastSession.templateName ?? lastSession.sportType}</strong> · {fmtDate(lastSession.date)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { repeatSession(lastSession.id); onStartSession(); }}>Powtórz</button>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="Brak aktywnego szablonu" desc={`Dodaj szablon dla: ${focusSport}.`} cta="Dodaj szablon" onCta={() => onQuickAction('szablony', focusSport)} />
          )}
        </div>

        {/* Co dziś pracuje */}
        <div className="card">
          <div className="card-head"><span className="card-title">Co dziś pracuje?</span></div>
          {Object.keys(muscles).length > 0 ? (
            <>
              <BodyMap highlight={muscles} />
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-3)' }}>
                <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc)', marginRight: 4 }} />Główne</span>
                <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc-b)', marginRight: 4 }} />Pomocnicze</span>
                <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--ink-4)', marginRight: 4 }} />Stabilizatory</span>
              </div>
            </>
          ) : (
            <EmptyState title="Brak danych o partiach" desc="Ten szablon nie ma jeszcze ćwiczeń z bazy." />
          )}
        </div>

        {/* Aktywności w tygodniu + Stan dnia */}
        <div className="card">
          <div className="card-head"><span className="card-title">Aktywności w tygodniu</span></div>
          <div style={{ marginBottom: 12 }}>
            {SPORT_KEYS.map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
                <span style={{ flex: 1, color: 'var(--ink-2)' }}>{s}</span>
                <span style={{ fontWeight: 700 }}>{week.bySport[s] ?? 0}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 0, marginBottom: 14 }} onClick={() => onQuickAction('analiza')}>Zobacz analizę →</button>

          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Stan dnia</div>
            {lastFeeling ? (
              <>
                <DayStateBar label="Energia" value={lastFeeling.energy} max={5} />
                <DayStateBar label="Gotowość" value={lastFeeling.readiness} />
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>Ostatni wpis: {fmtDate(lastFeeling.date)}</div>
              </>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickAction('odczucia')}>+ Dodaj odczucia</button>
            )}
          </div>
        </div>
      </div>

      <WeekStrip sessions={sessions} activeTemplates={activeTemplates} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 16 }}>
        <WeekStatsRow sessions={sessions} />
        <div className="card">
          <div className="card-head"><span className="card-title">Trend objętości</span></div>
          <VolumeChart sessions={filterBySport(sessions, focusSport)} />
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="card">
        <div className="card-head"><span className="card-title">Szybkie akcje</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => onQuickAction('szablony')}>+ Dodaj trening</button>
          <button className="btn btn-secondary" onClick={() => onQuickAction('odczucia')}>+ Dodaj odczucia</button>
          <button className="btn btn-secondary" onClick={() => onQuickAction('szablony', 'Mobilność')}>+ Dodaj mobilność</button>
          <button className="btn btn-secondary" onClick={() => onQuickAction('szablony', 'Rehabilitacja')}>+ Dodaj rehabilitację</button>
        </div>
      </div>
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

function SportTemplates({ sportFilter, onSportFilterChange, onStartTemplate }: { sportFilter: SportKey | 'Wszystko'; onSportFilterChange: (s: SportKey | 'Wszystko') => void; onStartTemplate: (t: WorkoutTemplate) => void }) {
  const { templates, addTemplate, updateTemplate, deleteTemplate, exercises } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TemplateFilters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<TemplateSort>('recent');
  const editingTemplate = templates.find(t => t.id === editId);

  const categories = sportFilter === 'Wszystko' ? Object.values(TEMPLATE_CATEGORIES).flat() : TEMPLATE_CATEGORIES[sportFilter];
  const countForSport = (s: SportKey | 'Wszystko') => templates.filter((t) => s === 'Wszystko' || t.sportType === s).length;

  const filtered = templates.filter((t) => {
    if (sportFilter !== 'Wszystko' && t.sportType !== sportFilter) return false;
    if (query.trim() && !t.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (filters.category !== 'any' && t.category !== filters.category) return false;
    if (filters.level !== 'any' && t.level !== filters.level) return false;
    if (filters.duration !== 'any' && durationBucket(t.estimatedDuration) !== filters.duration) return false;
    if (filters.equipment !== 'any' && !(t.equipmentTags ?? []).includes(filters.equipment)) return false;
    if (filters.muscle !== 'any') {
      const tplMuscles = templateMuscles(t);
      if (!tplMuscles[filters.muscle]) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'duration') return a.estimatedDuration - b.estimatedDuration;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SportSelectorRow
        active={sportFilter}
        onSelect={(s) => { onSportFilterChange(s); setFilters(DEFAULT_FILTERS); }}
        countLabel={(s) => plCount(countForSport(s), 'szablon', 'szablony', 'szablonów')}
      />

      <div className="card">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select className="select" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="any">Kategoria: wszystkie</option>
            {[...new Set(categories)].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value as Difficulty | 'any' }))}>
            <option value="any">Poziom: wszystkie</option>
            {(['beginner', 'intermediate', 'advanced'] as const).map((l) => <option key={l} value={l}>{DIFFICULTY_LABEL[l]}</option>)}
          </select>
          <select className="select" value={filters.duration} onChange={(e) => setFilters((f) => ({ ...f, duration: e.target.value as TemplateFilters['duration'] }))}>
            <option value="any">Czas: wszystkie</option>
            <option value="short">&lt; 30 min</option>
            <option value="mid">30–60 min</option>
            <option value="long">&gt; 60 min</option>
          </select>
          <select className="select" value={filters.equipment} onChange={(e) => setFilters((f) => ({ ...f, equipment: e.target.value }))}>
            <option value="any">Sprzęt: wszystkie</option>
            {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
          </select>
          <select className="select" value={filters.muscle} onChange={(e) => setFilters((f) => ({ ...f, muscle: e.target.value as MuscleKey | 'any' }))}>
            <option value="any">Partia: wszystkie</option>
            {MUSCLES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 280px', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Szablony</span></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input className="input" placeholder="Szukaj szablonu…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowy</button>
          </div>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as TemplateSort)} style={{ width: '100%', marginBottom: 10 }}>
            <option value="recent">Sortuj: Ostatnio używane</option>
            <option value="name">Sortuj: Nazwa A–Z</option>
            <option value="duration">Sortuj: Czas trwania</option>
          </select>
          {filtered.length === 0
            ? <EmptyState title="Brak szablonów" desc="Zmień filtry albo dodaj nowy szablon." cta="Dodaj szablon" onCta={() => setShowAdd(true)} />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{filtered.map(t => (
              <div key={t.id}
                className="template-row"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${editId===t.id ? 'var(--acc-line)' : 'transparent'}`, background: editId===t.id ? 'var(--acc-soft)' : 'var(--surface-inset)' }}
                onClick={() => setEditId(t.id)}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 17, flexShrink: 0 }}>
                  {SPORTS.find((s) => s.key === t.sportType)?.emoji ?? '🏋️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {t.sportType} · ~{t.estimatedDuration} min · {t.exercises.length} ćw.
                  </div>
                </div>
                {t.isActive && <span className="badge badge-green" style={{ fontSize: 8.5, flexShrink: 0 }}>AKTYWNY</span>}
                <button className="icon-btn" onClick={e => { e.stopPropagation(); setDeleteId(t.id); }}><IcoTrash /></button>
              </div>
            ))}</div>
          }
        </div>

        {editingTemplate
          ? <TemplateDetail template={editingTemplate} catalogExercises={exercises} onUpdate={p => updateTemplate(editingTemplate.id, p)} onStart={() => onStartTemplate(editingTemplate)} />
          : <div className="card" style={{ gridColumn: '2 / 4', display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 }}>
              <EmptyState title="Wybierz szablon" desc="Kliknij szablon po lewej." />
            </div>
        }
      </div>

      <AddTemplateModal open={showAdd} onClose={() => setShowAdd(false)} defaultSport={sportFilter === 'Wszystko' ? 'Siłownia' : sportFilter}
        onSave={data => { addTemplate(data); setShowAdd(false); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTemplate(deleteId!); setEditId(null); setDeleteId(null); }} label="ten szablon" />
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

function TemplateDetail({ template, catalogExercises, onUpdate, onStart }: { template: WorkoutTemplate; catalogExercises: SportExercise[]; onUpdate: (p: Partial<WorkoutTemplate>) => void; onStart: () => void }) {
  const [pickerId, setPickerId] = useState('');
  const muscles = templateMuscles(template);
  const stats = templateStats(template);
  const sportExercises = EXERCISE_CATALOG.filter((e) => e.sport === template.sportType);

  function addExerciseToTemplate() {
    const def = findExercise(pickerId) ?? catalogExercises.find((e) => e.id === pickerId);
    if (!def) return;
    const exerciseName = 'name' in def ? def.name : '';
    onUpdate({
      exercises: [...template.exercises, {
        exerciseId: pickerId, exerciseName,
        sets: [
          { setNumber: 1, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' },
          { setNumber: 2, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' },
          { setNumber: 3, reps: 10, weight: 0, restTime: 90, rir: 2, completed: false, notes: '' },
        ],
      }],
    });
    setPickerId('');
  }

  function removeExercise(exerciseId: string) {
    onUpdate({ exercises: template.exercises.filter((e) => e.exerciseId !== exerciseId) });
  }

  return (
    <>
      <div className="card">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--acc-soft)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>
              {SPORTS.find((s) => s.key === template.sportType)?.emoji ?? '🏋️'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize:17, fontWeight:700 }}>{template.name}</h2>
                {template.isActive && <span className="badge badge-green" style={{ fontSize: 8.5 }}>AKTYWNY</span>}
              </div>
              <div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:2 }}>{template.sportType} · ~{template.estimatedDuration} min · {template.exercises.length} ćwiczeń</div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onStart}>▶ Użyj szablonu</button>
        </div>

        {template.goal && <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 12 }}>{template.goal}</p>}
        {template.description && <p style={{ fontSize:13, color:'var(--ink-2)', marginBottom:12 }}>{template.description}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <StatBox label="Czas" value={`~${stats.duration} min`} />
          <StatBox label="Serii roboczych" value={`${stats.setCount}`} />
          <StatBox label="Objętość" value={stats.volumeKg > 0 ? `${(stats.volumeKg / 1000).toFixed(1)} t` : '–'} />
          <StatBox label="Poziom" value={template.level ? DIFFICULTY_LABEL[template.level] : '–'} />
        </div>

        <SectionHead title={`Ćwiczenia (${template.exercises.length})`} />
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {template.exercises.map((ex, i) => (
            <div key={ex.exerciseId} style={{ background:'var(--surface-3)', borderRadius:10, padding:'10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight:600, fontSize:13.5 }}>{ex.exerciseName}</div>
                <div style={{ fontSize:11.5, color:'var(--ink-3)' }}>
                  {ex.sets.length} serii · {ex.sets[0]?.reps} pow. · {ex.sets[0]?.weight > 0 ? `${ex.sets[0].weight} kg` : 'masa ciała'}
                </div>
              </div>
              <button className="icon-btn" onClick={() => removeExercise(ex.exerciseId)}><IcoTrash /></button>
            </div>
          ))}
          {template.exercises.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Ten szablon nie ma jeszcze ćwiczeń.</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select className="select" style={{ flex: 1 }} value={pickerId} onChange={(e) => setPickerId(e.target.value)}>
            <option value="">Wybierz ćwiczenie z bazy…</option>
            {sportExercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" disabled={!pickerId} onClick={addExerciseToTemplate}>+ Dodaj</button>
        </div>

        <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => onUpdate({ isActive: !template.isActive })}>
          {template.isActive ? 'Dezaktywuj szablon' : 'Aktywuj szablon'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Partie mięśniowe</span></div>
          <BodyMap highlight={muscles} size={64} compact />
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Informacje</span></div>
          <InfoRow label="Sprzęt" value={(template.equipmentTags ?? []).join(', ') || '—'} />
          <InfoRow label="Cel" value={template.goal || '—'} />
          <InfoRow label="Poziom" value={template.level ? DIFFICULTY_LABEL[template.level] : '—'} />
          <InfoRow label="Ostatnio aktualizowany" value={fmtDate(template.updatedAt)} />
        </div>
      </div>
    </>
  );
}

function AddTemplateModal({ open, onClose, defaultSport, onSave }: { open: boolean; onClose: () => void; defaultSport: SportKey; onSave: (t: Omit<WorkoutTemplate,'id'|'createdAt'|'updatedAt'>) => void }) {
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState<SportKey>(defaultSport);
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[defaultSport][0]);
  const [level, setLevel] = useState<Difficulty>('intermediate');
  const [goal, setGoal] = useState('');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState(60);
  const [equipmentTags, setEquipmentTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) { setSportType(defaultSport); setCategory(TEMPLATE_CATEGORIES[defaultSport][0]); }
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
          onSave({ name, sportType, description: desc, estimatedDuration: duration, exercises: [], isActive: true, category, level, goal, equipmentTags });
          setName(''); setDesc(''); setGoal(''); setEquipmentTags([]);
        }}>Zapisz</button>
      </>}>
      <Field label="Nazwa" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Push A — Klatka" /></Field>
      <div className="form-grid">
        <Field label="Sport"><select className="select" value={sportType} onChange={e => { const s = e.target.value as SportKey; setSportType(s); setCategory(TEMPLATE_CATEGORIES[s][0]); }}>
          {SPORTS.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.key}</option>)}
        </select></Field>
        <Field label="Kategoria"><select className="select" value={category} onChange={e => setCategory(e.target.value)}>
          {TEMPLATE_CATEGORIES[sportType].map(c => <option key={c}>{c}</option>)}
        </select></Field>
      </div>
      <div className="form-grid">
        <Field label="Poziom"><select className="select" value={level} onChange={e => setLevel(e.target.value as Difficulty)}>
          {(['beginner', 'intermediate', 'advanced'] as const).map(l => <option key={l} value={l}>{DIFFICULTY_LABEL[l]}</option>)}
        </select></Field>
        <Field label={`Czas: ${duration} min`}><input type="range" min={15} max={180} step={5} value={duration} onChange={e => setDuration(+e.target.value)} style={{ width:'100%' }} /></Field>
      </div>
      <Field label="Cel treningu"><input className="input" value={goal} onChange={e => setGoal(e.target.value)} placeholder="Np. Hipertrofia klatki i barków" /></Field>
      <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
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
  const { activeSession, updateActiveSession, completeSession, cancelSession } = useLocalStore();
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPain, setCompletionPain] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

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

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'start' }}>
      <div className="col">
        {/* Header */}
        <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>{SPORTS.find((s) => s.key === sportType)?.emoji ?? '🏋️'}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{templateName}</div>
              <div style={{ fontSize:12, color:'var(--ink-3)' }}>{sportType}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:22 }}>{fmtTime(elapsed)}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)' }}>Czas trwania</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setShowComplete(true)}>● ZAKOŃCZ</button>
          </div>
        </div>

        {/* Exercise tabs */}
        <div className="card" style={{ padding:'12px 16px' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {exercises.map((ex, i) => {
              const done = ex.sets.every(s => s.completed);
              return (
                <button key={ex.exerciseId}
                  onClick={() => updateActiveSession({ currentExerciseIndex: i })}
                  style={{ padding:'5px 12px', borderRadius:99, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                    background: i===currentExerciseIndex ? 'var(--acc)' : done ? 'var(--acc-soft)' : 'var(--surface-3)',
                    color: i===currentExerciseIndex ? 'var(--on-acc)' : done ? 'var(--acc-ink)' : 'var(--ink-2)' }}>
                  {i+1}. {ex.exerciseName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sets table */}
        {currentEx && (
          <div className="card">
            <div style={{ fontWeight:700, fontSize:16, marginBottom:14 }}>{currentEx.exerciseName}</div>
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
          </div>
        )}
      </div>

      {/* Rest timer sidebar */}
      <div className="col">
        <div className="card" style={{ textAlign:'center', padding:24 }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--ink-3)', marginBottom:12 }}>Timer odpoczynku</div>
          <div style={{ fontFamily:'var(--mono)', fontWeight:800, fontSize:48, letterSpacing:-2, lineHeight:1 }}>{fmtTime(timerSec)}</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:14 }}>
            {timerRunning
              ? <button className="btn btn-secondary" onClick={() => setTimerRunning(false)}>⏸ Pauza</button>
              : <button className="btn btn-primary" onClick={() => setTimerRunning(true)}>▶ Start</button>}
            <button className="btn btn-ghost" onClick={() => { setTimerSec(0); setTimerRunning(false); }}>Reset</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:12 }}>
            {[30,60,90,120,150,180].map(s => (
              <button key={s} className="btn btn-secondary btn-sm" onClick={() => { setTimerSec(s); setTimerRunning(true); }}>
                {s<60?`${s}s`:`${s/60}min`}
              </button>
            ))}
          </div>
        </div>
        {exercises[currentExerciseIndex+1] && (
          <div className="card">
            <div style={{ fontSize:12, color:'var(--ink-3)', marginBottom:4 }}>Następne ćwiczenie</div>
            <div style={{ fontWeight:600 }}>{exercises[currentExerciseIndex+1].exerciseName}</div>
          </div>
        )}
      </div>

      {/* Complete modal */}
      <Modal open={showComplete} onClose={() => setShowComplete(false)} title="Zakończ trening"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowComplete(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => { completeSession(completionNotes, completionPain); onSessionEnd(); }}>Zakończ i zapisz</button>
        </>}>
        <div style={{ background:'var(--surface-3)', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, textAlign:'center' }}>
            <div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Czas</div><div style={{ fontWeight:700 }}>{fmtTime(elapsed)}</div></div>
            <div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Serie</div><div style={{ fontWeight:700 }}>{exercises.reduce((a,e)=>a+e.sets.filter(s=>s.completed).length,0)}</div></div>
            <div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Objętość</div><div style={{ fontWeight:700 }}>{(exercises.reduce((a,e)=>a+volFromSets(e.sets),0)/1000).toFixed(1)}t</div></div>
          </div>
        </div>
        <Field label="Komentarz"><textarea className="textarea" value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} rows={2} /></Field>
        <Field label={`Ból po treningu: ${completionPain}/10`}><input type="range" min={0} max={10} value={completionPain} onChange={e => setCompletionPain(+e.target.value)} style={{ width:'100%' }} /></Field>
        <button className="btn btn-ghost btn-sm" onClick={() => { cancelSession(); onSessionEnd(); }} style={{ color:'var(--p-high)', marginTop:4 }}>
          Porzuć bez zapisywania
        </button>
      </Modal>
    </div>
  );
}

// ─── HISTORIA ─────────────────────────────────────────────────

function SportHistory({ onRepeat }: { onRepeat: () => void }) {
  const { sessions, repeatSession } = useLocalStore();
  if (!sessions || sessions.length === 0) return <EmptyState title="Brak historii treningów" desc="Ukończ pierwszą sesję, aby zobaczyć historię." />;

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map((s: WorkoutSession) => (
        <SessionCard key={s.id} session={s} onRepeat={() => { repeatSession(s.id); onRepeat(); }} />
      ))}
    </div>
  );
}

function SessionCard({ session, onRepeat }: { session: WorkoutSession; onRepeat: () => void }) {
  const totalVol = sessionVolume(session);
  const totalSets = sessionSetCount(session);
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{session.templateName}</span>
            <SportBadge sport={session.sportType} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{new Date(session.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ink-3)' }}>
          {session.duration && <span>⏱ {session.duration} min</span>}
          {session.distanceKm != null && <span>📏 {session.distanceKm} km</span>}
          {totalSets > 0 && <span>📦 {totalSets} serii</span>}
          {totalVol > 0 && <span>💪 {totalVol.toLocaleString('pl-PL')} kg obj.</span>}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRepeat}>Powtórz</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {session.exercises.map(ex => (
          <span key={ex.exerciseId} style={{ fontSize: 12, padding: '3px 8px', background: 'var(--surface-3)', borderRadius: 6 }}>{ex.exerciseName}</span>
        ))}
      </div>
      {session.notesAfterTraining && <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, fontStyle: 'italic' }}>"{session.notesAfterTraining}"</div>}
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

function SportAnalysis() {
  const { sessions, feelings, templates } = useLocalStore();
  const [sport, setSport] = useState<SportKey | 'Wszystko'>('Wszystko');
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);

  const scoped = filterBySport(sessions, sport);
  const windowed = scoped.filter((s) => (Date.now() - new Date(s.date).getTime()) / 86400000 <= windowDays);
  const insights = generateInsights(sessions, feelings, SPORT_KEYS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className={`pill ${sport === 'Wszystko' ? 'accent' : ''}`} onClick={() => setSport('Wszystko')}>Wszystko</button>
            {SPORTS.map((s) => (
              <button key={s.key} className={`pill ${sport === s.key ? 'accent' : ''}`} onClick={() => setSport(s.key)}>{s.emoji} {s.key}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([7, 30, 90] as const).map((d) => (
              <button key={d} className={`pill ${windowDays === d ? 'accent' : ''}`} onClick={() => setWindowDays(d)}>{d} dni</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Wnioski</span></div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {insights.map((line, i) => <li key={i} style={{ fontSize: 13, color: 'var(--ink-2)' }}>{line}</li>)}
        </ul>
      </div>

      {(sport === 'Wszystko' || sport === 'Siłownia') && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-head"><span className="card-title">Objętość (ostatnie 8 treningów)</span></div>
              <VolumeChart sessions={sport === 'Wszystko' ? sessions.filter((s) => s.sportType === 'Siłownia') : scoped} />
            </div>
            <div className="card">
              <div className="card-head"><span className="card-title">Balans partii mięśniowych</span></div>
              <MuscleBalanceBars sessions={windowed.filter((s) => s.sportType === 'Siłownia' || sport === 'Siłownia')} />
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

function SportExercises() {
  const { exercises, addExercise } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [sportFilter, setSportFilter] = useState<SportKey | 'Wszystko'>('Wszystko');
  const [muscleFilter, setMuscleFilter] = useState<MuscleKey | 'any'>('any');
  const [query, setQuery] = useState('');

  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportKey>('Siłownia');
  const [primary, setPrimary] = useState<MuscleKey[]>([]);
  const [secondary, setSecondary] = useState<MuscleKey[]>([]);
  const [equipment, setEquipment] = useState('Sztanga');
  const [rehabSafe, setRehabSafe] = useState(false);

  const filtered = exercises.filter((ex) => {
    if (sportFilter !== 'Wszystko' && ex.sportType !== sportFilter) return false;
    if (muscleFilter !== 'any' && !(ex.primaryMuscles ?? []).includes(muscleFilter) && !(ex.secondaryMuscles ?? []).includes(muscleFilter)) return false;
    if (query.trim() && !ex.name.toLowerCase().includes(query.trim().toLowerCase()) && !(ex.aliases ?? []).some((a) => a.toLowerCase().includes(query.trim().toLowerCase()))) return false;
    return true;
  });

  function toggleMuscle(list: MuscleKey[], setList: (v: MuscleKey[]) => void, key: MuscleKey) {
    setList(list.includes(key) ? list.filter((m) => m !== key) : [...list, key]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button className={`pill ${sportFilter === 'Wszystko' ? 'accent' : ''}`} onClick={() => setSportFilter('Wszystko')}>Wszystko</button>
          {SPORTS.map((s) => (
            <button key={s.key} className={`pill ${sportFilter === s.key ? 'accent' : ''}`} onClick={() => setSportFilter(s.key)}>{s.emoji} {s.key}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Szukaj nazwy lub aliasu…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select className="select" value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value as MuscleKey | 'any')}>
            <option value="any">Partia: wszystkie</option>
            {MUSCLES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Baza ćwiczeń ({filtered.length}/{exercises.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowe ćwiczenie</button>
        </div>
        <table className="table">
          <thead><tr><th>NAZWA</th><th>SPORT</th><th>GŁÓWNE PARTIE</th><th>POMOCNICZE</th><th>SPRZĘT</th><th>REHAB</th></tr></thead>
          <tbody>
            {filtered.map(ex => (
              <tr key={ex.id}>
                <td style={{ fontWeight: 600 }}>{ex.name}</td>
                <td><span className="badge badge-gray">{ex.sportType}</span></td>
                <td>{(ex.primaryMuscles ?? []).map((m) => <span key={m} className="badge badge-green" style={{ marginRight: 4 }}>{MUSCLE_LABEL[m]}</span>)}
                  {(ex.primaryMuscles ?? []).length === 0 && <span style={{ color: 'var(--ink-3)' }}>{ex.muscleGroup}</span>}</td>
                <td>{(ex.secondaryMuscles ?? []).map((m) => <span key={m} className="tag" style={{ marginRight: 4 }}>{MUSCLE_LABEL[m]}</span>)}</td>
                <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{ex.equipment}</td>
                <td>{ex.rehabSafe && <span className="badge badge-blue">Bezpieczne</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="Brak wyników" desc="Zmień filtry wyszukiwania." />}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowe ćwiczenie" size="lg"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim() || primary.length === 0) return;
            addExercise({
              name, sportType: sport, muscleGroup: MUSCLE_LABEL[primary[0]], equipment, notes: '',
              category: TEMPLATE_CATEGORIES[sport][0], equipmentTags: [equipment], difficulty: 'intermediate',
              movementPattern: '', primaryMuscles: primary, secondaryMuscles: secondary, stabilizerMuscles: [],
              instructions: '', tips: '', contraindications: '', rehabSafe, tags: [],
            });
            setName(''); setPrimary([]); setSecondary([]); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa ćwiczenia" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Wyciskanie sztangi" /></Field>
        <div className="form-grid">
          <Field label="Sport"><select className="select" value={sport} onChange={e => setSport(e.target.value as SportKey)}>{SPORTS.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.key}</option>)}</select></Field>
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

const MOODS = ['😴','😓','😐','🙂','💪','🔥'];

function FeelingSlider({ label, value, onChange, max = 10 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: '100%', accentColor: 'var(--acc)' }} />
    </div>
  );
}

function SportFeelings() {
  const { sessions, feelings, addFeeling } = useLocalStore();
  const [mode, setMode] = useState<FeelingMode>('post');
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [pain, setPain] = useState(0);
  const [stiffness, setStiffness] = useState(0);
  const [recovery, setRecovery] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(3);
  const [readiness, setReadiness] = useState(7);
  const [note, setNote] = useState('');
  const [painMap, setPainMap] = useState<Partial<Record<MuscleKey, number>>>({});
  const [saved, setSaved] = useState(false);

  const recent = [...feelings].slice(0, 8);
  const trainingDates = new Set(sessions.map((s) => s.date));
  const avgEnergyTrainingDays = avg(feelings.filter((f) => trainingDates.has(f.date)).map((f) => f.energy));
  const avgEnergyRestDays = avg(feelings.filter((f) => !trainingDates.has(f.date)).map((f) => f.energy));

  function avg(arr: number[]): number | null {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  }

  function cyclePain(key: MuscleKey) {
    setPainMap((prev) => {
      const current = prev[key] ?? 0;
      const next = current >= 5 ? 0 : current + 1;
      const copy = { ...prev };
      if (next === 0) delete copy[key]; else copy[key] = next;
      return copy;
    });
  }

  function handleSave() {
    addFeeling({
      date: new Date().toISOString().split('T')[0], mode,
      mood, energy, motivation, pain, stiffness, recovery, sleep, stress, readiness, note, painMap,
    });
    setSaved(true);
    setNote(''); setPainMap({});
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Check-in organizmu</span>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-3)', padding: 3, borderRadius: 10 }}>
            {(['pre', 'post'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={m === mode ? 'pill accent' : 'pill'} style={{ border: 0 }}>
                {m === 'pre' ? 'Przed treningiem' : 'Po treningu'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Samopoczucie</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {MOODS.map((m, i) => (
              <button key={i} onClick={() => setMood(i)}
                style={{ fontSize: 24, padding: '7px 11px', borderRadius: 12, border: `2px solid ${mood === i ? 'var(--acc)' : 'var(--border)'}`, background: mood === i ? 'var(--acc-soft)' : 'transparent', cursor: 'pointer', transition: '.14s' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <FeelingSlider label="Energia" value={energy} onChange={setEnergy} max={5} />
          <FeelingSlider label="Motywacja" value={motivation} onChange={setMotivation} max={5} />
          <FeelingSlider label="Ból" value={pain} onChange={setPain} />
          <FeelingSlider label="Sztywność" value={stiffness} onChange={setStiffness} />
          <FeelingSlider label="Regeneracja" value={recovery} onChange={setRecovery} />
          <FeelingSlider label="Sen" value={sleep} onChange={setSleep} />
          <FeelingSlider label="Stres" value={stress} onChange={setStress} />
          <FeelingSlider label="Gotowość do treningu" value={readiness} onChange={setReadiness} />
        </div>

        <Field label="Notatka">
          <textarea className="input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Jak się czujesz? Czy coś boli?" style={{ resize: 'none', lineHeight: 1.6 }} />
        </Field>
        <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%', marginTop: 8 }}>
          {saved ? '✓ Zapisano' : 'Zapisz check-in'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Mapa bólu</span></div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8 }}>Kliknij obszar, by zwiększyć natężenie (0–5)</div>
          <BodyMap painMap={painMap} onRegionClick={cyclePain} size={84} />
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Historia odczuć</span></div>
          {recent.length === 0 ? <EmptyState title="Brak wpisów" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ fontSize: 20 }}>{MOODS[f.mood]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{f.mode === 'pre' ? 'Przed' : 'Po'} · {fmtDate(f.date)}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Energia {f.energy}/5 · Ból {f.pain}/10 · Gotowość {f.readiness}/10</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {avgEnergyTrainingDays != null && avgEnergyRestDays != null && (
          <div className="card">
            <div className="card-head"><span className="card-title">Korelacja z aktywnością</span></div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              Średnia energia w dni treningowe: <strong>{avgEnergyTrainingDays.toFixed(1)}/5</strong><br />
              Średnia energia w dni odpoczynku: <strong>{avgEnergyRestDays.toFixed(1)}/5</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
