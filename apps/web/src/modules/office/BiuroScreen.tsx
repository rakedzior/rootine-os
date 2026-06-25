import { useEffect, useMemo, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, IcoTrash, IcoPlus, IcoCheck } from '@/components/common';
import { useLocalStore, type OfficeDocument, type OfficeTask, type Priority, type VacationEntry } from '@/store/localStore';

interface RecurringDeadline { id: string; label: string; sub: string; date: string; }

type IconName =
  | 'briefcase' | 'todo' | 'active' | 'calendar' | 'palm' | 'building'
  | 'doc' | 'car' | 'shield' | 'folder' | 'all' | 'user' | 'wallet' | 'monitor';

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

function OfficeIcon({ name }: { name: IconName }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      {name === 'briefcase' && <><rect x="3" y="7" width="18" height="13" rx="2" {...c} /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" {...c} /></>}
      {name === 'todo' && <><path d="M9 11l3 3L22 4" {...c} /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...c} /></>}
      {name === 'active' && <><path d="M7 3h10M8 21h8M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" {...c} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...c} /><path d="M8 3v4M16 3v4M4 10h16" {...c} /></>}
      {name === 'palm' && <><path d="M12 21v-8M5 12c2-5 7-7 7-7s5 2 7 7M12 5c-1 4-4 6-8 7M12 5c1 4 4 6 8 7" {...c} /></>}
      {name === 'building' && <><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M8 7h1M12 7h1M8 11h1M12 11h1M8 15h1M12 15h1M3 21h18" {...c} /></>}
      {name === 'doc' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...c} /><path d="M14 2v6h6M8 13h8M8 17h6" {...c} /></>}
      {name === 'car' && <><path d="M5 17H3a2 2 0 0 1-2-2v-3l2-5h16l2 5v3a2 2 0 0 1-2 2h-2" {...c} /><circle cx="7" cy="17" r="2" {...c} /><circle cx="17" cy="17" r="2" {...c} /></>}
      {name === 'shield' && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...c} /></>}
      {name === 'folder' && <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...c} /></>}
      {name === 'all' && <><rect x="4" y="4" width="7" height="7" rx="1.5" {...c} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...c} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...c} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...c} /></>}
      {name === 'user' && <><path d="M20 21a8 8 0 0 0-16 0" {...c} /><circle cx="12" cy="7" r="4" {...c} /></>}
      {name === 'wallet' && <><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" {...c} /><path d="M16 13h.01" {...c} /></>}
      {name === 'monitor' && <><rect x="3" y="4" width="18" height="12" rx="2" {...c} /><path d="M8 20h8M12 16v4" {...c} /></>}
    </svg>
  );
}

function categoryIcon(category: string): IconName {
  const n = category.toLowerCase();
  if (n.includes('dokument')) return 'doc';
  if (n.includes('samoch') || n.includes('auto') || n.includes('pojazd')) return 'car';
  if (n.includes('ubezp')) return 'shield';
  if (n.includes('urlop')) return 'palm';
  if (n.includes('hr') || n.includes('kadr')) return 'user';
  if (n.includes('finans') || n.includes('ksi')) return 'wallet';
  if (n.includes('it') || n.includes('sprz')) return 'monitor';
  if (n.includes('urz') || n.includes('admin')) return 'building';
  return 'folder';
}

function deadlineStatus(date: string): { label: string; cls: string } {
  const days = daysLeft(date);
  if (days === null) return { label: '—', cls: 'status-cancelled' };
  if (days < 0) return { label: 'Po terminie', cls: 'status-overdue' };
  if (days <= 30) return { label: `Za ${days} dni`, cls: 'status-warn' };
  return { label: 'OK', cls: 'status-done' };
}

function noteFor(list: OfficeTask[]) {
  const urgent = list.filter(t => t.priority === 'high' && t.status !== 'done').length;
  if (urgent > 0) return `${urgent} pilne`;
  const active = list.filter(t => t.status === 'active').length;
  if (active > 0) return `${active} w trakcie`;
  return 'OK';
}

function OfficeMetric({ icon, label, value, note, onClick }: { icon: IconName; label: string; value: string; note: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="office-metric-icon"><OfficeIcon name={icon} /></span>
      <span className="office-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </span>
      <span className="office-metric-arrow">›</span>
    </>
  );
  if (!onClick) return <div className="office-metric">{content}</div>;
  return <button className="office-metric office-metric-button" type="button" onClick={onClick}>{content}</button>;
}

export function BiuroScreen() {
  const {
    officeTasks, officeCategories, addOfficeTask, updateOfficeTask, deleteOfficeTask,
    addOfficeCategory, deleteOfficeCategory, vacationBalance,
    officeDocuments, cars, insurances,
  } = useLocalStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showVacation, setShowVacation] = useState(false);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const active = useMemo(() => officeTasks.filter(t => !t.isArchived), [officeTasks]);
  const monthKey = currentMonthKey();
  const dueThisMonth = useMemo(() => active.filter(t => t.dueDate?.startsWith(monthKey)), [active, monthKey]);
  const remaining = vacationBalance.yearlyLimit - vacationBalance.usedDays - vacationBalance.plannedDays;

  const byCategory = useMemo(() => {
    const map = new Map<string, OfficeTask[]>();
    for (const task of active) {
      const list = map.get(task.category) ?? [];
      list.push(task);
      map.set(task.category, list);
    }
    return map;
  }, [active]);

  const categoryFiltered = selectedCategory ? active.filter(t => t.category === selectedCategory) : active;
  const sortedTasks = [...categoryFiltered].sort((a, b) => {
    if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
    const dateCompare = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    return sortAsc ? dateCompare : -dateCompare;
  });

  const recurringDeadlines = useMemo<RecurringDeadline[]>(() => {
    const out: RecurringDeadline[] = [];
    for (const car of cars) {
      if (car.insuranceExpiry) out.push({ id: `car-oc-${car.id}`, label: `OC — ${car.name}`, sub: car.plateNumber, date: car.insuranceExpiry });
      if (car.inspectionDate) out.push({ id: `car-pp-${car.id}`, label: `Przegląd — ${car.name}`, sub: car.plateNumber, date: car.inspectionDate });
    }
    for (const insurance of insurances) out.push({ id: `ins-${insurance.id}`, label: insurance.name, sub: insurance.insurer, date: insurance.expiryDate });
    for (const doc of officeDocuments) if (doc.expiryDate && !doc.isArchived) out.push({ id: `doc-${doc.id}`, label: doc.name, sub: doc.category, date: doc.expiryDate });
    return out.filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
  }, [cars, insurances, officeDocuments]);

  const visibleDocuments = officeDocuments.filter(d => !d.isArchived);

  return (
    <div className="module-page office-page">
      <div className="office-shell office-dashboard-shell">
        <div className="office-hero">
          <div className="office-hero-main">
            <span className="office-hero-icon"><OfficeIcon name="briefcase" /></span>
            <div>
              <h1>Biuro</h1>
              <p>Zarządzaj sprawami, dokumentami i terminami w jednym miejscu.</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm office-new-task-btn" type="button" onClick={() => setShowAdd(true)}><IcoPlus /> Nowe zadanie</button>
        </div>

        <div className="office-kpi-grid">
          <OfficeMetric icon="todo" label="Do zrobienia" value={String(active.filter(t => t.status === 'todo').length)} note="aktywnych spraw" />
          <OfficeMetric icon="active" label="W trakcie" value={String(active.filter(t => t.status === 'active').length)} note="w realizacji" />
          <OfficeMetric icon="calendar" label="Terminy w tym miesiącu" value={String(dueThisMonth.length)} note={`${dueThisMonth.filter(t => t.priority === 'high').length} pilne`} />
          <OfficeMetric icon="palm" label="Urlop" value={`${remaining} dni`} note={`z ${vacationBalance.yearlyLimit} dni rocznie`} onClick={() => setShowVacation(true)} />
        </div>

        <div className="office-dashboard-grid">
          <aside className="card office-sidebar">
            <div className="office-panel-title">Kategorie</div>
            <div className="office-category-list">
              <button type="button" className={`office-category-row${selectedCategory === null ? ' is-active' : ''}`} onClick={() => setSelectedCategory(null)}>
                <span className="office-category-icon"><OfficeIcon name="all" /></span>
                <span className="office-category-info">
                  <strong>Wszystkie</strong>
                  <span className="office-category-sub">{noteFor(active)}</span>
                </span>
                <span className="office-category-count">{active.length}</span>
              </button>
              {officeCategories.map(category => {
                const list = byCategory.get(category) ?? [];
                return (
                  <button key={category} type="button" className={`office-category-row${selectedCategory === category ? ' is-active' : ''}`} onClick={() => setSelectedCategory(category)}>
                    <span className="office-category-icon"><OfficeIcon name={categoryIcon(category)} /></span>
                    <span className="office-category-info">
                      <strong>{category}</strong>
                      <span className="office-category-sub">{noteFor(list)}</span>
                    </span>
                    <span className="office-category-count">{list.length}</span>
                  </button>
                );
              })}
            </div>
            <button className="office-add-category-btn" type="button" onClick={() => setShowCategoryManager(true)}><IcoPlus /> Dodaj kategorię</button>
          </aside>

          <main className="card office-cases-panel">
            <div className="office-panel-head">
              <div className="office-panel-title">Moje sprawy</div>
              <button className="office-sort-btn" type="button" onClick={() => setSortAsc(v => !v)}>
                Sortuj: Termin {sortAsc ? '↑' : '↓'}
              </button>
            </div>

            {sortedTasks.length === 0 ? (
              <EmptyState title="Brak spraw" cta="Dodaj zadanie" onCta={() => setShowAdd(true)} />
            ) : (
              <div className="office-case-list">
                {sortedTasks.map(task => (
                  <div key={task.id} className={`office-case-row${task.status === 'done' ? ' is-done' : ''}`}>
                    <button className="office-case-check" type="button" onClick={() => updateOfficeTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} aria-label="Zmień status">
                      {task.status === 'done' && <IcoCheck />}
                    </button>
                    <div className="office-case-main">
                      <strong>{task.title}</strong>
                      <span>{task.category}</span>
                    </div>
                    <time>{fmtDate(task.dueDate)}</time>
                    <span className="office-case-chevron">›</span>
                    <button className="icon-btn office-case-delete" type="button" onClick={() => setDeleteId(task.id)} aria-label={`Usuń ${task.title}`}><IcoTrash /></button>
                  </div>
                ))}
              </div>
            )}

            {selectedCategory && (
              <button className="office-panel-footer" type="button" onClick={() => setSelectedCategory(null)}>Zobacz wszystkie sprawy ›</button>
            )}
          </main>

          <aside className="office-right-stack">
            <section className="card office-mini-panel">
              <div className="office-panel-head">
                <div className="office-panel-title">Nadchodzące terminy</div>
                <span className="office-panel-icon"><OfficeIcon name="calendar" /></span>
              </div>
              {recurringDeadlines.length === 0 ? (
                <EmptyState title="Brak terminów" />
              ) : (
                <div className="office-deadline-list">
                  {recurringDeadlines.slice(0, 5).map(deadline => (
                    <div key={deadline.id} className="office-deadline-row">
                      <span className="office-dot" />
                      <span>
                        <strong>{deadline.label}</strong>
                        <small>{deadline.sub}</small>
                      </span>
                      <time>{fmtDate(deadline.date)}</time>
                    </div>
                  ))}
                </div>
              )}
              <button className="office-panel-footer" type="button" onClick={() => setShowDeadlines(true)}>Zobacz wszystkie terminy ›</button>
            </section>

            <section className="card office-mini-panel">
              <div className="office-panel-head">
                <div className="office-panel-title">Dokumenty <span>{visibleDocuments.length}</span></div>
                <span className="office-panel-icon"><OfficeIcon name="doc" /></span>
              </div>
              {visibleDocuments.length === 0 ? (
                <EmptyState title="Brak dokumentów" />
              ) : (
                <div className="office-document-list">
                  {visibleDocuments.slice(0, 3).map(doc => (
                    <div key={doc.id} className="office-document-row">
                      <span>{doc.name}</span>
                      <time>{fmtDate(doc.expiryDate)}</time>
                      <OfficeIcon name="calendar" />
                    </div>
                  ))}
                </div>
              )}
              <button className="office-panel-footer" type="button" onClick={() => setShowDocuments(true)}>Zobacz wszystkie dokumenty ›</button>
            </section>
          </aside>
        </div>
      </div>

      <TaskFormModal
        open={showAdd}
        categories={officeCategories}
        defaultCategory={selectedCategory ?? officeCategories[0] ?? 'Administracja'}
        onClose={() => setShowAdd(false)}
        onSave={(payload) => { addOfficeTask({ ...payload, status: 'todo', isArchived: false }); setShowAdd(false); }}
      />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteOfficeTask(deleteId); setDeleteId(null); }} label="to zadanie" />
      <CategoryManagerModal open={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={officeCategories} onAdd={addOfficeCategory} onDelete={deleteOfficeCategory} />
      <VacationModal open={showVacation} onClose={() => setShowVacation(false)} />
      <OfficeDeadlinesModal open={showDeadlines} onClose={() => setShowDeadlines(false)} deadlines={recurringDeadlines} />
      <OfficeDocumentsModal open={showDocuments} onClose={() => setShowDocuments(false)} documents={visibleDocuments} />
    </div>
  );
}

function OfficeDeadlinesModal({ open, onClose, deadlines }: { open: boolean; onClose: () => void; deadlines: RecurringDeadline[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Wszystkie terminy" size="lg">
      {deadlines.length === 0 ? <EmptyState title="Brak terminów" /> : (
        <div className="office-modal-list">
          {deadlines.map(deadline => {
            const status = deadlineStatus(deadline.date);
            return (
              <div key={deadline.id} className="office-modal-row">
                <div>
                  <strong>{deadline.label}</strong>
                  <span>{deadline.sub} · {fmtDate(deadline.date)}</span>
                </div>
                <span className={`badge ${status.cls}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function OfficeDocumentsModal({ open, onClose, documents }: { open: boolean; onClose: () => void; documents: OfficeDocument[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Dokumenty" size="lg">
      {documents.length === 0 ? <EmptyState title="Brak dokumentów" /> : (
        <table className="table">
          <thead><tr><th>Nazwa</th><th>Kategoria</th><th>Numer</th><th>Ważny do</th></tr></thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 700 }}>{doc.name}</td>
                <td>{doc.category}</td>
                <td>{doc.documentNumber ?? '—'}</td>
                <td>{fmtDate(doc.expiryDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

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
    setTitle('');
    setInstitution('');
    setCategory(defaultCategory);
    setPriority('mid');
    setDueDate('');
    setNotes('');
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

function CategoryManagerModal({ open, onClose, categories, onAdd, onDelete }: { open: boolean; onClose: () => void; categories: string[]; onAdd: (name: string) => void; onDelete: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Zarządzaj kategoriami" footer={<button className="btn btn-primary btn-sm" onClick={onClose}>Gotowe</button>}>
      {categories.map(category => (
        <div key={category} className="goals-category-row">
          <span>{category}</span>
          <button className="icon-btn" type="button" onClick={() => onDelete(category)} aria-label={`Usuń kategorię ${category}`}><IcoTrash /></button>
        </div>
      ))}
      <div className="goals-category-add-row">
        <input className="input" placeholder="Nazwa nowej kategorii" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => { if (!name.trim()) return; onAdd(name.trim()); setName(''); }}><IcoPlus /> Dodaj</button>
      </div>
    </Modal>
  );
}

function VacationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { vacations, vacationBalance, addVacation, updateVacation, deleteVacation } = useLocalStore();
  const [form, setForm] = useState<{ vacation: VacationEntry | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VacationEntry | null>(null);
  const remaining = vacationBalance.yearlyLimit - vacationBalance.usedDays - vacationBalance.plannedDays;

  return (
    <Modal open={open} onClose={onClose} title="Urlopy" size="lg" footer={<button className="btn btn-primary btn-sm" onClick={onClose}>Gotowe</button>}>
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

      {vacations.length === 0 ? (
        <EmptyState title="Brak wpisów urlopowych" cta="Dodaj urlop" onCta={() => setForm({ vacation: null })} />
      ) : (
        <table className="table">
          <thead><tr><th>Od</th><th>Do</th><th>Dni</th><th>Typ</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {vacations.map(vacation => (
              <tr key={vacation.id}>
                <td>{fmtDate(vacation.startDate)}</td>
                <td>{fmtDate(vacation.endDate)}</td>
                <td style={{ fontWeight: 700 }}>{vacation.days}</td>
                <td><span className="badge badge-gray">{vacation.type}</span></td>
                <td><span className={`badge ${vacation.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>{vacation.status === 'approved' ? 'Zatwierdzone' : vacation.status === 'planned' ? 'Planowane' : vacation.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" type="button" onClick={() => setForm({ vacation })} aria-label="Edytuj urlop">✎</button>
                    <button className="icon-btn" type="button" onClick={() => setDeleteTarget(vacation)} aria-label="Usuń urlop"><IcoTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
