import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logAudit } from '@/lib/audit';
import {
  deleteAccount,
  deleteBudgetCategory,
  deleteFinancialReminder,
  deleteRecurringExpense,
  deleteSavingsGoal,
  fetchFinanceDashboard,
  saveAccount,
  saveBudgetCategory,
  saveFinancialReminder,
  saveJdgItem,
  saveRecurringExpense,
  saveSavingsGoal,
  setFinancialReminderCompleted,
  setJdgMonth,
  setRecurringPaid,
} from './api';
import type {
  AccountInput,
  BudgetCategoryInput,
  FinancialReminderInput,
  JdgItemInput,
  JdgMonth,
  RecurringExpense,
  RecurringExpenseInput,
  SavingsGoalInput,
} from './types';

export const FINANCE_KEY = ['finance'] as const;

export function useFinanceDashboard(month: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, month],
    queryFn: () => fetchFinanceDashboard(month),
  });
}

function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: FINANCE_KEY });
}

function onFinanceChange(invalidate: () => void, entity: string) {
  invalidate();
  void logAudit('finance_change', { entity });
}

export function useSaveAccount() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AccountInput }) => saveAccount(input, id),
    onSuccess: () => onFinanceChange(invalidate, 'finance.account'),
  });
}

export function useDeleteFinanceAccount() {
  const invalidate = useInvalidateFinance();
  return useMutation({ mutationFn: deleteAccount, onSuccess: () => onFinanceChange(invalidate, 'finance.account') });
}

export function useSaveBudgetCategory() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BudgetCategoryInput }) => saveBudgetCategory(input, id),
    onSuccess: () => onFinanceChange(invalidate, 'finance.budget_category'),
  });
}

export function useDeleteFinanceBudgetCategory() {
  const invalidate = useInvalidateFinance();
  return useMutation({ mutationFn: deleteBudgetCategory, onSuccess: () => onFinanceChange(invalidate, 'finance.budget_category') });
}

export function useSaveSavingsGoal() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: SavingsGoalInput }) => saveSavingsGoal(input, id),
    onSuccess: () => onFinanceChange(invalidate, 'finance.savings_goal'),
  });
}

export function useDeleteFinanceSavingsGoal() {
  const invalidate = useInvalidateFinance();
  return useMutation({ mutationFn: deleteSavingsGoal, onSuccess: () => onFinanceChange(invalidate, 'finance.savings_goal') });
}

export function useSaveRecurringExpense() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: RecurringExpenseInput }) => saveRecurringExpense(input, id),
    onSuccess: () => onFinanceChange(invalidate, 'finance.recurring_expense'),
  });
}

export function useDeleteFinanceRecurringExpense() {
  const invalidate = useInvalidateFinance();
  return useMutation({ mutationFn: deleteRecurringExpense, onSuccess: () => onFinanceChange(invalidate, 'finance.recurring_expense') });
}

export function useSaveFinancialReminder() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: FinancialReminderInput }) => saveFinancialReminder(input, id),
    onSuccess: () => onFinanceChange(invalidate, 'finance.reminder'),
  });
}

export function useDeleteFinanceReminder() {
  const invalidate = useInvalidateFinance();
  return useMutation({ mutationFn: deleteFinancialReminder, onSuccess: () => onFinanceChange(invalidate, 'finance.reminder') });
}

export function useToggleFinanceReminder() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => setFinancialReminderCompleted(id, completed),
    onSuccess: () => onFinanceChange(invalidate, 'finance.reminder'),
  });
}

export function useSetRecurringPaid() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (input: { payment: RecurringExpense; month: string; paid: boolean }) => setRecurringPaid(input),
    onSuccess: () => onFinanceChange(invalidate, 'finance.recurring_occurrence'),
  });
}

export function useSaveJdgItem() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: JdgItemInput }) => saveJdgItem(input, id),
    onSuccess: () => onFinanceChange(invalidate, 'finance.jdg_item'),
  });
}

export function useSetJdgMonth() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ month, itemIds }: { month: JdgMonth; itemIds: string[] }) => setJdgMonth(month, itemIds),
    onSuccess: () => onFinanceChange(invalidate, 'finance.jdg_month'),
  });
}
