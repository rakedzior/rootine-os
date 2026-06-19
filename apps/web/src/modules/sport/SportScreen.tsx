import { useState, useEffect, useRef } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, SectionHead, IcoTrash } from '@/components/common';
import { useLocalStore, type WorkoutTemplate, type WorkoutSet, type WorkoutSession, type SportExercise } from '@/store/localStore';

const SPORT_TABS = [
  { id: 'dzisiaj',   label: 'Dzisiaj' },
  { id: 'szablony',  label: 'Szablony' },
  { id: 'sesja',     label: 'Aktywna sesja' },
  { id: 'historia',  label: 'Historia' },
  { id: 'analiza',   label: 'Analiza' },
  { id: 'cwiczenia', label: 'Ćwiczenia' },
  { id: 'odczucia',  label: 'Odczucia' },
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
function volFromSets(sets: WorkoutSet[]) {
  return sets.filter(s => s.completed).reduce((a, s) => a + s.weight * s.reps, 0);
}

export function SportScreen() {
  const [tab, setTab] = useState('dzisiaj');
  const { activeSession } = useLocalStore();

  useEffect(() => {
    if (activeSession && tab !== 'sesja') setTab('sesja');
  }, [activeSession]);

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">🏋️ Sport</h1>
        <SubTabs tabs={SPORT_TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'dzisiaj'   && <SportToday onStartSession={() => setTab('sesja')} />}
      {tab === 'szablony'  && <SportTemplates />}
      {tab === 'sesja'     && <SportActiveSession onSessionEnd={() => setTab('historia')} />}
      {tab === 'historia'  && <SportHistory />}
      {tab === 'analiza'   && <SportAnalysis />}
      {tab === 'cwiczenia' && <SportExercises />}
      {tab === 'odczucia'  && <SportFeelings />}
    </div>
  );
}

// ─── DZISIAJ ──────────────────────────────────────────────────

function SportToday({ onStartSession }: { onStartSession: () => void }) {
  const { templates, sessions, startSession } = useLocalStore();
  const nextTemplate = templates.find(t => t.isActive) ?? templates[0];
  const lastSession = sessions[0];
  const weekSessions = sessions.filter(s => {
    const diff = (Date.now() - new Date(s.date).getTime()) / 86400000;
    return diff <= 7;
  });
  const weekVol = weekSessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + volFromSets(e.sets), 0), 0);
  const weekTime = weekSessions.reduce((a, s) => a + (s.duration ?? 0), 0);

  function handleStart() {
    if (!nextTemplate) return;
    startSession({
      templateId: nextTemplate.id,
      templateName: nextTemplate.name,
      sportType: nextTemplate.sportType,
      currentExerciseIndex: 0,
      exercises: nextTemplate.exercises.map(e => ({
        ...e,
        sets: e.sets.map(s => ({ ...s, completed: false }))
      })),
    });
    onStartSession();
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Dzisiejszy trening</span></div>
          {nextTemplate ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-soft2)', display: 'grid', placeItems: 'center', fontSize: 20 }}>🏋️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{nextTemplate.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{nextTemplate.sportType} · {nextTemplate.estimatedDuration} min</div>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStart}>▶ Rozpocznij sesję</button>
            </>
          ) : (
            <EmptyState title="Brak szablonu" desc="Dodaj szablon treningowy." />
          )}
        </div>

        {lastSession && (
          <div className="card">
            <div className="card-head"><span className="card-title">Ostatnia sesja</span></div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{lastSession.templateName}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>{fmtDate(lastSession.date)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Czas', val: `${lastSession.duration ?? 0} min` },
                { label: 'Objętość', val: `${(lastSession.exercises.reduce((a, e) => a + volFromSets(e.sets), 0) / 1000).toFixed(1)} t` },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Tydzień</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Treningi', val: `${weekSessions.length}` },
              { label: 'Czas', val: `${weekTime} min` },
              { label: 'Objętość', val: `${Math.round(weekVol / 100) / 10} t` },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.label}</div>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Aktywności</span></div>
          {['Siłownia','Bieganie','Wspinaczka','Mobilność','Rehabilitacja'].map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{type}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-text)' }}>
                {weekSessions.filter(s => s.sportType === type).length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SZABLONY ─────────────────────────────────────────────────

function SportTemplates() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, exercises } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const editingTemplate = templates.find(t => t.id === editId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Szablony</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowy</button>
        </div>
        {templates.length === 0
          ? <EmptyState title="Brak szablonów" cta="Dodaj szablon" onCta={() => setShowAdd(true)} />
          : templates.map(t => (
            <div key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer', background: editId===t.id ? 'var(--green-soft2)' : undefined, margin: '0 -16px' }}
              onClick={() => setEditId(t.id)}
            >
              <span style={{ fontSize: 20 }}>🏋️</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.sportType} · {t.exercises.length} ćw.</div>
              </div>
              <span className={`badge ${t.isActive ? 'badge-green' : 'badge-gray'}`}>{t.isActive ? 'Aktywny' : ''}</span>
              <button className="icon-btn" onClick={e => { e.stopPropagation(); setDeleteId(t.id); }}><IcoTrash /></button>
            </div>
          ))
        }
      </div>

      {editingTemplate
        ? <TemplateDetail template={editingTemplate} onUpdate={p => updateTemplate(editingTemplate.id, p)} />
        : <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 }}>
            <EmptyState title="Wybierz szablon" desc="Kliknij szablon po lewej." />
          </div>
      }

      <AddTemplateModal open={showAdd} onClose={() => setShowAdd(false)} exercises={exercises}
        onSave={data => { addTemplate(data); setShowAdd(false); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTemplate(deleteId!); setEditId(null); setDeleteId(null); }} label="ten szablon" />
    </div>
  );
}

function TemplateDetail({ template, onUpdate }: { template: WorkoutTemplate; onUpdate: (p: Partial<WorkoutTemplate>) => void }) {
  return (
    <div className="card">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700 }}>{template.name}</h2>
          <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:2 }}>{template.sportType} · ~{template.estimatedDuration} min</div>
        </div>
        <button className={`btn btn-sm ${template.isActive ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => onUpdate({ isActive: !template.isActive })}>
          {template.isActive ? 'Dezaktywuj' : 'Aktywuj'}
        </button>
      </div>
      {template.description && <p style={{ fontSize:13, color:'var(--ink-2)', marginBottom:16 }}>{template.description}</p>}
      <SectionHead title="Ćwiczenia" />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {template.exercises.map((ex, i) => (
          <div key={ex.exerciseId} style={{ background:'var(--surface-3)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{i+1}. {ex.exerciseName}</div>
            <div style={{ fontSize:12, color:'var(--ink-3)' }}>
              {ex.sets.length} serii · {ex.sets[0]?.reps} pow. · {ex.sets[0]?.weight > 0 ? `${ex.sets[0].weight} kg` : 'masa ciała'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTemplateModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; exercises: SportExercise[]; onSave: (t: Omit<WorkoutTemplate,'id'|'createdAt'|'updatedAt'>) => void }) {
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('Siłownia');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState(60);

  return (
    <Modal open={open} onClose={onClose} title="Nowy szablon"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!name.trim()) return;
          onSave({ name, sportType, description: desc, estimatedDuration: duration, exercises: [], isActive: true });
          setName(''); setDesc('');
        }}>Zapisz</button>
      </>}>
      <Field label="Nazwa" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Push A — Klatka" /></Field>
      <Field label="Typ"><select className="select" value={sportType} onChange={e => setSportType(e.target.value)}>
        {['Siłownia','Bieganie','Wspinaczka','Mobilność','Rehabilitacja'].map(t => <option key={t}>{t}</option>)}
      </select></Field>
      <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
      <Field label={`Czas: ${duration} min`}><input type="range" min={15} max={180} step={5} value={duration} onChange={e => setDuration(+e.target.value)} style={{ width:'100%' }} /></Field>
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
            <span style={{ fontSize:20 }}>🏋️</span>
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
                    background: i===currentExerciseIndex ? 'var(--green)' : done ? 'var(--green-soft2)' : 'var(--surface-3)',
                    color: i===currentExerciseIndex ? 'white' : done ? 'var(--green-text)' : 'var(--ink-2)' }}>
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
                    <tr key={si} style={{ background: set.completed ? 'var(--green-soft2)' : undefined }}>
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

function SportHistory() {
  const { sessions } = useLocalStore();
  if (!sessions || sessions.length === 0) return <EmptyState title="Brak historii treningów" desc="Ukończ pierwszą sesję, aby zobaczyć historię." />;

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map((s: WorkoutSession) => <SessionCard key={s.id} session={s} />)}
    </div>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const totalVol = session.exercises.reduce((sum, ex) => sum + volFromSets(ex.sets), 0);
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{session.templateName}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{new Date(session.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ink-3)' }}>
          {session.duration && <span>⏱ {session.duration} min</span>}
          <span>📦 {totalSets} serii</span>
          <span>💪 {totalVol.toLocaleString('pl-PL')} kg obj.</span>
        </div>
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

function SportAnalysis() {
  const { sessions } = useLocalStore();
  const last8 = [...(sessions || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).reverse();
  const totalVols = last8.map(s => s.exercises.reduce((sum, ex) => sum + volFromSets(ex.sets), 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-head"><span className="card-title">Wolumen (ostatnie 8 treningów)</span></div>
        {last8.length === 0
          ? <EmptyState title="Brak danych" desc="Ukończ treningi, aby zobaczyć analizę." />
          : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
              {last8.map((s, i) => {
                const maxVol = Math.max(...totalVols, 1);
                const pct = totalVols[i] / maxVol;
                return (
                  <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(totalVols[i] / 1000)}k</div>
                    <div style={{ width: '100%', background: 'var(--green-soft2)', borderRadius: '4px 4px 0 0', height: `${Math.max(pct * 80, 4)}px`, transition: 'height 0.3s' }} />
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{new Date(s.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Treningi (łącznie)', val: (sessions || []).length },
          { label: 'Ten miesiąc', val: (sessions || []).filter(s => s.date.startsWith(new Date().toISOString().slice(0,7))).length },
          { label: 'Seria dni', val: 0 },
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
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('Klatka');
  const [equipment, setEquipment] = useState('Sztanga');

  const MUSCLES = ['Klatka','Plecy','Nogi','Barki','Biceps','Triceps','Brzuch','Cardio'];
  const EQUIPMENTS = ['Sztanga','Hantle','Maszyna','Własna waga','Kettlebell','Linka'];

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Baza ćwiczeń ({exercises.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowe ćwiczenie</button>
        </div>
        <table className="table">
          <thead><tr><th>NAZWA</th><th>MIĘSIEŃ</th><th>SPRZĘT</th></tr></thead>
          <tbody>
            {exercises.map(ex => (
              <tr key={ex.id}>
                <td style={{ fontWeight: 600 }}>{ex.name}</td>
                <td><span className="badge badge-gray">{ex.muscleGroup}</span></td>
                <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{ex.equipment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowe ćwiczenie"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addExercise({ name, muscleGroup: muscle, equipment, sportType: '', notes: '' });
            setName(''); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa ćwiczenia" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Wyciskanie sztangi" /></Field>
        <div className="form-grid">
          <Field label="Partia mięśniowa"><select className="select" value={muscle} onChange={e => setMuscle(e.target.value)}>{MUSCLES.map(m => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Sprzęt"><select className="select" value={equipment} onChange={e => setEquipment(e.target.value)}>{EQUIPMENTS.map(e => <option key={e}>{e}</option>)}</select></Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── ODCZUCIA ─────────────────────────────────────────────────

function SportFeelings() {
  const feelings: any[] = [];
  const sorted = [...(feelings || [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card">
        <div className="card-head"><span className="card-title">Dziennik odczuć</span></div>
        {sorted.length === 0
          ? <EmptyState title="Brak odczuć" desc="Odczucia możesz dodać po zakończeniu sesji treningowej." />
          : sorted.map(f => (
            <div key={f.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{new Date(f.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span>Energia: <strong>{f.energyLevel}/10</strong></span>
                  <span>Sen: <strong>{f.sleepHours}h</strong></span>
                  {f.bodyWeight && <span>Waga: <strong>{f.bodyWeight}kg</strong></span>}
                </div>
              </div>
              {f.notes && <div style={{ fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic' }}>"{f.notes}"</div>}
              {f.soreness && f.soreness.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {f.soreness.map((s: string) => <span key={s} style={{ fontSize: 11, padding: '2px 7px', background: 'rgba(239,68,68,0.08)', color: 'var(--p-high)', borderRadius: 99 }}>{s}</span>)}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
