import { useState } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, StatusBadge, PriorityBadge, IcoTrash } from '@/components/common';
import { useLocalStore, type Priority, type TaskStatus } from '@/store/localStore';

const TABS = [
  { id: 'zadania',   label: 'Zadania urzędowe', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id: 'dokumenty', label: 'Dokumenty',         icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: 'samochod',  label: 'Samochód',          icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg> },
  { id: 'ubezp',     label: 'Ubezpieczenia',     icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'urlopy',    label: 'Urlopy',            icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg> },
];

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysLeft(d?: string) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff;
}

export function BiuroScreen() {
  const [tab, setTab] = useState('zadania');
  return (
    <div className="module-page">
      <div className="module-header">
        <span className="module-title">Biuro</span>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'zadania'   && <BiuroZadania />}
      {tab === 'dokumenty' && <BiuroDokumenty />}
      {tab === 'samochod'  && <BiuroSamochod />}
      {tab === 'ubezp'     && <BiuroUbezpieczenia />}
      {tab === 'urlopy'    && <BiuroUrlopy />}
    </div>
  );
}

// ─── ZADANIA ──────────────────────────────────────────────────

function BiuroZadania() {
  const { officeTasks, addOfficeTask, updateOfficeTask, deleteOfficeTask } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const active = officeTasks.filter(t => !t.isArchived);
  const filtered = filter === 'all' ? active : active.filter(t => t.status === filter);
  const counts = { todo: active.filter(t=>t.status==='todo').length, active: active.filter(t=>t.status==='active').length, done: active.filter(t=>t.status==='done').length };

  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('mid');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
      <div className="col">
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all','todo','active','done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filter === f ? 'var(--green)' : 'var(--surface-3)', color: filter === f ? 'white' : 'var(--ink-2)' }}>
              {f === 'all' ? 'Wszystkie' : f === 'todo' ? 'Do zrobienia' : f === 'active' ? 'W trakcie' : 'Zrobione'}
            </button>
          ))}
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>+ Nowe zadanie</button>
        </div>

        {filtered.length === 0
          ? <div className="card"><EmptyState title="Brak zadań" cta="Dodaj zadanie" onCta={() => setShowAdd(true)} /></div>
          : filtered.map(task => (
            <div key={task.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div onClick={() => updateOfficeTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                  style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${task.status === 'done' ? 'var(--green-mid)' : 'var(--border)'}`, background: task.status === 'done' ? 'var(--green-mid)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', flexShrink: 0, marginTop: 2 }}>
                  {task.status === 'done' && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--ink-3)' : 'var(--ink)' }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {task.institution && <span className="badge badge-gray">{task.institution}</span>}
                    {task.category && <span className="badge badge-gray">{task.category}</span>}
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {task.dueDate && <span style={{ fontSize: 11, color: daysLeft(task.dueDate)! < 3 ? 'var(--p-high)' : 'var(--ink-3)' }}>📅 {fmtDate(task.dueDate)}</span>}
                  </div>
                  {task.notes && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{task.notes}</div>}
                </div>
                <button className="icon-btn" onClick={() => setDeleteId(task.id)}><IcoTrash /></button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Sidebar stats */}
      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Podsumowanie</span></div>
          {[{ label: 'Do zrobienia', val: counts.todo, color: 'var(--p-mid)' },
            { label: 'W trakcie', val: counts.active, color: 'var(--green-text)' },
            { label: 'Zrobione', val: counts.done, color: 'var(--ink-3)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ fontSize: 13 }}>{item.label}</span>
              <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowe zadanie urzędowe"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!title.trim()) return;
            addOfficeTask({ title, institution, category, priority, dueDate: dueDate || undefined, status: 'todo', notes, isArchived: false });
            setTitle(''); setInstitution(''); setCategory(''); setDueDate(''); setNotes(''); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Tytuł zadania" required><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Np. Odnów paszport" /></Field>
        <div className="form-grid">
          <Field label="Instytucja"><input className="input" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Urząd, bank, itp." /></Field>
          <Field label="Kategoria"><input className="input" value={category} onChange={e => setCategory(e.target.value)} placeholder="Np. Dokumenty, Podatki" /></Field>
          <Field label="Priorytet"><select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            <option value="low">Niski</option><option value="mid">Średni</option><option value="high">Wysoki</option>
          </select></Field>
          <Field label="Termin"><input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
        </div>
        <Field label="Notatki"><textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></Field>
      </Modal>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteOfficeTask(deleteId!); setDeleteId(null); }} label="to zadanie" />
    </div>
  );
}

// ─── DOKUMENTY ────────────────────────────────────────────────

function BiuroDokumenty() {
  const { officeDocuments, addOfficeDocument } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Osobiste');
  const [docNumber, setDocNumber] = useState('');
  const [expiry, setExpiry] = useState('');

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Dokumenty ({officeDocuments.filter(d=>!d.isArchived).length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Dodaj dokument</button>
        </div>
        {officeDocuments.filter(d => !d.isArchived).length === 0
          ? <EmptyState title="Brak dokumentów" cta="Dodaj dokument" onCta={() => setShowAdd(true)} />
          : (
            <table className="table">
              <thead><tr><th>DOKUMENT</th><th>KATEGORIA</th><th>NUMER</th><th>WAŻNY DO</th><th>STATUS</th></tr></thead>
              <tbody>
                {officeDocuments.filter(d => !d.isArchived).map(doc => {
                  const days = daysLeft(doc.expiryDate);
                  const expiring = days !== null && days <= 30;
                  return (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600 }}>{doc.name}</td>
                      <td><span className="badge badge-gray">{doc.category}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>{doc.documentNumber || '—'}</td>
                      <td style={{ fontSize: 13, color: expiring ? 'var(--p-high)' : 'var(--ink)' }}>{fmtDate(doc.expiryDate)}</td>
                      <td>
                        {expiring ? <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--p-high)' }}>⚠ Wkrótce wygasa</span>
                          : days === null ? <span className="badge badge-gray">Bezterminowy</span>
                          : <span className="badge badge-green">Ważny</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Dodaj dokument"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addOfficeDocument({ name, category, documentNumber: docNumber || undefined, expiryDate: expiry || undefined, issueDate: undefined, reminderEnabled: true, notes: '', isArchived: false });
            setName(''); setDocNumber(''); setExpiry(''); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa dokumentu" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. Paszport, Dowód osobisty" /></Field>
        <div className="form-grid">
          <Field label="Kategoria"><select className="select" value={category} onChange={e => setCategory(e.target.value)}>
            {['Osobiste','Pojazd','Nieruchomość','Ubezpieczenie','Podatkowe','Inne'].map(c => <option key={c}>{c}</option>)}
          </select></Field>
          <Field label="Numer dokumentu"><input className="input" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="AA 123456" /></Field>
          <Field label="Data ważności"><input type="date" className="input" value={expiry} onChange={e => setExpiry(e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── SAMOCHÓD ─────────────────────────────────────────────────

function BiuroSamochod() {
  const { cars } = useLocalStore();
  const car = cars[0];

  if (!car) return <div className="card" style={{ maxWidth: 400 }}><EmptyState title="Brak samochodu" desc="Dodaj samochód w ustawieniach." /></div>;

  const items = [
    { label: 'Przebieg', val: `${car.mileage.toLocaleString('pl-PL')} km`, icon: '🛣' },
    { label: 'Ubezpieczenie (OC/AC)', val: fmtDate(car.insuranceExpiry), icon: '🛡', warn: daysLeft(car.insuranceExpiry) !== null && daysLeft(car.insuranceExpiry)! <= 30 },
    { label: 'Przegląd techniczny', val: fmtDate(car.inspectionDate), icon: '🔧', warn: daysLeft(car.inspectionDate) !== null && daysLeft(car.inspectionDate)! <= 30 },
    { label: 'Wymiana oleju', val: fmtDate(car.oilChangeDate), icon: '🛢', warn: false },
    { label: 'Wymiana opon', val: fmtDate(car.tireChangeDate), icon: '⚙️', warn: false },
  ];

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 36 }}>🚗</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{car.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>{car.plateNumber}</div>
          </div>
        </div>
      </div>
      <div className="card">
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{item.label}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: (item as any).warn ? 'var(--p-high)' : 'var(--ink)' }}>{item.val}</div>
            </div>
            {(item as any).warn && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--p-high)' }}>⚠</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── UBEZPIECZENIA ────────────────────────────────────────────

function BiuroUbezpieczenia() {
  const { insurances, addInsurance } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Życiowe');
  const [insurer, setInsurer] = useState('');
  const [expiry, setExpiry] = useState('');
  const [premium, setPremium] = useState(0);
  const [frequency, setFrequency] = useState('miesięcznie');

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Ubezpieczenia</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Dodaj</button>
        </div>
        {insurances.length === 0
          ? <EmptyState title="Brak ubezpieczeń" cta="Dodaj ubezpieczenie" onCta={() => setShowAdd(true)} />
          : (
            <table className="table">
              <thead><tr><th>NAZWA</th><th>TYP</th><th>UBEZPIECZYCIEL</th><th>WAŻNE DO</th><th>SKŁADKA</th></tr></thead>
              <tbody>
                {insurances.map(ins => {
                  const days = daysLeft(ins.expiryDate);
                  return (
                    <tr key={ins.id}>
                      <td style={{ fontWeight: 600 }}>{ins.name}</td>
                      <td><span className="badge badge-gray">{ins.type}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{ins.insurer}</td>
                      <td style={{ fontSize: 13, color: days !== null && days <= 30 ? 'var(--p-high)' : 'var(--ink)' }}>{fmtDate(ins.expiryDate)}</td>
                      <td style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{ins.premium} PLN/{ins.frequency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Dodaj ubezpieczenie"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addInsurance({ name, type, insurer, expiryDate: expiry, premium, frequency, notes: '' });
            setName(''); setInsurer(''); setExpiry(''); setPremium(0); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Np. OC/AC BMW" /></Field>
        <div className="form-grid">
          <Field label="Typ"><select className="select" value={type} onChange={e => setType(e.target.value)}>
            {['Życiowe','OC/AC','Nieruchomość','Zdrowotne','Podróżne','Inne'].map(t => <option key={t}>{t}</option>)}
          </select></Field>
          <Field label="Ubezpieczyciel"><input className="input" value={insurer} onChange={e => setInsurer(e.target.value)} /></Field>
          <Field label="Data wygaśnięcia"><input type="date" className="input" value={expiry} onChange={e => setExpiry(e.target.value)} /></Field>
          <Field label="Składka (PLN)"><input type="number" className="input" value={premium} onChange={e => setPremium(+e.target.value)} /></Field>
          <Field label="Częstotliwość"><select className="select" value={frequency} onChange={e => setFrequency(e.target.value)}>
            {['miesięcznie','kwartalnie','rocznie'].map(f => <option key={f}>{f}</option>)}
          </select></Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── URLOPY ───────────────────────────────────────────────────

function BiuroUrlopy() {
  const { vacations, vacationBalance, addVacation } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('Wypoczynkowy');
  const [notes, setNotes] = useState('');

  const remaining = vacationBalance.yearlyLimit - vacationBalance.usedDays - vacationBalance.plannedDays;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
      <div className="col">
        <div className="card">
          <div className="card-head">
            <span className="card-title">Historia urlopów</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Dodaj</button>
          </div>
          {vacations.length === 0
            ? <EmptyState title="Brak wpisów urlopowych" cta="Dodaj urlop" onCta={() => setShowAdd(true)} />
            : (
              <table className="table">
                <thead><tr><th>OD</th><th>DO</th><th>DNI</th><th>TYP</th><th>STATUS</th></tr></thead>
                <tbody>
                  {vacations.map(v => (
                    <tr key={v.id}>
                      <td>{fmtDate(v.startDate)}</td>
                      <td>{fmtDate(v.endDate)}</td>
                      <td style={{ fontWeight: 700 }}>{v.days}</td>
                      <td><span className="badge badge-gray">{v.type}</span></td>
                      <td><span className={`badge ${v.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>{v.status === 'approved' ? 'Zatwierdzone' : v.status === 'planned' ? 'Planowane' : v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">Bilans urlopowy</span></div>
        {[
          { label: 'Limit roczny', val: vacationBalance.yearlyLimit, color: 'var(--ink)' },
          { label: 'Wykorzystane', val: vacationBalance.usedDays, color: 'var(--p-high)' },
          { label: 'Zaplanowane', val: vacationBalance.plannedDays, color: 'var(--p-mid)' },
          { label: 'Pozostałe', val: remaining, color: 'var(--green-text)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: 13 }}>{item.label}</span>
            <span style={{ fontWeight: 700, color: item.color }}>{item.val} dni</span>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Dodaj urlop"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!start || !end) return;
            const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
            addVacation({ startDate: start, endDate: end, days, type, notes, status: 'planned' });
            setStart(''); setEnd(''); setNotes(''); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Od"><input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} autoFocus /></Field>
        <Field label="Do"><input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} /></Field>
        <Field label="Typ urlopu">
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            {['Wypoczynkowy','Na żądanie','Okolicznościowy','Bezpłatny','Inny'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Notatki"><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
