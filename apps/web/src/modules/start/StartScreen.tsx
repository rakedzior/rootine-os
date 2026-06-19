import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStore } from '@/store/localStore';

const MONTH_FULL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const MONTH_SHORT = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

// ─── MOCK HABITS ──────────────────────────────────────────────
const MOCK_HABITS = [
  { name: 'Medytacja 10 min', cat: 'Zdrowie', streak: 12, done: true },
  { name: 'Zimny prysznic',   cat: 'Zdrowie', streak: 7,  done: true },
  { name: 'Czytanie 30 min',  cat: 'Nauka',   streak: 21, done: false },
  { name: '10 000 kroków',    cat: 'Sport',   streak: 5,  done: true },
  { name: 'Pisanie dziennika',cat: 'Refleksja',streak: 3, done: false },
  { name: 'Ćwiczenia barku',  cat: 'Sport',   streak: 8,  done: false },
];

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

// ─── ADD TASK MODAL ───────────────────────────────────────────

const CAT_OPTIONS = ['Rutyna', 'Trening', 'Praca', 'Regeneracja', 'Cel', 'Inne'];
const PRIO_OPTIONS: { value: 'high' | 'mid' | 'low'; label: string }[] = [
  { value: 'high', label: '🔴 Wysoki' },
  { value: 'mid',  label: '🟡 Średni' },
  { value: 'low',  label: '🟢 Niski'  },
];

interface NewTask {
  title: string;
  category: string;
  priority: 'high' | 'mid' | 'low';
  dueDate: string;
  note: string;
}

interface AddTaskModalProps {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onSave: (task: NewTask) => void;
}

function AddTaskModal({ open, defaultDate, onClose, onSave }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Praca');
  const [priority, setPriority] = useState<'high' | 'mid' | 'low'>('mid');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [note, setNote] = useState('');

  useEffect(() => { setDueDate(defaultDate); }, [defaultDate]);

  const reset = () => { setTitle(''); setCategory('Praca'); setPriority('mid'); setNote(''); };

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), category, priority, dueDate, note });
    reset();
    onClose();
  }

  function handleClose() { reset(); onClose(); }

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={handleClose}
    >
      <div
        style={{ background:'var(--surface)', borderRadius:'var(--r-lg)', width:'100%', maxWidth:480, boxShadow:'var(--sh-3)', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid var(--border-soft)' }}>
          <span style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:600 }}>Dodaj zadanie</span>
          <button onClick={handleClose} style={{ width:30, height:30, borderRadius:8, border:'1px solid var(--border-soft)', background:'transparent', cursor:'pointer', color:'var(--ink-3)', fontSize:18, display:'grid', placeItems:'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Title */}
          <div>
            <label style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:600, display:'block', marginBottom:6 }}>Tytuł zadania *</label>
            <input
              autoFocus
              className="input"
              placeholder="Wpisz zadanie…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{ width:'100%', boxSizing:'border-box' }}
            />
          </div>

          {/* Date + Priority row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:600, display:'block', marginBottom:6 }}>Data</label>
              <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width:'100%', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:600, display:'block', marginBottom:6 }}>Priorytet</label>
              <select className="select" value={priority} onChange={e => setPriority(e.target.value as 'high'|'mid'|'low')} style={{ width:'100%' }}>
                {PRIO_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:600, display:'block', marginBottom:6 }}>Kategoria</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {CAT_OPTIONS.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding:'5px 12px', borderRadius:99, border:'1px solid var(--border)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'.14s',
                    background: category === c ? 'var(--acc-solid)' : 'transparent',
                    color: category === c ? 'var(--on-acc)' : 'var(--ink-2)' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:600, display:'block', marginBottom:6 }}>Notatka (opcjonalnie)</label>
            <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Dodatkowe informacje…" style={{ width:'100%', boxSizing:'border-box', resize:'vertical' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'14px 20px', borderTop:'1px solid var(--border-soft)' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleClose}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!title.trim()}>Dodaj zadanie</button>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────

interface CalendarProps {
  onDayClick: (dateStr: string) => void;
}

function Calendar({ onDayClick }: CalendarProps) {
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight: 0 }}>
      {/* cal head */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:600, letterSpacing:'-.01em' }}>
          {MONTH_FULL[month]} <span style={{ color:'var(--ink-3)', fontWeight:500 }}>{year}</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ display:'flex', gap:2, background:'var(--surface-inset)', padding:3, borderRadius:10, border:'1px solid var(--border-soft)' }}>
            {(['month','week','day'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{
                fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600,
                padding:'5px 10px', borderRadius:7, border:0, cursor:'pointer', transition:'.14s',
                background: view===v ? 'var(--surface)' : 'transparent',
                color: view===v ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: view===v ? 'var(--sh-1)' : 'none',
              }}>{v==='month'?'Miesiąc':v==='week'?'Tydzień':'Dzień'}</button>
            ))}
          </div>
          <button onClick={prev} style={{ width:28,height:28,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--ink-2)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <button onClick={next} style={{ width:28,height:28,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--ink-2)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <button onClick={goToday} style={{ fontFamily:'var(--mono)',fontSize:10,letterSpacing:'.08em',textTransform:'uppercase',fontWeight:600,padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',cursor:'pointer' }}>
            Dziś
          </button>
        </div>
      </div>

      {/* day names */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:5, flexShrink:0 }}>
        {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map(d => (
          <div key={d} style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)',paddingLeft:4 }}>{d}</div>
        ))}
      </div>

      {/* grid — flex:1 so it fills remaining card height */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:5, flex:1, minHeight:0 }}>
        {cells.map((day,i) => {
          const evs = day ? (MOCK_EVENTS[day]??[]) : [];
          return (
            <div key={i}
              onClick={() => { if (day) onDayClick(toDateStr(year, month, day)); }}
              style={{
                minHeight:72, borderRadius:'var(--r-sm)',
                background: isToday(day) ? 'var(--acc-a-soft)' : day ? 'var(--surface-inset)' : 'transparent',
                border: isToday(day) ? '1px solid var(--acc-a)' : day ? '1px solid var(--border-soft)' : '1px solid transparent',
                padding:7, display:'flex', flexDirection:'column', gap:3,
                cursor: day ? 'pointer' : 'default',
                transition:'.14s',
                opacity: !day ? 0 : 1,
              }}
              title={day ? `Dodaj zadanie na ${day} ${MONTH_SHORT[month]}` : undefined}
            >
              {day && <>
                <div style={{
                  fontVariantNumeric:'tabular-nums',
                  ...(isToday(day)
                    ? { color:'#fff', background:'var(--acc-a)', width:22, height:22, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, fontWeight:700 }
                    : { fontSize:12, fontWeight:600, color:'var(--ink-2)' })
                }}>{day}</div>
                {evs.map(e => (
                  <div key={e.label} className={`ev ${e.cls}`} style={{ fontSize:9.5 }}>{e.label}</div>
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
  const [habits, setHabits] = useState(MOCK_HABITS);
  const done = habits.filter(h=>h.done).length;
  const total = habits.length;
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
          <div style={{ fontSize:13,fontWeight:600,color:'var(--ink)' }}>{pct>=80?'Świetny rytm!':pct>=50?'Stabilny rytm dziś':'Ruszaj się! 💪'}</div>
          <div style={{ fontFamily:'var(--mono)',fontSize:9.5,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--ink-3)',marginTop:3 }}>Jesteś o krok dalej!</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {habits.map((h,i) => (
          <div key={h.name} title={h.name}
            onClick={() => setHabits(prev => prev.map((x,j) => j===i ? {...x, done: !x.done} : x))}
            style={{ width:10, height:10, borderRadius:'50%', cursor:'pointer',
              background: h.done ? 'var(--acc-a)' : 'var(--surface-inset)',
              border: h.done ? 'none' : '1px solid var(--border)',
              transition:'.15s' }} />
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
            <div style={{ width:64, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <svg viewBox="0 0 40 80" width="40" height="80" fill="none">
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
            <Link to="/sport" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'var(--ink)', color:'var(--bg-1)', borderRadius:'var(--r-mid)', padding:'11px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Rozpocznij sesję
            </Link>
            <Link to="/sport" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', color:'var(--ink-2)', border:'1px solid var(--border)', borderRadius:'var(--r-mid)', padding:'11px 14px', fontFamily:'var(--mono)', fontSize:10.5, letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600, textDecoration:'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
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
        Zobacz szczegóły
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </Link>
    </div>
  );
}

// ─── TODAY PANEL ──────────────────────────────────────────────

const CAT_COLORS: Record<string,string> = {
  Rutyna:'var(--acc-a)', Trening:'var(--acc-b)', Praca:'var(--ev-blue)',
  Regeneracja:'var(--ev-lav)', Cel:'var(--ev-clay)', default:'var(--ink-4)',
};

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  category?: string;
  priority?: string;
}

interface TodayPanelProps {
  onAddTask: () => void;
}

function TodayPanel({ onAddTask }: TodayPanelProps) {
  const { workTasks, goals } = useLocalStore();
  const [now, setNow] = useState(new Date());
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id); },[]);

  // Merge store tasks + locally added tasks
  const todayStr = now.toISOString().split('T')[0];
  const storeTasks: Task[] = [
    ...workTasks.filter(t => t.status !== 'done' && (!t.dueDate || t.dueDate === todayStr)),
    ...goals.flatMap(g => g.tasks).filter(t => t.status !== 'done' && (!t.dueDate || t.dueDate === todayStr)),
  ].slice(0, 8);
  const overdue = workTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length;
  const allTasks: Task[] = [...storeTasks, ...localTasks.filter(t => t.dueDate === todayStr || !t.dueDate)];
  const displayTasks = allTasks.length > 0 ? allTasks : workTasks.filter(t=>t.status==='active').slice(0,5) as Task[];

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  function toggleCheck(id: string) {
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const habitsDone = MOCK_HABITS.filter(h=>h.done).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ marginBottom:16, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--display)', fontSize:32, fontWeight:600, letterSpacing:'-.02em', lineHeight:1 }}>Dzisiaj</span>
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--ink-3)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:'var(--ink)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', letterSpacing:'.03em' }}>
              {now.getDate()} {MONTH_SHORT[now.getMonth()]} {now.getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:20, marginBottom:16, flexShrink:0 }}>
        {[
          { val: displayTasks.length + (overdue > 0 ? overdue : 0), label: 'zadań', warn: overdue > 0 },
          { val: habitsDone, label: 'nawyków', warn: false },
          { val: 1, label: 'wydarzenie', warn: false },
        ].map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div>
              <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:700, lineHeight:1, color: s.warn ? 'var(--p-high)' : 'var(--ink)' }}>{s.val}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Task list — scrollable */}
      <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
        {displayTasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>
            Wszystko zrobione! 🎉
          </div>
        ) : displayTasks.map(task => {
          const isDone = checkedIds.has(task.id) || task.status === 'done';
          const p = task.priority;
          const prioColor = p==='high'?'var(--p-high)':p==='mid'?'var(--acc-b-ink)':'var(--ink-4)';
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 2px', borderTop:'1px solid var(--border-soft)' }}>
              {/* Checkbox */}
              <div
                role="checkbox"
                aria-checked={isDone}
                tabIndex={0}
                onClick={() => toggleCheck(task.id)}
                onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && toggleCheck(task.id)}
                style={{ width:18, height:18, borderRadius:6, border:`1.5px solid ${isDone?'var(--acc-a)':'var(--border)'}`, background:isDone?'var(--acc-a)':'transparent', flexShrink:0, display:'grid', placeItems:'center', color:'#fff', cursor:'pointer', transition:'.15s' }}
              >
                {isDone && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
              </div>
              <span style={{ flex:1, fontSize:13, color:isDone?'var(--ink-3)':'var(--ink)', fontWeight:500, textDecoration:isDone?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {task.title}
              </span>
              {task.category && (
                <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', flexShrink:0 }}>
                  <i style={{ width:5, height:5, borderRadius:'50%', background:CAT_COLORS[task.category]??CAT_COLORS.default, display:'block' }}/>
                  {task.category}
                </span>
              )}
              {p && p !== 'low' && (
                <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.06em', color:prioColor, fontWeight:700, flexShrink:0 }}>{p==='high'?'HIGH':'MID'}</span>
              )}
            </div>
          );
        })}

        {/* Locally added tasks */}
        {localTasks.filter(t => t.dueDate !== todayStr && t.dueDate).map(task => (
          <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 2px', borderTop:'1px solid var(--border-soft)', opacity:.6 }}>
            <div style={{ width:18, height:18, borderRadius:6, border:'1.5px solid var(--border)', background:'transparent', flexShrink:0 }} />
            <span style={{ flex:1, fontSize:13, color:'var(--ink-2)', fontWeight:500 }}>{task.title}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'var(--ink-3)' }}>{task.dueDate}</span>
          </div>
        ))}
      </div>

      {/* Add task row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:12, marginTop:8, borderTop:'1px solid var(--border-soft)', flexShrink:0 }}>
        <button
          onClick={onAddTask}
          style={{ display:'flex', alignItems:'center', gap:7, flex:1, background:'transparent', border:0, color:'var(--ink-3)', cursor:'pointer', fontFamily:'var(--sans)', fontSize:13, padding:0, textAlign:'left' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--acc-a)', flexShrink:0 }}><path d="M12 5v14M5 12h14"/></svg>
          Dodaj zadanie
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────

export function StartScreen() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(todayStr);
  const [addedTasks, setAddedTasks] = useState<NewTask[]>([]);

  function openForToday() { setModalDate(todayStr); setModalOpen(true); }
  function openForDay(dateStr: string) { setModalDate(dateStr); setModalOpen(true); }
  function handleSaveTask(task: NewTask) { setAddedTasks(prev => [...prev, task]); }

  return (
    <div className="module-page">
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: 'var(--gap)', gap: 'var(--gap)',
        maxWidth: 1640, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        {/* TOP ROW: Today + Calendar — fixed min-height, not flex-grow */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 'var(--gap)', minHeight: 480 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TodayPanel onAddTask={openForToday} />
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Calendar onDayClick={openForDay} />
          </div>
        </div>

        {/* BOTTOM ROW: Habits · Training · Calories — always visible */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)' }}>
          <div className="card"><HabitsStrip /></div>
          <div className="card"><TrainingStrip /></div>
          <div className="card"><CaloriesStrip /></div>
        </div>
      </div>

      <AddTaskModal
        open={modalOpen}
        defaultDate={modalDate}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
}
