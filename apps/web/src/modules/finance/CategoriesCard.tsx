import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/features/finance/hooks';

const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

const PRESET_CATEGORIES = [
  { name: 'Życie', kind: 'expense' },
  { name: 'Firma', kind: 'expense' },
  { name: 'Auto', kind: 'expense' },
  { name: 'Mieszkanie', kind: 'expense' },
  { name: 'Podróże', kind: 'expense' },
  { name: 'Oszczędności', kind: 'expense' },
  { name: 'Podatki', kind: 'expense' },
  { name: 'Wynagrodzenie', kind: 'income' },
  { name: 'Inne', kind: 'income' },
];

export function CategoriesCard() {
  const { data, isLoading, isError, refetch } = useCategories();
  const create = useCreateCategory();
  const del = useDeleteCategory();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('expense');
  const [showPresets, setShowPresets] = useState(false);

  const existing = data ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate({ name: n, kind });
    setName('');
  };

  function addPreset(preset: { name: string; kind: string }) {
    if (existing.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) return;
    create.mutate(preset);
  }

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Kategorie</span></div>
        {!isLoading && existing.length === 0 && (
          <button type="button" className="pill" style={{ cursor: 'pointer', background: 'var(--acc-a-soft)', color: 'var(--acc-a-ink)' }}
            onClick={() => PRESET_CATEGORIES.forEach(addPreset)}>
            Dodaj domyślne
          </button>
        )}
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
          {existing.length === 0 && <div className="agenda-empty">Brak kategorii. Kliknij „Dodaj domyślne" lub utwórz ręcznie.</div>}
          {existing.map((c) => (
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

      {showPresets && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4 }}>
          {PRESET_CATEGORIES.filter((p) => !existing.some((c) => c.name.toLowerCase() === p.name.toLowerCase())).map((p) => (
            <button key={p.name} type="button" onClick={() => addPreset(p)}
              style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--ink-2)' }}>
              + {p.name}
            </button>
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
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <button className="btn" type="submit" disabled={create.isPending} style={{ flex: 1 }}>Dodaj</button>
          <button type="button" className="he-btn ghost" onClick={() => setShowPresets((v) => !v)} style={{ flexShrink: 0 }}>
            {showPresets ? 'Ukryj' : 'Szybkie'}
          </button>
        </div>
      </form>
    </article>
  );
}
