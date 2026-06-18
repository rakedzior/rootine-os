import { useMemo, useState } from 'react';
import { useHabits, useHabitLogs, useCreateHabit, useDeleteHabit, useToggleHabitLog } from './hooks';
import { habitStats, todayStr } from './dates';
import type { HabitLog } from './types';

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const FLAME = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2c1 3-1 4-2 6-1 1.6-.5 3 1 3 1.2 0 2-1 2-2 1.5 1 3 2.8 3 5a6 6 0 1 1-12 0c0-2 1-3.7 2.5-5C8 12 9 9 12 2z" />
  </svg>
);
const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

export function HabitList() {
  const habitsQ = useHabits();
  const logsQ = useHabitLogs();
  const create = useCreateHabit();
  const del = useDeleteHabit();
  const toggle = useToggleHabitLog();
  const [name, setName] = useState('');
  const today = todayStr();

  // habit_id -> set of completed dates
  const datesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of (logsQ.data ?? []) as HabitLog[]) {
      let s = map.get(l.habit_id);
      if (!s) {
        s = new Set();
        map.set(l.habit_id, s);
      }
      s.add(l.log_date);
    }
    return map;
  }, [logsQ.data]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate({ name: n });
    setName('');
  };

  if (habitsQ.isLoading) return <div className="note-peek">Ładowanie nawyków…</div>;
  if (habitsQ.isError) {
    return (
      <div>
        <div className="auth-banner warn">Nie udało się wczytać nawyków.</div>
        <button className="he-btn ghost" type="button" onClick={() => habitsQ.refetch()}>Spróbuj ponownie</button>
      </div>
    );
  }

  const habits = habitsQ.data ?? [];

  return (
    <div>
      <div id="habitList">
        {habits.length === 0 && (
          <div className="agenda-empty">Brak nawyków. Dodaj pierwszy poniżej.</div>
        )}
        {habits.map((h) => {
          const stats = habitStats(datesByHabit.get(h.id) ?? new Set(), today);
          return (
            <div
              key={h.id}
              className={`habit ed-row${stats.doneToday ? ' done' : ''}`}
              onClick={() => toggle.mutate({ habitId: h.id, date: today, done: !stats.doneToday })}
            >
              <span className="check">{CHECK}</span>
              <div className="info">
                <div className="n">{h.name}</div>
                {h.category && <div className="c">{h.category}</div>}
              </div>
              <div className="hab-dots" aria-label="Ostatnie 7 dni">
                {stats.week.map((on, i) => (
                  <span key={i} className={`hd-dot${on ? ' on' : ''}`} />
                ))}
              </div>
              <span className="streak" title="Seria dni">
                {FLAME}
                {stats.streak}
              </span>
              <button
                className="fl-del"
                type="button"
                aria-label="Usuń nawyk"
                onClick={(e) => {
                  e.stopPropagation();
                  del.mutate(h.id);
                }}
              >
                {TRASH}
              </button>
            </div>
          );
        })}
      </div>

      <form className="capture" onSubmit={add} style={{ marginTop: 14 }}>
        <div className="field">
          <span className="lead">Nawyk</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dodaj nawyk i naciśnij Enter…"
          />
        </div>
        <button className="btn" type="submit" disabled={create.isPending}>
          {create.isPending ? 'Dodawanie…' : 'Dodaj'}
        </button>
      </form>
    </div>
  );
}
