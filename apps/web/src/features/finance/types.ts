export interface Account {
  id: string;
  createdAt: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution?: string;
  color?: string;
  archived: boolean;
}

export interface RecurringExpense {
  id: string;
  createdAt: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  frequency: 'monthly' | 'yearly' | 'jdg' | 'custom_recurring';
  reminderEnabled: boolean;
  paidThisMonth: boolean;
  folderId?: string;
}

export interface FinancialReminder {
  id: string;
  title: string;
  amount?: number;
  dueDate: string;
  category: string;
  completed: boolean;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  month: string;
  plannedAmount: number;
  actualAmount: number;
  color?: string;
}

export interface SavingsGoal {
  id: string;
  createdAt: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  notes?: string;
  emoji?: string;
}

export interface JdgItem {
  id: string;
  label: string;
  description?: string;
  dueDay?: number;
}

export interface JdgMonth {
  month: string;
  completed: string[];
}

export interface FinanceDashboardData {
  accounts: Account[];
  recurringExpenses: RecurringExpense[];
  financialReminders: FinancialReminder[];
  budgetCategories: BudgetCategory[];
  savingsGoals: SavingsGoal[];
  jdgItems: JdgItem[];
  jdgMonths: JdgMonth[];
}

export type AccountInput = Omit<Account, 'id' | 'createdAt'>;
export type RecurringExpenseInput = Omit<RecurringExpense, 'id' | 'createdAt'>;
export type FinancialReminderInput = Omit<FinancialReminder, 'id'>;
export type BudgetCategoryInput = Omit<BudgetCategory, 'id'>;
export type SavingsGoalInput = Omit<SavingsGoal, 'id' | 'createdAt'>;
export type JdgItemInput = Omit<JdgItem, 'id'>;
