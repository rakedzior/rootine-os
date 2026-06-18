import { supabase } from '@/lib/supabase';
import type {
  Account, Transaction, Category, Budget, RecurringExpense,
  NewAccountInput, NewTransactionInput, NewCategoryInput, NewBudgetInput, NewRecurringInput,
} from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ---- accounts ----
export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((a) => ({ ...a, starting_balance: Number(a.starting_balance) })) as Account[];
}

export async function insertAccount(input: NewAccountInput): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: await uid(),
      name: input.name,
      kind: input.kind ?? 'checking',
      starting_balance: input.starting_balance ?? 0,
      currency: input.currency ?? 'PLN',
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...data, starting_balance: Number(data.starting_balance) } as Account;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

// ---- transactions ----
export async function fetchTransactions(limit = 200): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .is('deleted_at', null)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
}

export async function insertTransaction(input: NewTransactionInput): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: await uid(),
      amount: input.amount,
      account_id: input.account_id ?? null,
      category_id: input.category_id ?? null,
      note: input.note ?? null,
      occurred_on: input.occurred_on ?? new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// ---- categories ----
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('financial_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function insertCategory(input: NewCategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('financial_categories')
    .insert({ user_id: await uid(), name: input.name, kind: input.kind ?? 'expense' })
    .select('*')
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('financial_categories').delete().eq('id', id);
  if (error) throw error;
}

// ---- budgets ----
export async function fetchBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((b) => ({ ...b, limit_amount: Number(b.limit_amount) })) as Budget[];
}

export async function insertBudget(input: NewBudgetInput): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: await uid(),
      name: input.name,
      category_id: input.category_id ?? null,
      limit_amount: input.limit_amount,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...data, limit_amount: Number(data.limit_amount) } as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

// ---- recurring expenses ----
export async function fetchRecurring(): Promise<RecurringExpense[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .order('day_of_month', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as RecurringExpense[];
}

export async function insertRecurring(input: NewRecurringInput): Promise<RecurringExpense> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: await uid(),
      name: input.name,
      amount: input.amount,
      day_of_month: input.day_of_month ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as RecurringExpense;
}

export async function patchRecurring(id: string, patch: Partial<RecurringExpense>): Promise<RecurringExpense> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return { ...data, amount: Number(data.amount) } as RecurringExpense;
}

export async function deleteRecurring(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) throw error;
}
