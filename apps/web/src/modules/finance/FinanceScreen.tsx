import { useState } from 'react';
import {
  useAccounts, useTransactions, useCategories, useCreateAccount, useDeleteAccount,
  useCreateTransaction, useDeleteTransaction,
} from '@/features/finance/hooks';
import { accountBalance, totalBalance, formatMoney, ACCOUNT_KINDS, type Account, type Category } from '@/features/finance/types';
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

  return (
    <main className="grid">
      {/* LEFT: balance + budgets */}
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
      <input className="auth-input mono" style={{ flex: '1 1 100px' }} inputMode="decimal"
        value={start} onChange={(e) => setStart(e.target.value)} placeholder="Saldo pocz." />
      <button className="btn" type="submit" disabled={create.isPending} style={{ width: '100%' }}>Dodaj konto</button>
    </form>
  );
}

function AddTransactionForm({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const create = useCreateTransaction();
  const [amount, setAmount] = useState('');
  const [dir, setDir] = useState<'out' | 'in'>('out');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Math.abs(Number(amount));
    if (!value) return;
    create.mutate({
      amount: dir === 'out' ? -value : value,
      account_id: accountId || null,
      category_id: categoryId || null,
      note: note.trim() || null,
      occurred_on: date,
    });
    setAmount('');
    setNote('');
  };

  return (
    <form className="capture" onSubmit={submit} style={{ flexWrap: 'wrap', gap: 10 }}>
      <select className="he-select" value={dir} onChange={(e) => setDir(e.target.value as 'out' | 'in')} style={{ flex: '1 1 110px' }}>
        <option value="out">Wydatek</option>
        <option value="in">Wpływ</option>
      </select>
      <input className="auth-input mono" style={{ flex: '1 1 100px' }} inputMode="decimal"
        value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Kwota" />
      <select className="he-select" value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ flex: '1 1 130px' }}>
        <option value="">— konto —</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name || 'Konto'}</option>)}
      </select>
      <select className="he-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ flex: '1 1 130px' }}>
        <option value="">— kategoria —</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input className="auth-input" type="date" style={{ flex: '1 1 140px' }} value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="field" style={{ flex: '1 1 100%' }}>
        <span className="lead">Opis</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notatka (opcjonalnie)…" />
      </div>
      <button className="btn" type="submit" disabled={create.isPending} style={{ width: '100%' }}>Dodaj transakcję</button>
    </form>
  );
}

function TransactionRow({ id, amount, note, date }: { id: string; amount: number; note: string | null; date: string }) {
  const del = useDeleteTransaction();
  const positive = amount > 0;
  return (
    <div className="fl-row">
      <div className={`fl-ic ${positive ? 'green' : 'clay'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          {positive ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
        </svg>
      </div>
      <div className="fl-info">
        <span className="fl-name">{note || (positive ? 'Wpływ' : 'Wydatek')}</span>
        <span className="fl-ctx">{date}</span>
      </div>
      <span className={`fl-amt ${positive ? 'positive' : 'negative'}`}>
        {positive ? '+' : '−'}{formatMoney(Math.abs(amount))}
      </span>
      <button className="fl-del" type="button" aria-label="Usuń transakcję" onClick={() => del.mutate(id)}>
        {TRASH}
      </button>
    </div>
  );
}
