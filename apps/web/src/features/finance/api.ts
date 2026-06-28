import { supabase } from '@/lib/supabase';
import type {
  Account,
  AccountInput,
  BudgetCategory,
  BudgetCategoryInput,
  FinanceDashboardData,
  FinancialReminder,
  FinancialReminderInput,
  JdgItem,
  JdgItemInput,
  JdgMonth,
  RecurringExpense,
  RecurringExpenseInput,
  SavingsGoal,
  SavingsGoalInput,
} from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji uzytkownika');
  return id;
}

function toMinor(value: number | undefined): number {
  return Math.round((value ?? 0) * 100);
}

function fromMinor(value: number | string | null | undefined): number {
  return Number(value ?? 0) / 100;
}

function monthEnd(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

function dueDateFor(month: string, dueDay: number): string {
  const lastDay = Number(monthEnd(month).slice(-2));
  const day = Math.min(Math.max(1, dueDay || 1), lastDay);
  return `${month}-${String(day).padStart(2, '0')}`;
}

function activeFilter<T extends { deleted_at?: string | null; archived?: boolean | null }>(rows: T[] | null): T[] {
  return (rows ?? []).filter((row) => !row.deleted_at && !row.archived);
}

function mapAccount(row: any): Account {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    type: row.type,
    balance: fromMinor(row.balance_minor),
    currency: row.currency,
    institution: row.institution ?? undefined,
    color: row.color ?? undefined,
    archived: Boolean(row.archived),
  };
}

function mapBudget(row: any): BudgetCategory {
  return {
    id: row.id,
    name: row.name,
    month: row.month,
    plannedAmount: fromMinor(row.planned_amount_minor),
    actualAmount: fromMinor(row.actual_amount_minor),
    color: row.color ?? undefined,
  };
}

function mapSavingsGoal(row: any): SavingsGoal {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    targetAmount: fromMinor(row.target_amount_minor),
    currentAmount: fromMinor(row.current_amount_minor),
    deadline: row.deadline ?? undefined,
    notes: row.notes ?? undefined,
    emoji: row.icon ?? undefined,
  };
}

function mapRecurring(row: any, paidIds: Set<string>): RecurringExpense {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    amount: fromMinor(row.amount_minor),
    category: row.category,
    dueDay: row.due_day ?? 1,
    frequency: row.frequency ?? row.payment_type ?? 'monthly',
    reminderEnabled: row.reminder_days_before != null,
    paidThisMonth: paidIds.has(row.id),
  };
}

function mapReminder(row: any): FinancialReminder {
  return {
    id: row.id,
    title: row.name,
    amount: fromMinor(row.amount_minor),
    dueDate: row.due_date,
    category: row.category,
    completed: row.status === 'paid',
    notes: row.notes ?? undefined,
  };
}

function mapJdgItem(row: any): JdgItem {
  return {
    id: row.id,
    label: row.label,
    description: row.description ?? undefined,
    dueDay: row.due_day ?? undefined,
  };
}

export async function fetchFinanceDashboard(month: string): Promise<FinanceDashboardData> {
  const [
    accounts,
    budgets,
    savingsGoals,
    payments,
    occurrences,
    jdgItems,
    jdgMonthItems,
  ] = await Promise.all([
    supabase.from('finance_accounts').select('*').order('created_at', { ascending: true }),
    supabase.from('finance_budget_categories').select('*').eq('month', month).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('finance_savings_goals').select('*').order('created_at', { ascending: true }),
    supabase.from('finance_payments').select('*').order('due_day', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
    supabase.from('finance_payment_occurrences').select('*').gte('due_date', `${month}-01`).lte('due_date', monthEnd(month)).order('due_date', { ascending: true }),
    supabase.from('finance_jdg_items').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('finance_jdg_month_items').select('*').eq('month', month),
  ]);

  for (const result of [accounts, budgets, savingsGoals, payments, occurrences, jdgItems, jdgMonthItems]) {
    if (result.error) throw result.error;
  }

  const paidPaymentIds = new Set(
    (occurrences.data ?? [])
      .filter((row) => row.payment_id && row.status === 'paid')
      .map((row) => row.payment_id as string),
  );
  const recurring = activeFilter(payments.data).map((row) => mapRecurring(row, paidPaymentIds));
  const reminders = (occurrences.data ?? [])
    .filter((row) => !row.payment_id)
    .map(mapReminder);
  const completed = (jdgMonthItems.data ?? [])
    .filter((row) => row.is_completed)
    .map((row) => row.jdg_item_id as string);

  return {
    accounts: activeFilter(accounts.data).map(mapAccount),
    recurringExpenses: recurring,
    financialReminders: reminders,
    budgetCategories: activeFilter(budgets.data).map(mapBudget),
    savingsGoals: activeFilter(savingsGoals.data).map(mapSavingsGoal),
    jdgItems: (jdgItems.data ?? []).map(mapJdgItem),
    jdgMonths: [{ month, completed }],
  };
}

export async function saveAccount(input: AccountInput, id?: string): Promise<void> {
  const payload = {
    user_id: await uid(),
    name: input.name,
    type: input.type,
    balance_minor: toMinor(input.balance),
    currency: input.currency,
    institution: input.institution ?? null,
    color: input.color ?? null,
    archived: input.archived,
  };
  const result = id
    ? await supabase.from('finance_accounts').update(payload).eq('id', id)
    : await supabase.from('finance_accounts').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('finance_accounts').update({ archived: true, deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function saveBudgetCategory(input: BudgetCategoryInput, id?: string): Promise<void> {
  const payload = {
    user_id: await uid(),
    name: input.name,
    month: input.month,
    planned_amount_minor: toMinor(input.plannedAmount),
    actual_amount_minor: toMinor(input.actualAmount),
    color: input.color ?? null,
  };
  const result = id
    ? await supabase.from('finance_budget_categories').update(payload).eq('id', id)
    : await supabase.from('finance_budget_categories').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteBudgetCategory(id: string): Promise<void> {
  const { error } = await supabase.from('finance_budget_categories').update({ archived: true, deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function saveSavingsGoal(input: SavingsGoalInput, id?: string): Promise<void> {
  const payload = {
    user_id: await uid(),
    name: input.name,
    target_amount_minor: toMinor(input.targetAmount),
    current_amount_minor: toMinor(input.currentAmount),
    deadline: input.deadline ?? null,
    notes: input.notes ?? null,
    icon: input.emoji ?? null,
  };
  const result = id
    ? await supabase.from('finance_savings_goals').update(payload).eq('id', id)
    : await supabase.from('finance_savings_goals').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('finance_savings_goals').update({ archived: true, deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function saveRecurringExpense(input: RecurringExpenseInput, id?: string): Promise<void> {
  const payload = {
    user_id: await uid(),
    name: input.name,
    category: input.category,
    amount_minor: toMinor(input.amount),
    payment_type: input.frequency,
    frequency: input.frequency,
    due_day: input.dueDay,
    reminder_days_before: input.reminderEnabled ? 2 : null,
    show_in_planner: false,
  };
  const result = id
    ? await supabase.from('finance_payments').update(payload).eq('id', id)
    : await supabase.from('finance_payments').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const { error } = await supabase.from('finance_payments').update({ archived: true, deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function saveFinancialReminder(input: FinancialReminderInput, id?: string): Promise<void> {
  const payload = {
    user_id: await uid(),
    payment_id: null,
    name: input.title,
    category: input.category,
    amount_minor: toMinor(input.amount),
    due_date: input.dueDate,
    status: input.completed ? 'paid' : 'due',
    paid_at: input.completed ? new Date().toISOString() : null,
    notes: input.notes ?? null,
  };
  const result = id
    ? await supabase.from('finance_payment_occurrences').update(payload).eq('id', id)
    : await supabase.from('finance_payment_occurrences').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteFinancialReminder(id: string): Promise<void> {
  const { error } = await supabase.from('finance_payment_occurrences').delete().eq('id', id);
  if (error) throw error;
}

export async function setFinancialReminderCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('finance_payment_occurrences')
    .update({ status: completed ? 'paid' : 'due', paid_at: completed ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw error;
}

export async function setRecurringPaid(input: { payment: RecurringExpense; month: string; paid: boolean }): Promise<void> {
  const userId = await uid();
  const dueDate = dueDateFor(input.month, input.payment.dueDay);
  const existing = await supabase
    .from('finance_payment_occurrences')
    .select('id')
    .eq('payment_id', input.payment.id)
    .eq('due_date', dueDate)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const payload = {
    user_id: userId,
    payment_id: input.payment.id,
    name: input.payment.name,
    category: input.payment.category,
    amount_minor: toMinor(input.payment.amount),
    due_date: dueDate,
    status: input.paid ? 'paid' : 'due',
    paid_at: input.paid ? new Date().toISOString() : null,
  };

  const result = existing.data?.id
    ? await supabase.from('finance_payment_occurrences').update(payload).eq('id', existing.data.id)
    : await supabase.from('finance_payment_occurrences').insert(payload);
  if (result.error) throw result.error;
}

export async function saveJdgItem(input: JdgItemInput, id?: string): Promise<void> {
  const payload = {
    user_id: await uid(),
    label: input.label,
    description: input.description ?? null,
    due_day: input.dueDay ?? null,
    is_active: true,
  };
  const result = id
    ? await supabase.from('finance_jdg_items').update(payload).eq('id', id)
    : await supabase.from('finance_jdg_items').insert(payload);
  if (result.error) throw result.error;
}

export async function setJdgMonth(month: JdgMonth, itemIds: string[]): Promise<void> {
  const userId = await uid();
  const current = await supabase.from('finance_jdg_month_items').select('*').eq('month', month.month);
  if (current.error) throw current.error;

  const existingByItem = new Map((current.data ?? []).map((row) => [row.jdg_item_id as string, row.id as string]));
  const allItemIds = new Set([...itemIds, ...existingByItem.keys()]);
  const writes = [...allItemIds].map((itemId) => {
    const payload = {
      user_id: userId,
      jdg_item_id: itemId,
      month: month.month,
      is_completed: itemIds.includes(itemId),
      completed_at: itemIds.includes(itemId) ? new Date().toISOString() : null,
    };
    const existingId = existingByItem.get(itemId);
    return existingId
      ? supabase.from('finance_jdg_month_items').update(payload).eq('id', existingId)
      : supabase.from('finance_jdg_month_items').insert(payload);
  });
  const results = await Promise.all(writes);
  for (const result of results) {
    if (result.error) throw result.error;
  }
}
