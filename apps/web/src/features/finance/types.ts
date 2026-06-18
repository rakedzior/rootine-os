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

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: string; // 'income' | 'expense'
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  period: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  day_of_month: number | null;
  category_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
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
  category_id?: string | null;
  note?: string | null;
  occurred_on?: string;
}

export interface NewCategoryInput {
  name: string;
  kind?: string;
}

export interface NewBudgetInput {
  name: string;
  category_id?: string | null;
  limit_amount: number;
}

export interface NewRecurringInput {
  name: string;
  amount: number;
  day_of_month?: number | null;
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

export function accountBalance(account: Account, txs: Transaction[]): number {
  const sum = txs.reduce((s, t) => (t.account_id === account.id ? s + t.amount : s), 0);
  return account.starting_balance + sum;
}

export function totalBalance(accounts: Account[], txs: Transaction[]): number {
  const starts = accounts.reduce((s, a) => s + a.starting_balance, 0);
  const flow = txs.reduce((s, t) => s + t.amount, 0);
  return starts + flow;
}

export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthExpenseByCategory(txs: Transaction[], ym: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.amount >= 0 || !t.category_id) continue;
    if (!t.occurred_on.startsWith(ym)) continue;
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + Math.abs(t.amount));
  }
  return map;
}
