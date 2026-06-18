import { useIsFeatureVisible } from '@/features/config/useConfig';
import '@/styles/health.css';

/* Faithful port of Health.html (3-column). Live data (readiness, logger,
 * measurements, runs) wired in the Sport CRUD step; static/empty for now. */
export function SportScreen() {
  const showReadiness = useIsFeatureVisible('sport.readiness');
  const showBody = useIsFeatureVisible('sport.body_measurements');
  const showWorkout = useIsFeatureVisible('sport.today_workout');
  const showLogger = useIsFeatureVisible('sport.workout_logger');
  const showWeek = useIsFeatureVisible('sport.week_plan');
  const showProg = useIsFeatureVisible('sport.load_progression');
  const showLoad = useIsFeatureVisible('sport.training_load');
  const showHistory = useIsFeatureVisible('sport.session_history');
  const showRunning = useIsFeatureVisible('sport.running');
  const showRehab = useIsFeatureVisible('sport.rehab_mobility');

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
      {/* LEFT: recovery */}
      <section className="col">
        {showReadiness && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Regeneracja i gotowość</span></div>
              <span className="pill">Ręcznie / HealthKit</span>
            </div>
            <div className="readiness-top">
              <div className="h-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-inset)" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--acc-a)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray="263.9" strokeDashoffset="263.9" transform="rotate(-90 50 50)" />
                </svg>
                <div className="rt"><b className="tnum">—</b><small>Gotowość</small></div>
              </div>
              <div className="meta">
                <div className="a">Brak danych</div>
                <div className="b">Wpisz sen / HRV / tętno</div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--acc-a)' }} />Sen</div><div className="v tnum">—<small>h</small></div></div>
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--ev-blue)' }} />HRV</div><div className="v tnum">—<small>ms</small></div></div>
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--acc-b)' }} />Tętno spocz.</div><div className="v tnum">—<small>bpm</small></div></div>
              <div className="stat-cell"><div className="k"><i style={{ background: 'var(--ev-lav)' }} />Zakwasy</div><div className="v">—</div></div>
            </div>
          </article>
        )}

        {showBody && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="card-title">Pomiary ciała</span></div>
              <span className="pill">30 dni</span>
            </div>
            <div className="metric-head">
              <div className="big tnum">—<small> kg</small></div>
              <div className="delta">—</div>
            </div>
            <div className="stat-grid" style={{ marginTop: 14 }}>
              <div className="stat-cell"><div className="k">Tkanka tłuszczowa</div><div className="v tnum">—<small>%</small></div></div>
              <div className="stat-cell"><div className="k">Masa beztłuszczowa</div><div className="v tnum">—<small>kg</small></div></div>
            </div>
            <div className="agenda-empty" style={{ marginTop: 12 }}>Dodaj pomiary w kroku CRUD.</div>
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
          <div className="diet-hint" style={{ marginTop: 10 }}>Strava w Fazie 3. Garmin poza zakresem.</div>
        </article>
      </section>

      {/* CENTER: training */}
      <section className="col">
        {showWorkout && (
          <article className="card">
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div className="lhs"><span className="card-title">Dzisiejszy trening</span></div>
              <span className="pill">Plan</span>
            </div>
            <div className="th-layout">
              <div className="th-left">
                <span className="th-badge">Planowany</span>
                <div className="th-name">Brak sesji</div>
                <div className="th-sub">Zaplanuj trening, aby zobaczyć szczegóły</div>
                <div className="th-metrics">
                  <div className="th-m"><div><span>Objętość</span><b>— kg</b></div></div>
                  <div className="th-m"><div><span>Czas</span><b>—</b></div></div>
                  <div className="th-m"><div><span>Serie</span><b>—</b></div></div>
                  <div className="th-m"><div><span>Kalorie</span><b>—</b></div></div>
                </div>
                <div className="th-focus">
                  <span className="tf-lbl">Główny fokus</span>
                  <span className="tf-tag">—</span>
                </div>
              </div>
            </div>
          </article>
        )}

        {showLogger && card('Logger serii', 'Ćwiczenie · ciężar · powtórzenia · serie · RIR/RPE — wkrótce (CRUD).', 'Sesja')}
        {showHistory && card('Historia sesji', 'Zapisane sesje pojawią się tutaj.', 'Ostatnie')}
      </section>

      {/* RIGHT: plan & progress */}
      <section className="col">
        {showWeek && card('Plan tygodnia', 'Push / Pull / Nogi — zaplanuj tydzień.', 'Tydzień')}
        {showProg && card('Progresja i 1RM', 'Szacowane 1RM i progresja obciążeń.', 'Trend')}
        {showLoad && card('Obciążenie treningowe', 'Tygodniowa objętość i obciążenie.', 'ACWR')}
        {showRunning && card('Bieganie', 'Aktywności ze Stravy (Faza 3).', 'Strava')}
        {showRehab && card('Rehabilitacja i mobilność', 'Ćwiczenia rehab i mobility.', 'Rutyna')}
      </section>
    </main>
  );
}
