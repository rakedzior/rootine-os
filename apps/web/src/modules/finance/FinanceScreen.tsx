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
  { id: 'miesieczne', label: 'Miesięczne', icon: () => <TabIcon name="calendar" /> },
];

type FinanceTab = 'przeglad' | 'miesieczne';
type FinanceTone = 'blue' | 'violet' | 'teal' | 'pink';
type IconName =
  | 'overview' | 'calendar' | 'accounts' | 'budget' | 'savings' | 'payments' | 'business'
  | 'due' | 'paid' | 'edit' | 'plus' | 'reset' | 'check'
  | 'home' | 'transport' | 'food' | 'entertainment' | 'health' | 'utilities' | 'phone'
  | 'shield' | 'car' | 'travel' | 'cash' | 'bank' | 'wallet' | 'other';

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

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function iconForAccount(account: Account): IconName {
  const source = normalized(`${account.type} ${account.name} ${account.institution ?? ''}`);
  if (source.includes('oszczed')) return 'bank';
  if (source.includes('gotow') || source.includes('cash')) return 'wallet';
  if (source.includes('walut') || source.includes('inwest')) return 'cash';
  return 'accounts';
}

function toneForAccount(account: Account): FinanceTone {
  const source = normalized(`${account.type} ${account.name}`);
  if (source.includes('oszczed')) return 'violet';
  if (source.includes('gotow')) return 'teal';
  if (source.includes('wspol') || source.includes('inwest')) return 'pink';
  return 'blue';
}

function iconForCategory(category: string, name = ''): IconName {
  const source = normalized(`${category} ${name}`);
  if (source.includes('miesz') || source.includes('czynsz')) return 'home';
  if (source.includes('transport') || source.includes('parking')) return 'transport';
  if (source.includes('jedz')) return 'food';
  if (source.includes('rozryw') || source.includes('netflix')) return 'entertainment';
  if (source.includes('zdrow') || source.includes('silown')) return 'health';
  if (source.includes('prad') || source.includes('internet') || source.includes('dom')) return 'utilities';
  if (source.includes('telefon') || source.includes('abonament')) return 'phone';
  if (source.includes('ubez')) return 'shield';
  if (source.includes('auto') || source.includes('samoch') || source.includes('oc')) return 'car';
  if (source.includes('jdg') || source.includes('ksieg') || source.includes('faktur')) return 'business';
  return 'other';
}

function toneForCategory(category: string): FinanceTone {
  const source = normalized(category);
  if (source.includes('miesz') || source.includes('transport') || source.includes('auto')) return 'blue';
  if (source.includes('jedz') || source.includes('dom') || source.includes('ubez')) return 'teal';
  if (source.includes('rozryw')) return 'violet';
  return 'pink';
}

function iconForSavings(goal: SavingsGoal): IconName {
  const source = normalized(`${goal.name} ${goal.notes ?? ''}`);
  if (source.includes('podusz') || source.includes('bezpiec')) return 'shield';
  if (source.includes('wakac') || source.includes('urlop')) return 'travel';
  if (source.includes('samoch') || source.includes('auto')) return 'car';
  return 'savings';
}

function toneForSavings(goal: SavingsGoal): FinanceTone {
  const source = normalized(`${goal.name} ${goal.notes ?? ''}`);
  if (source.includes('wakac') || source.includes('urlop')) return 'pink';
  if (source.includes('samoch') || source.includes('auto')) return 'blue';
  return 'teal';
}

function iconForJdg(key: keyof JdgMonth): IconName {
  if (key === 'invoiceIssued' || key === 'documentsSent') return 'payments';
  if (key === 'accountingPaid') return 'business';
  return 'budget';
}

export function FinanceScreen() {
  const [tab, setTab] = useState<FinanceTab>('przeglad');
  const [month, setMonth] = useState(currentYearMonth());

  return (
    <div className="module-page">
      <div className="module-header no-title">
        <SubTabs tabs={TABS} active={tab} onChange={(id) => setTab(id as FinanceTab)} />
      </div>

      {tab === 'przeglad' && <FinanceOverview month={month} onNavigate={setTab} />}
      {tab === 'miesieczne' && <FinanceMonthly month={month} onMonthChange={setMonth} />}
    </div>
  );
}

function FinanceOverview({ month, onNavigate }: { month: string; onNavigate: (tab: FinanceTab) => void }) {
  const { accounts, savingsGoals, recurringExpenses } = useLocalStore();
  const activeAccounts = accounts.filter((a) => !a.archived);
  const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const monthlyFixed = recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="finance-shell">
      <div className="finance-kpi-grid">
        <MetricCard
          icon="accounts"
          label="Łączne środki"
          value={fmtPLN(totalBalance)}
          note={`${activeAccounts.length} aktywne konta`}
          tone="blue"
          onEdit={() => onNavigate('przeglad')}
        />
        <MetricCard
          icon="savings"
          label="Łączne oszczędności"
          value={fmtPLN(totalSavings)}
          note={`${savingsGoals.length} cele oszczędnościowe`}
          tone="violet"
          onEdit={() => onNavigate('przeglad')}
        />
        <MetricCard
          icon="payments"
          label="Miesięczne stałe wydatki"
          value={fmtPLN(monthlyFixed)}
          note={`Stałe koszty w ${fmtMonth(month)}`}
          tone="teal"
          onEdit={() => onNavigate('miesieczne')}
        />
      </div>

      <div className="finance-dashboard-grid">
        <AccountsPanel />
        <SavingsPanel />
        <FixedExpensesPanel onConfigure={() => onNavigate('miesieczne')} />
      </div>

      <div className="finance-overview-cta">
        <div className="finance-cta-copy">
          <FinanceIcon name="calendar" />
          <span>Budżet, płatności cykliczne oraz elementy JDG znajdziesz w zakładce Miesięczne.</span>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => onNavigate('miesieczne')}>Przejdź do Miesięczne</button>
      </div>
    </div>
  );
}

function FinanceMonthly({ month, onMonthChange }: { month: string; onMonthChange: (month: string) => void }) {
  const { budgetCategories, recurringExpenses, financialReminders } = useLocalStore();
  const categories = budgetCategories.filter((cat) => cat.month === month);
  const planned = categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  const actual = categories.reduce((sum, cat) => sum + cat.actualAmount, 0);
  const paidRecurring = recurringExpenses.filter((item) => item.paidThisMonth).reduce((sum, item) => sum + item.amount, 0);
  const dueRecurring = recurringExpenses.filter((item) => !item.paidThisMonth).reduce((sum, item) => sum + item.amount, 0);
  const monthReminders = financialReminders.filter((reminder) => reminder.dueDate.startsWith(month));
  const paidReminders = monthReminders.filter((reminder) => reminder.completed).reduce((sum, reminder) => sum + (reminder.amount ?? 0), 0);
  const dueReminders = monthReminders.filter((reminder) => !reminder.completed).reduce((sum, reminder) => sum + (reminder.amount ?? 0), 0);
  const paid = paidRecurring + paidReminders;
  const due = dueRecurring + dueReminders;
  const remaining = planned - actual;
  const budgetPct = clampPct((actual / Math.max(planned, 1)) * 100);

  return (
    <div className="finance-shell">
      <FinanceMonthBar month={month} onMonthChange={onMonthChange} />

      <div className="finance-kpi-grid">
        <MetricCard icon="due" label="Do zapłaty" value={fmtPLN(due)} note={`Pozostało w ${fmtMonth(month)}`} tone="pink" />
        <MetricCard icon="paid" label="Opłacone" value={fmtPLN(paid)} note={`Opłacone w ${fmtMonth(month)}`} tone="teal" />
        <BudgetMetric planned={planned} actual={actual} remaining={remaining} pct={budgetPct} />
      </div>

      <div className="finance-monthly-grid">
        <BudgetPanel month={month} detailed />
        <RecurringPanel month={month} detailed />
        <JdgPanel month={month} detailed />
      </div>
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

function MetricCard({ icon, label, value, note, tone, onEdit }: { icon: IconName; label: string; value: string; note: string; tone: FinanceTone; onEdit?: () => void }) {
  return (
    <article className={`finance-metric finance-metric-${tone}`}>
      <div className="finance-metric-icon"><FinanceIcon name={icon} /></div>
      <div className="finance-metric-body">
        <div className="finance-metric-label">
          {label}
          {onEdit && (
            <button className="finance-inline-edit" type="button" onClick={onEdit} aria-label={`Edytuj: ${label}`}>
              <FinanceIcon name="edit" />
            </button>
          )}
        </div>
        <div className="finance-metric-value">{value}</div>
        <div className="finance-metric-note">{note}</div>
      </div>
      <MiniSparkline tone={tone} />
    </article>
  );
}

function BudgetMetric({ planned, actual, remaining, pct }: { planned: number; actual: number; remaining: number; pct: number }) {
  return (
    <article className="finance-metric finance-budget-metric">
      <div className="finance-metric-icon"><FinanceIcon name="budget" /></div>
      <div className="finance-budget-metric-body">
        <div className="finance-metric-label">
          Budżet miesiąca
          <span className="finance-inline-edit" aria-hidden="true"><FinanceIcon name="edit" /></span>
        </div>
        <div className="finance-budget-metric-stats">
          <Stat label="Zaplanowane" value={fmtPLN(planned)} />
          <Stat label="Wydane" value={fmtPLN(actual)} />
          <Stat label="Pozostało" value={fmtPLN(remaining)} danger={remaining < 0} />
        </div>
        <div className="finance-budget-meter">
          <span style={{ width: `${pct}%` }} />
          <strong>{fmtNumber(pct)}%</strong>
        </div>
      </div>
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
                        <span className={`finance-icon-tile finance-tone-${toneForAccount(account)}`}><FinanceIcon name={iconForAccount(account)} /></span>
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
                    <span className={`finance-icon-tile finance-tone-${toneForCategory(cat.name)}`}><FinanceIcon name={iconForCategory(cat.name)} /></span>
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
                    <span className={`finance-icon-tile finance-tone-${toneForSavings(goal)}`}><FinanceIcon name={iconForSavings(goal)} /></span>
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

function FixedExpensesPanel({ onConfigure }: { onConfigure: () => void }) {
  const { recurringExpenses } = useLocalStore();
  const total = recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const grouped = Array.from(recurringExpenses.reduce((map, expense) => {
    map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    return map;
  }, new Map<string, number>()).entries())
    .map(([category, amount]) => ({ category, amount, pct: clampPct((amount / Math.max(total, 1)) * 100) }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <SectionCard
      title="Stałe wydatki"
      action={<button className="finance-inline-edit" type="button" onClick={onConfigure} aria-label="Skonfiguruj stałe wydatki"><FinanceIcon name="edit" /></button>}
    >
      {grouped.length === 0 ? (
        <EmptyState title="Brak stałych wydatków" cta="Skonfiguruj" onCta={onConfigure} />
      ) : (
        <div className="finance-fixed-list">
          {grouped.map((item) => {
            const icon = iconForCategory(item.category);
            const tone = toneForCategory(item.category);
            return (
              <button key={item.category} className="finance-fixed-row" type="button" onClick={onConfigure}>
                <span className={`finance-icon-tile finance-tone-${tone}`}><FinanceIcon name={icon} /></span>
                <span className="finance-fixed-main">
                  <strong>{item.category}</strong>
                  <span className="finance-progress"><span style={{ width: `${item.pct}%` }} /></span>
                </span>
                <span className="finance-fixed-amount">{fmtPLN(item.amount)}</span>
                <span className="finance-fixed-share">{fmtNumber(item.pct)}%</span>
              </button>
            );
          })}
          <div className="finance-fixed-total">
            <span>Łączne stałe wydatki</span>
            <strong>{fmtPLN(total)} / mies.</strong>
          </div>
        </div>
      )}
      <button className="finance-config-strip" type="button" onClick={onConfigure}>
        <FinanceIcon name="business" />
        <span>Skonfiguruj stałe wydatki</span>
      </button>
    </SectionCard>
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
                <span className={`finance-icon-tile finance-tone-${toneForCategory(expense.category)}`}><FinanceIcon name={iconForCategory(expense.category, expense.name)} /></span>
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
                  <span className={`finance-icon-tile finance-tone-${checked ? 'teal' : 'pink'}`}><FinanceIcon name={iconForJdg(check.key)} /></span>
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

function MiniSparkline({ tone }: { tone: FinanceTone }) {
  const points = useMemo(() => {
    if (tone === 'violet') return '0,34 12,31 24,33 36,22 48,18 60,24 72,20 84,12 96,10 108,3';
    if (tone === 'teal') return '0,29 12,28 24,18 36,19 48,12 60,15 72,10 84,11 96,5 108,4';
    if (tone === 'pink') return '0,30 12,19 24,23 36,16 48,18 60,12 72,8 84,9 96,2 108,11';
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
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...common} /><path d="M8 3v4M16 3v4M4 10h16" {...common} /><path d="M8 14h3M14 14h2M8 17h2" {...common} /></>}
      {name === 'due' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 7v5l3 2M12 18h.01" {...common} /></>}
      {name === 'paid' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="m8 12.5 2.6 2.6L16.5 9" {...common} /></>}
      {name === 'home' && <><path d="M3.5 11.5 12 4l8.5 7.5" {...common} /><path d="M5.5 10.5V20h13v-9.5" {...common} /><path d="M10 20v-5h4v5" {...common} /></>}
      {name === 'transport' && <><rect x="4" y="7" width="16" height="9" rx="2" {...common} /><path d="M7 7l1.5-3h7L17 7M7 16v2M17 16v2M7.5 12h.01M16.5 12h.01" {...common} /></>}
      {name === 'food' && <><path d="M7 3v8M4.5 3v5.5a2.5 2.5 0 0 0 5 0V3M7 11v10" {...common} /><path d="M15 3v18M15 3c3 1.3 4.5 3.7 4.5 7v1H15" {...common} /></>}
      {name === 'entertainment' && <><path d="M7 15h10l1.8 2.2a2.2 2.2 0 0 0 3.6-2.2l-1.2-5.3A4 4 0 0 0 17.3 6H6.7a4 4 0 0 0-3.9 3.7L1.6 15a2.2 2.2 0 0 0 3.6 2.2L7 15z" {...common} /><path d="M7.5 10v3M6 11.5h3M15.5 11h.01M18 13h.01" {...common} /></>}
      {name === 'health' && <><path d="M20.5 8.8c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.5 2.6z" {...common} /><path d="M8 12h2l1-2.5 2 5 1-2.5h2" {...common} /></>}
      {name === 'utilities' && <><path d="m13 2-8 12h6l-1 8 9-13h-6l0-7z" {...common} /></>}
      {name === 'phone' && <><path d="M6.5 4.5 9 3l2.5 4-1.8 1.3a12 12 0 0 0 6 6l1.3-1.8 4 2.5-1.5 2.5a3 3 0 0 1-3.4 1.3C10.8 17.2 6.8 13.2 5.2 7.9a3 3 0 0 1 1.3-3.4z" {...common} /></>}
      {name === 'shield' && <><path d="M12 21s7-3.5 7-9.5V5l-7-3-7 3v6.5C5 17.5 12 21 12 21z" {...common} /><path d="M9 12l2 2 4-5" {...common} /></>}
      {name === 'car' && <><path d="M5 14h14l-1.5-5.5A3 3 0 0 0 14.6 6H9.4a3 3 0 0 0-2.9 2.5L5 14z" {...common} /><path d="M5 14v4M19 14v4M7.5 18h.01M16.5 18h.01M8 11h8" {...common} /></>}
      {name === 'travel' && <><path d="M4 12a8 8 0 0 1 16 0" {...common} /><path d="M4 12h16M8 12c0-4 4-8 4-8s4 4 4 8M12 12v8M9 20h6" {...common} /></>}
      {name === 'cash' && <><rect x="3" y="6" width="18" height="12" rx="2" {...common} /><circle cx="12" cy="12" r="2.5" {...common} /><path d="M6.5 9.5v.01M17.5 14.5v.01" {...common} /></>}
      {name === 'bank' && <><path d="M4 10h16M5 20h14M6 10v10M10 10v10M14 10v10M18 10v10M3.5 8 12 3l8.5 5" {...common} /></>}
      {name === 'wallet' && <><path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4H17" {...common} /><path d="M16 13h4M16 13a1.5 1.5 0 0 0 0 3h4" {...common} /></>}
      {name === 'other' && <><circle cx="12" cy="12" r="8" {...common} /><path d="M8 12h.01M12 12h.01M16 12h.01" {...common} /></>}
    </svg>
  );
}
