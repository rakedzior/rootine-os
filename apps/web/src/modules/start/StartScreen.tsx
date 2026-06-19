import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStore } from '@/store/localStore';

const DAY_PL = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
const MONTH_PL = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];
const MONTH_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── WEATHER CARD ─────────────────────────────────────────────

function WeatherCard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = `${DAY_PL[now.getDay()]}, ${now.getDate()} ${MONTH_PL[now.getMonth()]}`;

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Pogoda i czas</span></div>
        <span className="pill accent">
          <span className="led" />
          Kraków
        </span>
      </div>

      {/* Weather main */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 2 }}>
        <svg className="weather-ic" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="28" r="14" stroke="currentColor" strokeWidth="3.5" fill="rgba(189,135,105,.18)" />
          <line x1="32" y1="5" x2="32" y2="9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="47" x2="32" y2="51" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="9" y1="28" x2="13" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="51" y1="28" x2="55" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="15.8" y1="12.8" x2="18.6" y2="15.6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="45.4" y1="40.4" x2="48.2" y2="43.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="48.2" y1="12.8" x2="45.4" y2="15.6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="18.6" y1="40.4" x2="15.8" y2="43.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="weather-temp">
          <div className="t" style={{ fontFamily: 'var(--mono)', fontSize: 52, fontWeight: 600, lineHeight: 1 }}>
            24<sup style={{ fontSize: 20, color: 'var(--ink-3)' }}>°C</sup>
          </div>
          <div className="cond" style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginTop: 4 }}>Zachmurzenie</div>
        </div>
      </div>

      {/* Weather meta */}
      <div className="weather-meta">
        <div className="wm-cell"><div className="k">Odczuwalna</div><div className="v">23°</div></div>
        <div className="wm-cell"><div className="k">Wilgotność</div><div className="v">52%</div></div>
        <div className="wm-cell"><div className="k">Wiatr</div><div className="v">14 km/h</div></div>
      </div>

      {/* Clock */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
        <div className="clock-big">
          {pad(now.getHours())}:{pad(now.getMinutes())}
          <span className="sec">:{pad(now.getSeconds())}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{dateStr}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3 }}>CET UTC+2</div>
        </div>
      </div>
    </article>
  );
}

// ─── FINANCE PULSE ────────────────────────────────────────────

function FinancePulseCard() {
  const { accounts } = useLocalStore();
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Puls finansów</span></div>
        <Link to="/finance" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-2)', textDecoration: 'none', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', padding: '5px 11px', borderRadius: 999 }}>
          Szczegóły
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 2 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 38, fontWeight: 600 }}>
          {totalBalance.toLocaleString('pl-PL', { maximumFractionDigits: 0 })}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>PLN</span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, color: 'var(--acc-a-ink)', marginTop: 6 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        +4.2% vs. zeszły miesiąc
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {accounts.slice(0, 4).map(acc => (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--acc-a)', flexShrink: 0 }} />
              {acc.name}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {acc.balance.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

// ─── NUTRITION SUMMARY ────────────────────────────────────────

function NutritionCard() {
  const { mealEntries, dietGoals } = useLocalStore();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = mealEntries.filter(e => e.date === today);
  const eaten = todayEntries.reduce((s, e) => s + e.kcal, 0);
  const protein = todayEntries.reduce((s, e) => s + e.protein, 0);
  const carbs = todayEntries.reduce((s, e) => s + e.carbs, 0);
  const fat = todayEntries.reduce((s, e) => s + e.fat, 0);
  const pct = Math.min(100, Math.round((eaten / dietGoals.kcal) * 100));
  const circ = 263.9;

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Kalorie dziś</span></div>
        <span className="pill">Dziś</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-inset)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--acc-a)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)} />
          </svg>
          <div className="rt">
            <b style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600 }}>{pct}</b>
            <small>%</small>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
            <b style={{ color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 24 }}>{eaten}</b> / {dietGoals.kcal} kcal
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.04em', color: 'var(--acc-a-ink)', padding: '4px 8px', background: 'var(--acc-a-soft)', borderRadius: 999 }}>
            Pozostało {dietGoals.kcal - eaten} kcal
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
        {[
          { k: 'Białko', v: Math.round(protein), goal: dietGoals.protein, color: 'var(--acc-a)' },
          { k: 'Węglowodany', v: Math.round(carbs), goal: dietGoals.carbs, color: 'var(--ev-blue)' },
          { k: 'Tłuszcze', v: Math.round(fat), goal: dietGoals.fat, color: 'var(--acc-b)' },
        ].map(m => (
          <div key={m.k}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{m.k}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{m.v}g</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-inset)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.round(m.v/m.goal*100))}%`, background: m.color, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end' }}>
        <Link to="/diet" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--acc-a-ink)', textDecoration: 'none', fontWeight: 600 }}>
          Zobacz dietę →
        </Link>
      </div>
    </article>
  );
}

// ─── TODAY CARD ───────────────────────────────────────────────

function TodayCard() {
  const { workTasks, goals } = useLocalStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const dueTodayWork = workTasks.filter(t => t.status !== 'done' && t.dueDate === todayStr);
  const dueTodayGoal = goals.flatMap(g => g.tasks).filter(t => t.status !== 'done' && t.dueDate === todayStr);
  const allTasks = [...dueTodayWork, ...dueTodayGoal];
  const overdue = workTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length;

  const dayName = DAY_PL[new Date().getDay()];
  const dateStr = `${dayName}, ${new Date().getDate()} ${MONTH_PL[new Date().getMonth()]}`;

  return (
    <article className="card">
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Tasks side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>DZISIAJ</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 600, letterSpacing: '-.01em', marginTop: 2 }}>{dateStr}</div>
            </div>
            <Link to="/work" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', background: 'var(--surface-inset)', border: '1px solid var(--border-soft)', color: 'var(--ink-2)', padding: '7px 12px', borderRadius: 9, textDecoration: 'none', fontWeight: 600 }}>
              Plan dnia
            </Link>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'zadań', val: allTasks.length + overdue, warn: overdue > 0 ? `${overdue} po terminie` : undefined },
              { label: 'nawyki', val: 2 },
              { label: 'wydarzeń', val: 1 },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 600, color: s.warn ? 'var(--p-high)' : 'var(--ink)' }}>{s.val}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.label}{s.warn ? <><br /><small style={{ color: 'var(--p-high)', fontFamily: 'var(--mono)', fontSize: 9 }}>{s.warn}</small></> : null}</span>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div>
            {allTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-3)', fontSize: 13 }}>
                Wszystko zrobione na dziś 🎉
              </div>
            ) : allTasks.slice(0, 8).map(task => (
              <div key={task.id} className="todo-item">
                <div className="todo-check">
                  {task.status === 'done' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
                <span className="t">{task.title}</span>
                <span className="cat">{(task as any).priority ?? ''}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn-ghost btn-sm" style={{ flex: 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Dodaj zadanie
            </button>
            <button className="btn-ghost btn-sm">Zakończone</button>
          </div>
        </div>

        {/* Aside */}
        <div style={{ width: 200, flexShrink: 0, marginLeft: 20, paddingLeft: 20, borderLeft: '1px solid var(--border-soft)' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 10 }}>Następnie</div>
            <div style={{ background: 'var(--surface-inset)', borderRadius: 'var(--r-mid)', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Dziś · 18:00
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Spotkanie z klientem</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Google Meet</span>
                <button style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--acc-a-ink)', background: 'var(--acc-a-soft)', border: 0, padding: '5px 9px', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Dołącz</button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 10 }}>Przypomnienia</div>
            {[
              { n: 'Opłacić OC/AC – Warta', w: 'za 2 dni' },
              { n: 'Rotacja barku', w: 'dziś' },
              { n: 'Zaległe faktury', w: 'pt 20 cze' },
            ].map(r => (
              <div key={r.n} style={{ display: 'flex', gap: 8, padding: '7px 0', borderTop: '1px solid var(--border-soft)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--acc-b)', flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{r.n}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>{r.w}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── CALENDAR CARD ────────────────────────────────────────────

const MOCK_EVENTS = [
  { day: 3, label: 'Standup', cls: 'blue' },
  { day: 7, label: 'Trening A', cls: 'clay' },
  { day: 10, label: 'Dentysta', cls: 'lav' },
  { day: 14, label: 'Weekend', cls: 'green' },
  { day: 18, label: 'Spotkanie', cls: 'blue' },
  { day: 21, label: 'Trening B', cls: 'clay' },
  { day: 25, label: 'Urlop', cls: 'green' },
];

function CalendarCard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let startDow = first.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function isToday(d: number | null) { return !!d && d === now.getDate() && month === now.getMonth() && year === now.getFullYear(); }
  function eventsFor(d: number | null) { return d ? MOCK_EVENTS.filter(e => e.day === d) : []; }

  return (
    <article className="card">
      <div className="cal-head">
        <div className="lhs">
          <span className="cal-month">{MONTH_FULL[month]} <span className="yr">{year}</span></span>
        </div>
        <div className="cal-ctrl">
          <button className="cal-navbtn" onClick={prev}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <button className="cal-navbtn" onClick={next}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <button className="cal-today-btn" onClick={goToday}>Dziś</button>
        </div>
      </div>

      <div className="cal-dow">
        {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => (
          <div key={i} className={`cal-cell ${!day ? 'out' : ''} ${isToday(day) ? 'today' : ''}`}>
            <div className="dn">{day ?? ''}</div>
            <div className="evs">
              {eventsFor(day).map(e => (
                <div key={e.label} className={`ev ${e.cls}`}>{e.label}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
        {[['blue','Praca'],['clay','Trening'],['green','Wydarzenia'],['lav','Osobiste']].map(([cls, lbl]) => (
          <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '.04em' }}>
            <i style={{ width: 7, height: 7, borderRadius: 2, background: `var(--ev-${cls})`, display: 'block' }} />
            {lbl}
          </span>
        ))}
      </div>
    </article>
  );
}

// ─── HABITS CARD ──────────────────────────────────────────────

const MOCK_HABITS = [
  { name: 'Medytacja 10 min', cat: 'Zdrowie', streak: 12, done: true },
  { name: 'Zimny prysznic', cat: 'Zdrowie', streak: 7, done: true },
  { name: 'Czytanie 30 min', cat: 'Nauka', streak: 21, done: false },
  { name: 'Ćwiczenia', cat: 'Sport', streak: 5, done: true },
  { name: 'Pisanie dziennika', cat: 'Refleksja', streak: 3, done: false },
];

function HabitsCard() {
  const doneCount = MOCK_HABITS.filter(h => h.done).length;
  const pct = Math.round((doneCount / MOCK_HABITS.length) * 100);
  const circ = 270.2;

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Nawyki i rutyny</span></div>
        <span className="pill">{doneCount} / {MOCK_HABITS.length}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 6 }}>
        <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--surface-inset)" strokeWidth="8" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--acc-a)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 600 }}>{pct}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>Stabilny rytm dziś</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>Jesteś o krok dalej!</div>
        </div>
      </div>

      {MOCK_HABITS.map(h => (
        <div key={h.name} className={'habit-row' + (h.done ? ' done' : '')}>
          <div className="habit-check">
            {h.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
          </div>
          <div className="info">
            <div className="n">{h.name}</div>
            <div className="c">{h.cat}</div>
          </div>
          {h.streak > 0 && (
            <div className="streak">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-4-2.5-7.5-5-10z"/></svg>
              {h.streak}
            </div>
          )}
        </div>
      ))}
    </article>
  );
}

// ─── TRAINING CARD ────────────────────────────────────────────

function TrainingCard() {
  const { templates, sessions } = useLocalStore();
  const nextTemplate = templates.find(t => t.isActive) ?? templates[0];
  const lastSession = sessions[0];

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Dzisiejszy trening</span></div>
        {nextTemplate && <span className="pill accent">{nextTemplate.sportType}</span>}
      </div>

      {nextTemplate ? (
        <div className="train-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="tt">{nextTemplate.name}</div>
              <div className="ts">{nextTemplate.exercises.length} ćwiczeń · {nextTemplate.estimatedDuration} min</div>
            </div>
            <span className="badge badge-clay">Hipertrofia</span>
          </div>
          <div className="train-meta">
            <div><span className="mk">Szac. czas</span><div className="mv">{nextTemplate.estimatedDuration} min</div></div>
            {lastSession && <div><span className="mk">Ostatni</span><div className="mv" style={{ fontSize: 11 }}>{new Date(lastSession.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}</div></div>}
          </div>
          <Link to="/sport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--ink)', color: 'var(--bg-1)', border: 0, borderRadius: 'var(--r-mid)', padding: '12px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginTop: 14 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Rozpocznij sesję
          </Link>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '20px 0' }}>Brak aktywnego szablonu</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--border-soft)' }}>
        {[['var(--acc-a)','Strava'],['var(--acc-a)','Garmin'],['var(--acc-b)','Kotcha']].map(([c, n]) => (
          <span key={n} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.04em', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'block' }} />
            {n}
          </span>
        ))}
      </div>
    </article>
  );
}

// ─── GOALS CARD ───────────────────────────────────────────────

function GoalsCard() {
  const { goals } = useLocalStore();
  const active = goals.filter(g => !g.archived).slice(0, 4);

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Postępy w celach</span></div>
        <span className="pill">Q2</span>
      </div>

      {active.map(g => (
        <div key={g.id} className="goal-row">
          <div className="goal-gh">
            <span className="goal-name">
              {g.emoji} {g.title}
              {' '}<small style={{ fontFamily: 'var(--mono)', fontWeight: 500, fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em', textTransform: 'uppercase', marginLeft: 7 }}>{g.type}</small>
            </span>
            <span className="goal-pct">{g.progress}%</span>
          </div>
          <div className="goal-track"><i style={{ width: g.progress + '%' }} /></div>
        </div>
      ))}

      {active.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>Brak aktywnych celów</div>
      )}

      <Link to="/goals" style={{ display: 'block', marginTop: 14, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--acc-a-ink)', textDecoration: 'none', fontWeight: 600 }}>
        Zobacz wszystkie cele →
      </Link>
    </article>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────

export function StartScreen() {
  return (
    <main className="main-grid">
      <section className="col">
        <WeatherCard />
        <FinancePulseCard />
        <NutritionCard />
      </section>
      <section className="col">
        <TodayCard />
        <CalendarCard />
      </section>
      <section className="col">
        <HabitsCard />
        <TrainingCard />
        <GoalsCard />
      </section>
    </main>
  );
}
