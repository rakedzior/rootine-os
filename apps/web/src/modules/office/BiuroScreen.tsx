import { useEffect, useMemo, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, PriorityBadge, StatusBadge, PageHeader, SubTabs, IcoTrash, IcoPlus, IcoCheck } from '@/components/common';
import { useLocalStore, type OfficeTask, type Priority, type VacationEntry } from '@/store/localStore';

const OFFICE_TABS = [
  { id: 'sprawy', label: 'Sprawy' },
  { id: 'dokumenty', label: 'Dokumenty' },
];

interface RecurringDeadline { id: string; label: string; sub: string; date: string; }

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysLeft(d?: string) {
  if (!d) return null;
  return Math.ceil((new Date(`${d}T12:00:00`).getTime() - Date.now()) / 86400000);
}
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type IconName = 'briefcase' | 'todo' | 'active' | 'calendar' | 'palm' | 'building' | 'doc' | 'car' | 'shield' | 'folder' | 'plus' | 'all';

function OfficeIcon({ name }: { name: IconName }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'briefcase' && <><rect x="3" y="7" width="18" height="13" rx="2" {...c} /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" {...c} /></>}
      {name === 'todo' && <><path d="M9 11l3 3L22 4" {...c} /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...c} /></>}
      {name === 'active' && <><circle cx="12" cy="12" r="8.5" {...c} /><path d="M12 7v5l3 2" {...c} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...c} /><path d="M8 3v4M16 3v4M4 10h16" {...c} /></>}
      {name === 'palm' && <><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" {...c} /></>}
      {name === 'building' && <><path d="M9 11l3 3L22 4" {...c} /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...c} /></>}
      {name === 'doc' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...c} /><polyline points="14 2 14 8 20 8" {...c} /></>}
      {name === 'car' && <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" {...c} /><circle cx="9" cy="17" r="2" {...c} /><circle cx="17" cy="17" r="2" {...c} /></>}
      {name === 'shield' && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...c} /></>}
      {name === 'folder' && <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...c} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...c} /></>}
      {name === 'all' && <><rect x="4" y="4" width="7" height="7" rx="1.5" {...c} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...c} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...c} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...c} /></>}
    </svg>
  );
}

function categoryIcon(category: string): IconName {
  const n = category.toLowerCase();
  if (n.includes('dokument')) return 'doc';
  if (n.includes('samoch') || n.includes('auto')) return 'car';
  if (n.includes('ubezp')) return 'shield';
  if (n.includes('urlop')) return 'palm';
  if (n.includes('urząd') || n.includes('urzed')) return 'building';
  return 'folder';
}

function OfficeMetric({ icon, tone, label, value, note, onClick }: { icon: IconName; tone: 'pink' | 'blue' | 'teal' | 'violet'; label: string; value: string; note: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'article';
  return (
    <Tag className={`office-metric office-metric-${tone}${onClick ? ' office-metric-clickable' : ''}`} type={onClick ? 'button' : undefined} onClick={onClick}>
      <div className="office-metric-icon"><OfficeIcon name={icon} /></div>
      <div className="office-metric-body">
        <div className="office-metric-label">{label}</div>
        <div className="office-metric-value">{value}</div>
        <div className="office-metric-note">{note}</div>
      </div>
    </Tag>
  );
}

export function BiuroScreen() {
  const {
    officeTasks, officeCategories, addOfficeTask, updateOfficeTask, deleteOfficeTask,
    addOfficeCategory, deleteOfficeCategory, vacationBalance,
    officeDocuments, cars, insurances,
  } = useLocalStore();

  const [tab, setTab] = useState('sprawy');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<'open' | 'all' | 'done'>('open');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showVacation, setShowVacation] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);

  const active = useMemo(() => officeTasks.filter(t => !t.isArchived), [officeTasks]);
  const monthKey = currentMonthKey();
  const dueThisMonth = useMemo(() => active.filter(t => t.dueDate?.startsWith(monthKey)), [active, monthKey]);
  const remaining = vacationBalance.yearlyLimit - vacationBalance.usedDays - vacationBalance.plannedDays;

  const byCategory = useMemo(() => {
    const map = new Map<string, OfficeTask[]>();
    for (const t of active) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [active]);

  function noteFor(list: OfficeTask[]) {
    const pilne = list.filter(t => t.priority === 'high' && t.status !== 'done').length;
    if (pilne > 0) return `${pilne} pilne`;
    const trakcie = list.filter(t => t.status === 'active').length;
    if (trakcie > 0) return `${trakcie} w trakcie`;
    return 'OK';
  }

  const categoryFiltered = selectedCategory ? active.filter(t => t.category === selectedCategory) : active;
  const openCount = categoryFiltered.filter(t => t.status !== 'done').length;
  const doneCount = categoryFiltered.filter(t => t.status === 'done').length;
  const tabFiltered = statusTab === 'open' ? categoryFiltered.filter(t => t.status !== 'done')
    : statusTab === 'done' ? categoryFiltered.filter(t => t.status === 'done')
    : categoryFiltered;
  const sorted = [...tabFiltered].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));

  const completed = useMemo(
    () => officeTasks.filter(t => t.status === 'done' && !t.isArchived).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [officeTasks]
  );

  const recurringDeadlines = useMemo<RecurringDeadline[]>(() => {
    const out: RecurringDeadline[] = [];
    for (const c of cars) {
      if (c.insuranceExpiry) out.push({ id: `car-oc-${c.id}`, label: `OC — ${c.name}`, sub: c.plateNumber, date: c.insuranceExpiry });
      if (c.inspectionDate) out.push({ id: `car-pp-${c.id}`, label: `Przegląd — ${c.name}`, sub: c.plateNumber, date: c.inspectionDate });
    }
    for (const i of insurances) out.push({ id: `ins-${i.id}`, label: i.name, sub: i.insurer, date: i.expiryDate });
    for (const d of officeDocuments) if (d.expiryDate && !d.isArchived) out.push({ id: `doc-${d.id}`, label: d.name, sub: d.category, date: d.expiryDate });
    return out.filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
  }, [cars, insurances, officeDocuments]);

  const visibleDocuments = officeDocuments.filter(d => !d.isArchived);

  return (
    <div className="module-page">
      <div className="office-shell">
        <PageHeader
          icon={<OfficeIcon name="briefcase" />}
          title="Biuro"
          desc="Wszystkie sprawy, dokumenty i terminy w jednym miejscu."
          actions={tab === 'sprawy' ? <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowAdd(true)}><IcoPlus /> Nowe zadanie</button> : undefined}
        />

        <SubTabs tabs={OFFICE_TABS} active={tab} onChange={setTab} />

        {tab === 'dokumenty' ? (
          <OfficeDocuments documents={visibleDocuments} deadlines={recurringDeadlines} />
        ) : (
        <>
        <div className="office-kpi-grid">
          <OfficeMetric icon="todo" tone="pink" label="Do zrobienia" value={String(active.filter(t => t.status === 'todo').length)} note="wszystkie sprawy" />
          <OfficeMetric icon="active" tone="blue" label="W trakcie" value={String(active.filter(t => t.status === 'active').length)} note="w realizacji" />
          <OfficeMetric icon="calendar" tone="teal" label="Terminy w tym miesiącu" value={String(dueThisMonth.length)} note={`${dueThisMonth.filter(t => t.priority === 'high').length} pilne`} />
          <OfficeMetric icon="palm" tone="violet" label="Urlop pozostały" value={`${remaining} dni`} note={`z ${vacationBalance.yearlyLimit} dni rocznie`} onClick={() => setShowVacation(true)} />
        </div>

        <div className="office-layout">
          <div className="card office-sidebar">
            <div className="card-head"><span className="card-title">Kategorie</span></div>
            <div className="office-category-list">
              <button type="button" className={`office-category-row${selectedCategory === null ? ' is-active' : ''}`} onClick={() => setSelectedCategory(null)}>
                <span className="office-category-icon"><OfficeIcon name="all" /></span>
                <span className="office-category-info">
                  <strong>Wszystkie</strong>
                  <span className="office-category-sub">{noteFor(active)}</span>
                </span>
                <span className="office-category-count">{active.length}</span>
              </button>
              {officeCategories.map(cat => {
                const list = byCategory.get(cat) ?? [];
                return (
                  <button key={cat} type="button" className={`office-category-row${selectedCategory === cat ? ' is-active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                    <span className="office-category-icon"><OfficeIcon name={categoryIcon(cat)} /></span>
                    <span className="office-category-info">
                      <strong>{cat}</strong>
                      <span className="office-category-sub">{noteFor(list)}</span>
                    </span>
                    <span className="office-category-count">{list.length}</span>
                  </button>
                );
              })}
            </div>
            <button className="office-add-category-btn" type="button" onClick={() => setShowCategoryManager(true)}><IcoPlus /> Dodaj kategorię</button>
          </div>

          <div className="office-main">
            <div className="card">
              <div className="card-head">
                <span className="card-title">Moje sprawy</span>
              </div>
              <div className="office-tabs">
                <button type="button" className={`office-tab${statusTab === 'open' ? ' is-active' : ''}`} onClick={() => setStatusTab('open')}>Aktywne {openCount}</button>
                <button type="button" className={`office-tab${statusTab === 'all' ? ' is-active' : ''}`} onClick={() => setStatusTab('all')}>Wszystkie {categoryFiltered.length}</button>
                <button type="button" className={`office-tab${statusTab === 'done' ? ' is-active' : ''}`} onClick={() => setStatusTab('done')}>Zrobione {doneCount}</button>
              </div>

              {sorted.length === 0
                ? <EmptyState title="Brak spraw" cta="Dodaj zadanie" onCta={() => setShowAdd(true)} />
                : (
                  <div className="office-tasks-list">
                    {sorted.map(task => {
                      const dl = daysLeft(task.dueDate);
                      return (
                        <div key={task.id} className={`office-task-row${task.status === 'done' ? ' is-done' : ''}`}>
                          <button className="office-task-check" type="button" onClick={() => updateOfficeTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} aria-label="Zmień status">
                            {task.status === 'done' && <IcoCheck />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="office-task-title">{task.title}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span className="badge badge-gray">{task.category}</span>
                              {task.institution && <span className="badge badge-gray">{task.institution}</span>}
                              <PriorityBadge priority={task.priority} />
                              <StatusBadge status={task.status} />
                              {task.dueDate && <span style={{ fontSize: 11, color: dl !== null && dl < 3 ? 'var(--p-high)' : 'var(--ink-3)' }}>📅 {fmtDate(task.dueDate)}</span>}
                            </div>
                          </div>
                          <button className="icon-btn" onClick={() => setDeleteId(task.id)}><IcoTrash /></button>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <button type="button" className="office-collapse-toggle" onClick={() => setCompletedCollapsed(v => !v)} aria-expanded={!completedCollapsed}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, transform: completedCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><path d="M6 9l6 6 6-6" /></svg>
              <span className="card-title">Ukończone ostatnio</span>
              <span className="badge badge-gray">{completed.length}</span>
            </button>
            {!completedCollapsed && completed.length > 4 && <button className="office-link-inline" type="button" onClick={() => setShowAllCompleted(true)}>Zobacz archiwum →</button>}
          </div>
          {!completedCollapsed && (completed.length === 0
            ? <EmptyState title="Brak ukończonych spraw" desc="Ukończone zadania pojawią się tutaj." />
            : (
              <div className="office-completed-grid">
                {completed.slice(0, 4).map(t => (
                  <div key={t.id} className="office-completed-item">
                    <span className="office-completed-check"><IcoCheck /></span>
                    <div className="office-completed-info">
                      <strong>{t.title}</strong>
                      <small>{t.category} · {fmtDate(t.updatedAt.split('T')[0])}</small>
                    </div>
                  </div>
                ))}
              </div>
            ))
          }
        </div>
        </>
        )}
      </div>

      <TaskFormModal
        open={showAdd}
        categories={officeCategories}
        defaultCategory={selectedCategory ?? officeCategories[0]}
        onClose={() => setShowAdd(false)}
        onSave={(payload) => { addOfficeTask({ ...payload, status: 'todo', isArchived: false }); setShowAdd(false); }}
      />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteOfficeTask(deleteId); setDeleteId(null); }} label="to zadanie" />
      <CategoryManagerModal open={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={officeCategories} onAdd={addOfficeCategory} onDelete={deleteOfficeCategory} />
      <VacationModal open={showVacation} onClose={() => setShowVacation(false)} />
      <AllCompletedModal
        open={showAllCompleted}
        onClose={() => setShowAllCompleted(false)}
        tasks={completed}
        onReopen={(id) => updateOfficeTask(id, { status: 'todo' })}
        onDelete={(id) => deleteOfficeTask(id)}
      />
    </div>
  );
}

// ─── DOCUMENTS / RECURRING DEADLINES ────────────────────────────

function deadlineStatus(date: string): { label: string; cls: string } {
  const days = daysLeft(date);
  if (days === null) return { label: '—', cls: 'status-cancelled' };
  if (days < 0) return { label: 'Po terminie', cls: 'status-overdue' };
  if (days <= 30) return { label: `Za ${days} dni`, cls: 'status-warn' };
  return { label: 'OK', cls: 'status-done' };
}

function OfficeDocuments({ documents, deadlines }: { documents: { id: string; name: string; category: string; documentNumber?: string; expiryDate?: string }[]; deadlines: RecurringDeadline[] }) {
  return (
    <div className="office-layout">
      <div className="card" style={{ minWidth: 0 }}>
        <div className="card-head"><span className="card-title">Terminy cykliczne</span></div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 12px' }}>OC, przegląd, ubezpieczenia, PIT, ZUS i inne powtarzalne terminy.</p>
        {deadlines.length === 0 ? (
          <EmptyState title="Brak terminów" desc="Dodaj auto, ubezpieczenie lub dokument z datą ważności." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deadlines.map(d => {
              const s = deadlineStatus(d.date);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-mid)', border: '1px solid var(--border-soft)', background: 'var(--surface-inset)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.sub} · {fmtDate(d.date)}</div>
                  </div>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ minWidth: 0 }}>
        <div className="card-head"><span className="card-title">Dokumenty</span></div>
        {documents.length === 0 ? (
          <EmptyState title="Brak dokumentów" desc="Tu pojawią się dowody, polisy, umowy i inne dokumenty." />
        ) : (
          <table className="table">
            <thead><tr><th>NAZWA</th><th>KATEGORIA</th><th>NUMER</th><th>WAŻNY DO</th></tr></thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{d.category}</td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{d.documentNumber ?? '—'}</td>
                  <td>{d.expiryDate ? fmtDate(d.expiryDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── TASK FORM MODAL ────────────────────────────────────────────

function TaskFormModal({ open, categories, defaultCategory, onClose, onSave }: {
  open: boolean; categories: string[]; defaultCategory: string; onClose: () => void;
  onSave: (payload: Omit<OfficeTask, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'isArchived'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [priority, setPriority] = useState<Priority>('mid');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(''); setInstitution(''); setCategory(defaultCategory); setPriority('mid'); setDueDate(''); setNotes('');
  }, [open, defaultCategory]);

  return (
    <Modal open={open} onClose={onClose} title="Nowe zadanie" footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!title.trim()) return;
          onSave({ title: title.trim(), institution, category, priority, dueDate: dueDate || undefined, notes });
        }}>Dodaj</button>
      </>
    }>
      <Field label="Tytuł zadania" required><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Np. Odnów paszport" autoFocus /></Field>
      <div className="form-grid">
        <Field label="Instytucja"><input className="input" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Urząd, bank, itp." /></Field>
        <Field label="Kategoria"><select className="select" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Priorytet"><select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
          <option value="low">Niski</option><option value="mid">Średni</option><option value="high">Wysoki</option>
        </select></Field>
        <Field label="Termin"><input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
      </div>
      <Field label="Notatki"><textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></Field>
    </Modal>
  );
}

// ─── CATEGORY MANAGER ───────────────────────────────────────────

function CategoryManagerModal({ open, onClose, categories, onAdd, onDelete }: { open: boolean; onClose: () => void; categories: string[]; onAdd: (name: string) => void; onDelete: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Zarządzaj kategoriami" footer={<button className="btn btn-primary btn-sm" onClick={onClose}>Gotowe</button>}>
      {categories.map(c => (
        <div key={c} className="goals-category-row">
          <span>{c}</span>
          <button className="icon-btn" type="button" onClick={() => onDelete(c)} aria-label={`Usuń kategorię ${c}`}><IcoTrash /></button>
        </div>
      ))}
      <div className="goals-category-add-row">
        <input className="input" placeholder="Nazwa nowej kategorii" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => { if (!name.trim()) return; onAdd(name.trim()); setName(''); }}><IcoPlus /> Dodaj</button>
      </div>
    </Modal>
  );
}

// ─── VACATION MODAL ─────────────────────────────────────────────

function VacationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { vacations, vacationBalance, addVacation, updateVacation, deleteVacation } = useLocalStore();
  const [form, setForm] = useState<{ vacation: VacationEntry | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VacationEntry | null>(null);
  const remaining = vacationBalance.yearlyLimit - vacationBalance.usedDays - vacationBalance.plannedDays;

  return (
    <Modal open={open} onClose={onClose} title="Urlopy" size="lg" footer={
      <button className="btn btn-primary btn-sm" onClick={onClose}>Gotowe</button>
    }>
      <div className="office-vacation-stats">
        <div className="office-vacation-stat"><span>Limit roczny</span><strong>{vacationBalance.yearlyLimit} dni</strong></div>
        <div className="office-vacation-stat"><span>Wykorzystane</span><strong>{vacationBalance.usedDays} dni</strong></div>
        <div className="office-vacation-stat"><span>Zaplanowane</span><strong>{vacationBalance.plannedDays} dni</strong></div>
        <div className="office-vacation-stat"><span>Pozostałe</span><strong>{remaining} dni</strong></div>
      </div>

      <div className="card-head" style={{ padding: 0, marginBottom: 10 }}>
        <span className="card-title">Historia urlopów</span>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setForm({ vacation: null })}><IcoPlus /> Dodaj urlop</button>
      </div>

      {vacations.length === 0
        ? <EmptyState title="Brak wpisów urlopowych" cta="Dodaj urlop" onCta={() => setForm({ vacation: null })} />
        : (
          <table className="table">
            <thead><tr><th>OD</th><th>DO</th><th>DNI</th><th>TYP</th><th>STATUS</th><th></th></tr></thead>
            <tbody>
              {vacations.map(v => (
                <tr key={v.id}>
                  <td>{fmtDate(v.startDate)}</td>
                  <td>{fmtDate(v.endDate)}</td>
                  <td style={{ fontWeight: 700 }}>{v.days}</td>
                  <td><span className="badge badge-gray">{v.type}</span></td>
                  <td><span className={`badge ${v.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>{v.status === 'approved' ? 'Zatwierdzone' : v.status === 'planned' ? 'Planowane' : v.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" type="button" onClick={() => setForm({ vacation: v })} aria-label="Edytuj urlop">✎</button>
                      <button className="icon-btn" type="button" onClick={() => setDeleteTarget(v)} aria-label="Usuń urlop"><IcoTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }

      <VacationFormModal
        open={!!form}
        vacation={form?.vacation ?? null}
        onClose={() => setForm(null)}
        onSave={(payload) => {
          if (form?.vacation) updateVacation(form.vacation.id, payload);
          else addVacation(payload);
          setForm(null);
        }}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteVacation(deleteTarget.id); setDeleteTarget(null); }}
        label="ten urlop"
      />
    </Modal>
  );
}

function VacationFormModal({ open, vacation, onClose, onSave }: {
  open: boolean; vacation: VacationEntry | null; onClose: () => void; onSave: (payload: Omit<VacationEntry, 'id' | 'createdAt'>) => void;
}) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('Wypoczynkowy');
  const [status, setStatus] = useState('planned');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setStart(vacation?.startDate ?? '');
    setEnd(vacation?.endDate ?? '');
    setType(vacation?.type ?? 'Wypoczynkowy');
    setStatus(vacation?.status ?? 'planned');
    setNotes(vacation?.notes ?? '');
  }, [vacation, open]);

  return (
    <Modal open={open} onClose={onClose} title={vacation ? 'Edytuj urlop' : 'Dodaj urlop'} footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!start || !end) return;
          const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
          onSave({ startDate: start, endDate: end, days, type, status, notes });
        }}>Zapisz</button>
      </>
    }>
      <div className="form-grid">
        <Field label="Od"><input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} autoFocus /></Field>
        <Field label="Do"><input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} /></Field>
        <Field label="Typ urlopu">
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            {['Wypoczynkowy', 'Na żądanie', 'Okolicznościowy', 'Bezpłatny', 'Inny'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="planned">Planowane</option><option value="approved">Zatwierdzone</option>
          </select>
        </Field>
      </div>
      <Field label="Notatki"><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    </Modal>
  );
}

// ─── ALL COMPLETED MODAL ────────────────────────────────────────

function AllCompletedModal({ open, onClose, tasks, onReopen, onDelete }: { open: boolean; onClose: () => void; tasks: OfficeTask[]; onReopen: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Wszystkie ukończone sprawy" size="lg">
      <div className="goals-modal-list">
        {tasks.length === 0
          ? <EmptyState title="Brak ukończonych spraw" />
          : tasks.map(t => (
            <div key={t.id} className="office-completed-item" style={{ background: 'var(--surface)' }}>
              <span className="office-completed-check"><IcoCheck /></span>
              <div className="office-completed-info">
                <strong>{t.title}</strong>
                <small>{t.category} · Ukończono {fmtDate(t.updatedAt.split('T')[0])}</small>
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => onReopen(t.id)}>Wznów</button>
              <button className="icon-btn" type="button" onClick={() => onDelete(t.id)} aria-label={`Usuń ${t.title}`}><IcoTrash /></button>
            </div>
          ))
        }
      </div>
    </Modal>
  );
}
