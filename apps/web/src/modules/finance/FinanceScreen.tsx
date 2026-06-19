import { useState } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, ProgressBar, IcoTrash } from '@/components/common';
import { useLocalStore, type JdgMonth } from '@/store/localStore';

const TABS = [
  { id: 'przeglad',   label: 'Przegląd' },
  { id: 'konta',      label: 'Konta' },
  { id: 'budzet',     label: 'Budżet' },
  { id: 'oszczednosci', label: 'Oszczędności' },
  { id: 'cykliczne',  label: 'Cykliczne' },
  { id: 'jdg',        label: 'JDG' },
];

function fmtPLN(n: number) {
  return n.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });
}

export function FinanceScreen() {
  const [tab, setTab] = useState('przeglad');
  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">💰 Finanse</h1>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'przeglad'     && <FinancePrzeglad />}
      {tab === 'konta'        && <FinanceKonta />}
      {tab === 'budzet'       && <FinanceBudzet />}
      {tab === 'oszczednosci' && <FinanceOszczednosci />}
      {tab === 'cykliczne'    && <FinanceCykliczne />}
      {tab === 'jdg'          && <FinanceJDG />}
    </div>
  );
}

// ─── PRZEGLĄD ─────────────────────────────────────────────────

function FinancePrzeglad() {
  const { accounts, savingsGoals, recurringExpenses, financialReminders } = useLocalStore();
  const totalBalance = accounts.filter(a => !a.archived).reduce((s, a) => s + a.balance, 0);
  const totalSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const monthlyFixed = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const upcoming = financialReminders.filter(r => !r.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
      {/* Podsumowanie */}
      <div className="col">
        {[
          { label: 'Łączne środki', val: fmtPLN(totalBalance), icon: '💳', color: 'var(--green)' },
          { label: 'Oszczędności', val: fmtPLN(totalSavings), icon: '🏦', color: '#3B82F6' },
          { label: 'Miesięczne stałe', val: fmtPLN(monthlyFixed), icon: '🔄', color: '#F59E0B' },
        ].map(item => (
          <div key={item.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}18`, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{item.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Konta */}
      <div className="card">
        <div className="card-head"><span className="card-title">Konta</span></div>
        {accounts.filter(a => !a.archived).map(acc => (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${acc.color}22`, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0, color: acc.color }}>
              {acc.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{acc.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{acc.type}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums', color: acc.balance < 0 ? 'var(--p-high)' : 'var(--ink)' }}>
              {fmtPLN(acc.balance)}
            </div>
          </div>
        ))}
      </div>

      {/* Przypomnienia */}
      <div className="card">
        <div className="card-head"><span className="card-title">Przypomnienia</span></div>
        {upcoming.length === 0
          ? <EmptyState title="Brak przypomnień" desc="Dodaj przypomnienie o płatności." />
          : upcoming.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{new Date(r.dueDate).toLocaleDateString('pl-PL')}</div>
              </div>
              {r.amount && <span style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{fmtPLN(r.amount)}</span>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── KONTA ────────────────────────────────────────────────────

function FinanceKonta() {
  const { accounts, addAccount, deleteAccount } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Konto osobiste');
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('PLN');
  const [color, setColor] = useState('#166534');

  const active = accounts.filter(a => !a.archived);

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Konta ({active.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowe konto</button>
        </div>
        {active.length === 0
          ? <EmptyState title="Brak kont" cta="Dodaj konto" onCta={() => setShowAdd(true)} />
          : (
            <table className="table">
              <thead><tr><th>NAZWA</th><th>TYP</th><th>WALUTA</th><th style={{ textAlign: 'right' }}>SALDO</th><th></th></tr></thead>
              <tbody>
                {active.map(acc => (
                  <tr key={acc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${acc.color}22`, color: acc.color, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12 }}>{acc.name[0]}</div>
                        <span style={{ fontWeight: 600 }}>{acc.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{acc.type}</td>
                    <td style={{ fontSize: 13 }}>{acc.currency}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: acc.balance < 0 ? 'var(--p-high)' : 'var(--ink)' }}>{fmtPLN(acc.balance)}</td>
                    <td><button className="icon-btn" onClick={() => setDeleteId(acc.id)}><IcoTrash /></button></td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={3} style={{ fontWeight: 700 }}>Łącznie</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtPLN(active.reduce((s, a) => s + a.balance, 0))}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          )
        }
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowe konto"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addAccount({ name, type, balance, currency, color, archived: false });
            setName(''); setBalance(0); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa konta" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. PKO BP — główne" /></Field>
        <div className="form-grid">
          <Field label="Typ"><select className="select" value={type} onChange={e => setType(e.target.value)}>
            {['Konto osobiste','Konto oszczędnościowe','Karta kredytowa','Gotówka','Inwestycje'].map(t => <option key={t}>{t}</option>)}
          </select></Field>
          <Field label="Waluta"><select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
            {['PLN','EUR','USD','GBP'].map(c => <option key={c}>{c}</option>)}
          </select></Field>
          <Field label="Saldo początkowe"><input type="number" className="input" value={balance} onChange={e => setBalance(+e.target.value)} step={100} /></Field>
          <Field label="Kolor"><input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} /></Field>
        </div>
      </Modal>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteAccount(deleteId!); setDeleteId(null); }} label="to konto" />
    </div>
  );
}

// ─── BUDŻET ───────────────────────────────────────────────────

function FinanceBudzet() {
  const { budgetCategories } = useLocalStore();
  const currentMonth = new Date().toISOString().slice(0,7);
  const cats = budgetCategories.filter(c => c.month === currentMonth);
  const totalPlanned = cats.reduce((s, c) => s + c.plannedAmount, 0);
  const totalActual = cats.reduce((s, c) => s + c.actualAmount, 0);

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Zaplanowane</div><div style={{ fontWeight: 800, fontSize: 20 }}>{fmtPLN(totalPlanned)}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Wydane</div><div style={{ fontWeight: 800, fontSize: 20, color: totalActual > totalPlanned ? 'var(--p-high)' : 'var(--ink)' }}>{fmtPLN(totalActual)}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Pozostało</div><div style={{ fontWeight: 800, fontSize: 20, color: 'var(--green-text)' }}>{fmtPLN(totalPlanned - totalActual)}</div></div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><span className="card-title">Kategorie budżetu</span></div>
        {cats.length === 0
          ? <EmptyState title="Brak kategorii" desc="Budżet zostanie uzupełniony po zsynchronizowaniu transakcji." />
          : cats.map(cat => {
            const pct = Math.round((cat.actualAmount / cat.plannedAmount) * 100);
            const over = cat.actualAmount > cat.plannedAmount;
            return (
              <div key={cat.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{cat.name}</span>
                  </div>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: over ? 'var(--p-high)' : 'var(--ink)', fontWeight: 600 }}>{fmtPLN(cat.actualAmount)}</span>
                    <span style={{ color: 'var(--ink-3)' }}> / {fmtPLN(cat.plannedAmount)}</span>
                  </div>
                </div>
                <ProgressBar value={cat.actualAmount} max={cat.plannedAmount} size="sm" color={over ? 'var(--p-high)' : cat.color} />
                <div style={{ fontSize: 11, color: over ? 'var(--p-high)' : 'var(--ink-3)', marginTop: 3, textAlign: 'right' }}>{pct}%</div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── OSZCZĘDNOŚCI ─────────────────────────────────────────────

function FinanceOszczednosci() {
  const { savingsGoals, addSavingsGoal } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏦');
  const [target, setTarget] = useState(10000);
  const [current, setCurrent] = useState(0);
  const [deadline, setDeadline] = useState('');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {savingsGoals.map(goal => {
        const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
        return (
          <div key={goal.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>{goal.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{goal.name}</div>
                {goal.deadline && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Do {new Date(goal.deadline).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</div>}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{fmtPLN(goal.currentAmount)}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>z {fmtPLN(goal.targetAmount)}</span>
              </div>
              <ProgressBar value={goal.currentAmount} max={goal.targetAmount} size="md" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 600 }}>{pct}% celu</div>
          </div>
        );
      })}
      <div className="card" style={{ border: '2px dashed var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer' }} onClick={() => setShowAdd(true)}>
        <div style={{ textAlign: 'center', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
          <div style={{ fontSize: 13 }}>Nowy cel oszczędnościowy</div>
        </div>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowy cel oszczędnościowy"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addSavingsGoal({ name, emoji, targetAmount: target, currentAmount: current, deadline: deadline || undefined, notes: '' });
            setName(''); setCurrent(0); setTarget(10000); setDeadline(''); setShowAdd(false);
          }}>Utwórz</button>
        </>}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Emoji"><input className="input" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ width: 60, textAlign: 'center', fontSize: 20 }} /></Field>
          <Field label="Nazwa" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Fundusz awaryjny" style={{ width: '100%' }} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Cel (PLN)"><input type="number" className="input" value={target} onChange={e => setTarget(+e.target.value)} step={500} /></Field>
          <Field label="Aktualne (PLN)"><input type="number" className="input" value={current} onChange={e => setCurrent(+e.target.value)} step={100} /></Field>
          <Field label="Termin"><input type="date" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── CYKLICZNE ────────────────────────────────────────────────

function FinanceCykliczne() {
  const { recurringExpenses } = useLocalStore();
  const total = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Wydatki cykliczne</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Suma: {fmtPLN(total)}/mies.</span>
        </div>
        {recurringExpenses.length === 0
          ? <EmptyState title="Brak wydatków cyklicznych" />
          : (
            <table className="table">
              <thead><tr><th>NAZWA</th><th>KATEGORIA</th><th>DZIEŃ</th><th>CZĘSTOTLIWOŚĆ</th><th style={{ textAlign: 'right' }}>KWOTA</th></tr></thead>
              <tbody>
                {recurringExpenses.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td><span className="badge badge-gray">{e.category}</span></td>
                    <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{e.dueDay}.</td>
                    <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{e.frequency}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtPLN(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}

// ─── JDG ──────────────────────────────────────────────────────

function FinanceJDG() {
  const { jdgMonths } = useLocalStore();
  const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  const fields: { key: keyof JdgMonth; label: string }[] = [
    { key: 'invoiceIssued', label: 'Faktura' },
    { key: 'documentsSent', label: 'Dokumenty' },
    { key: 'accountingPaid', label: 'Księgowość' },
    { key: 'zusPaid', label: 'ZUS' },
    { key: 'pitPaid', label: 'PIT' },
    { key: 'vatPaid', label: 'VAT' },
  ];
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div className="card-head"><span className="card-title">Obowiązki JDG</span></div>
      <table className="table" style={{ minWidth: 600 }}>
        <thead>
          <tr>
            <th>MIESIĄC</th>
            {fields.map(f => <th key={String(f.key)} style={{ textAlign: 'center' }}>{f.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {jdgMonths.map(month => {
            const [y, m] = month.month.split('-');
            const label = `${MONTHS_PL[parseInt(m)-1]} ${y}`;
            return (
              <tr key={month.id}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                {fields.map(f => (
                  <td key={String(f.key)} style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 16 }}>{month[f.key] ? '✅' : '⬜'}</span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
