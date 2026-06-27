import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConfirmDelete, Field, PageHeader } from '@/components/common';
import { PageLayout } from '@/components/layout/primitives';
import {
  type Account,
  type BudgetCategory,
  type FinancialReminder,
  type JdgItem,
  type RecurringExpense,
  type SavingsGoal,
} from '@/features/finance/types';
import {
  useDeleteFinanceAccount,
  useDeleteFinanceBudgetCategory,
  useDeleteFinanceRecurringExpense,
  useDeleteFinanceReminder,
  useDeleteFinanceSavingsGoal,
  useFinanceDashboard,
  useSaveAccount,
  useSaveBudgetCategory,
  useSaveFinancialReminder,
  useSaveJdgItem,
  useSaveRecurringExpense,
  useSaveSavingsGoal,
  useSetJdgMonth,
  useSetRecurringPaid,
  useToggleFinanceReminder,
} from '@/features/finance/hooks';

type FinanceSegment = 'accounts' | 'due' | 'budget' | 'savings' | 'jdg' | 'history';
type SummaryKey = 'accounts' | 'savings' | 'budget' | 'due';
type PaymentRow = {
  id: string;
  source: 'recurring' | 'reminder';
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  type: string;
  status: 'due' | 'paid' | 'overdue';
  paid: boolean;
  raw: RecurringExpense | FinancialReminder;
};
type IconName =
  | 'wallet' | 'savings' | 'budget' | 'due' | 'paid' | 'home' | 'transport' | 'food' | 'entertainment'
  | 'health' | 'business' | 'car' | 'phone' | 'shield' | 'cash' | 'bank' | 'plus' | 'edit' | 'trash'
  | 'check' | 'settings' | 'history' | 'calendar' | 'note' | 'arrow' | 'close' | 'reset';

const SEGMENTS: Array<{ id: FinanceSegment; label: string }> = [
  { id: 'due', label: 'Płatności' },
  { id: 'budget', label: 'Budżet' },
  { id: 'jdg', label: 'JDG' },
  { id: 'history', label: 'Historia' },
];

const CATEGORY_OPTIONS = ['Mieszkanie', 'Transport', 'Jedzenie', 'Rozrywka', 'Zdrowie', 'JDG', 'Auto', 'Inne'];
const ACCOUNT_TYPES = ['main_account', 'savings_account', 'foreign_currency', 'cash', 'joint_account', 'investment', 'other'];
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  main_account: 'Konto główne',
  savings_account: 'Konto oszczędnościowe',
  foreign_currency: 'Konto walutowe',
  cash: 'Gotówka',
  joint_account: 'Konto wspólne',
  investment: 'Inwestycje',
  other: 'Inne',
  główne: 'Konto główne',
  oszczędnościowe: 'Konto oszczędnościowe',
  gotówka: 'Gotówka',
  karta: 'Karta',
  walutowe: 'Konto walutowe',
  inwestycje: 'Inwestycje',
};
const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'];
const BUDGET_COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#8B5CF6', '#EF4444', '#14B8A6', '#6B7280'];
const PAYMENT_TYPES = [
  { value: 'one_time', label: 'jednorazowa' },
  { value: 'monthly', label: 'miesięczna' },
  { value: 'yearly', label: 'roczna' },
  { value: 'jdg', label: 'JDG' },
  { value: 'custom_recurring', label: 'własna' },
];
const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const EMPTY_FINANCE = {
  accounts: [],
  recurringExpenses: [],
  financialReminders: [],
  budgetCategories: [],
  savingsGoals: [],
  jdgItems: [],
  jdgMonths: [],
};

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthFromUrl() {
  const value = new URLSearchParams(window.location.search).get('month');
  return value && /^\d{4}-\d{2}$/.test(value) ? value : currentYearMonth();
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${year}`;
}

function daysInMonth(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function dueDateFor(month: string, dueDay: number) {
  const day = Math.min(Math.max(1, dueDay || 1), daysInMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtMoney(n: number, currency = 'PLN') {
  return n.toLocaleString('pl-PL', { style: 'currency', currency, maximumFractionDigits: currency === 'PLN' ? 0 : 2 });
}

function fmtNumber(n: number) {
  return n.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
}

function num(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function isPast(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${date}T12:00:00`) < today;
}

function categoryIcon(category: string, name = ''): IconName {
  const source = normalized(`${category} ${name}`);
  if (source.includes('miesz') || source.includes('czynsz')) return 'home';
  if (source.includes('transport')) return 'transport';
  if (source.includes('jedz')) return 'food';
  if (source.includes('rozryw')) return 'entertainment';
  if (source.includes('zdrow')) return 'health';
  if (source.includes('jdg') || source.includes('ksieg')) return 'business';
  if (source.includes('auto') || source.includes('oc')) return 'car';
  if (source.includes('telefon')) return 'phone';
  if (source.includes('ubez')) return 'shield';
  return 'wallet';
}

function accountIcon(account: Account): IconName {
  const source = normalized(`${account.type} ${account.name}`);
  if (source.includes('oszcz')) return 'bank';
  if (source.includes('got')) return 'cash';
  if (source.includes('walut')) return 'cash';
  return 'wallet';
}

function toPaymentRows(recurring: RecurringExpense[], reminders: FinancialReminder[], month: string): PaymentRow[] {
  const recurringRows = recurring.map((item) => {
    const paid = Boolean(item.paidThisMonth);
    const dueDate = dueDateFor(month, item.dueDay);
    return {
      id: `recurring:${item.id}`,
      source: 'recurring' as const,
      name: item.name,
      category: item.category,
      amount: item.amount,
      dueDate,
      type: item.frequency === 'yearly' ? 'roczna' : item.frequency === 'jdg' ? 'JDG' : 'miesięczna',
      status: paid ? 'paid' as const : isPast(dueDate) ? 'overdue' as const : 'due' as const,
      paid,
      raw: item,
    };
  });
  const reminderRows = reminders.filter((item) => item.dueDate.startsWith(month)).map((item) => {
    const paid = Boolean(item.completed);
    return {
      id: `reminder:${item.id}`,
      source: 'reminder' as const,
      name: item.title,
      category: item.category,
      amount: item.amount ?? 0,
      dueDate: item.dueDate,
      type: 'jednorazowa',
      status: paid ? 'paid' as const : isPast(item.dueDate) ? 'overdue' as const : 'due' as const,
      paid,
      raw: item,
    };
  });
  return [...recurringRows, ...reminderRows].sort((a, b) => {
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name, 'pl');
  });
}

export function FinanceScreen() {
  const [month, setMonth] = useState(monthFromUrl);
  const [segment, setSegment] = useState<FinanceSegment>('due');
  const [activeSummary, setActiveSummary] = useState<SummaryKey>('due');
  const [accountEditorToken, setAccountEditorToken] = useState(0);
  const [paymentDrawer, setPaymentDrawer] = useState<{ open: boolean; row?: PaymentRow | null }>({ open: false });
  const [budgetDrawer, setBudgetDrawer] = useState<{ open: boolean; category?: BudgetCategory | null }>({ open: false });
  const [savingsDrawer, setSavingsDrawer] = useState<{ open: boolean; goal?: SavingsGoal | null }>({ open: false });
  const [jdgDrawer, setJdgDrawer] = useState<{ open: boolean; item?: JdgItem | null }>({ open: false });

  const financeQuery = useFinanceDashboard(month);
  const finance = financeQuery.data ?? EMPTY_FINANCE;
  const activeAccounts = finance.accounts.filter((account) => !account.archived);
  const monthBudget = finance.budgetCategories.filter((category) => category.month === month);
  const payments = useMemo(() => toPaymentRows(finance.recurringExpenses, finance.financialReminders, month), [finance.recurringExpenses, finance.financialReminders, month]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('month', month);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [month]);

  const totals = useMemo(() => {
    const funds = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
    const savings = finance.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const due = payments.filter((row) => !row.paid).reduce((sum, row) => sum + row.amount, 0);
    const paid = payments.filter((row) => row.paid).reduce((sum, row) => sum + row.amount, 0);
    const planned = monthBudget.reduce((sum, category) => sum + category.plannedAmount, 0);
    const spent = monthBudget.reduce((sum, category) => sum + category.actualAmount, 0);
    const budgetPct = clampPct((spent / Math.max(planned, 1)) * 100);
    return { funds, savings, due, paid, planned, spent, budgetPct };
  }, [activeAccounts, monthBudget, payments, finance.savingsGoals]);

  const openSummary = (key: SummaryKey) => {
    setActiveSummary(key);
    if (key === 'accounts') setSegment('accounts');
    if (key === 'savings') setSegment('savings');
    if (key === 'budget') setSegment('budget');
    if (key === 'due') setSegment('due');
  };

  const addForSegment = () => {
    if (segment === 'accounts') setAccountEditorToken((value) => value + 1);
    if (segment === 'due') setPaymentDrawer({ open: true });
    if (segment === 'budget') setBudgetDrawer({ open: true });
    if (segment === 'savings') setSavingsDrawer({ open: true });
    if (segment === 'jdg') setJdgDrawer({ open: true });
    if (segment === 'history') exportHistoryCsv(month, payments);
  };

  return (
    <PageLayout
      className="finance-os"
      header={<PageHeader
        icon={<Icon name="wallet" />}
        title="Finanse"
        desc="Przegląd finansów, budżetu i płatności w jednym miejscu."
        actions={(
          <div className="finance-month-control">
            <button className="icon-btn" type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Poprzedni miesiąc"><Icon name="arrow" flip /></button>
            <input className="input finance-month-input" type="month" value={month} onChange={(event) => setMonth(event.target.value || currentYearMonth())} />
            <button className="icon-btn" type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Następny miesiąc"><Icon name="arrow" /></button>
          </div>
        )}
      />}
    >

      <section className="finance-summary-strip">
        <SummaryTile active={activeSummary === 'accounts'} label="Środki" value={fmtMoney(totals.funds)} note={`${activeAccounts.length} aktywnych źródeł`} onClick={() => openSummary('accounts')} />
        <SummaryTile active={activeSummary === 'savings'} label="Oszczędności" value={fmtMoney(totals.savings)} note={`${finance.savingsGoals.length} cele oszczędnościowe`} onClick={() => openSummary('savings')} />
        <SummaryTile active={activeSummary === 'budget'} label="Budżet" value={`${fmtNumber(totals.budgetPct)}%`} note={`${fmtMoney(totals.spent)} wydane z ${fmtMoney(totals.planned)}`} onClick={() => openSummary('budget')} />
        <SummaryTile active={activeSummary === 'due'} label="Płatności" value={fmtMoney(totals.due)} note={`Pozostało w ${monthLabel(month)}`} onClick={() => openSummary('due')} />
      </section>

      <div className="finance-workspace">
        <main className="finance-month-panel">
          <div className="finance-segment-toolbar">
            <nav className="finance-segment-tabs">
              {SEGMENTS.map((item) => <button key={item.id} className={segment === item.id ? 'is-active' : ''} type="button" onClick={() => setSegment(item.id)}>{item.label}</button>)}
            </nav>
            <div className="finance-segment-side">
              <SegmentKpiRail segment={segment} month={month} accounts={activeAccounts} payments={payments} goals={finance.savingsGoals} totals={totals} jdgItems={finance.jdgItems} jdgMonths={finance.jdgMonths} />
              <button className="btn btn-primary btn-sm finance-segment-cta" type="button" onClick={addForSegment}>{ctaLabel(segment)}</button>
            </div>
          </div>
          <div className="finance-segment-body">
            {financeQuery.isLoading && <FinanceEmpty title="Ładuję finanse..." desc="Pobieram dane z Supabase." />}
            {financeQuery.isError && <FinanceEmpty title="Nie udało się pobrać finansów." desc={financeQuery.error instanceof Error ? financeQuery.error.message : 'Spróbuj ponownie za chwilę.'} />}
            {!financeQuery.isLoading && !financeQuery.isError && segment === 'accounts' && <AccountsSegment editorToken={accountEditorToken} accounts={finance.accounts} />}
            {segment === 'due' && <PaymentsSegment month={month} payments={payments} onEdit={(row) => setPaymentDrawer({ open: true, row })} />}
            {segment === 'budget' && <BudgetSegment categories={monthBudget} onEdit={(category) => setBudgetDrawer({ open: true, category })} />}
            {segment === 'savings' && <SavingsSegment goals={finance.savingsGoals} onEdit={(goal) => setSavingsDrawer({ open: true, goal })} />}
            {segment === 'jdg' && <JdgSegment month={month} jdgItems={finance.jdgItems} jdgMonths={finance.jdgMonths} onEdit={(item) => setJdgDrawer({ open: true, item })} />}
            {segment === 'history' && <HistorySegment month={month} payments={payments} />}
          </div>
        </main>

      </div>

      <PaymentDrawer open={paymentDrawer.open} row={paymentDrawer.row ?? null} month={month} onClose={() => setPaymentDrawer({ open: false })} />
      <BudgetDrawer open={budgetDrawer.open} category={budgetDrawer.category ?? null} month={month} onClose={() => setBudgetDrawer({ open: false })} />
      <SavingsDrawer open={savingsDrawer.open} goal={savingsDrawer.goal ?? null} onClose={() => setSavingsDrawer({ open: false })} />
      <JdgDrawer open={jdgDrawer.open} item={jdgDrawer.item ?? null} month={month} onClose={() => setJdgDrawer({ open: false })} />
    </PageLayout>
  );
}

function ctaLabel(segment: FinanceSegment) {
  if (segment === 'accounts') return '+ Źródło';
  if (segment === 'due') return '+ Płatność';
  if (segment === 'budget') return '+ Kategoria';
  if (segment === 'savings') return '+ Nowy cel';
  if (segment === 'jdg') return '+ Obowiązek';
  return 'Eksportuj';
}

function SummaryTile({ label, value, note, active, action, onClick }: { label: string; value: string; note: string; active: boolean; action?: IconName; onClick: () => void }) {
  return (
    <button className={`finance-summary-tile ${active ? 'is-active' : ''}`} type="button" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      {action && <i className="finance-summary-action"><Icon name={action} /></i>}
    </button>
  );
}

function SegmentKpiRail({
  segment,
  month,
  accounts,
  payments,
  goals,
  totals,
  jdgItems,
  jdgMonths,
}: {
  segment: FinanceSegment;
  month: string;
  accounts: Account[];
  payments: PaymentRow[];
  goals: SavingsGoal[];
  totals: { due: number; paid: number; budgetPct: number; spent: number; planned: number };
  jdgItems: JdgItem[];
  jdgMonths: { month: string; completed: string[] }[];
}) {
  const next = payments.find((row) => !row.paid);
  const overdue = payments.filter((row) => row.status === 'overdue').length;
  const remaining = totals.planned - totals.spent;
  const savings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const savingsTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const jdgCompleted = jdgMonths.find((row) => row.month === month)?.completed.length ?? 0;
  const paidRows = payments.filter((row) => row.paid);
  const funds = accounts.reduce((sum, account) => sum + account.balance, 0);
  const plnFunds = accounts.filter((account) => account.currency === 'PLN').reduce((sum, account) => sum + account.balance, 0);
  const foreignAccounts = accounts.filter((account) => account.currency !== 'PLN').length;

  if (segment === 'accounts') {
    return (
      <div className="finance-segment-kpis">
        <MiniKpi label="Środki" value={fmtMoney(funds)} />
        <MiniKpi label="Źródła" value={`${accounts.length}`} />
        <MiniKpi label="PLN" value={fmtMoney(plnFunds)} />
        <MiniKpi label="Waluty" value={`${foreignAccounts}`} />
      </div>
    );
  }
  if (segment === 'due') {
    return (
      <div className="finance-segment-kpis">
        <MiniKpi label="Płatności" value={fmtMoney(totals.due)} />
        <MiniKpi label="Opłacone" value={fmtMoney(totals.paid)} />
        <MiniKpi label="Najbliższa" value={next ? formatDate(next.dueDate) : '-'} danger={Boolean(next?.status === 'overdue')} />
        <MiniKpi label="Po terminie" value={`${overdue}`} danger={overdue > 0} />
      </div>
    );
  }
  if (segment === 'budget') {
    return (
      <div className="finance-segment-kpis">
        <MiniKpi label="Plan" value={fmtMoney(totals.planned)} />
        <MiniKpi label="Wydane" value={fmtMoney(totals.spent)} />
        <MiniKpi label="Pozostało" value={fmtMoney(remaining)} danger={remaining < 0} />
        <MiniKpi label="Wykonanie" value={`${fmtNumber(totals.budgetPct)}%`} />
      </div>
    );
  }
  if (segment === 'savings') {
    return (
      <div className="finance-segment-kpis">
        <MiniKpi label="Oszczędności" value={fmtMoney(savings)} />
        <MiniKpi label="Cele" value={`${goals.length}`} />
        <MiniKpi label="Realizacja" value={`${fmtNumber((savings / Math.max(savingsTarget, 1)) * 100)}%`} />
      </div>
    );
  }
  if (segment === 'jdg') {
    return (
      <div className="finance-segment-kpis">
        <MiniKpi label="Ukończone" value={`${jdgCompleted}/${jdgItems.length}`} />
        <MiniKpi label="Postęp" value={`${jdgItems.length ? fmtNumber((jdgCompleted / jdgItems.length) * 100) : 0}%`} />
      </div>
    );
  }
  return (
    <div className="finance-segment-kpis">
      <MiniKpi label="Zdarzenia" value={`${paidRows.length}`} />
      <MiniKpi label="Opłacono" value={fmtMoney(paidRows.reduce((sum, row) => sum + row.amount, 0))} />
    </div>
  );
}

function MiniKpi({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <span className={`finance-mini-kpi ${danger ? 'is-danger' : ''}`}><small>{label}</small><strong>{value}</strong></span>;
}

function PaymentsSegment({ month, payments, onEdit }: { month: string; payments: PaymentRow[]; onEdit: (row: PaymentRow) => void }) {
  const setRecurringPaid = useSetRecurringPaid();
  const toggleReminder = useToggleFinanceReminder();
  const deleteRecurring = useDeleteFinanceRecurringExpense();
  const deleteReminder = useDeleteFinanceReminder();
  const [deleteTarget, setDeleteTarget] = useState<PaymentRow | null>(null);
  const total = payments.reduce((sum, row) => sum + row.amount, 0);

  const toggle = (row: PaymentRow) => {
    if (row.source === 'recurring') setRecurringPaid.mutate({ payment: row.raw as RecurringExpense, month, paid: !row.paid });
    else toggleReminder.mutate({ id: (row.raw as FinancialReminder).id, completed: !row.paid });
  };

  return (
    <>
      {payments.length === 0 ? (
        <FinanceEmpty title="Brak płatności w tym miesiącu." desc="Dodaj pierwszą płatność albo skonfiguruj cykliczne koszty." />
      ) : (
        <div className="finance-payments-table">
          <div className="finance-payments-head">
            <span />
            <span>Nazwa</span><span>Kategoria</span><span>Termin</span><span>Kwota</span><span>Typ</span><span>Status</span><span>Akcje</span>
          </div>
          {payments.map((row) => (
            <div key={row.id} className={`finance-payment-line ${row.paid ? 'is-paid' : ''}`} onClick={() => onEdit(row)}>
              <button className="finance-check" type="button" onClick={(event) => { event.stopPropagation(); toggle(row); }} aria-label="Zmień status płatności">{row.paid && <Icon name="check" />}</button>
              <span className="finance-payment-name"><span className={`finance-icon-tile finance-tone-${row.status === 'paid' ? 'teal' : 'blue'}`}><Icon name={categoryIcon(row.category, row.name)} /></span><strong>{row.name}</strong></span>
              <span className="finance-category-cell"><span className={`finance-icon-tile finance-tone-${row.status === 'paid' ? 'teal' : 'blue'}`}><Icon name={categoryIcon(row.category)} /></span>{row.category}</span>
              <span className={row.status === 'overdue' ? 'finance-danger' : ''}>{formatDate(row.dueDate)}</span>
              <strong>{fmtMoney(row.amount)}</strong>
              <Badge>{row.type}</Badge>
              <StatusBadge status={row.status} />
              <span className="finance-line-actions">
                <button className="icon-btn" type="button" onClick={(event) => { event.stopPropagation(); onEdit(row); }}><Icon name="edit" /></button>
                <button className="icon-btn" type="button" onClick={(event) => { event.stopPropagation(); setDeleteTarget(row); }}><Icon name="trash" /></button>
              </span>
            </div>
          ))}
          <div className="finance-total-line"><span>{payments.length} płatności</span><strong>{fmtMoney(total)}</strong></div>
        </div>
      )}
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        label={deleteTarget?.name ?? 'płatność'}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.source === 'recurring') deleteRecurring.mutate((deleteTarget.raw as RecurringExpense).id);
          else deleteReminder.mutate((deleteTarget.raw as FinancialReminder).id);
          setDeleteTarget(null);
        }}
      />
      <span className="finance-panel-foot">{monthLabel(month)} · suma płatności {fmtMoney(total)}</span>
    </>
  );
}

function BudgetSegment({ categories, onEdit }: { categories: BudgetCategory[]; onEdit: (category: BudgetCategory) => void }) {
  const deleteBudgetCategory = useDeleteFinanceBudgetCategory();
  const [deleteTarget, setDeleteTarget] = useState<BudgetCategory | null>(null);

  return (
    <>
      {categories.length === 0 ? (
        <FinanceEmpty title="Budżet na ten miesiąc nie jest skonfigurowany." desc="Dodaj kategorie i zaplanowane kwoty." />
      ) : (
        <div className="finance-budget-table">
          <div className="finance-budget-row is-head"><span>Kategoria</span><span>Plan</span><span>Wydane</span><span>Pozostało</span><span>%</span><span>Status</span><span>Akcje</span></div>
          {categories.map((category) => {
            const pct = clampPct((category.actualAmount / Math.max(category.plannedAmount, 1)) * 100);
            const left = category.plannedAmount - category.actualAmount;
            const over = left < 0;
            return (
              <button key={category.id} className="finance-budget-row" type="button" onClick={() => onEdit(category)}>
                <span className="finance-budget-name"><span className={`finance-icon-tile finance-tone-${over ? 'pink' : 'blue'}`}><Icon name={categoryIcon(category.name)} /></span>{category.name}</span>
                <strong>{fmtMoney(category.plannedAmount)}</strong>
                <strong>{fmtMoney(category.actualAmount)}</strong>
                <strong className={over ? 'finance-danger' : ''}>{fmtMoney(left)}</strong>
                <span className="finance-budget-progress"><i style={{ width: `${pct}%`, background: over ? 'var(--finance-overdue)' : 'var(--accent-ice-strong)' }} />{fmtNumber(pct)}%</span>
                <span>{over ? <Badge tone="danger">przekroczony</Badge> : <Badge>ok</Badge>}</span>
                <span className="finance-line-actions"><span className="icon-btn"><Icon name="edit" /></span><span className="icon-btn" onClick={(event) => { event.stopPropagation(); setDeleteTarget(category); }}><Icon name="trash" /></span></span>
              </button>
            );
          })}
        </div>
      )}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} label={deleteTarget?.name ?? 'kategorię'} onConfirm={() => { if (deleteTarget) deleteBudgetCategory.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </>
  );
}

function SavingsSegment({ goals, onEdit }: { goals: SavingsGoal[]; onEdit: (goal: SavingsGoal) => void }) {
  const deleteSavingsGoal = useDeleteFinanceSavingsGoal();
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);

  return (
    <>
      {goals.length === 0 ? (
        <FinanceEmpty title="Nie masz jeszcze celów oszczędnościowych." desc="Dodaj pierwszy cel i śledź postęp." />
      ) : (
        <div className="finance-savings-list-v2">
          {goals.map((goal) => {
            const pct = clampPct((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100);
            return (
              <button key={goal.id} className="finance-saving-line" type="button" onClick={() => onEdit(goal)}>
                <span className="finance-icon-tile finance-tone-teal"><Icon name={categoryIcon(goal.name)} /></span>
                <span><strong>{goal.name}</strong><small>{goal.notes || 'Cel oszczędnościowy'}</small></span>
                <span><strong>{fmtMoney(goal.currentAmount)}</strong><small>z {fmtMoney(goal.targetAmount)}</small></span>
                <span className="finance-progress-line"><i style={{ width: `${pct}%` }} />{fmtNumber(pct)}%</span>
                <span className="finance-line-actions"><span className="icon-btn"><Icon name="edit" /></span><span className="icon-btn" onClick={(event) => { event.stopPropagation(); setDeleteTarget(goal); }}><Icon name="trash" /></span></span>
              </button>
            );
          })}
        </div>
      )}
      <ConfirmDelete open={!!deleteTarget} onClose={() => setDeleteTarget(null)} label={deleteTarget?.name ?? 'cel'} onConfirm={() => { if (deleteTarget) deleteSavingsGoal.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </>
  );
}

function JdgSegment({ month, jdgItems, jdgMonths, onEdit }: { month: string; jdgItems: JdgItem[]; jdgMonths: { month: string; completed: string[] }[]; onEdit: (item: JdgItem) => void }) {
  const setJdgMonth = useSetJdgMonth();
  const current = jdgMonths.find((item) => item.month === month);
  const completed = current?.completed ?? [];

  const toggle = (item: JdgItem) => {
    const next = completed.includes(item.id) ? completed.filter((id) => id !== item.id) : [...completed, item.id];
    setJdgMonth.mutate({ month: current ?? { month, completed }, itemIds: next });
  };

  return (
    <>
      {jdgItems.length === 0 ? (
        <FinanceEmpty title="Brak obowiązków JDG." desc="Dodaj miesięczną checklistę, np. ZUS, PIT, VAT." />
      ) : (
        <div className="finance-jdg-table">
          <div className="finance-jdg-table-head"><span /><span>Nazwa</span><span>Termin</span><span>Status</span><span>Akcje</span></div>
          {jdgItems.map((item) => {
            const done = completed.includes(item.id);
            return (
              <button key={item.id} className={`finance-jdg-table-row ${done ? 'is-paid' : ''}`} type="button" onClick={() => toggle(item)}>
                <span className="finance-check">{done && <Icon name="check" />}</span>
                <span className="finance-payment-name"><span className="finance-icon-tile finance-tone-pink"><Icon name="business" /></span><strong>{item.label}</strong></span>
                <span>{item.dueDay ? `${item.dueDay}. dzień miesiąca` : 'bez terminu'}</span>
                <StatusBadge status={done ? 'paid' : 'due'} />
                <span className="finance-line-actions"><span className="icon-btn" onClick={(event) => { event.stopPropagation(); onEdit(item); }}><Icon name="edit" /></span></span>
              </button>
            );
          })}
          <div className="finance-total-line"><span>{monthLabel(month)} · ukończone {completed.length}/{jdgItems.length}</span><strong>{jdgItems.length ? `${fmtNumber((completed.length / jdgItems.length) * 100)}%` : '0%'}</strong></div>
        </div>
      )}
    </>
  );
}

function HistorySegment({ month, payments }: { month: string; payments: PaymentRow[] }) {
  const rows = payments.filter((row) => row.paid).map((row) => ({
    id: row.id,
    title: `${row.name} oznaczono jako opłacone`,
    category: row.category,
    date: row.dueDate,
    amount: row.amount,
  }));
  return (
    <>
      {rows.length === 0 ? (
        <FinanceEmpty title="Brak historii" desc="Zdarzenia finansowe z wybranego miesiąca pojawią się tutaj." />
      ) : (
        <div className="finance-history-table">
          <div className="finance-history-table-head"><span>Data</span><span>Zdarzenie</span><span>Kategoria</span><span>Kwota</span></div>
          {rows.map((row) => (
            <div key={row.id} className="finance-history-table-row">
              <span>{formatDate(row.date)}</span>
              <span className="finance-payment-name"><span className="finance-icon-tile finance-tone-teal"><Icon name={categoryIcon(row.category, row.title)} /></span><strong>{row.title}</strong></span>
              <span className="finance-category-cell"><span className="finance-icon-tile finance-tone-blue"><Icon name={categoryIcon(row.category)} /></span>{row.category}</span>
              <strong>{fmtMoney(row.amount)}</strong>
            </div>
          ))}
          <div className="finance-total-line"><span>{monthLabel(month)} · zdarzenia {rows.length}</span><strong>{fmtMoney(rows.reduce((sum, row) => sum + row.amount, 0))}</strong></div>
        </div>
      )}
    </>
  );
}

function blankAccount(): Account {
  return { id: '', createdAt: '', name: '', type: 'main_account', balance: 0, currency: 'PLN', archived: false, color: '#3B82F6' };
}

function AccountsSegment({ editorToken, accounts }: { editorToken: number; accounts: Account[] }) {
  const saveAccount = useSaveAccount();
  const deleteAccount = useDeleteFinanceAccount();
  const [editing, setEditing] = useState<Account | null>(null);
  const active = accounts.filter((account) => !account.archived);
  const total = active.reduce((sum, account) => sum + account.balance, 0);

  useEffect(() => {
    if (editorToken > 0) setEditing(blankAccount());
  }, [editorToken]);

  return (
    <div className="finance-accounts-panel">
      <div className="finance-drawer-total"><span>Łączne środki</span><strong>{fmtMoney(total)}</strong></div>
      <div className="finance-account-list finance-account-list-panel">
        {active.length === 0 ? <FinanceEmpty title="Nie masz jeszcze źródeł środków." desc="Dodaj konto, gotówkę albo inne źródło." /> : active.map((account) => (
          <button key={account.id} type="button" className="finance-account-row" onClick={() => setEditing(account)}>
            <span className="finance-icon-tile finance-tone-blue"><Icon name={accountIcon(account)} /></span>
            <span><strong>{account.name}</strong><small>{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</small></span>
            <b>{fmtMoney(account.balance, account.currency)}</b>
            <span className="finance-line-actions">
              <span className="icon-btn"><Icon name="edit" /></span>
              <span className="icon-btn" onClick={(event) => { event.stopPropagation(); deleteAccount.mutate(account.id); }}><Icon name="trash" /></span>
            </span>
          </button>
        ))}
      </div>
      <button className="btn btn-secondary finance-inline-add" type="button" onClick={() => setEditing(blankAccount())}>+ Dodaj źródło</button>
      <AccountEditor account={editing} onClose={() => setEditing(null)} onSave={(payload) => {
        saveAccount.mutate({ id: editing?.id || undefined, input: payload });
        setEditing(null);
      }} />
    </div>
  );
}

function PaymentDrawer({ open, row, month, onClose }: { open: boolean; row: PaymentRow | null; month: string; onClose: () => void }) {
  const saveRecurring = useSaveRecurringExpense();
  const saveReminder = useSaveFinancialReminder();
  const initial = row ? {
    name: row.name,
    amount: String(row.amount),
    category: row.category,
    dueDate: row.dueDate,
    paymentType: row.source === 'reminder' ? 'one_time' : (row.raw as RecurringExpense).frequency === 'jdg' ? 'jdg' : 'monthly',
    status: row.paid ? 'paid' : 'due',
    reminder: true,
    showPlanner: false,
    note: '',
  } : {
    name: '',
    amount: '0',
    category: CATEGORY_OPTIONS[0],
    dueDate: `${month}-10`,
    paymentType: 'monthly',
    status: 'due',
    reminder: true,
    showPlanner: false,
    note: '',
  };
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [open, row?.id, month]);

  const save = () => {
    if (!form.name.trim()) return;
    const amount = num(form.amount);
    if (form.paymentType === 'one_time') {
      const payload = { title: form.name.trim(), amount, dueDate: form.dueDate, category: form.category, completed: form.status === 'paid' };
      saveReminder.mutate({ id: row?.source === 'reminder' ? (row.raw as FinancialReminder).id : undefined, input: payload });
    } else {
      const payload = {
        name: form.name.trim(),
        amount,
        category: form.category,
        dueDay: Number(form.dueDate.slice(-2)),
        frequency: (form.paymentType === 'jdg' ? 'jdg' : form.paymentType === 'yearly' ? 'yearly' : 'monthly') as RecurringExpense['frequency'],
        reminderEnabled: form.reminder,
        paidThisMonth: form.status === 'paid',
        folderId: undefined,
      };
      saveRecurring.mutate({ id: row?.source === 'recurring' ? (row.raw as RecurringExpense).id : undefined, input: payload });
    }
    onClose();
  };

  return (
    <FinanceDrawer open={open} title={row ? 'Edytuj płatność' : 'Dodaj płatność'} onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={save}>Zapisz</button></>}>
      <div className="finance-form-grid">
        <Field label="Nazwa" required><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Kwota"><input className="input" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field>
        <Field label="Kategoria"><select className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Termin"><input className="input" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></Field>
        <Field label="Typ płatności"><select className="select" value={form.paymentType} onChange={(event) => setForm({ ...form, paymentType: event.target.value })}>{PAYMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="Status"><select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="due">do zapłaty</option><option value="paid">opłacone</option><option value="cancelled">anulowane</option></select></Field>
      </div>
      <label className="finance-toggle"><input type="checkbox" checked={form.reminder} onChange={(event) => setForm({ ...form, reminder: event.target.checked })} /> Przypomnij 2 dni przed terminem</label>
      <label className="finance-toggle"><input type="checkbox" checked={form.showPlanner} onChange={(event) => setForm({ ...form, showPlanner: event.target.checked })} /> Pokaż w Planerze</label>
      <Field label="Notatka"><textarea className="textarea" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
    </FinanceDrawer>
  );
}

function BudgetDrawer({ open, category, month, onClose }: { open: boolean; category: BudgetCategory | null; month: string; onClose: () => void }) {
  const saveBudgetCategory = useSaveBudgetCategory();
  const [form, setForm] = useState({ name: '', planned: '0', spent: '0', color: BUDGET_COLORS[0], note: '' });
  useEffect(() => setForm({ name: category?.name ?? '', planned: String(category?.plannedAmount ?? 0), spent: String(category?.actualAmount ?? 0), color: category?.color ?? BUDGET_COLORS[0], note: '' }), [category, open]);
  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), plannedAmount: num(form.planned), actualAmount: num(form.spent), month, color: form.color };
    saveBudgetCategory.mutate({ id: category?.id, input: payload });
    onClose();
  };
  return (
    <FinanceDrawer open={open} title={category ? 'Edytuj kategorię budżetu' : 'Dodaj kategorię budżetu'} onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={save}>Zapisz</button></>}>
      <Field label="Nazwa" required><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <div className="finance-form-grid">
        <Field label="Miesięczny plan"><input className="input" type="number" value={form.planned} onChange={(event) => setForm({ ...form, planned: event.target.value })} /></Field>
        <Field label="Wydane"><input className="input" type="number" value={form.spent} onChange={(event) => setForm({ ...form, spent: event.target.value })} /></Field>
        <Field label="Kolor"><input className="input" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></Field>
      </div>
      <Field label="Notatka"><textarea className="textarea" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
    </FinanceDrawer>
  );
}

function SavingsDrawer({ open, goal, onClose }: { open: boolean; goal: SavingsGoal | null; onClose: () => void }) {
  const saveSavingsGoal = useSaveSavingsGoal();
  const [form, setForm] = useState({ name: '', current: '0', target: '10000', deadline: '', notes: '', contribution: '' });
  useEffect(() => setForm({ name: goal?.name ?? '', current: String(goal?.currentAmount ?? 0), target: String(goal?.targetAmount ?? 10000), deadline: goal?.deadline ?? '', notes: goal?.notes ?? '', contribution: '' }), [goal, open]);
  const save = () => {
    if (!form.name.trim()) return;
    const current = num(form.current) + num(form.contribution);
    const payload = { name: form.name.trim(), currentAmount: current, targetAmount: num(form.target), deadline: form.deadline || undefined, notes: form.notes, emoji: goal?.emoji ?? '$' };
    saveSavingsGoal.mutate({ id: goal?.id, input: payload });
    onClose();
  };
  return (
    <FinanceDrawer open={open} title={goal ? 'Edytuj cel oszczędnościowy' : 'Nowy cel oszczędnościowy'} onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={save}>Zapisz</button></>}>
      <Field label="Nazwa" required><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <div className="finance-form-grid">
        <Field label="Aktualnie"><input className="input" type="number" value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} /></Field>
        <Field label="Cel"><input className="input" type="number" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></Field>
        <Field label="Termin"><input className="input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></Field>
        <Field label="+ Dodaj wpłatę"><input className="input" type="number" value={form.contribution} onChange={(event) => setForm({ ...form, contribution: event.target.value })} /></Field>
      </div>
      <Field label="Notatka"><textarea className="textarea" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
    </FinanceDrawer>
  );
}

function JdgDrawer({ open, item, month, onClose }: { open: boolean; item: JdgItem | null; month: string; onClose: () => void }) {
  const saveJdgItem = useSaveJdgItem();
  const [form, setForm] = useState({ title: '', dueDay: '', description: '', planner: false });
  useEffect(() => setForm({ title: item?.label ?? '', dueDay: item?.dueDay ? String(item.dueDay) : '', description: '', planner: false }), [item, open]);
  const save = () => {
    if (!form.title.trim()) return;
    const payload = { label: form.title.trim(), dueDay: form.dueDay ? Number(form.dueDay) : undefined };
    saveJdgItem.mutate({ id: item?.id, input: payload });
    onClose();
  };
  return (
    <FinanceDrawer open={open} title={item ? 'Edytuj obowiązek JDG' : 'Dodaj obowiązek JDG'} onClose={onClose} footer={<><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={save}>Zapisz</button></>}>
      <Field label="Nazwa" required><input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
      <Field label={`Dzień miesiąca (${monthLabel(month)})`}><input className="input" type="number" min={1} max={31} value={form.dueDay} onChange={(event) => setForm({ ...form, dueDay: event.target.value })} /></Field>
      <label className="finance-toggle"><input type="checkbox" checked={form.planner} onChange={(event) => setForm({ ...form, planner: event.target.checked })} /> Pokaż w Planerze</label>
      <Field label="Opis"><textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
    </FinanceDrawer>
  );
}

function AccountEditor({ account, onClose, onSave }: { account: Account | null; onClose: () => void; onSave: (payload: Omit<Account, 'id' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({ name: '', type: 'main_account', balance: '0', currency: 'PLN', institution: '', color: '#3B82F6' });
  useEffect(() => setForm({ name: account?.name ?? '', type: account?.type ?? 'main_account', balance: String(account?.balance ?? 0), currency: account?.currency ?? 'PLN', institution: account?.institution ?? '', color: account?.color ?? '#3B82F6' }), [account]);
  if (!account) return null;
  return (
    <div className="finance-inline-editor">
      <Field label="Nazwa" required><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <div className="finance-form-grid">
        <Field label="Typ"><select className="select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{ACCOUNT_TYPE_LABELS[type]}</option>)}</select></Field>
        <Field label="Waluta"><select className="select" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select></Field>
        <Field label="Saldo"><input className="input" type="number" value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} /></Field>
      </div>
      <div className="finance-drawer-footer"><button className="btn btn-secondary" onClick={onClose}>Anuluj</button><button className="btn btn-primary" onClick={() => { if (!form.name.trim()) return; onSave({ name: form.name.trim(), type: form.type, balance: num(form.balance), currency: form.currency, institution: form.institution || undefined, archived: false, color: form.color }); }}>Zapisz</button></div>
    </div>
  );
}

function FinanceDrawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="finance-drawer-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="finance-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header><strong>{title}</strong><button className="icon-btn" onClick={onClose} aria-label="Zamknij"><Icon name="close" /></button></header>
        <div className="finance-drawer-body">{children}</div>
        {footer && <footer className="finance-drawer-footer">{footer}</footer>}
      </aside>
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone?: 'danger' | 'success' | 'jdg' }) {
  return <span className={`finance-badge ${tone ? `is-${tone}` : ''}`}>{children}</span>;
}

function StatusBadge({ status }: { status: PaymentRow['status'] }) {
  if (status === 'paid') return <Badge tone="success">opłacone</Badge>;
  if (status === 'overdue') return <Badge tone="danger">po terminie</Badge>;
  return <Badge>do zapłaty</Badge>;
}

function FinanceEmpty({ title, desc }: { title: string; desc: string }) {
  return <div className="finance-empty"><strong>{title}</strong><span>{desc}</span></div>;
}

function exportHistoryCsv(month: string, payments: PaymentRow[]) {
  const rows = payments.map((row) => `${row.dueDate},${row.name},${row.category},${row.amount},${row.status}`).join('\n');
  const blob = new Blob([`date,name,category,amount,status\n${rows}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rootine-finanse-${month}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Icon({ name, flip = false }: { name: IconName; flip?: boolean }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: flip ? 'rotate(180deg)' : undefined }}>
      {name === 'wallet' && <><path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4H17" {...common} /><path d="M16 13h4M16 13a1.5 1.5 0 0 0 0 3h4" {...common} /></>}
      {name === 'savings' && <><path d="M12 21s7-4 7-10V5l-7-3-7 3v6c0 6 7 10 7 10z" {...common} /></>}
      {name === 'budget' && <><path d="M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H7" {...common} /></>}
      {name === 'due' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 7v5l3 2" {...common} /></>}
      {name === 'paid' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="m8 12.5 2.6 2.6L16.5 9" {...common} /></>}
      {name === 'home' && <><path d="M3.5 11.5 12 4l8.5 7.5" {...common} /><path d="M5.5 10.5V20h13v-9.5" {...common} /><path d="M10 20v-5h4v5" {...common} /></>}
      {name === 'transport' && <><rect x="4" y="7" width="16" height="9" rx="2" {...common} /><path d="M7 7l1.5-3h7L17 7M7 16v2M17 16v2" {...common} /></>}
      {name === 'food' && <><path d="M7 3v8M4.5 3v5.5a2.5 2.5 0 0 0 5 0V3M7 11v10" {...common} /><path d="M15 3v18M15 3c3 1.3 4.5 3.7 4.5 7v1H15" {...common} /></>}
      {name === 'entertainment' && <><path d="M7 15h10l1.8 2.2a2.2 2.2 0 0 0 3.6-2.2l-1.2-5.3A4 4 0 0 0 17.3 6H6.7a4 4 0 0 0-3.9 3.7L1.6 15a2.2 2.2 0 0 0 3.6 2.2L7 15z" {...common} /></>}
      {name === 'health' && <><path d="M20.5 8.8c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.5 2.6z" {...common} /></>}
      {name === 'business' && <><path d="M3 21h18M5 21V8l7-5 7 5v13" {...common} /><path d="M9 21v-7h6v7" {...common} /></>}
      {name === 'car' && <><path d="M5 14h14l-1.5-5.5A3 3 0 0 0 14.6 6H9.4a3 3 0 0 0-2.9 2.5L5 14z" {...common} /><path d="M5 14v4M19 14v4M8 11h8" {...common} /></>}
      {name === 'phone' && <><path d="M6.5 4.5 9 3l2.5 4-1.8 1.3a12 12 0 0 0 6 6l1.3-1.8 4 2.5-1.5 2.5a3 3 0 0 1-3.4 1.3C10.8 17.2 6.8 13.2 5.2 7.9a3 3 0 0 1 1.3-3.4z" {...common} /></>}
      {name === 'shield' && <><path d="M12 21s7-3.5 7-9.5V5l-7-3-7 3v6.5C5 17.5 12 21 12 21z" {...common} /></>}
      {name === 'cash' && <><rect x="3" y="6" width="18" height="12" rx="2" {...common} /><circle cx="12" cy="12" r="2.5" {...common} /></>}
      {name === 'bank' && <><path d="M4 10h16M5 20h14M6 10v10M10 10v10M14 10v10M18 10v10M3.5 8 12 3l8.5 5" {...common} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...common} /></>}
      {name === 'edit' && <><path d="M12 20h9" {...common} /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" {...common} /></>}
      {name === 'trash' && <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6" {...common} /></>}
      {name === 'check' && <><path d="M20 6 9 17l-5-5" {...common} /></>}
      {name === 'settings' && <><circle cx="12" cy="12" r="3" {...common} /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" {...common} /></>}
      {name === 'history' && <><path d="M3 12a9 9 0 1 0 3-6.7" {...common} /><path d="M3 4v6h6M12 7v5l3 2" {...common} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...common} /><path d="M8 3v4M16 3v4M4 10h16" {...common} /></>}
      {name === 'note' && <><path d="M5 4h11l3 3v13H5z" {...common} /><path d="M16 4v4h4M8 12h8M8 16h5" {...common} /></>}
      {name === 'arrow' && <><path d="m9 18 6-6-6-6" {...common} /></>}
      {name === 'close' && <><path d="M18 6 6 18M6 6l12 12" {...common} /></>}
      {name === 'reset' && <><path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6" {...common} /></>}
    </svg>
  );
}
