import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStore } from '@/store/localStore';

const MONTH_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── MOCK HABITS ──────────────────────────────────────────────
const MOCK_HABITS = [
  { name: 'Medytacja 10 min', cat: 'Zdrowie', streak: 12, done: true },
  { name: 'Zimny prysznic',   cat: 'Zdrowie', streak: 7,  done: true },
  { name: 'Czytanie 30 min',  cat: 'Nauka',   streak: 21, done: false },
  { name: '10 000 kroków',    cat: 'Sport',   streak: 5,  done: true },
  { name: 'Pisanie dziennika',cat: 'Refleksja',streak: 3, done: false },
  { name: 'Ćwiczenia barku',  cat: 'Sport',   streak: 8,  done: false },
];

// ─── CALENDAR ─────────────────────────────────────────────────
const MOCK_EVENTS: Record<number, { label: string; cls: string }[]> = {
  3:  [{ label: 'Standup', cls: 'blue' }],
  7:  [{ label: 'Trening A', cls: 'clay' }],
  11: [{ label: 'Spotkanie Krzysi', cls: 'blue' }],
  13: [{ label: 'Festiwal', cls: 'green' }],
  16: [{ label: 'Barcelona', cls: 'green' }],
  17: [{ label: 'Taniec 19:00', cls: 'lav' }],
  18: [{ label: 'Masa: Dawid', cls: 'blue' }],
  19: [{ label: 'Kaszki – punkt', cls: 'clay' }],
  21: [{ label: 'Trening B', cls: 'clay' }],
  23: [{ label: 'Dzień Ojca', cls: 'green' }],
  26: [{ label: 'Wizyta u ks.', cls: 'lav' }],
};

function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<'month'|'week'|'day'>('month');

  function prev() { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); }
  function next() { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);
  let startDow = first.getDay(); startDow = startDow===0?6:startDow-1;
  const cells: (number|null)[] = [];
  for (let i=0;i<startDow;i++) cells.push(null);
  for (let d=1;d<=last.getDate();d++) cells.push(d);
  while (cells.length%7!==0) cells.push(null);

  const isToday = (d:number|null) => !!d && d===now.getDate() && month===now.getMonth() && year===now.getFullYear();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* cal head */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:600, letterSpacing:'-.01em' }}>
          {MONTH_FULL[month]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{year}</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* view switcher */}
          <div style={{ display:'flex', gap:2, background:'var(--surface-inset)', padding:3, borderRadius:10, border:'1px solid var(--border-soft)' }}>
            {(['month','week','day'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{
                fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600,
                padding:'6px 11px', borderRadius:7, border:0, cursor:'pointer', transition:'.14s',
                background: view===v ? 'var(--surface)' : 'transparent',
                color: view===v ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: view===v ? 'var(--sh-1)' : 'none',
              }}>
                {v==='month'?'Miesiąc':v==='week'?'Tydzień':'Dzień'}
              </button>
            ))}
          </div>
          {/* nav */}
          <button onClick={prev} style={{ width:30,height:30,borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--ink-2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <button onClick={next} style={{ width:30,height:30,borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--ink-2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <button onClick={goToday} style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.08em',textTransform:'uppercase',fontWeight:600,padding:'7px 13px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',cursor:'pointer' }}>
            Dziś
          </button>
        </div>
      </div>

      {/* day names */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:6 }}>
        {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map(d => (
          <div key={d} style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)',paddingLeft:4 }}>{d}</div>
        ))}
      </div>

      {/* grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:6, flex:1 }}>
        {cells.map((day,i) => {
          const evs = day ? (MOCK_EVENTS[day]??[]) : [];
          return (
            <div key={i} style={{
              minHeight:90, borderRadius:'var(--r-mid)',
              background: isToday(day) ? 'var(--acc-a-soft)' : day ? 'var(--surface-inset)' : 'transparent',
              border: isToday(day) ? '1px solid var(--acc-a)' : '1px solid var(--border-soft)',
              padding:9, display:'flex', flexDirection:'column', gap:4, cursor:day?'pointer':'default', transition:'.14s',
              opacity: !day ? 0 : 1,
            }}>
              {day && <>
                <div style={{
                  fontVariantNumeric:'tabular-nums',
                  ...(isToday(day)
                    ? { color:'#fff', background:'var(--acc-a)', width:23, height:23, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, fontWeight:700 }
                    : { fontSize:12.5, fontWeight:600, color:'var(--ink-2)' })
                }}>{day}</div>
                {evs.map(e => (
                  <div key={e.label} className={`ev ${e.cls}`} style={{ fontSize:10 }}>{e.label}</div>
                ))}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BOTTOM STRIP COMPONENTS ──────────────────────────────────

function HabitsStrip() {
  const done = MOCK_HABITS.filter(h=>h.done).length;
  const total = MOCK_HABITS.length;
  const pct = Math.round(done/total*100);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Nawyki</span>
        <span style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--ink-3)' }}>{done} / {total}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
        <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
          <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-inset)" strokeWidth="12"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--acc-a)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray="251.3" strokeDashoffset={251.3-(251.3*pct/100)}/>
          </svg>
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--mono)',fontSize:15,fontWeight:700 }}>{pct}%</div>
        </div>
        <div>
          <div style={{ fontSize:13,fontWeight:600,color:'var(--ink)' }}>Stabilny rytm dziś</div>
          <div style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--ink-3)',marginTop:3 }}>Jesteś o krok dalej!</div>
        </div>
      </div>
      {/* dot progress */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {MOCK_HABITS.map(h => (
          <div key={h.name} title={h.name} style={{ width:10, height:10, borderRadius:'50%', background: h.done ? 'var(--acc-a)' : 'var(--surface-inset)', border:'1px solid var(--border)' }} />
        ))}
      </div>
      <Link to="/goals" style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:14, fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--acc-a-ink)', textDecoration:'none', fontWeight:600 }}>
        Zobacz wszystkie
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </Link>
    </div>
  );
}

function TrainingStrip() {
  const { templates, sessions } = useLocalStore();
  const tpl = templates.find(t=>t.isActive) ?? templates[0];
  const lastSess = sessions[0];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Następny trening</span>
        {tpl && <span style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--acc-b-ink)',background:'var(--acc-b-soft)',padding:'4px 9px',borderRadius:999,fontWeight:600 }}>Push A</span>}
      </div>

      {tpl ? (
        <>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            {/* body SVG placeholder */}
            <div style={{ width:64, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <svg viewBox="0 0 40 80" width="40" height="80" fill="none">
                {/* simple body outline */}
                <ellipse cx="20" cy="9" rx="7" ry="7" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="11" y="17" width="18" height="22" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--acc-a-soft)"/>
                <rect x="3" y="17" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--acc-a-soft)"/>
                <rect x="30" y="17" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--acc-a-soft)"/>
                <rect x="12" y="40" width="7" height="20" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="21" y="40" width="7" height="20" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="12" y="61" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
                <rect x="21" y="61" width="7" height="16" rx="3" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface-2)"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>{tpl.name}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:3 }}>
                Ćwiczenie · {tpl.exercises.length > 0 ? tpl.exercises.reduce((s,e)=>s+e.sets.length,0) : 23} serii
              </div>
              <div style={{ display:'flex', gap:18, marginTop:12 }}>
                {[
                  { k:'Czas.',    v: tpl.estimatedDuration + ' min' },
                  { k:'Obj.',     v: lastSess ? '9 240 kg' : '–' },
                  { k:'Top seria',v: 'RIR 2' },
                ].map(s => (
                  <div key={s.k}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--ink-3)' }}>{s.k}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginTop:2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <Link to="/sport" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'var(--ink)', color:'var(--bg-1)', borderRadius:'var(--r-mid)', padding:'11px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none', border:0, cursor:'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Rozpocznij sesję
            </Link>
            <Link to="/sport" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'transparent', color:'var(--ink-2)', border:'1px solid var(--border)', borderRadius:'var(--r-mid)', padding:'11px 14px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none', cursor:'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Podgląd planu
            </Link>
          </div>
        </>
      ) : (
        <div style={{ fontSize:13, color:'var(--ink-3)', textAlign:'center', padding:'20px 0' }}>Brak szablonu</div>
      )}
    </div>
  );
}

function CaloriesStrip() {
  const { mealEntries, dietGoals } = useLocalStore();
  const today = new Date().toISOString().split('T')[0];
  const entries = mealEntries.filter(e=>e.date===today);
  const eaten = entries.reduce((s,e)=>s+e.kcal,0);
  const protein = Math.round(entries.reduce((s,e)=>s+e.protein,0));
  const carbs = Math.round(entries.reduce((s,e)=>s+e.carbs,0));
  const fat = Math.round(entries.reduce((s,e)=>s+e.fat,0));
  const pct = Math.min(100, Math.round(eaten/dietGoals.kcal*100));

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600 }}>Podsumowanie kalorii</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
          <svg viewBox="0 0 100 100" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--surface-inset)" strokeWidth="10"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--acc-a)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray="238.8" strokeDashoffset={238.8-(238.8*pct/100)}/>
          </svg>
          <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
            <span style={{ fontFamily:'var(--mono)',fontSize:18,fontWeight:700,lineHeight:1 }}>{eaten}</span>
            <span style={{ fontFamily:'var(--mono)',fontSize:8,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--ink-3)',marginTop:1 }}>kcal</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          {[
            { k:'Białko', v:protein, goal:dietGoals.protein, color:'var(--acc-a)' },
            { k:'Węglowodany', v:carbs, goal:dietGoals.carbs, color:'var(--ev-blue)' },
            { k:'Tłuszcze', v:fat, goal:dietGoals.fat, color:'var(--acc-b)' },
          ].map(m => (
            <div key={m.k} style={{ marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11.5, color:'var(--ink-2)', fontWeight:500 }}>{m.k}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--ink)', fontWeight:600 }}>{m.v} <span style={{ color:'var(--ink-3)', fontWeight:400 }}>/ {m.goal} g</span></span>
              </div>
              <div style={{ height:4, borderRadius:999, background:'var(--surface-inset)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(100,Math.round(m.v/m.goal*100))}%`, background:m.color, borderRadius:999 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link to="/diet" style={{ display:'inline-flex',alignItems:'center',gap:5,marginTop:12,fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--acc-a-ink)',textDecoration:'none',fontWeight:600 }}>
        Zobacz szczegóły diety
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </Link>
    </div>
  );
}

// ─── TODAY PANEL (left column) ────────────────────────────────

const CAT_COLORS: Record<string,string> = {
  Rutyna:'var(--acc-a)', Trening:'var(--acc-b)', Praca:'var(--ev-blue)',
  Regeneracja:'var(--ev-lav)', Cel:'var(--ev-clay)', default:'var(--ink-4)',
};

function TodayPanel() {
  const { workTasks, goals } = useLocalStore();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id); },[]);

  const todayStr = now.toISOString().split('T')[0];
  const dueTodayWork = workTasks.filter(t=>t.status!=='done'&&t.dueDate===todayStr);
  const dueTodayGoal = goals.flatMap(g=>g.tasks).filter(t=>t.status!=='done'&&t.dueDate===todayStr);
  const overdue = workTasks.filter(t=>t.status!=='done'&&t.dueDate&&t.dueDate<todayStr).length;
  const allTasks = [...dueTodayWork, ...dueTodayGoal];
  const activeWork = workTasks.filter(t=>t.status==='active').slice(0,5);
  const displayTasks = allTasks.length > 0 ? allTasks : activeWork;

  const habitsDone = MOCK_HABITS.filter(h=>h.done).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:16, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--display)', fontSize:36, fontWeight:600, letterSpacing:'-.02em', lineHeight:1 }}>Dzisiaj</span>
          <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--ink-3)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:'var(--ink)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', letterSpacing:'.04em' }}>
              {now.getDate()} {MONTH_FULL[now.getMonth()].slice(0,3).toLowerCase()} {now.getFullYear()}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
              22° · Kraków
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:24, marginBottom:20 }}>
        {[
          { icon:() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, val:displayTasks.length+(overdue>0?overdue:0), label:'zadań do zrobienia', warn:overdue>0 },
          { icon:() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>, val:habitsDone, label:'nawyki do wykonania', warn:false },
          { icon:() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, val:1, label:'wydarzenie dzisiaj', warn:false },
        ].map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color: s.warn ? 'var(--p-high)' : 'var(--acc-a)' }}>{s.icon()}</span>
            <div>
              <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:700, lineHeight:1, color: s.warn ? 'var(--p-high)' : 'var(--ink)' }}>{s.val}</div>
              <div style={{ fontSize:11.5, color:'var(--ink-3)', marginTop:2 }}>{s.label}</div>
              <div style={{ height:2, borderRadius:99, background: s.warn ? 'rgba(192,86,74,.2)' : 'var(--acc-a-soft)', marginTop:4, width:'100%' }}>
                <div style={{ height:'100%', width:'60%', borderRadius:99, background: s.warn ? 'var(--p-high)' : 'var(--acc-a)' }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
        {displayTasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>
            Wszystko zrobione! 🎉
          </div>
        ) : displayTasks.map(task => {
          const p = (task as any).priority as string|undefined;
          const prioLabel = p==='high'?'HIGH':p==='mid'?'MID':p==='low'?'LOW':undefined;
          const prioColor = p==='high'?'var(--p-high)':p==='mid'?'var(--acc-b-ink)':'var(--ink-4)';
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 2px', borderTop:'1px solid var(--border-soft)' }}>
              <div style={{ width:19,height:19,borderRadius:7,border:`1.5px solid ${task.status==='done'?'var(--acc-a)':'var(--border)'}`,background:task.status==='done'?'var(--acc-a)':'transparent',flexShrink:0,display:'grid',placeItems:'center',color:'#fff',cursor:'pointer' }}>
                {task.status==='done' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ flex:1, fontSize:13.5, color:task.status==='done'?'var(--ink-3)':'var(--ink)', fontWeight:500, textDecoration:task.status==='done'?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {task.title}
              </span>
              {(task as any).category && (
                <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', flexShrink:0 }}>
                  <i style={{ width:6,height:6,borderRadius:'50%',background:CAT_COLORS[(task as any).category]??CAT_COLORS.default,display:'block' }}/>
                  {(task as any).category}
                </span>
              )}
              {prioLabel && (
                <span style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.06em', color:prioColor, fontWeight:700, flexShrink:0 }}>{prioLabel}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Add task row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:12, marginTop:12, borderTop:'1px solid var(--border-soft)' }}>
        <button style={{ display:'flex', alignItems:'center', gap:7, flex:1, background:'transparent', border:0, color:'var(--ink-3)', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, padding:0, textAlign:'left' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--acc-a)' }}><path d="M12 5v14M5 12h14"/></svg>
          Dodaj zadanie
        </button>
        <div style={{ display:'flex', gap:4 }}>
          {[
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
          ].map((ico,i) => (
            <button key={i} style={{ width:26,height:26,borderRadius:8,border:'1px solid var(--border)',background:'transparent',color:'var(--ink-3)',display:'grid',placeItems:'center',cursor:'pointer' }}>
              {ico}
            </button>
          ))}
        </div>
        <button style={{ fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.06em',textTransform:'uppercase',fontWeight:600,color:'var(--ink-3)',background:'transparent',border:0,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Zakończone
        </button>
      </div>
    </div>
  );
}


// ─── ROOT ─────────────────────────────────────────────────────

export function StartScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1,
      padding: 'var(--gap)', gap: 'var(--gap)',
      maxWidth: 1640, margin: '0 auto', width: '100%',
    }}>
      {/* TOP ROW: Today + Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 'var(--gap)', flex: 1, minHeight: 0 }}>
        {/* Left: Today */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
          <TodayPanel />
        </div>
        {/* Right: Calendar */}
        <div className="card">
          <Calendar />
        </div>
      </div>

      {/* BOTTOM ROW: Habits · Training · Calories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap)' }}>
        <div className="card"><HabitsStrip /></div>
        <div className="card"><TrainingStrip /></div>
        <div className="card"><CaloriesStrip /></div>
      </div>
    </div>
  );
}
