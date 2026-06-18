export interface Account {
  id: string;
  user_id: string;
  name: string;
  kind: string;
  starting_balance: number;
  currency: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number; // signed: + wpływ, - wydatek
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NewAccountInput {
  name: string;
  kind?: string;
  starting_balance?: number;
  currency?: string;
}

export interface NewTransactionInput {
  amount: number; // already signed
  account_id?: string | null;
  note?: string | null;
  occurred_on?: string;
}

export const ACCOUNT_KINDS: { value: string; label: string }[] = [
  { value: 'checking', label: 'Konto' },
  { value: 'savings', label: 'Oszczędności' },
  { value: 'cash', label: 'Gotówka' },
  { value: 'card', label: 'Karta' },
];

export function formatMoney(n: number, currency = 'PLN', decimals = 2): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** Balance for one account = starting balance + its transactions. */
export function accountBalance(account: Account, txs: Transaction[]): number {
  const sum = txs.reduce((s, t) => (t.account_id === account.id ? s + t.amount : s), 0);
  return account.starting_balance + sum;
}

/** Net worth = all starting balances + all transactions (incl. unassigned). */
export function totalBalance(accounts: Account[], txs: Transaction[]): number {
  const starts = accounts.reduce((s, a) => s + a.starting_balance, 0);
  const flow = txs.reduce((s, t) => s + t.amount, 0);
  return starts + flow;
}
