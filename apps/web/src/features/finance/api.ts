import { supabase } from '@/lib/supabase';
import type { Account, Transaction, NewAccountInput, NewTransactionInput } from './types';

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
