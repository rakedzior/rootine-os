import { useState, useMemo } from 'react';
import {
  useAccounts, useTransactions, useCategories, useCreateAccount, useDeleteAccount,
  useCreateTransaction, useDeleteTransaction,
} from '@/features/finance/hooks';
import { accountBalance, totalBalance, formatMoney, ACCOUNT_KINDS, currentYearMonth, type Account, type Category } from '@/features/finance/types';
import { CategoriesCard } from './CategoriesCard';
import { BudgetsCard } from './BudgetsCard';
import { RecurringCard } from './RecurringCard';

const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

export function FinanceScreen() {
  const accountsQ = useAccounts();
  const txQ = useTransactions();
  const categoriesQ = useCategories();

  const accounts = accountsQ.data ?? [];
  const txs = txQ.data ?? [];
  const categories = categoriesQ.data ?? [];
  const loading = accountsQ.isLoading || txQ.isLoading;
  const error = accountsQ.isError || txQ.isError;

  const ym = currentYearMonth();
  const monthTxs = useMemo(() => txs.filter((t) => t.occurred_on.startsWith(ym)), [txs, ym]);
  const monthIncome = useMemo(() => monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [monthTxs]);
  const monthExpense = useMemo(() => monthTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [monthTxs]);

  const catById = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.amount >= 0 || !t.category_id) continue;
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + Math.abs(t.amount));
    }
    return [...map.entries()]
      .map(([cid, amt]) => ({ name: catById.get(cid)?.name ?? 'Inne', amt }))
      .sort((a, b) => b.amt - a.amt);
  }, [monthTxs, catById]);

  return (
    <main className="grid">
      {/* LEFT: balance + monthly summary */}
      <section className="col">
        {error && (
          <article className="card"><div className="auth-banner warn">Nie udało się wczytać danych finansowych.</div></article>
        )}
        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="card-title">Saldo</span></div>
            {!loading && <span className="pill accent">{formatMoney(totalBalance(accounts, txs))}</span>}
          </div>
          {loading ? (
            <div className="note-peek">Ładowanie…</div>
          ) : (
            <>
              <div className="fin-ledger">
                {accounts.length === 0 && <div className="agenda-empty">Brak kont. Dodaj pierwsze poniżej.</div>}
                {accounts.map((a) => (
                  <AccountRow key={a.id} account={a} balance={accountBalance(a, txs)} />
                ))}
              </div>
              <AddAccountForm />
            </>
          )}
        </article>

        {/* Monthly summary */}
        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="card-title">Podsumowanie miesiąca</span></div>
            <span className="pill">{ym}</span>
          </div>
          <div className="stat-grid" style={{ marginBottom: 14 }}>
            <div className="stat-cell">
              <div className="k">Wpływy</div>
              <div className="v tnum" style={{ color: 'var(--acc-a)', fontWeight: 700 }}>{formatMoney(monthIncome)}</div>
            </div>
            <div className="stat-cell">
              <div className="k">Wydatki</div>
              <div className="v tnum" style={{ color: 'var(--acc-b)', fontWeight: 700 }}>{formatMoney(monthExpense)}</div>
            </div>
            <div className="stat-cell">
              <div className="k">Bilans</div>
              <div className="v tnum" style={{ fontWeight: 700, color: monthIncome - monthExpense >= 0 ? 'var(--acc-a)' : 'var(--acc-b)' }}>
                {formatMoney(monthIncome - monthExpense)}
              </div>
            </div>
            <div className="stat-cell">
              <div className="k">Transakcji</div>
              <div className="v tnum">{monthTxs.length}</div>
            </div>
          </div>
          {expenseByCategory.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Wydatki wg kategorii
              </div>
              {expenseByCategory.slice(0, 6).map(({ name, amt }) => {
                const pct = monthExpense > 0 ? Math.round((amt / monthExpense) * 100) : 0;
                return (
                  <div key={name} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{name}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>{formatMoney(amt)} <span style={{ color: 'var(--ink-3)' }}>{pct}%</span></span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-inset)' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: 'var(--acc-a)', width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {expenseByCategory.length === 0 && monthTxs.length === 0 && (
            <div className="agenda-empty">Brak transakcji w tym miesiącu.</div>
          )}
        </article>

        <BudgetsCard />
      </section>

      {/* CENTER: transactions */}
      <section className="col">
        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="card-title">Transakcje</span></div>
          </div>
          <AddTransactionForm accounts={accounts} categories={categories} />
          {!loading && (
            <div className="fin-ledger" style={{ marginTop: 8 }}>
              {txs.length === 0 && <div className="agenda-empty">Brak transakcji.</div>}
              {txs.slice(0, 80).map((t) => (
                <TransactionRow key={t.id} amount={t.amount} note={t.note} date={t.occurred_on} id={t.id} />
              ))}
            </div>
          )}
        </article>
      </section>

      {/* RIGHT: recurring + categories */}
      <section className="col">
        <RecurringCard />
        <CategoriesCard />
      </section>
    </main>
  );
}

function AccountRow({ account, balance }: { account: Account; balance: number }) {
  const del = useDeleteAccount();
  const kindLabel = ACCOUNT_KINDS.find((k) => k.value === account.kind)?.label ?? account.kind;
  return (
    <div className="fl-row">
      <div className="fl-ic grey">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
        </svg>
      </div>
      <div className="fl-info">
        <span className="fl-name">{account.name || 'Konto'}</span>
        <span className="fl-ctx">{kindLabel}</span>
      </div>
      <span className="fl-amt">{formatMoney(balance, account.currency)}</span>
      <button className="fl-del" type="button" aria-label="Usuń konto" onClick={() => del.mutate(account.id)}>
        {TRASH}
      </button>
    </div>
  );
}

function AddAccountForm() {
  const create = useCreateAccount();
  const [name, setName] = useState('');
  const [kind, setKind] = useState(ACCOUNT_KINDS[0].value);
  const [start, setStart] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate({ name: n, kind, starting_balance: Number(start) || 0 });
    setName('');
    setStart('');
  };

  return (
    <form className="capture" onSubmit={submit} style={{ flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
      <div className="field" style={{ flex: '1 1 100%' }}>
        <span className="lead">Konto</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa konta…" />
      </div>
      <select className="he-select" value={kind} onChange={(e) => setKind(e.target.value)} style={{ flex: '1 1 120px' }}>
        {ACCOUNT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>
      <input className="auth-input mono" style={{ flex: '1 1 100px', width: 110 }} type="number" step="0.01" value={start} onChange={(e) => setStart(e.target.value)} placeholder="Saldo pocz." />
      <button className="btn" type="submit" disabled={create.isPending} style={{ flex: '0 0 auto' }}>Dodaj konto</button>
    </form>
  );
}
function TransactionRow({ id, amount, note, date }: { id: string; amount: number; note: string | null; date: string }) {
  const del = useDeleteTransaction();
  return (
    <div className="fl-row">
      <div className="fl-info">
        <span className="fl-name">{note || '—'}</span>
        <span className="fl-ctx">{date}</span>
      </div>
      <span className="fl-amt" style={{ color: amount >= 0 ? 'var(--acc-a)' : 'var(--acc-b)', fontFamily: 'var(--mono)' }}>
        {amount >= 0 ? '+' : ''}{formatMoney(amount)}
      </span>
      <button className="fl-del" type="button" aria-label="Usuń transakcję" onClick={() => del.mutate(id)}>
        {TRASH}
      </button>
    </div>
  );
}

function AddTransactionForm({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const create = useCreateTransaction();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (isNaN(a)) return;
    create.mutate({
      amount: a,
      note: note.trim() || null,
      occurred_on: date,
      account_id: accountId || null,
      category_id: categoryId || null,
    });
    setAmount('');
    setNote('');
  };

  return (
    <form className="capture" onSubmit={submit} style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
      <input className="auth-input mono" style={{ flex: '1 1 90px', width: 100 }} type="number" step="0.01"
        value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Kwota (- wydatek)" />
      <input className="auth-input" style={{ flex: '2 1 140px' }}
        value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opis…" />
      <input className="auth-input" style={{ flex: '1 1 110px', width: 120 }} type="date"
        value={date} onChange={(e) => setDate(e.target.value)} />
      <select className="he-select" style={{ flex: '1 1 110px' }} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        <option value="">Konto…</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <select className="he-select" style={{ flex: '1 1 110px' }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Kategoria…</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn" type="submit" disabled={create.isPending} style={{ flex: '0 0 auto' }}>Dodaj</button>
    </form>
  );
}
