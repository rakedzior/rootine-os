import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccounts, insertAccount, deleteAccount,
  fetchTransactions, insertTransaction, deleteTransaction,
  fetchCategories, insertCategory, deleteCategory,
  fetchBudgets, insertBudget, deleteBudget,
  fetchRecurring, insertRecurring, patchRecurring, deleteRecurring,
} from './api';
import type {
  Account, Transaction, Category, Budget, RecurringExpense,
  NewAccountInput, NewTransactionInput, NewCategoryInput, NewBudgetInput, NewRecurringInput,
} from './types';

export const ACCOUNTS_KEY = ['accounts'] as const;
export const TRANSACTIONS_KEY = ['transactions'] as const;
export const CATEGORIES_KEY = ['financial_categories'] as const;
export const BUDGETS_KEY = ['budgets'] as const;
export const RECURRING_KEY = ['recurring_expenses'] as const;

// ---- accounts ----
export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: fetchAccounts });
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

// ---- transactions ----
export function useTransactions() {
  return useQuery({ queryKey: TRANSACTIONS_KEY, queryFn: () => fetchTransactions() });
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

// ---- categories ----
export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: fetchCategories });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCategoryInput) => insertCategory(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CATEGORIES_KEY });
      const prev = qc.getQueryData<Category[]>(CATEGORIES_KEY);
      qc.setQueryData<Category[]>(CATEGORIES_KEY, (old) => (old ?? []).filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(CATEGORIES_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

// ---- budgets ----
export function useBudgets() {
  return useQuery({ queryKey: BUDGETS_KEY, queryFn: fetchBudgets });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBudgetInput) => insertBudget(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: BUDGETS_KEY });
      const prev = qc.getQueryData<Budget[]>(BUDGETS_KEY);
      qc.setQueryData<Budget[]>(BUDGETS_KEY, (old) => (old ?? []).filter((b) => b.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(BUDGETS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}

// ---- recurring ----
export function useRecurring() {
  return useQuery({ queryKey: RECURRING_KEY, queryFn: fetchRecurring });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRecurringInput) => insertRecurring(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  });
}

export function useToggleRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => patchRecurring(id, { active }),
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: RECURRING_KEY });
      const prev = qc.getQueryData<RecurringExpense[]>(RECURRING_KEY);
      qc.setQueryData<RecurringExpense[]>(RECURRING_KEY, (old) =>
        (old ?? []).map((r) => (r.id === id ? { ...r, active } : r)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(RECURRING_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurring(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: RECURRING_KEY });
      const prev = qc.getQueryData<RecurringExpense[]>(RECURRING_KEY);
      qc.setQueryData<RecurringExpense[]>(RECURRING_KEY, (old) => (old ?? []).filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(RECURRING_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  });
}
