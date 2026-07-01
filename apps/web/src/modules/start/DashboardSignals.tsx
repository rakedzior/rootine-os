import { Link } from 'react-router-dom';
import { useNextWorkout } from '@/features/sport/hooks';
import { useTodayMealItems, useNutritionTarget } from '@/features/diet/hooks';

/** Relative Polish day label for a YYYY-MM-DD date. */
function whenLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff <= 0) return 'Dziś';
  if (diff === 1) return 'Jutro';
  if (diff < 7) return d.toLocaleDateString('pl-PL', { weekday: 'long' });
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

/** Supporting signal: the next planned training session. */
export function SportSignal() {
  const { data: next, isLoading } = useNextWorkout();
  return (
    <div className="card signal-card">
      <div className="signal-head">
        <span className="signal-title">Trening</span>
        <Link to="/sport" className="signal-link">Sport</Link>
      </div>
      {isLoading ? (
        <div className="signal-empty"><p>Wczytywanie…</p></div>
      ) : next ? (
        <Link to="/sport" className="signal-body">
          <span className="signal-when">{whenLabel(next.scheduled_date)}</span>
          <span className="signal-main">{next.title}</span>
          <span className="signal-sub">
            {next.subtitle || (next.planned_duration_min ? `${next.planned_duration_min} min` : 'Trening')}
          </span>
        </Link>
      ) : (
        <div className="signal-empty">
          <p>Brak zaplanowanych treningów.</p>
          <Link to="/sport" className="signal-cta">Zaplanuj trening</Link>
        </div>
      )}
    </div>
  );
}

/** Supporting signal: today's nutrition status (consumed vs. target). */
export function DietSignal() {
  const { data: items, isLoading } = useTodayMealItems();
  const { data: target } = useNutritionTarget();

  const consumed = (items ?? []).reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carb: a.carb + i.carb, fat: a.fat + i.fat }),
    { kcal: 0, protein: 0, carb: 0, fat: 0 },
  );
  const kcal = Math.round(consumed.kcal);
  const kcalTarget = target?.kcal_target ?? 0;
  const hasItems = (items?.length ?? 0) > 0;
  const pct = kcalTarget > 0 ? Math.min(100, Math.round((kcal / kcalTarget) * 100)) : 0;
  const remaining = kcalTarget > 0 ? Math.max(0, kcalTarget - kcal) : null;

  return (
    <div className="card signal-card">
      <div className="signal-head">
        <span className="signal-title">Odżywianie</span>
        <Link to="/diet" className="signal-link">Dieta</Link>
      </div>
      {isLoading ? (
        <div className="signal-empty"><p>Wczytywanie…</p></div>
      ) : !hasItems ? (
        <div className="signal-empty">
          <p>Brak posiłków na dziś.</p>
          <Link to="/diet" className="signal-cta">Dodaj posiłek</Link>
        </div>
      ) : (
        <Link to="/diet" className="signal-body">
          <span className="signal-kcal">
            <b>{kcal}</b>
            {kcalTarget > 0 && <span> / {kcalTarget} kcal</span>}
          </span>
          {kcalTarget > 0 && (
            <span className="signal-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
          )}
          <span className="signal-macros">
            <span>B {Math.round(consumed.protein)}g</span>
            <span>W {Math.round(consumed.carb)}g</span>
            <span>T {Math.round(consumed.fat)}g</span>
            {remaining !== null && <span className="signal-macros-rem">Zostało {remaining} kcal</span>}
          </span>
        </Link>
      )}
    </div>
  );
}
