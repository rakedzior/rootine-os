import { Link } from 'react-router-dom';
import { useAccounts, useTransactions } from './hooks';
import { totalBalance, formatMoney } from './types';

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Read-only Start widget: net worth + this month's in/out. */
export function FinancePulse() {
  const accountsQ = useAccounts();
  const txQ = useTransactions();

  if (accountsQ.isLoading || txQ.isLoading) return <div className="note-peek">Ładowanie finansów…</div>;
  if (accountsQ.isError || txQ.isError) {
    return <div className="auth-banner warn">Nie udało się wczytać finansów.</div>;
  }

  const accounts = accountsQ.data ?? [];
  const txs = txQ.data ?? [];
  const ym = currentYearMonth();
  const monthTx = txs.filter((t) => t.occurred_on.startsWith(ym));
  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const total = totalBalance(accounts, txs);

  return (
    <div>
      <div className="fin-bal">
        <span className="amt tnum">{formatMoney(total, 'PLN', 2)}</span>
      </div>
      <div className="fin-rows">
        <div className="fin-row">
          <span className="lbl">Wpływy (ten miesiąc)</span>
          <span className="val">{formatMoney(income)}</span>
        </div>
        <div className="fin-row">
          <span className="lbl">Wydatki (ten miesiąc)</span>
          <span className="val">{formatMoney(expense)}</span>
        </div>
      </div>
      {accounts.length === 0 && (
        <div className="diet-hint" style={{ marginTop: 10 }}>Dodaj konto w module Finanse, aby zacząć.</div>
      )}
      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <Link to="/finance" className="dsf-link">Zobacz finanse →</Link>
      </div>
    </div>
  );
}
