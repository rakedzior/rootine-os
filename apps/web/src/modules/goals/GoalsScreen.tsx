import { useEffect, useMemo, useState } from 'react';
import {
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useMilestones, useCreateMilestone, useToggleMilestone, useUpdateMilestone, useDeleteMilestone,
} from '@/features/goals/hooks';
import { categoryIconClass, computeGoalProgress, type Goal, type Milestone } from '@/features/goals/types';

const CATEGORIES = ['Siła', 'Nauka', 'Finanse', 'Zdrowie', 'Inne'];

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

export function GoalsScreen() {
  const goalsQ = useGoals();
  const milestonesQ = useMilestones();
  const create = useCreateGoal();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const byGoal = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of milestonesQ.data ?? []) {
      const arr = map.get(m.goal_id) ?? [];
      arr.push(m);
      map.set(m.goal_id, arr);
    }
    return map;
  }, [milestonesQ.data]);

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate({ name: n, category });
    setName('');
  };

  return (
    <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 760 }}>
      <section className="col">
        <article className="card session">
          <div className="greet">Cele <span className="em">·</span> postępy</div>
          <div className="greet-sub">Cele i kamienie milowe</div>
        </article>

        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="card-title">Nowy cel</span></div>
          </div>
          <form className="capture" onSubmit={addGoal} style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="field" style={{ flex: '1 1 220px' }}>
              <span className="lead">Cel</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa celu…" />
            </div>
            <select className="he-select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 150 }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn" type="submit" disabled={create.isPending}>
              {create.isPending ? 'Dodawanie…' : 'Dodaj'}
            </button>
          </form>
        </article>

        {goalsQ.isLoading && <article className="card"><div className="note-peek">Ładowanie celów…</div></article>}
        {goalsQ.isError && (
          <article className="card">
            <div className="auth-banner warn">Nie udało się wczytać celów.</div>
            <button className="he-btn ghost" type="button" onClick={() => goalsQ.refetch()}>Spróbuj ponownie</button>
          </article>
        )}
        {goalsQ.data && goalsQ.data.length === 0 && (
          <article className="card"><div className="agenda-empty">Brak celów. Dodaj pierwszy powyżej.</div></article>
        )}

        {(goalsQ.data ?? []).map((g) => (
          <GoalCard key={g.id} goal={g} milestones={byGoal.get(g.id) ?? []} />
        ))}
      </section>
    </main>
  );
}

function GoalCard({ goal, milestones }: { goal: Goal; milestones: Milestone[] }) {
  const update = useUpdateGoal();
  const del = useDeleteGoal();
  const createM = useCreateMilestone();
  const toggleM = useToggleMilestone();
  const updateM = useUpdateMilestone();
  const delM = useDeleteMilestone();
  const [manual, setManual] = useState(goal.progress);
  const [mTitle, setMTitle] = useState('');

  const hasMilestones = milestones.length > 0;
  const derived = hasMilestones ? computeGoalProgress(milestones) : null;
  const shown = derived ?? manual;

  // Persist derived progress to goals.progress so the Start widget stays in
  // sync. Optimistic update sets goal.progress === derived, so this settles.
  useEffect(() => {
    if (derived !== null && derived !== goal.progress) {
      update.mutate({ id: goal.id, patch: { progress: derived } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived, goal.progress, goal.id]);

  const commitManual = () => {
    if (manual !== goal.progress) update.mutate({ id: goal.id, patch: { progress: manual } });
  };

  const addMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const t = mTitle.trim();
    if (!t) return;
    createM.mutate({ goalId: goal.id, title: t });
    setMTitle('');
  };

  const setWeight = (m: Milestone, raw: string) => {
    const v = raw.trim() === '' ? null : Math.max(0, Math.min(100, Number(raw)));
    updateM.mutate({ id: m.id, patch: { weight: Number.isNaN(v as number) ? null : v } });
  };

  return (
    <article className="card">
      <div className="goal" style={{ paddingTop: 0 }}>
        <div className="gh">
          <span className="gn">
            <span className={`gic ${categoryIconClass(goal.category)}`} />
            {goal.name}
            {goal.category && <small>{goal.category}</small>}
          </span>
          <span className="gp tnum">{shown}%</span>
        </div>
        <div className="track"><i style={{ width: `${shown}%` }} /></div>
      </div>

      {hasMilestones ? (
        <div className="diet-hint" style={{ marginTop: 8 }}>
          Postęp liczony z kamieni milowych ({milestones.filter((m) => m.done).length}/{milestones.length}).
          Pole „%" przy kamieniu ustawia własną wagę; puste = równy podział.
        </div>
      ) : (
        <input
          type="range" min={0} max={100} value={manual}
          onChange={(e) => setManual(Number(e.target.value))}
          onPointerUp={commitManual} onBlur={commitManual} onKeyUp={commitManual}
          style={{ width: '100%', marginTop: 12 }}
        />
      )}

      <div className="todos" style={{ marginTop: 8 }}>
        {milestones.map((m) => (
          <div key={m.id} className={`todo ed-row${m.done ? ' done' : ''}`}
            onClick={() => toggleM.mutate({ id: m.id, done: !m.done })}>
            <span className="check">{CHECK}</span>
            <span className="t">{m.title}</span>
            <input
              className="auth-input mono"
              style={{ width: 56, padding: '4px 6px', textAlign: 'right' }}
              inputMode="numeric"
              placeholder="auto"
              defaultValue={m.weight ?? ''}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => setWeight(m, e.target.value)}
              title="Waga w % (puste = auto)"
            />
            <button className="fl-del" type="button" aria-label="Usuń kamień milowy"
              onClick={(e) => { e.stopPropagation(); delM.mutate(m.id); }}>
              {TRASH}
            </button>
          </div>
        ))}
      </div>

      <form className="capture" onSubmit={addMilestone} style={{ marginTop: 10 }}>
        <div className="field">
          <span className="lead">Kamień</span>
          <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Dodaj kamień milowy…" />
        </div>
        <button className="btn" type="submit">Dodaj</button>
      </form>

      <div className="hydro-actions" style={{ marginTop: 12 }}>
        <button className="he-btn ghost" type="button" onClick={() => del.mutate(goal.id)}>Usuń cel</button>
      </div>
    </article>
  );
}
