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
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={score >= 70 ? 'var(--acc-a)' : score >= 40 ? 'var(--acc-b)' : 'var(--acc-b)'}
                    strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={dash} strokeDashoffset={offset}
                    transform="rotate(-90 50 50)" />
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
            <div className="meas" style={{ marginTop: 12 }}>
              <div className="meas-row">
                <span className="mn">Sen</span>
                <input type="number" placeholder="h" value={sleepH} onChange={(e) => setSleepH(e.target.value)} inputMode="decimal" />
                <span className="mu">h</span>
              </div>
              <div className="meas-row">
                <span className="mn">HRV</span>
                <input type="number" placeholder="ms" value={hrv} onChange={(e) => setHrv(e.target.value)} inputMode="numeric" />
                <span className="mu">ms</span>
              </div>
              <div className="meas-row">
                <span className="mn">Tętno spocz.</span>
                <input type="number" placeholder="bpm" value={hr} onChange={(e) => setHr(e.target.value)} inputMode="numeric" />
                <span className="mu">bpm</span>
              </div>
              <div className="meas-row">
                <span className="mn">Zakwasy</span>
                <input type="number" placeholder="0–5" value={soreness} onChange={(e) => setSoreness(e.target.value)} inputMode="numeric" min={0} max={5} />
                <span className="mu">/5</span>
              </div>
            </div>
            <button className="meas-edit" style={{ marginTop: 12, width: '100%' }} type="button" onClick={saveReadiness} disabled={upsertReadiness.isPending}>
              {upsertReadiness.isPending ? 'Zapisywanie…' : 'Zapisz gotowość'}
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
            <div className="meas" style={{ marginTop: 12 }}>
              <div className="meas-row">
                <span className="mn">Waga</span>
                <input type="number" placeholder="0.0" value={bWeight} onChange={(e) => setBWeight(e.target.value)} inputMode="decimal" />
                <span className="mu">kg</span>
              </div>
              <div className="meas-row">
                <span className="mn">Tłuszcz</span>
                <input type="number" placeholder="0.0" value={bFat} onChange={(e) => setBFat(e.target.value)} inputMode="decimal" />
                <span className="mu">%</span>
              </div>
              <div className="meas-row">
                <span className="mn">LBM</span>
                <input type="number" placeholder="0.0" value={bLean} onChange={(e) => setBLean(e.target.value)} inputMode="decimal" />
                <span className="mu">kg</span>
              </div>
            </div>
            <button className="meas-edit" style={{ marginTop: 12, width: '100%' }} type="button" onClick={saveMeasurement} disabled={addMeasure.isPending}>
              {addMeasure.isPending ? 'Zapisywanie…' : 'Zapisz pomiar'}
            </button>
          </article>
        )}

        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="card-title">Integracje</span></div>
          </div>
          <div className="integ">
            <div className="integ-row">
              <div className="integ-icon strava">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <div className="integ-info"><div className="integ-name">Strava</div></div>
              <div className="integ-status">Niepołączono</div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 10, marginBottom: 0 }}>Strava w Fazie 3.</p>
        </article>
      </section>

      {/* CENTER: training */}
      <section className="col">
        {showWorkout && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Dzisiejszy trening</span></div>
              <span className="pill">{todayWo ? todayWo.status : 'Brak'}</span>
            </div>
            {todayWo ? (
              <div>
                <div className="th-name" style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{todayWo.name}</div>
                {todayWo.type && <div className="th-sub">{todayWo.type}</div>}
                <div className="sess-actions" style={{ marginTop: 10 }}>
                  <button className="btn-primary" type="button"
                    onClick={() => patchWorkout.mutate({ id: todayWo.id, patch: { status: 'done' } })}
                    disabled={todayWo.status === 'done'}>
                    {todayWo.status === 'done' ? '✓ Zrobione' : 'Oznacz jako zrobione'}
                  </button>
                  <button className="btn-ghost" type="button" onClick={() => setSelectedWoId(todayWo.id)}>
                    Logger →
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="agenda-empty" style={{ marginBottom: 12 }}>Brak sesji na dziś.</div>
                <div className="he-grid" style={{ marginBottom: 8 }}>
                  <input type="text" className="fi" placeholder="Nazwa treningu" value={newWoName} onChange={(e) => setNewWoName(e.target.value)} />
                  <input type="text" className="fi" placeholder="Typ (Push, Pull…)" value={newWoType} onChange={(e) => setNewWoType(e.target.value)} />
                </div>
                <button className="btn-primary" type="button" onClick={addWorkout} disabled={createWorkout.isPending}>
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
                <select className="fi-sel" value={selectedWoId ?? ''} onChange={(e) => setSelectedWoId(e.target.value || null)}
                  style={{ fontSize: 12, padding: '4px 28px 4px 8px', width: 'auto', maxWidth: 200 }}>
                  <option value="">-- Wybierz sesję --</option>
                  {workouts.map((w) => <option key={w.id} value={w.id}>{w.date} · {w.name}</option>)}
                </select>
              )}
            </div>
            {!selectedWoId ? (
              <div className="agenda-empty">Wybierz sesję powyżej lub utwórz trening.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                  <input type="text" className="fi" placeholder="Ćwiczenie" value={exName} onChange={(e) => setExName(e.target.value)} style={{ flex: '2 1 120px' }} />
                  <input type="number" className="set-inp" placeholder="kg" value={setWeight} onChange={(e) => setSetWeight(e.target.value)} inputMode="decimal" style={{ width: 64 }} />
                  <input type="number" className="set-inp" placeholder="powt." value={setReps} onChange={(e) => setSetReps(e.target.value)} inputMode="numeric" style={{ width: 64 }} />
                  <input type="number" className="set-inp" placeholder="RIR" value={setRir} onChange={(e) => setSetRir(e.target.value)} inputMode="numeric" style={{ width: 52 }} />
                  <button className="btn-primary" type="button" onClick={logSet} disabled={addSet.isPending} style={{ padding: '8px 14px', flexShrink: 0 }}>
                    Loguj
                  </button>
                </div>
                {sets.length === 0 ? (
                  <div className="agenda-empty">Brak serii — dodaj pierwszą.</div>
                ) : (
                  <div className="logger">
                    {Object.entries(
                      sets.reduce<Record<string, typeof sets>>((acc, s) => {
                        (acc[s.exercise_name] ??= []).push(s);
                        return acc;
                      }, {}),
                    ).map(([ex, exSets]) => (
                      <div key={ex} className="lg-ex">
                        <div className="lg-ex-head">
                          <span className="n">{ex}</span>
                          <span className="t">{exSets.length} ser.</span>
                        </div>
                        <div className="set-cols">
                          <div>#</div><div>kg</div><div>Powt.</div><div>≈1RM</div><div />
                        </div>
                        {exSets.map((s) => (
                          <div key={s.id} className="set-row">
                            <span className="sn">{s.set_no}</span>
                            <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{s.weight}</span>
                            <span className="tnum" style={{ fontSize: 13 }}>{s.reps}</span>
                            <span className="tnum" style={{ fontSize: 12, color: 'var(--acc-a-ink)', fontWeight: 600 }}>
                              {epley(s.weight, s.reps)}
                            </span>
                            <button type="button" onClick={() => delSet.mutate({ id: s.id, workoutId: selectedWoId })}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 15, lineHeight: 1 }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
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
              <>
                {workouts.slice(0, 8).map((w) => (
                  <div key={w.id} className="sh-row">
                    <div className="sh-date">
                      <div className="dd">{w.date.slice(8, 10)}</div>
                      <div className="mo">{w.date.slice(5, 7)}.{w.date.slice(2, 4)}</div>
                    </div>
                    <div className="sh-main">
                      <div className="n">
                        <span className="sh-tag" style={{ background: w.status === 'done' ? 'var(--acc-a)' : 'var(--surface-inset)' }} />
                        {w.name}
                      </div>
                      {w.type && <div className="m">{w.type}</div>}
                    </div>
                    <div className="sh-feel">
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: w.status === 'done' ? 'var(--acc-a-soft)' : 'var(--surface-inset)', color: w.status === 'done' ? 'var(--acc-a-ink)' : 'var(--ink-3)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                        {w.status}
                      </span>
                    </div>
                    <button type="button" onClick={() => deleteWorkout.mutate(w.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
              </>
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
              <>
                {Object.entries(
                  sets.reduce<Record<string, { w: number; r: number }>>((acc, s) => {
                    const e1rm = epley(s.weight, s.reps);
                    if (!acc[s.exercise_name] || e1rm > epley(acc[s.exercise_name].w, acc[s.exercise_name].r)) {
                      acc[s.exercise_name] = { w: s.weight, r: s.reps };
                    }
                    return acc;
                  }, {}),
                ).map(([ex, { w, r }]) => (
                  <div key={ex} className="pb-row">
                    <div className="pb-mark" style={{ background: 'var(--acc-a)' }} />
                    <div className="nm"><div className="n">{ex}</div><div className="d">{w}kg × {r} powt.</div></div>
                    <div className="pb-val tnum">{epley(w, r)}<small>kg</small></div>
                  </div>
                ))}
              </>
            )}
          </article>
        )}
        {showRunning && card('Bieganie', 'Aktywności ze Stravy (Faza 3).', 'Strava')}
        {showRehab && card('Rehabilitacja i mobilność', 'Ćwiczenia rehab i mobility.', 'Rutyna')}
      </section>
    </main>
  );
}
