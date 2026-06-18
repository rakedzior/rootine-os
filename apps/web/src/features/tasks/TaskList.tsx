import { useState } from 'react';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from './hooks';

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

export function TaskList() {
  const { data, isLoading, isError, refetch } = useTasks();
  const create = useCreateTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const [title, setTitle] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    create.mutate({ title: t });
    setTitle('');
  };

  if (isLoading) {
    return <div className="note-peek">Ładowanie zadań…</div>;
  }
  if (isError) {
    return (
      <div>
        <div className="auth-banner warn">Nie udało się wczytać zadań.</div>
        <button className="he-btn ghost" type="button" onClick={() => refetch()}>Spróbuj ponownie</button>
      </div>
    );
  }

  const tasks = data ?? [];

  return (
    <div>
      <div className="todos">
        {tasks.length === 0 && (
          <div className="agenda-empty">Brak zadań. Dodaj pierwsze poniżej.</div>
        )}
        {tasks.map((t) => (
          <div
            key={t.id}
            className={`todo ed-row${t.done ? ' done' : ''}`}
            onClick={() => toggle.mutate({ id: t.id, done: !t.done })}
          >
            <span className="check">{CHECK}</span>
            <span className="t">{t.title}</span>
            {t.scheduled_time && <span className="todo-time">{t.scheduled_time}</span>}
            <button
              className="fl-del"
              type="button"
              aria-label="Usuń zadanie"
              onClick={(e) => {
                e.stopPropagation();
                del.mutate(t.id);
              }}
            >
              {TRASH}
            </button>
          </div>
        ))}
      </div>

      <form className="capture" onSubmit={add} style={{ marginTop: 14 }}>
        <div className="field">
          <span className="lead">Nowe</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dodaj zadanie i naciśnij Enter…"
          />
        </div>
        <button className="btn" type="submit" disabled={create.isPending}>
          {create.isPending ? 'Dodawanie…' : 'Dodaj'}
        </button>
      </form>
    </div>
  );
}
