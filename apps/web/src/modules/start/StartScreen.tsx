import { useIsFeatureVisible } from '@/features/config/useConfig';
import { TaskList } from '@/features/tasks/TaskList';

/** Start dashboard — assembled incrementally. c1.1 brings the live task list;
 *  remaining widgets (finance pulse, nutrition, calendar, habits…) land in
 *  c1.2–c1.7 and are gated by their feature_key. */
export function StartScreen() {
  const showTasks = useIsFeatureVisible('start.today_tasks');

  return (
    <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 760 }}>
      <section className="col">
        <article className="card session">
          <div className="greet">
            Dzień dobry <span className="em">·</span> dziś
          </div>
          <div className="greet-sub">Faza 1 — pierwszy żywy moduł: zadania</div>
        </article>

        {showTasks && (
          <article className="card today-card" style={{ padding: 'var(--pad)' }}>
            <div className="today-hd">
              <div className="today-hd-l">
                <span className="today-title">DZISIAJ</span>
              </div>
            </div>
            <TaskList />
          </article>
        )}
      </section>
    </main>
  );
}
