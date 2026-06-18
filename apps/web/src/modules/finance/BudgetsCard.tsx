import { useMemo, useState } from 'react';
import { useBudgets, useCreateBudget, useDeleteBudget, useCategories, useTransactions } from '@/features/finance/hooks';
import { formatMoney, monthExpenseByCategory, currentYearMonth, type Category } from '@/features/finance/types';

const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

export function BudgetsCard() {
  const budgetsQ = useBudgets();
  const categoriesQ = useCategories();
  const txQ = useTransactions();
  const create = useCreateBudget();
  const del = useDeleteBudget();

  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  const expenseCats = (categoriesQ.data ?? []).filter((c) => c.kind === 'expense');
  const catById = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categoriesQ.data ?? []) m.set(c.id, c);
    return m;
  }, [categoriesQ.data]);

  const spentByCat = useMemo(
    () => monthExpenseByCategory(txQ.data ?? [], currentYearMonth()),
    [txQ.data],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lim = Number(limit);
    if (!categoryId || !lim) return;
    const cat = catById.get(categoryId);
    create.mutate({ name: cat?.name ?? 'Budżet', category_id: categoryId, limit_amount: lim });
    setLimit('');
  };

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Budżety (ten miesiąc)</span></div>
      </div>

      {budgetsQ.isLoading ? (
        <div className="note-peek">Ładowanie…</div>
      ) : budgetsQ.isError ? (
        <div className="auth-banner warn">Nie udało się wczytać budżetów.</div>
      ) : (
        <div>
          {(budgetsQ.data ?? []).length === 0 && (
            <div className="agenda-empty">Brak budżetów. Dodaj poniżej (wymaga kategorii wydatku).</div>
          )}
          {(budgetsQ.data ?? []).map((b) => {
            const spent = b.category_id ? (spentByCat.get(b.category_id) ?? 0) : 0;
            const pct = b.limit_amount > 0 ? Math.min(100, Math.round((spent / b.limit_amount) * 100)) : 0;
            const over = spent > b.limit_amount;
            return (
              <div className="goal" key={b.id}>
                <div className="gh">
                  <span className="gn">{b.name}</span>
                  <span className="gp tnum" style={over ? { color: 'var(--acc-b-ink)' } : undefined}>
                    {formatMoney(spent)} / {formatMoney(b.limit_amount)}
                  </span>
                </div>
                <div className="track">
                  <i style={{ width: `${pct}%`, background: over ? 'var(--acc-b)' : undefined }} />
                </div>
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button className="fl-del" type="button" aria-label="Usuń budżet" onClick={() => del.mutate(b.id)}>
                    {TRASH}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form className="capture" onSubmit={submit} style={{ flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        <select className="he-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ flex: '1 1 160px' }}>
          <option value="">— kategoria wydatku —</option>
          {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="auth-input mono" style={{ width: 120 }} inputMode="decimal"
          value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limit / mies." />
        <button className="btn" type="submit" disabled={create.isPending || expenseCats.length === 0}>Dodaj</button>
      </form>
      {expenseCats.length === 0 && (
        <div className="diet-hint" style={{ marginTop: 8 }}>Najpierw dodaj kategorię typu „Wydatek".</div>
      )}
    </article>
  );
}
