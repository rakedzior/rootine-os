import { useEffect, useMemo, useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import { TaskList } from '@/features/tasks/TaskList';
import { HabitList } from '@/features/habits/HabitList';
import { FinancePulse } from '@/features/finance/FinancePulse';
import { GoalProgress } from '@/features/goals/GoalProgress';
import { useTasks } from '@/features/tasks/hooks';
import { useHabits } from '@/features/habits/hooks';
import { useTodayMealItems, useNutritionToday } from '@/features/diet/hooks';
import { useCalendarEvents } from '@/features/integrations/hooks';
import type { CalendarEvent } from '@/features/integrations/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function StartScreen() {
  const showWeather = useIsFeatureVisible('start.weather_time');
  const showFinance = useIsFeatureVisible('start.finance_pulse');
  const showNutrition = useIsFeatureVisible('start.nutrition_summary');
  const showTasks = useIsFeatureVisible('start.today_tasks');
  const showCalendar = useIsFeatureVisible('start.calendar');
  const showHabits = useIsFeatureVisible('start.habits');
  const showWorkout = useIsFeatureVisible('start.today_workout');
  const showGoals = useIsFeatureVisible('start.goal_progress');

  const tasksQ = useTasks();
  const habitsQ = useHabits();
  const tasksToDo = (tasksQ.data ?? []).filter((t) => !t.done).length;
  const habitCount = (habitsQ.data ?? []).length;

  return (
    <main className="grid">
      {/* ---------- LEFT RAIL ---------- */}
      <section className="col">
        {showWeather && <WeatherCard />}
        {showFinance && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Puls finansów</span></div>
            </div>
            <FinancePulse />
          </article>
        )}
        {showNutrition && <NutritionSummaryCard />}
      </section>

      {/* ---------- CENTER ---------- */}
      <section className="col">
        {showTasks && (
          <article className="card today-card">
            <div className="today-layout">
              <div className="today-main">
                <div className="today-hd">
                  <div className="today-hd-l">
                    <span className="today-title">DZISIAJ</span>
                    <span className="today-sub">{cap(new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()))}</span>
                  </div>
                </div>
                <div className="today-stats">
                  <div className="ts-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    <div className="ts-body"><span className="ts-n tnum">{tasksToDo}</span><span className="ts-lbl">zadań do zrobienia</span></div>
                  </div>
                  <div className="ts-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                    <div className="ts-body"><span className="ts-n tnum">{habitCount}</span><span className="ts-lbl">nawyki</span></div>
                  </div>
                  <div className="ts-cell">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <div className="ts-body"><span className="ts-n tnum">0</span><span className="ts-lbl">wydarzenia dzisiaj</span></div>
                  </div>
                </div>
                <TaskList />
              </div>

              <div className="today-aside">
                <div className="ta-block">
                  <div className="ta-head">Następnie</div>
                  <div className="ta-next">
                    <div className="ta-evname" style={{ color: 'var(--ink-3)' }}>Brak nadchodzących wydarzeń</div>
                    <div className="diet-hint">Połącz Google Calendar w Ustawienia → Integracje</div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {showCalendar && <MonthCalendar />}
      </section>

      {/* ---------- RIGHT RAIL ---------- */}
      <section className="col">
        {showHabits && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Nawyki i rutyny</span></div>
            </div>
            <HabitList />
          </article>
        )}

        {showWorkout && <TodayWorkoutCard />}

        {showGoals && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Postępy w celach</span></div>
            </div>
            <GoalProgress />
          </article>
        )}
      </section>
    </main>
  );
}

function WeatherCard() {
  const now = useClock();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const dateStr = cap(new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(now));
  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Pogoda i czas</span></div>
        <span className="pill accent"><span className="led" />Kraków</span>
      </div>
      <div className="weather-main">
        <span className="weather-ic">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="24" cy="22" r="9" fill="currentColor" stroke="none" opacity=".85" /><path d="M26 50h22a8 8 0 0 0 .4-16A12 12 0 0 0 26 33a9 9 0 0 0 0 17z" /></svg>
        </span>
        <div className="weather-temp">
          <span className="t tnum">21<sup>°C</sup></span>
          <span className="cond">Pogodnie</span>
        </div>
      </div>
      <div className="weather-meta">
        <div className="wm-cell"><div className="k">Odczuwalna</div><div className="v tnum">20°</div></div>
        <div className="wm-cell"><div className="k">Wilgotność</div><div className="v tnum">48%</div></div>
        <div className="wm-cell"><div className="k">Wiatr</div><div className="v tnum">12 km/h</div></div>
      </div>
      <div className="clock-row centered">
        <div className="clock-big tnum">{hh}:{mm}<span className="sec">{ss}</span></div>
        <div className="d">{dateStr}</div>
      </div>
    </article>
  );
}

function NutritionSummaryCard() {
  const itemsQ = useTodayMealItems();
  const dailyQ = useNutritionToday();

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

  const dash = 263.9;
  const offset = dash - (dash * Math.min(100, (sumKcal / kcalTarget) * 100)) / 100;

  return (
    <article className="card diet-sum-card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Podsumowanie kalorii</span></div>
        <span className="pill">Dziś</span>
      </div>
      <div className="diet-sum-body">
        <div className="diet-sum-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-inset)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--acc-a)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={dash} strokeDashoffset={offset} transform="rotate(-90 50 50)" />
          </svg>
          <div className="diet-sum-inner"><b className="tnum">{Math.round(sumKcal)}</b><small>kcal</small></div>
        </div>
        <div className="diet-sum-macros">
          <div className="dsm-row"><span className="dsm-dot" style={{ background: 'var(--acc-a)' }} /><span className="dsm-lbl">Białko</span><span className="dsm-val tnum">{Math.round(sumProt)} <span className="dsm-g">/ {Math.round(protTarget)} g</span></span></div>
          <div className="dsm-row"><span className="dsm-dot" style={{ background: 'var(--ev-blue)' }} /><span className="dsm-lbl">Węglowodany</span><span className="dsm-val tnum">{Math.round(sumCarb)} <span className="dsm-g">/ {Math.round(carbTarget)} g</span></span></div>
          <div className="dsm-row"><span className="dsm-dot" style={{ background: 'var(--acc-b)' }} /><span className="dsm-lbl">Tłuszcze</span><span className="dsm-val tnum">{Math.round(sumFat)} <span className="dsm-g">/ {Math.round(fatTarget)} g</span></span></div>
        </div>
      </div>
      <div className="diet-sum-foot">
        <span className="dsf-hint">{items.length === 0 ? 'Brak wpisów — dodaj posiłki w module Dieta' : `${items.length} ${items.length === 1 ? 'wpis' : 'wpisów'} dziś`}</span>
        <a href="/diet" className="dsf-link">Zobacz dietę →</a>
      </div>
    </article>
  );
}

function TodayWorkoutCard() {
  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Dzisiejszy trening</span></div>
        <span className="pill">Plan</span>
      </div>
      <div className="train-card">
        <div className="th">
          <div>
            <div className="tt">Brak zaplanowanej sesji</div>
            <div className="ts">Zaplanuj w module Sport</div>
          </div>
        </div>
        <div className="diet-hint" style={{ marginTop: 10 }}>Treningi i logger serii — moduł Sport.</div>
      </div>
    </article>
  );
}

function MonthCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
  const nextMonth = new Date(year, month + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;

  const eventsQ = useCalendarEvents(monthStart, monthEnd);
  const events: CalendarEvent[] = eventsQ.data ?? [];

  // Map events by day-of-month for quick lookup
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.start_ts).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const firstIdx = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const arr: { day: number | null; today: boolean }[] = [];
    for (let i = 0; i < firstIdx; i++) arr.push({ day: null, today: false });
    for (let d = 1; d <= days; d++) arr.push({ day: d, today: d === today });
    return arr;
  }, [year, month, today]);

  const monthName = cap(new Intl.DateTimeFormat('pl-PL', { month: 'long' }).format(now));

  // Upcoming events this month
  const upcoming = events
    .filter((e) => new Date(e.start_ts) >= new Date())
    .slice(0, 5);

  return (
    <article className="card">
      <div className="cal-head">
        <div className="lhs">
          <span className="cal-month">{monthName} <span className="yr">{now.getFullYear()}</span></span>
        </div>
        {eventsQ.isFetching && (
          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>↻</span>
        )}
      </div>
      <div className="cal-dow">
        <div>Pon</div><div>Wt</div><div>Śr</div><div>Czw</div><div>Pt</div><div>Sob</div><div>Ndz</div>
      </div>
      <div className="cal-grid">
        {cells.map((c, i) => {
          if (c.day === null) return <div className="cal-cell out" key={`e${i}`} />;
          const dayEvents = eventsByDay[c.day] ?? [];
          return (
            <div className={`cal-cell${c.today ? ' today' : ''}`} key={c.day} title={dayEvents.map((e) => e.title).join('\n')}>
              <div className="dn tnum">{c.day}</div>
              {dayEvents.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: ev.color ?? 'var(--acc-a)',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {upcoming.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {upcoming.map((ev) => (
            <div key={ev.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: ev.color ?? 'var(--acc-a)', marginTop: 3,
              }} />
              <span style={{ color: 'var(--ink-2)', fontFamily: 'var(--mono)', fontSize: 11, flexShrink: 0 }}>
                {new Date(ev.start_ts).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
              </span>
              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{ev.title}</span>
            </div>
          ))}
        </div>
      )}
      {events.length === 0 && !eventsQ.isFetching && (
        <div className="diet-hint" style={{ marginTop: 12 }}>
          Brak wydarzeń · Połącz Google Calendar w Ustawienia → Integracje
        </div>
      )}
    </article>
  );
}
