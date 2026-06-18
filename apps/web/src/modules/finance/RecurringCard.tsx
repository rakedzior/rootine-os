import { useState } from 'react';
import { useRecurring, useCreateRecurring, useToggleRecurring, useDeleteRecurring } from '@/features/finance/hooks';
import { formatMoney } from '@/features/finance/types';

const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

export function RecurringCard() {
  const { data, isLoading, isError, refetch } = useRecurring();
  const create = useCreateRecurring();
  const toggle = useToggleRecurring();
  const del = useDeleteRecurring();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');

  const monthlyTotal = (data ?? []).filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const a = Number(amount);
    if (!n || !a) return;
    const d = day.trim() ? Math.max(1, Math.min(31, Number(day))) : null;
    create.mutate({ name: n, amount: a, day_of_month: d });
    setName('');
    setAmount('');
    setDay('');
  };

  return (
    <article className="card">
      <div className="card-head">
        <div className="lhs"><span className="card-title">Wydatki cykliczne</span></div>
        {!isLoading && <span className="pill">{formatMoney(monthlyTotal)} / mies.</span>}
      </div>

      {isLoading ? (
        <div className="note-peek">Ładowanie…</div>
      ) : isError ? (
        <div>
          <div className="auth-banner warn">Nie udało się wczytać wydatków cyklicznych.</div>
          <button className="he-btn ghost" type="button" onClick={() => refetch()}>Spróbuj ponownie</button>
        </div>
      ) : (
        <div className="fin-ledger">
          {(data ?? []).length === 0 && <div className="agenda-empty">Brak wydatków cyklicznych.</div>}
          {(data ?? []).map((r) => (
            <div className="fl-row" key={r.id} style={r.active ? undefined : { opacity: 0.5 }}>
              <div className="fl-info">
                <span className="fl-name">{r.name}</span>
                <span className="fl-ctx">{r.day_of_month ? `dzień ${r.day_of_month}` : 'co miesiąc'}</span>
              </div>
              <span className="fl-amt">{formatMoney(r.amount)}</span>
              <button
                className="recur-toggle"
                type="button"
                onClick={() => toggle.mutate({ id: r.id, active: !r.active })}
              >
                {r.active ? 'Wstrzymaj' : 'Wznów'}
              </button>
              <button className="fl-del" type="button" aria-label="Usuń" onClick={() => del.mutate(r.id)}>
                {TRASH}
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="capture" onSubmit={submit} style={{ flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        <div className="field" style={{ flex: '1 1 160px' }}>
          <span className="lead">Nazwa</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Netflix, czynsz…" />
        </div>
        <input className="auth-input mono" style={{ width: 110 }} inputMode="decimal"
          value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Kwota" />
        <input className="auth-input mono" style={{ width: 90 }} inputMode="numeric"
          value={day} onChange={(e) => setDay(e.target.value)} placeholder="Dzień" />
        <button className="btn" type="submit" disabled={create.isPending}>Dodaj</button>
      </form>
    </article>
  );
}
