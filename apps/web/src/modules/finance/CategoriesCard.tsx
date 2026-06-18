import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/features/finance/hooks';

const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

export function CategoriesCard() {
  const { data, isLoading, isError, refetch } = useCategories();
  const create = useCreateCategory();
  const del = useDeleteCategory();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('expense');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate({ name: n, kind });
    setName('');
  };

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Kategorie</span></div>
      </div>

      {isLoading ? (
        <div className="note-peek">Ładowanie…</div>
      ) : isError ? (
        <div>
          <div className="auth-banner warn">Nie udało się wczytać kategorii.</div>
          <button className="he-btn ghost" type="button" onClick={() => refetch()}>Spróbuj ponownie</button>
        </div>
      ) : (
        <div className="fin-ledger">
          {(data ?? []).length === 0 && <div className="agenda-empty">Brak kategorii.</div>}
          {(data ?? []).map((c) => (
            <div className="fl-row" key={c.id}>
              <div className="fl-info">
                <span className="fl-name">{c.name}</span>
                <span className="fl-ctx">{c.kind === 'income' ? 'wpływ' : 'wydatek'}</span>
              </div>
              <button className="fl-del" type="button" aria-label="Usuń kategorię" onClick={() => del.mutate(c.id)}>
                {TRASH}
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="capture" onSubmit={submit} style={{ flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        <div className="field" style={{ flex: '1 1 180px' }}>
          <span className="lead">Kategoria</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa kategorii…" />
        </div>
        <select className="he-select" value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 130 }}>
          <option value="expense">Wydatek</option>
          <option value="income">Wpływ</option>
        </select>
        <button className="btn" type="submit" disabled={create.isPending}>Dodaj</button>
      </form>
    </article>
  );
}
