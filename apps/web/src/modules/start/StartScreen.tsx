import { useIsFeatureVisible } from '@/features/config/useConfig';
import { TaskList } from '@/features/tasks/TaskList';
import { HabitList } from '@/features/habits/HabitList';
import { GoalProgress } from '@/features/goals/GoalProgress';
import { FinancePulse } from '@/features/finance/FinancePulse';

/** Start dashboard — assembled incrementally. c1.1 tasks, c1.2 habits;
 *  remaining widgets (finance pulse, nutrition, calendar…) land in
 *  c1.3–c1.7, each gated by its feature_key. */
export function StartScreen() {
  const showTasks = useIsFeatureVisible('start.today_tasks');
  const showHabits = useIsFeatureVisible('start.habits');
  const showGoals = useIsFeatureVisible('start.goal_progress');
  const showFinance = useIsFeatureVisible('start.finance_pulse');

  return (
    <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 760 }}>
      <section className="col">
        <article className="card session">
          <div className="greet">
            Dzień dobry <span className="em">·</span> dziś
          </div>
          <div className="greet-sub">Faza 1 — żywe moduły: zadania, nawyki</div>
        </article>

        {showFinance && (
          <article className="card">
            <div className="card-head">
              <div className="lhs">
                <span className="card-title">Puls finansów</span>
              </div>
            </div>
            <FinancePulse />
          </article>
        )}

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

        {showHabits && (
          <article className="card">
            <div className="card-head">
              <div className="lhs">
                <span className="card-title">Nawyki i rutyny</span>
              </div>
            </div>
            <HabitList />
          </article>
        )}

        {showGoals && (
          <article className="card">
            <div className="card-head">
              <div className="lhs">
                <span className="card-title">Postępy w celach</span>
              </div>
            </div>
            <GoalProgress />
          </article>
        )}
      </section>
    </main>
  );
}
