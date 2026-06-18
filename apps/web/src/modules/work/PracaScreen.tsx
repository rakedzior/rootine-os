import { useState } from 'react';
import '@/styles/work.css';

type Sec = 'dashboard' | 'companies' | 'tasks';

const SECTIONS: { key: Sec; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'companies', label: 'Firmy & Projekty' },
  { key: 'tasks', label: 'Zadania' },
];

const COLUMNS = ['Do zrobienia', 'W toku', 'Zrobione'];

export function PracaScreen() {
  const [sec, setSec] = useState<Sec>('dashboard');
  return (
    <div className="app" style={{ minHeight: 'auto' }}>
      <div className="work-subnav">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`work-nav-btn${sec === s.key ? ' active' : ''}`}
            type="button"
            onClick={() => setSec(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 1100 }}>
        <section className="col">
          {sec === 'dashboard' && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="card-title">Kanban projektów</span></div>
                <span className="pill">Wkrótce</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)', marginTop: 8 }}>
                {COLUMNS.map((col) => (
                  <div key={col} style={{ background: 'var(--surface-inset)', borderRadius: 'var(--r-mid)', padding: 14, minHeight: 160 }}>
                    <div className="card-title" style={{ marginBottom: 10 }}>{col}</div>
                    <div className="agenda-empty">Brak zadań</div>
                  </div>
                ))}
              </div>
            </article>
          )}
          {sec === 'companies' && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Firmy i projekty</span></div><span className="pill">Wkrótce</span></div>
              <div className="agenda-empty">Firmy / klienci i ich projekty — CRUD wkrótce.</div>
            </article>
          )}
          {sec === 'tasks' && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Zadania</span></div><span className="pill">Wkrótce</span></div>
              <div className="agenda-empty">Zadania, subtaski, statusy, terminy — CRUD wkrótce.</div>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
