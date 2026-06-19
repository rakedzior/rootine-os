import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useBodyMeasurements, useAddBodyMeasurement,
  useWorkouts, useCreateWorkout, useDeleteWorkout, usePatchWorkout,
  useWorkoutSets, useAddWorkoutSet, useDeleteWorkoutSet,
} from '@/features/sport/hooks';
import { useStravaActivities } from '@/features/integrations/hooks';
import '@/styles/health.css';

// 1RM Epley: w * (1 + reps/30)
function epley(weight: number, reps: number) {
  if (reps <= 0) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function SportScreen() {
  const showBody = useIsFeatureVisible('sport.body_measurements');
  const showWorkout = useIsFeatureVisible('sport.today_workout');
  const showLogger = useIsFeatureVisible('sport.workout_logger');
  const showHistory = useIsFeatureVisible('sport.session_history');
  const showProg = useIsFeatureVisible('sport.load_progression');
  const showRunning = useIsFeatureVisible('sport.running');
  const showRehab = useIsFeatureVisible('sport.rehab_mobility');

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

  return (
    <main className="grid">
      {/* LEFT: body + integrations */}
      <section className="col">
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
        {showRunning && <RunningCard />}
        {showRehab && card('Rehabilitacja i mobilność', 'Ćwiczenia rehab i mobility.', 'Rutyna')}
      </section>
    </main>
  );
}

function RunningCard() {
  const activQ = useStravaActivities(10);
  const runs = (activQ.data ?? []).filter((a) => a.type === 'Run' || a.type === 'VirtualRun');

  function fmt(distM: number | null) {
    if (!distM) return '—';
    return `${(distM / 1000).toFixed(2)} km`;
  }
  function fmtPace(s: number | null) {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')} /km`;
  }
  function fmtDur(s: number | null) {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Bieganie</span></div>
        {activQ.isFetching && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>↻</span>}
      </div>
      {runs.length === 0 ? (
        <div className="note-peek">
          {activQ.isLoading ? 'Ładowanie…' : 'Brak biegów · Połącz Stravę w Ustawienia → Integracje'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {runs.map((r) => (
            <div key={r.id} className="sh-row">
              <div className="sh-date">
                {new Date(r.start_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
              </div>
              <div className="sh-main">
                <div className="sh-title">{r.name}</div>
                <div className="m" style={{ display: 'flex', gap: 10 }}>
                  <span>{fmt(r.distance_m)}</span>
                  <span>{fmtDur(r.duration_s)}</span>
                  {r.avg_pace_s && <span>{fmtPace(r.avg_pace_s)}</span>}
                  {r.avg_hr && <span>♥ {r.avg_hr}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
