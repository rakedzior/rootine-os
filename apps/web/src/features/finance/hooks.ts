import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccounts, insertAccount, deleteAccount,
  fetchTransactions, insertTransaction, deleteTransaction,
} from './api';
import type { Account, Transaction, NewAccountInput, NewTransactionInput } from './types';

export const ACCOUNTS_KEY = ['accounts'] as const;
export const TRANSACTIONS_KEY = ['transactions'] as const;

export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: fetchAccounts });
}

export function useTransactions() {
  return useQuery({ queryKey: TRANSACTIONS_KEY, queryFn: () => fetchTransactions() });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewAccountInput) => insertAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ACCOUNTS_KEY });
      const prev = qc.getQueryData<Account[]>(ACCOUNTS_KEY);
      qc.setQueryData<Account[]>(ACCOUNTS_KEY, (old) => (old ?? []).filter((a) => a.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ACCOUNTS_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTransactionInput) => insertTransaction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TRANSACTIONS_KEY });
      const prev = qc.getQueryData<Transaction[]>(TRANSACTIONS_KEY);
      qc.setQueryData<Transaction[]>(TRANSACTIONS_KEY, (old) => (old ?? []).filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(TRANSACTIONS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  });
}
