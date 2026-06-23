import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, IcoTrash } from '@/components/common';
import {
  useLocalStore,
  type Account,
  type BudgetCategory,
  type FinancialReminder,
  type JdgMonth,
  type RecurringExpense,
  type SavingsGoal,
} from '@/store/localStore';

const TABS = [
  { id: 'przeglad', label: 'Przegląd', icon: () => <TabIcon name="overview" /> },
  { id: 'konta', label: 'Konta', icon: () => <TabIcon name="accounts" /> },
  { id: 'budzet', label: 'Budżet', icon: () => <TabIcon name="budget" /> },
  { id: 'oszczednosci', label: 'Oszczędności', icon: () => <TabIcon name="savings" /> },
  { id: 'cykliczne', label: 'Płatności', icon: () => <TabIcon name="payments" /> },
  { id: 'jdg', label: 'JDG', icon: () => <TabIcon name="business" /> },
];

type FinanceTab = 'przeglad' | 'konta' | 'budzet' | 'oszczednosci' | 'cykliczne' | 'jdg';
type IconName = 'overview' | 'accounts' | 'budget' | 'savings' | 'payments' | 'business' | 'edit' | 'plus' | 'reset' | 'check';

const CATEGORY_OPTIONS = ['Mieszkanie', 'Transport', 'Jedzenie', 'Rozrywka', 'Zdrowie', 'JDG', 'Auto', 'Inne'];
const ACCOUNT_TYPES = ['główne', 'oszczędnościowe', 'gotówka', 'karta', 'walutowe', 'inwestycje'];
const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'];
const BUDGET_COLORS = ['#3B82F6', '#F59E0B', '#22C55E', '#8B5CF6', '#EF4444', '#14B8A6', '#6B7280'];

const JDG_CHECKS: { key: keyof JdgMonth; label: string }[] = [
  { key: 'invoiceIssued', label: 'Faktury wystawione' },
  { key: 'documentsSent', label: 'Dokumenty wysłane' },
  { key: 'accountingPaid', label: 'Księgowość opłacona' },
  { key: 'zusPaid', label: 'ZUS opłacony' },
  { key: 'pitPaid', label: 'PIT opłacony' },
  { key: 'vatPaid', label: 'VAT opłacony' },
];

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtPLN(n: number, currency = 'PLN') {
  return n.toLocaleString('pl-PL', { style: 'currency', currency, maximumFractionDigits: 0 });
}

function fmtNumber(n: number) {
  return n.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
}

function fmtMonth(month: string) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
}

function daysInMonth(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function dueDateFor(month: string, dueDay: number) {
  const day = Math.min(Math.max(1, dueDay), daysInMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function num(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function FinanceScreen() {
  const [tab, setTab] = useState<FinanceTab>('przeglad');
  const [month, setMonth] = useState(currentYearMonth());

  return (
    <div className="module-page">
      <div className="module-header no-title">
        <SubTabs tabs={TABS} active={tab} onChange={(id) => setTab(id as FinanceTab)} />
      </div>

      {tab === 'przeglad' && <FinanceDashboard month={month} onMonthChange={setMonth} onNavigate={setTab} />}
      {tab === 'konta' && <FinanceFocus month={month} onMonthChange={setMonth}><AccountsPanel detailed /></FinanceFocus>}
      {tab === 'budzet' && <FinanceFocus month={month} onMonthChange={setMonth}><BudgetPanel month={month} detailed /></FinanceFocus>}
      {tab === 'oszczednosci' && <FinanceFocus month={month} onMonthChange={setMonth}><SavingsPanel detailed /></FinanceFocus>}
      {tab === 'cykliczne' && <FinanceFocus month={month} onMonthChange={setMonth}><RecurringPanel month={month} detailed /></FinanceFocus>}
      {tab === 'jdg' && <FinanceFocus month={month} onMonthChange={setMonth}><JdgPanel month={month} detailed /></FinanceFocus>}
    </div>
  );
}

function FinanceDashboard({ month, onMonthChange, onNavigate }: { month: string; onMonthChange: (month: string) => void; onNavigate: (tab: FinanceTab) => void }) {
  const { accounts, savingsGoals, recurringExpenses, budgetCategories } = useLocalStore();
  const activeAccounts = accounts.filter((a) => !a.archived);
  const monthBudget = budgetCategories.filter((c) => c.month === month);
  const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const monthlyFixed = recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const planned = monthBudget.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  const actual = monthBudget.reduce((sum, cat) => sum + cat.actualAmount, 0);

  return (
    <div className="finance-shell">
      <FinanceMonthBar month={month} onMonthChange={onMonthChange} />

      <div className="finance-kpi-grid">
        <MetricCard
          icon="accounts"
          label="Łączne środki"
          value={fmtPLN(totalBalance)}
          note={`${activeAccounts.length} aktywne konta`}
          tone="blue"
          onEdit={() => onNavigate('konta')}
        />
        <MetricCard
          icon="savings"
          label="Łączne oszczędności"
          value={fmtPLN(totalSavings)}
          note={`${savingsGoals.length} cele oszczędnościowe`}
          tone="violet"
          onEdit={() => onNavigate('oszczednosci')}
        />
        <MetricCard
          icon="payments"
          label="Miesięczne stałe wydatki"
          value={fmtPLN(monthlyFixed)}
          note={`${fmtPLN(actual)} z ${fmtPLN(planned)} budżetu`}
          tone="teal"
          onEdit={() => onNavigate('cykliczne')}
        />
      </div>

      <div className="finance-dashboard-grid">
        <AccountsPanel />
        <BudgetPanel month={month} />
        <SavingsPanel />
      </div>

      <div className="finance-bottom-grid">
        <RecurringPanel month={month} />
        <JdgPanel month={month} />
      </div>
    </div>
  );
}

function FinanceFocus({ month, onMonthChange, children }: { month: string; onMonthChange: (month: string) => void; children: ReactNode }) {
  return (
    <div className="finance-shell">
      <FinanceMonthBar month={month} onMonthChange={onMonthChange} />
      {children}
    </div>
  );
}

function FinanceMonthBar({ month, onMonthChange }: { month: string; onMonthChange: (month: string) => void }) {
  return (
    <div className="finance-toolbar">
      <div>
        <div className="finance-eyebrow">Plan finansowy</div>
        <div className="finance-toolbar-title">{fmtMonth(month)}</div>
      </div>
      <div className="finance-month-control">
        <input className="input" type="month" value={month} onChange={(e) => onMonthChange(e.target.value || currentYearMonth())} />
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => onMonthChange(currentYearMonth())}>Bieżący miesiąc</button>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, note, tone, onEdit }: { icon: IconName; label: string; value: string; note: string; tone: 'blue' | 'violet' | 'teal'; onEdit: () => void }) {
  return (
    <article className={`finance-metric finance-metric-${tone}`}>
      <div className="finance-metric-icon"><FinanceIcon name={icon} /></div>
      <div className="finance-metric-body">
        <div className="finance-metric-label">
          {label}
          <button className="finance-inline-edit" type="button" onClick={onEdit} aria-label={`Edytuj: ${label}`}>
            <FinanceIcon name="edit" />
          </button>
        </div>
        <div className="finance-metric-value">{value}</div>
        <div className="finance-metric-note">{note}</div>
      </div>
      <MiniSparkline tone={tone} />
    </article>
  );
}

function SectionCard({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`finance-card ${className}`}>
      <div className="finance-card-head">
        <div className="finance-card-title">{title}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AccountsPanel({ detailed = false }: { detailed?: boolean }) {
  const { accounts, addAccount, updateAccount, deleteAccount } = useLocalStore();
  const active = accounts.filter((account) => !account.archived);
  const total = active.reduce((sum, account) => sum + account.balance, 0);
  const [editing, setEditing] = useState<Account | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  return (
    <>
      <SectionCard
        title={`Konta (${active.length})`}
        className={detailed ? 'finance-card-full' : ''}
        action={<button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}><FinanceIcon name="plus" /> Nowe konto</button>}
      >
        {active.length === 0 ? (
          <EmptyState title="Brak kont" cta="Dodaj konto" onCta={() => setAdding(true)} />
        ) : (
          <div className="finance-table-wrap">
            <table className="table finance-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Typ</th>
                  <th>Waluta</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {active.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <button className="finance-name-btn" type="button" onClick={() => setEditing(account)}>
                        <span className="finance-dot" style={{ background: account.color }}>{account.name.slice(0, 1).toUpperCase()}</span>
                        <span>{account.name}</span>
                      </button>
                    </td>
                    <td>{account.type}</td>
                    <td>{account.currency}</td>
                    <td className="finance-money-cell">{fmtPLN(account.balance, account.currency)}</td>
                    <td className="finance-actions-cell">
                      <button className="icon-btn" type="button" onClick={() => setEditing(account)} aria-label={`Edytuj konto ${account.name}`}><FinanceIcon name="edit" /></button>
                      <button className="icon-btn" type="button" onClick={() => setDeleteTarget(account)} aria-label={`Archiwizuj konto ${account.name}`}><IcoTrash /></button>
                    </td>
                  </tr>
                ))}
                <tr className="finance-total-row">
                  <td colSpan={3}>Łącznie</td>
                  <td className="finance-money-cell">{fmtPLN(total)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <AccountModal
        open={adding || !!editing}
        account={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(payload) => {
          if (editing) updateAccount(editing.id, payload);
          else addAccount(payload);
          setAdding(false);
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteAccount(deleteTarget.id); setDeleteTarget(null); }}
        label={deleteTarget?.name ?? 'to konto'}
      />
    </>
  );
}

function BudgetPanel({ month, detailed = false }: { month: string; detailed?: boolean }) {
  const { budgetCategories, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory, resetBudgetMonth } = useLocalStore();
  const categories = budgetCategories.filter((cat) => cat.month === month);
  const planned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  const actual = categories.reduce((sum, cat) => sum + cat.actualAmount, 0);
  const remaining = planned - actual;
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BudgetCategory | null>(null);

  return (
    <>
      <SectionCard
        title="Budżet"
        className={detailed ? 'finance-card-full' : ''}
        action={
          <div className="finance-card-actions">
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => resetBudgetMonth(month)}><FinanceIcon name="reset" /> Reset</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}><FinanceIcon name="plus" /> Kategoria</button>
          </div>
        }
      >
        <div className="finance-budget-summary">
          <Stat label="Zaplanowane" value={fmtPLN(planned)} />
          <Stat label="Wydane" value={fmtPLN(actual)} />
          <Stat label="Pozostało" value={fmtPLN(remaining)} danger={remaining < 0} />
        </div>

        {categories.length === 0 ? (
          <EmptyState title="Brak budżetu" desc="Dodaj kategorie dla wybranego miesiąca." cta="Dodaj kategorię" onCta={() => setAdding(true)} />
        ) : (
          <div className="finance-budget-list">
            {categories.map((cat) => {
              const pct = clampPct((cat.actualAmount / Math.max(cat.plannedAmount, 1)) * 100);
              const over = cat.actualAmount > cat.plannedAmount;
              return (
                <div key={cat.id} className="finance-budget-row">
                  <button className="finance-budget-main" type="button" onClick={() => setEditing(cat)}>
                    <span className="finance-color-dot" style={{ background: cat.color }} />
                    <span>{cat.name}</span>
                  </button>
                  <div className="finance-budget-values">
                    <span>{fmtPLN(cat.plannedAmount)}</span>
                    <span className={over ? 'finance-danger' : ''}>{fmtPLN(cat.actualAmount)}</span>
                    <span className={over ? 'finance-danger' : ''}>{fmtPLN(cat.plannedAmount - cat.actualAmount)}</span>
                  </div>
                  <div className="finance-progress"><span style={{ width: `${pct}%`, background: over ? 'var(--danger)' : cat.color }} /></div>
                  <div className="finance-row-actions">
                    <button className="icon-btn" type="button" onClick={() => setEditing(cat)} aria-label={`Edytuj kategorię ${cat.name}`}><FinanceIcon name="edit" /></button>
                    <button className="icon-btn" type="button" onClick={() => setDeleteTarget(cat)} aria-label={`Usuń kategorię ${cat.name}`}><IcoTrash /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <BudgetModal
        open={adding || !!editing}
        category={editing}
        month={month}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(payload) => {
          if (editing) updateBudgetCategory(editing.id, payload);
          else addBudgetCategory(payload);
          setAdding(false);
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteBudgetCategory(deleteTarget.id); setDeleteTarget(null); }}
        label={deleteTarget?.name ?? 'tę kategorię'}
      />
    </>
  );
}

function SavingsPanel({ detailed = false }: { detailed?: boolean }) {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useLocalStore();
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);

  return (
    <>
      <SectionCard
        title="Oszczędności"
        className={detailed ? 'finance-card-full' : ''}
        action={<button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}><FinanceIcon name="plus" /> Nowy cel</button>}
      >
        {savingsGoals.length === 0 ? (
          <EmptyState title="Brak celów" cta="Dodaj cel" onCta={() => setAdding(true)} />
        ) : (
          <div className="finance-savings-list">
            {savingsGoals.map((goal) => {
              const pct = clampPct((goal.currentAmount / Math.max(goal.targetAmount, 1)) * 100);
              return (
                <div key={goal.id} className="finance-saving-row">
                  <button className="finance-saving-main" type="button" onClick={() => setEditing(goal)}>
                    <span className="finance-saving-icon">{goal.emoji || '$'}</span>
                    <span>
                      <strong>{goal.name}</strong>
                      <small>{goal.notes || 'Cel oszczędnościowy'}</small>
                    </span>
                  </button>
                  <div className="finance-saving-amounts">
                    <span>{fmtPLN(goal.currentAmount)}</span>
                    <small>z {fmtPLN(goal.targetAmount)}</small>
                  </div>
                  <div className="finance-progress finance-progress-pink"><span style={{ width: `${pct}%` }} /></div>
                  <div className="finance-saving-meta">{fmtNumber(pct)}% celu</div>
                  <div className="finance-row-actions">
                    <button className="icon-btn" type="button" onClick={() => setEditing(goal)} aria-label={`Edytuj cel ${goal.name}`}><FinanceIcon name="edit" /></button>
                    <button className="icon-btn" type="button" onClick={() => setDeleteTarget(goal)} aria-label={`Usuń cel ${goal.name}`}><IcoTrash /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SavingsModal
        open={adding || !!editing}
        goal={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(payload) => {
          if (editing) updateSavingsGoal(editing.id, payload);
          else addSavingsGoal(payload);
          setAdding(false);
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteSavingsGoal(deleteTarget.id); setDeleteTarget(null); }}
        label={deleteTarget?.name ?? 'ten cel'}
      />
    </>
  );
}

function RecurringPanel({ month, detailed = false }: { month: string; detailed?: boolean }) {
  const { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = useLocalStore();
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const sorted = [...recurringExpenses].sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name));
  const total = sorted.reduce((sum, item) => sum + item.amount, 0);
  const paid = sorted.filter((item) => item.paidThisMonth).reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <SectionCard
        title="Cykliczne płatności"
        className={detailed ? 'finance-card-full' : 'finance-card-wide'}
        action={<button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}><FinanceIcon name="plus" /> Płatność</button>}
      >
        <div className="finance-payment-summary">
          <Stat label="Suma miesięczna" value={fmtPLN(total)} />
          <Stat label="Opłacone" value={fmtPLN(paid)} />
          <Stat label="Do opłacenia" value={fmtPLN(total - paid)} danger={total - paid > 0} />
        </div>

        {sorted.length === 0 ? (
          <EmptyState title="Brak płatności" cta="Dodaj płatność" onCta={() => setAdding(true)} />
        ) : (
          <div className="finance-payment-list">
            {sorted.map((expense) => (
              <div key={expense.id} className={`finance-payment-row ${expense.paidThisMonth ? 'is-paid' : ''}`}>
                <button
                  className="finance-check"
                  type="button"
                  onClick={() => updateRecurringExpense(expense.id, { paidThisMonth: !expense.paidThisMonth })}
                  aria-label={expense.paidThisMonth ? 'Oznacz jako nieopłacone' : 'Oznacz jako opłacone'}
                >
                  {expense.paidThisMonth && <FinanceIcon name="check" />}
                </button>
                <button className="finance-payment-name" type="button" onClick={() => setEditing(expense)}>
                  <strong>{expense.name}</strong>
                  <small>{expense.category} - termin {dueDateFor(month, expense.dueDay)}</small>
                </button>
                <span className="badge badge-gray">{expense.frequency}</span>
                <span className="finance-payment-amount">{fmtPLN(expense.amount)}</span>
                <span className={`badge ${expense.paidThisMonth ? 'badge-green' : 'badge-gray'}`}>{expense.paidThisMonth ? 'Opłacone' : 'Do zapłaty'}</span>
                <div className="finance-row-actions">
                  <button className="icon-btn" type="button" onClick={() => setEditing(expense)} aria-label={`Edytuj płatność ${expense.name}`}><FinanceIcon name="edit" /></button>
                  <button className="icon-btn" type="button" onClick={() => setDeleteTarget(expense)} aria-label={`Usuń płatność ${expense.name}`}><IcoTrash /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <PaymentPlanner month={month} />
      </SectionCard>

      <RecurringModal
        open={adding || !!editing}
        expense={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(payload) => {
          if (editing) updateRecurringExpense(editing.id, payload);
          else addRecurringExpense(payload);
          setAdding(false);
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteRecurringExpense(deleteTarget.id); setDeleteTarget(null); }}
        label={deleteTarget?.name ?? 'tę płatność'}
      />
    </>
  );
}

function PaymentPlanner({ month }: { month: string }) {
  const { financialReminders, addFinancialReminder, updateFinancialReminder, deleteFinancialReminder, toggleFinancialReminder } = useLocalStore();
  const [editing, setEditing] = useState<FinancialReminder | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FinancialReminder | null>(null);
  const reminders = financialReminders
    .filter((reminder) => reminder.dueDate.startsWith(month))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <div className="finance-planner">
        <div className="finance-subhead">
          <span>Terminy jednorazowe</span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAdding(true)}><FinanceIcon name="plus" /> Termin</button>
        </div>
        {reminders.length === 0 ? (
          <div className="finance-muted-box">Brak dodatkowych terminów w tym miesiącu.</div>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className={`finance-reminder-row ${reminder.completed ? 'is-paid' : ''}`}>
              <button className="finance-check" type="button" onClick={() => toggleFinancialReminder(reminder.id)} aria-label="Zmień status terminu">
                {reminder.completed && <FinanceIcon name="check" />}
              </button>
              <button className="finance-payment-name" type="button" onClick={() => setEditing(reminder)}>
                <strong>{reminder.title}</strong>
                <small>{reminder.category} - {new Date(`${reminder.dueDate}T12:00:00`).toLocaleDateString('pl-PL')}</small>
              </button>
              <span className="finance-payment-amount">{reminder.amount ? fmtPLN(reminder.amount) : '-'}</span>
              <div className="finance-row-actions">
                <button className="icon-btn" type="button" onClick={() => setEditing(reminder)} aria-label={`Edytuj termin ${reminder.title}`}><FinanceIcon name="edit" /></button>
                <button className="icon-btn" type="button" onClick={() => setDeleteTarget(reminder)} aria-label={`Usuń termin ${reminder.title}`}><IcoTrash /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <ReminderModal
        open={adding || !!editing}
        reminder={editing}
        month={month}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(payload) => {
          if (editing) updateFinancialReminder(editing.id, payload);
          else addFinancialReminder(payload);
          setAdding(false);
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteFinancialReminder(deleteTarget.id); setDeleteTarget(null); }}
        label={deleteTarget?.title ?? 'ten termin'}
      />
    </>
  );
}

function JdgPanel({ month, detailed = false }: { month: string; detailed?: boolean }) {
  const { jdgMonths, updateJdgMonth, addJdgMonth } = useLocalStore();
  const entry = jdgMonths.find((item) => item.month === month);
  const completed = entry ? JDG_CHECKS.filter((check) => entry[check.key] === true).length : 0;

  return (
    <SectionCard title="JDG - opłaty cykliczne" className={detailed ? 'finance-card-full' : 'finance-card-wide'}>
      {!entry ? (
        <EmptyState title="Brak miesiąca JDG" desc="Utwórz checklistę dla wybranego miesiąca." cta="Utwórz miesiąc" onCta={() => addJdgMonth(month)} />
      ) : (
        <div className="finance-jdg-grid">
          <div className="finance-jdg-list">
            <div className="finance-jdg-progress">{completed}/{JDG_CHECKS.length} ukończonych</div>
            {JDG_CHECKS.map((check) => {
              const checked = entry[check.key] === true;
              return (
                <button
                  key={String(check.key)}
                  className={`finance-jdg-check ${checked ? 'is-paid' : ''}`}
                  type="button"
                  onClick={() => updateJdgMonth(entry.id, { [check.key]: !checked } as Partial<JdgMonth>)}
                >
                  <span className="finance-check">{checked && <FinanceIcon name="check" />}</span>
                  <span>{check.label}</span>
                </button>
              );
            })}
          </div>
          <div className="finance-jdg-notes">
            <textarea
              className="textarea"
              value={entry.notes}
              onChange={(event) => updateJdgMonth(entry.id, { notes: event.target.value })}
              placeholder="Notatki do miesiąca..."
              maxLength={500}
            />
            <div>{entry.notes.length}/500</div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function Stat({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="finance-stat">
      <span>{label}</span>
      <strong className={danger ? 'finance-danger' : ''}>{value}</strong>
    </div>
  );
}

function AccountModal({ open, account, onClose, onSave }: { open: boolean; account: Account | null; onClose: () => void; onSave: (payload: Omit<Account, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(ACCOUNT_TYPES[0]);
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('PLN');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState('#3B82F6');

  useEffect(() => {
    setName(account?.name ?? '');
    setType(account?.type ?? ACCOUNT_TYPES[0]);
    setBalance(String(account?.balance ?? 0));
    setCurrency(account?.currency ?? 'PLN');
    setInstitution(account?.institution ?? '');
    setColor(account?.color ?? '#3B82F6');
  }, [account, open]);

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Edytuj konto' : 'Nowe konto'} footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!name.trim()) return;
          onSave({ name: name.trim(), type, balance: num(balance), currency, institution: institution.trim() || undefined, archived: account?.archived ?? false, color });
        }}>Zapisz</button>
      </>
    }>
      <Field label="Nazwa" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Typ"><select className="select" value={type} onChange={(e) => setType(e.target.value)}>{ACCOUNT_TYPES.map((option) => <option key={option}>{option}</option>)}</select></Field>
        <Field label="Waluta"><select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((option) => <option key={option}>{option}</option>)}</select></Field>
        <Field label="Saldo"><input className="input" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
        <Field label="Kolor"><input className="input" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></Field>
      </div>
      <Field label="Instytucja"><input className="input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Bank, portfel, broker..." /></Field>
    </Modal>
  );
}

function BudgetModal({ open, category, month, onClose, onSave }: { open: boolean; category: BudgetCategory | null; month: string; onClose: () => void; onSave: (payload: Omit<BudgetCategory, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [planned, setPlanned] = useState('0');
  const [actual, setActual] = useState('0');
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [color, setColor] = useState(BUDGET_COLORS[0]);

  useEffect(() => {
    setName(category?.name ?? '');
    setPlanned(String(category?.plannedAmount ?? 0));
    setActual(String(category?.actualAmount ?? 0));
    setSelectedMonth(category?.month ?? month);
    setColor(category?.color ?? BUDGET_COLORS[0]);
  }, [category, month, open]);

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edytuj kategorię budżetu' : 'Nowa kategoria budżetu'} footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!name.trim()) return;
          onSave({ name: name.trim(), plannedAmount: num(planned), actualAmount: num(actual), month: selectedMonth, color });
        }}>Zapisz</button>
      </>
    }>
      <Field label="Nazwa" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Miesiąc"><input className="input" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} /></Field>
        <Field label="Kolor"><input className="input" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></Field>
        <Field label="Zaplanowane"><input className="input" type="number" value={planned} onChange={(e) => setPlanned(e.target.value)} /></Field>
        <Field label="Wydane"><input className="input" type="number" value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function SavingsModal({ open, goal, onClose, onSave }: { open: boolean; goal: SavingsGoal | null; onClose: () => void; onSave: (payload: Omit<SavingsGoal, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('$');
  const [target, setTarget] = useState('10000');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setName(goal?.name ?? '');
    setSymbol(goal?.emoji ?? '$');
    setTarget(String(goal?.targetAmount ?? 10000));
    setCurrent(String(goal?.currentAmount ?? 0));
    setDeadline(goal?.deadline ?? '');
    setNotes(goal?.notes ?? '');
  }, [goal, open]);

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edytuj cel' : 'Nowy cel oszczędnościowy'} footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!name.trim()) return;
          onSave({ name: name.trim(), emoji: symbol.trim() || '$', targetAmount: num(target), currentAmount: num(current), deadline: deadline || undefined, notes });
        }}>Zapisz</button>
      </>
    }>
      <div className="form-grid">
        <Field label="Symbol"><input className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)} maxLength={3} /></Field>
        <Field label="Termin"><input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
      </div>
      <Field label="Nazwa" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Cel"><input className="input" type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <Field label="Aktualnie"><input className="input" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
      </div>
      <Field label="Notatki"><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

function RecurringModal({ open, expense, onClose, onSave }: { open: boolean; expense: RecurringExpense | null; onClose: () => void; onSave: (payload: Omit<RecurringExpense, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [dueDay, setDueDay] = useState('10');
  const [frequency, setFrequency] = useState('monthly');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [paidThisMonth, setPaidThisMonth] = useState(false);

  useEffect(() => {
    setName(expense?.name ?? '');
    setAmount(String(expense?.amount ?? 0));
    setCategory(expense?.category ?? CATEGORY_OPTIONS[0]);
    setDueDay(String(expense?.dueDay ?? 10));
    setFrequency(expense?.frequency ?? 'monthly');
    setReminderEnabled(expense?.reminderEnabled ?? true);
    setPaidThisMonth(expense?.paidThisMonth ?? false);
  }, [expense, open]);

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edytuj płatność' : 'Nowa płatność cykliczna'} footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!name.trim()) return;
          onSave({ name: name.trim(), amount: num(amount), category, dueDay: Math.max(1, Math.min(31, Math.round(num(dueDay, 1)))), frequency, reminderEnabled, paidThisMonth });
        }}>Zapisz</button>
      </>
    }>
      <Field label="Nazwa" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Kwota"><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Dzień miesiąca"><input className="input" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></Field>
        <Field label="Kategoria"><select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
        <Field label="Częstotliwość"><select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></Field>
      </div>
      <label className="finance-toggle"><input type="checkbox" checked={paidThisMonth} onChange={(e) => setPaidThisMonth(e.target.checked)} /> Opłacone w wybranym miesiącu</label>
      <label className="finance-toggle"><input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} /> Przypominaj o terminie</label>
    </Modal>
  );
}

function ReminderModal({ open, reminder, month, onClose, onSave }: { open: boolean; reminder: FinancialReminder | null; month: string; onClose: () => void; onSave: (payload: Omit<FinancialReminder, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(`${month}-10`);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setTitle(reminder?.title ?? '');
    setAmount(reminder?.amount == null ? '' : String(reminder.amount));
    setDueDate(reminder?.dueDate ?? `${month}-10`);
    setCategory(reminder?.category ?? CATEGORY_OPTIONS[0]);
    setCompleted(reminder?.completed ?? false);
  }, [reminder, month, open]);

  return (
    <Modal open={open} onClose={onClose} title={reminder ? 'Edytuj termin' : 'Nowy termin płatności'} footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!title.trim()) return;
          onSave({ title: title.trim(), amount: amount.trim() ? num(amount) : undefined, dueDate, category, completed });
        }}>Zapisz</button>
      </>
    }>
      <Field label="Tytuł" required><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Kwota"><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Termin"><input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        <Field label="Kategoria"><select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
      </div>
      <label className="finance-toggle"><input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} /> Opłacone</label>
    </Modal>
  );
}

function MiniSparkline({ tone }: { tone: 'blue' | 'violet' | 'teal' }) {
  const points = useMemo(() => {
    if (tone === 'violet') return '0,34 12,31 24,33 36,22 48,18 60,24 72,20 84,12 96,10 108,3';
    if (tone === 'teal') return '0,29 12,28 24,18 36,19 48,12 60,15 72,10 84,11 96,5 108,4';
    return '0,30 12,24 24,27 36,17 48,13 60,19 72,15 84,9 96,10 108,2';
  }, [tone]);
  return (
    <svg className="finance-spark" viewBox="0 0 108 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function TabIcon({ name }: { name: IconName }) {
  return <FinanceIcon name={name} />;
}

function FinanceIcon({ name }: { name: IconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'accounts' && <><rect x="3" y="5" width="18" height="14" rx="2" {...common} /><path d="M3 10h18M7 15h4" {...common} /></>}
      {name === 'overview' && <><rect x="4" y="4" width="7" height="7" rx="1.5" {...common} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...common} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...common} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...common} /></>}
      {name === 'budget' && <><path d="M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H7" {...common} /></>}
      {name === 'savings' && <><path d="M12 21s7-4 7-10V5l-7-3-7 3v6c0 6 7 10 7 10z" {...common} /></>}
      {name === 'payments' && <><path d="M7 7h10M7 12h7M7 17h5" {...common} /><rect x="4" y="3" width="16" height="18" rx="2" {...common} /></>}
      {name === 'business' && <><path d="M3 21h18M5 21V8l7-5 7 5v13" {...common} /><path d="M9 21v-7h6v7" {...common} /></>}
      {name === 'edit' && <><path d="M12 20h9" {...common} /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" {...common} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...common} /></>}
      {name === 'reset' && <><path d="M3 12a9 9 0 1 0 3-6.7" {...common} /><path d="M3 4v6h6" {...common} /></>}
      {name === 'check' && <><path d="M20 6 9 17l-5-5" {...common} /></>}
    </svg>
  );
}
