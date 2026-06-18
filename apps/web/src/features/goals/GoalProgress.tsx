import { Link } from 'react-router-dom';
import { useGoals } from './hooks';
import { categoryIconClass } from './types';

/** Read-only Start widget: top goals with progress bars.
 *  Editing happens in the Cele module. */
export function GoalProgress() {
  const { data, isLoading, isError, refetch } = useGoals();

  if (isLoading) return <div className="note-peek">Ładowanie celów…</div>;
  if (isError) {
    return (
      <div>
        <div className="auth-banner warn">Nie udało się wczytać celów.</div>
        <button className="he-btn ghost" type="button" onClick={() => refetch()}>Spróbuj ponownie</button>
      </div>
    );
  }

  const goals = (data ?? []).slice(0, 5);
  if (goals.length === 0) {
    return <div className="agenda-empty">Brak celów. Dodaj je w module Cele.</div>;
  }

  return (
    <div>
      {goals.map((g) => (
        <div className="goal" key={g.id}>
          <div className="gh">
            <span className="gn">
              <span className={`gic ${categoryIconClass(g.category)}`} />
              {g.name}
              {g.category && <small>{g.category}</small>}
            </span>
            <span className="gp tnum">{g.progress}%</span>
          </div>
          <div className="track">
            <i style={{ width: `${g.progress}%` }} />
          </div>
        </div>
      ))}
      <Link to="/goals" className="goals-all">Zobacz wszystkie cele →</Link>
    </div>
  );
}
