import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useReadinessToday, useUpsertReadiness,
  useBodyMeasurements, useAddBodyMeasurement,
  useWorkouts, useCreateWorkout, useDeleteWorkout, usePatchWorkout,
  useWorkoutSets, useAddWorkoutSet, useDeleteWorkoutSet,
} from '@/features/sport/hooks';
import '@/styles/health.css';

// 1RM Epley: w * (1 + reps/30)
function epley(weight: number, reps: number) {
  if (reps <= 0) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function SportScreen() {
  const showReadiness = useIsFeatureVisible('sport.readiness');
  const showBody = useIsFeatureVisible('sport.body_measurements');
  const showWorkout = useIsFeatureVisible('sport.today_workout');
  const showLogger = useIsFeatureVisible('sport.workout_logger');
  const showHistory = useIsFeatureVisible('sport.session_history');
  const showProg = useIsFeatureVisible('sport.load_progression');
  const showRunning = useIsFeatureVisible('sport.running');
  const showRehab = useIsFeatureVisible('sport.rehab_mobility');

  // Readiness
  const readinessQ = useReadinessToday();
  const upsertReadiness = useUpsertReadiness();
  const [sleepH, setSleepH] = useState('');
  const [hrv, setHrv] = useState('');
  const [hr, setHr] = useState('');
  const [soreness, setSoreness] = useState('');
  const r = readinessQ.data;

  function saveReadiness() {
    upsertReadiness.mutate({
      sleep_h: sleepH ? parseFloat(sleepH) : undefined,
      hrv_ms: hrv ? parseInt(hrv) : undefined,
      resting_hr: hr ? parseInt(hr) : undefined,
      soreness: soreness ? parseInt(soreness) : undefined,
    });
    setSleepH(''); setHrv(''); setHr(''); setSoreness('');
  }

  const readinessScore = r
    ? Math.round(
        ((r.sleep_h ?? 0) / 9) * 40 +
        ((r.hrv_ms ?? 0) / 80) * 30 +
        ((r.resting_hr ? Math.max(0, (80 - r.resting_hr) / 30) : 0)) * 20 +
        ((r.soreness != null ? (5 - r.soreness) / 5 : 0)) * 10,
      )
    : null;

  // Body measurements
  const bodyQ = useBodyMeasurements();
  const addMeasure = useAddBodyMeasurement();
  const [bWeight, setBWeight] = useState('');
  const [bFat, setBFat] = useState('');
  const [bLean, setBLean] = useState('');
  const latestBody = (bodyQ.data ?? [])[0] ?? null;

  function saveMeasurement() {
    addMeasure.mutate({
      weight: bWeight ? parseFloat(bWeight) : null,
      body_fat: bFat ? parseFloat(bFat) : null,
      lean_mass: bLean ? parseFloat(bLean) : null,
    });
    setBWeight(''); setBFat(''); setBLean('');
  }

  // Workouts
  const workoutsQ = useWorkouts();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const patchWorkout = usePatchWorkout();
  const [newWoName, setNewWoName] = useState('');
  const [newWoType, setNewWoType] = useState('');
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const workouts = workoutsQ.data ?? [];
  const todayWo = workouts.find((w) => w.date === new Date().toISOString().split('T')[0]) ?? null;

  function addWorkout() {
    if (!newWoName.trim()) return;
    createWorkout.mutate({ name: newWoName.trim(), type: newWoType || null });
    setNewWoName(''); setNewWoType('');
  }

  // Workout sets logger
  const setsQ = useWorkoutSets(selectedWoId);
  const addSet = useAddWorkoutSet();
  const delSet = useDeleteWorkoutSet();
  const [exName, setExName] = useState('');
  const [setWeight, setSetWeight] = useState('');
  const [setReps, setSetReps] = useState('');
  const [setRir, setSetRir] = useState('');
  const sets = setsQ.data ?? [];

  function logSet() {
    if (!exName.trim() || !setWeight || !setReps) return;
    const nextNo = sets.filter((s) => s.exercise_name === exName.trim()).length + 1;
    addSet.mutate({
      workout_id: selectedWoId,
      exercise_name: exName.trim(),
      weight: parseFloat(setWeight),
      reps: parseInt(setReps),
      set_no: nextNo,
      rir: setRir ? parseInt(setRir) : null,
    });
    setSetWeight(''); setSetReps(''); setSetRir('');
  }

  const card = (title: string, body: string, pill?: string) => (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">{title}</span></div>
        {pill && <span className="pill">{pill}</span>}
      </div>
      <div className="agenda-empty">{body}</div>
    </article>
  );

  const score = readinessScore ?? 0;
  const dash = 263.9;
  const offset = dash - (dash * Math.min(100, score)) / 100;

  return (
    <main className="grid">
      {/* LEFT: recovery */}
      <section className="col">
        {showReadiness && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Regeneracja i gotowość</span></div>
              <span className="pill">Dziś</span>
            </div>
            <div className="readiness-top">
              <div className="h-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-inset)" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={score >= 70 ? 'var(--acc-a)' : score >= 40 ? 'var(--ev-yellow)' : 'var(--acc-b)'}
                    strokeWidth="9" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} transform="rotate(-90 50 50)" />
                </svg>
                <div className="rt"><b className="tnum">{readinessScore ?? '—'}</b><small>Gotowość</small></div>
              </div>
              <div className="meta">
                <div className="a">{r ? (score >= 70 ? 'Dobra gotowość' : score >= 40 ? 'Umiarkowana' : 'Potrzeba odpoczynku') : 'Brak danych'}</div>
                <div className="b">Sen / HRV / tętno</div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--acc-a)' }} />Sen</div><div className="v tnum">{r?.sleep_h ?? '—'}<small>h</small></div></div>
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--ev-blue)' }} />HRV</div><div className="v tnum">{r?.hrv_ms ?? '—'}<small>ms</small></div></div>
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--acc-b)' }} />Tętno spocz.</div><div className="v tnum">{r?.resting_hr ?? '—'}<small>bpm</small></div></div>
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--ev-lav)' }} />Zakwasy</div><div className="v">{r?.soreness != null ? `${r.soreness}/5` : '—'}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
              <input type="number" className="kcal" placeholder="Sen (h)" value={sleepH} onChange={(e) => setSleepH(e.target.value)} inputMode="decimal" />
              <input type="number" className="kcal" placeholder="HRV (ms)" value={hrv} onChange={(e) => setHrv(e.target.value)} inputMode="numeric" />
              <input type="number" className="kcal" placeholder="Tętno (bpm)" value={hr} onChange={(e) => setHr(e.target.value)} inputMode="numeric" />
              <input type="number" className="kcal" placeholder="Zakwasy (0-5)" value={soreness} onChange={(e) => setSoreness(e.target.value)} inputMode="numeric" min={0} max={5} />
            </div>
            <button className="add-btn" style={{ marginTop: 8 }} type="button" onClick={saveReadiness} disabled={upsertReadiness.isPending}>
              Zapisz gotowość
            </button>
          </article>
        )}

        {showBody && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Pomiary ciała</span></div>
              <span className="pill">30 dni</span>
            </div>
            {latestBody ? (
              <div className="metric-head">
                <div className="big tnum">{latestBody.weight ?? '—'}<small> kg</small></div>
                <div className="delta">{latestBody.body_fat != null ? `${latestBody.body_fat}% tłuszczu` : '—'}</div>
              </div>
            ) : (
              <div className="metric-head"><div className="big tnum">—<small> kg</small></div><div className="delta">Brak pomiarów</div></div>
            )}
            <div className="stat-grid" style={{ marginTop: 14 }}>
              <div className="stat-cell"><div className="k">Tłuszcz</div><div className="v tnum">{latestBody?.body_fat ?? '—'}<small>%</small></div></div>
              <div className="stat-cell"><div className="k">Masa beztłuszcz.</div><div className="v tnum">{latestBody?.lean_mass ?? '—'}<small>kg</small></div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
              <input type="number" className="kcal" placeholder="kg" value={bWeight} onChange={(e) => setBWeight(e.target.value)} inputMode="decimal" />
              <input type="number" className="kcal" placeholder="tłuszcz %" value={bFat} onChange={(e) => setBFat(e.target.value)} inputMode="decimal" />
              <input type="number" className="kcal" placeholder="LBM kg" value={bLean} onChange={(e) => setBLean(e.target.value)} inputMode="decimal" />
            </div>
            <button className="add-btn" style={{ marginTop: 8 }} type="button" onClick={saveMeasurement} disabled={addMeasure.isPending}>
              Zapisz pomiar
            </button>
          </article>
        )}

        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="card-title">Integracje</span></div>
          </div>
          <div className="integ">
            <div className="integ-row">
              <div className="integ-icon strava"><svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg></div>
              <div className="integ-info"><div className="integ-name">Strava</div></div>
              <div className="integ-status">Niepołączono</div>
            </div>
          </div>
          <div className="diet-hint" style={{ marginTop: 10 }}>Strava w Fazie 3.</div>
        </article>
      </section>

      {/* CENTER: training */}
      <section className="col">
        {showWorkout && (
          <article className="card">
            <div className="card-head" style={{ marginBottom: 8 }}>
              <div className="lhs"><span className="card-title">Dzisiejszy trening</span></div>
              <span className="pill">{todayWo ? todayWo.status : 'Brak'}</span>
            </div>
            {todayWo ? (
              <div>
                <div className="th-name" style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{todayWo.name}</div>
                {todayWo.type && <div className="th-sub">{todayWo.type}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="add-btn" type="button" onClick={() => patchWorkout.mutate({ id: todayWo.id, patch: { status: 'done' } })} disabled={todayWo.status === 'done'}>
                    {todayWo.status === 'done' ? '✓ Zrobione' : 'Oznacz jako zrobione'}
                  </button>
                  <button type="button" onClick={() => setSelectedWoId(todayWo.id)} style={{ background: 'var(--surface-inset)', border: 'none', borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
                    Logger →
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="agenda-empty" style={{ marginBottom: 10 }}>Brak sesji na dziś.</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="text" placeholder="Nazwa treningu" value={newWoName} onChange={(e) => setNewWoName(e.target.value)} style={{ flex: 1 }} />
                  <input type="text" className="kcal" placeholder="Typ (Push…)" value={newWoType} onChange={(e) => setNewWoType(e.target.value)} />
                </div>
                <button className="add-btn" style={{ marginTop: 6 }} type="button" onClick={addWorkout} disabled={createWorkout.isPending}>
                  + Dodaj trening
                </button>
              </div>
            )}
          </article>
        )}

        {showLogger && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Logger serii</span></div>
              {workouts.length > 0 && (
                <select value={selectedWoId ?? ''} onChange={(e) => setSelectedWoId(e.target.value || null)} style={{ fontSize: 12, padding: '2px 6px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                  <option value="">-- Wybierz sesję --</option>
                  {workouts.map((w) => <option key={w.id} value={w.id}>{w.date} · {w.name}</option>)}
                </select>
              )}
            </div>
            {!selectedWoId ? (
              <div className="agenda-empty">Wybierz sesję powyżej lub utwórz trening.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <input type="text" placeholder="Ćwiczenie" value={exName} onChange={(e) => setExName(e.target.value)} style={{ flex: 2, minWidth: 120 }} />
                  <input type="number" className="kcal" placeholder="kg" value={setWeight} onChange={(e) => setSetWeight(e.target.value)} inputMode="decimal" />
                  <input type="number" className="kcal" placeholder="powt." value={setReps} onChange={(e) => setSetReps(e.target.value)} inputMode="numeric" />
                  <input type="number" className="kcal" placeholder="RIR" value={setRir} onChange={(e) => setSetRir(e.target.value)} inputMode="numeric" />
                  <button className="add-btn" type="button" onClick={logSet} disabled={addSet.isPending}>Loguj</button>
                </div>
                {sets.length === 0 ? (
                  <div className="agenda-empty">Brak serii — dodaj pierwszą.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sets.map((s) => (
                      <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span><b>{s.exercise_name}</b> · Seria {s.set_no}</span>
                        <span className="tnum">{s.weight}kg × {s.reps} {s.rir != null ? `(RIR ${s.rir})` : ''} <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>≈1RM: {epley(s.weight, s.reps)}</span></span>
                        <button type="button" onClick={() => delSet.mutate({ id: s.id, workoutId: selectedWoId })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </article>
        )}

        {showHistory && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Historia sesji</span></div>
              <span className="pill">{workouts.length} sesji</span>
            </div>
            {workouts.length === 0 ? (
              <div className="agenda-empty">Brak sesji treningowych.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workouts.slice(0, 8).map((w) => (
                  <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{w.name}</span>
                      {w.type && <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 6 }}>{w.type}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{w.date}</span>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-inset)' }}>{w.status}</span>
                      <button type="button" onClick={() => deleteWorkout.mutate(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}
      </section>

      {/* RIGHT: plan & progress */}
      <section className="col">
        {showProg && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Progresja i 1RM</span></div>
              <span className="pill">Epley</span>
            </div>
            {sets.length === 0 ? (
              <div className="agenda-empty">Zaloguj serie, aby zobaczyć szacowane 1RM.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Object.entries(
                  sets.reduce<Record<string, { w: number; r: number }>>((acc, s) => {
                    const e1rm = epley(s.weight, s.reps);
                    if (!acc[s.exercise_name] || e1rm > epley(acc[s.exercise_name].w, acc[s.exercise_name].r)) {
                      acc[s.exercise_name] = { w: s.weight, r: s.reps };
                    }
                    return acc;
                  }, {}),
                ).map(([ex, { w, r }]) => (
                  <li key={ex} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{ex}</span>
                    <span className="tnum" style={{ color: 'var(--acc-a)', fontWeight: 600 }}>≈ {epley(w, r)} kg</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}
        {showRunning && card('Bieganie', 'Aktywności ze Stravy (Faza 3).', 'Strava')}
        {showRehab && card('Rehabilitacja i mobilność', 'Ćwiczenia rehab i mobility.', 'Rutyna')}
      </section>
    </main>
  );
}
