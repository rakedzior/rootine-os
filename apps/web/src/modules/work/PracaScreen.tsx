import { useState } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, ProgressBar, StatusBadge, PriorityBadge, SectionHead, IcoTrash } from '@/components/common';
import { useLocalStore, type WorkProject, type WorkTask, type Priority, type TaskStatus } from '@/store/localStore';

const TABS = [
  { id: 'zadania',   label: 'Zadania',   icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id: 'projekty',  label: 'Projekty',  icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
  { id: 'konteksty', label: 'Konteksty', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
];

function fmtDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

export function PracaScreen() {
  const [tab, setTab] = useState('zadania');
  return (
    <div className="module-page">
      <div className="module-header no-title">
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'zadania'   && <PracaZadania />}
      {tab === 'projekty'  && <PracaProjekty />}
      {tab === 'konteksty' && <PracaKonteksty />}
    </div>
  );
}

// ─── ZADANIA ──────────────────────────────────────────────────

function PracaZadania() {
  const { workTasks, workContexts, workProjects, activeWorkContextId, addWorkTask, updateWorkTask, deleteWorkTask } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterCtx, setFilterCtx] = useState<string | 'all'>('all');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Priority>('mid');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const activeCtx = filterCtx === 'all'
    ? workContexts.find(c => c.active)
    : workContexts.find(c => c.id === filterCtx);

  let tasks = workTasks;
  if (filterCtx !== 'all') tasks = tasks.filter(t => t.workContextId === filterCtx);
  else if (activeCtx) tasks = tasks.filter(t => t.workContextId === activeCtx.id);
  if (filterStatus !== 'all') tasks = tasks.filter(t => t.status === filterStatus);

  const grouped: Record<TaskStatus, WorkTask[]> = { todo: [], active: [], waiting: [], done: [], blocked: [] };
  tasks.forEach(t => grouped[t.status]?.push(t));

  const visibleGroups: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'active',  label: 'W trakcie',    color: 'var(--green-text)' },
    { status: 'todo',    label: 'Do zrobienia', color: 'var(--ink-2)' },
    { status: 'waiting', label: 'Oczekuje',     color: 'var(--p-mid)' },
    { status: 'blocked', label: 'Zablokowane',  color: 'var(--p-high)' },
    { status: 'done',    label: 'Zrobione',     color: 'var(--ink-3)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
      <div className="col">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto' }} value={filterCtx} onChange={e => setFilterCtx(e.target.value)}>
            <option value="all">Wszystkie konteksty</option>
            {workContexts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(['all','todo','active','waiting','done'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{ padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filterStatus === f ? 'var(--green)' : 'var(--surface-3)', color: filterStatus === f ? 'white' : 'var(--ink-2)' }}>
              {f === 'all' ? 'Wszystkie' : f === 'todo' ? 'Todo' : f === 'active' ? 'Aktywne' : f === 'waiting' ? 'Oczekuje' : 'Zrobione'}
            </button>
          ))}
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>+ Nowe zadanie</button>
        </div>

        {/* Grouped tasks */}
        {tasks.length === 0
          ? <div className="card"><EmptyState title="Brak zadań" desc="Dodaj pierwsze zadanie." cta="Dodaj zadanie" onCta={() => setShowAdd(true)} /></div>
          : visibleGroups.map(grp => {
            const grpTasks = filterStatus === 'all' ? grouped[grp.status] : (grp.status === filterStatus ? grouped[grp.status] : []);
            if (grpTasks.length === 0) return null;
            return (
              <div key={grp.status}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: grp.color, marginBottom: 8 }}>
                  {grp.label} ({grpTasks.length})
                </div>
                {grpTasks.map(task => (
                  <WorkTaskCard key={task.id} task={task} projects={workProjects}
                    onUpdate={p => updateWorkTask(task.id, p)}
                    onDelete={() => setDeleteId(task.id)} />
                ))}
              </div>
            );
          })
        }
      </div>

      {/* Sidebar: stats */}
      <div className="col">
        <div className="card">
          <div className="card-head"><span className="card-title">Podsumowanie</span></div>
          {visibleGroups.slice(0, 4).map(grp => (
            <div key={grp.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ fontSize: 13 }}>{grp.label}</span>
              <span style={{ fontWeight: 700, color: grp.color }}>{grouped[grp.status].length}</span>
            </div>
          ))}
        </div>

        {activeWorkContextId && (
          <div className="card">
            <div className="card-head"><span className="card-title">Aktywny kontekst</span></div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{workContexts.find(c => c.id === activeWorkContextId)?.name}</div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowe zadanie"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!title.trim()) return;
            const ctxId = filterCtx !== 'all' ? filterCtx : (activeCtx?.id ?? workContexts[0]?.id ?? '');
            addWorkTask({ workContextId: ctxId, projectId: projectId || undefined, title, description: desc, status, priority, dueDate: dueDate || undefined, notes: '' });
            setTitle(''); setDesc(''); setDueDate(''); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Tytuł" required><input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
        <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
        <div className="form-grid">
          <Field label="Status"><select className="select" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
            <option value="todo">Do zrobienia</option><option value="active">W trakcie</option>
            <option value="waiting">Oczekuje</option><option value="blocked">Zablokowane</option>
          </select></Field>
          <Field label="Priorytet"><select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            <option value="low">Niski</option><option value="mid">Średni</option><option value="high">Wysoki</option>
          </select></Field>
          <Field label="Projekt"><select className="select" value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">Brak projektu</option>
            {workProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></Field>
          <Field label="Termin"><input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
        </div>
      </Modal>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteWorkTask(deleteId!); setDeleteId(null); }} label="to zadanie" />
    </div>
  );
}

function WorkTaskCard({ task, projects, onUpdate, onDelete }: { task: WorkTask; projects: WorkProject[]; onUpdate: (p: Partial<WorkTask>) => void; onDelete: () => void }) {
  const project = projects.find(p => p.id === task.projectId);
  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done';

  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div onClick={() => onUpdate({ status: task.status === 'done' ? 'todo' : 'done' })}
          style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${task.status === 'done' ? 'var(--green-mid)' : 'var(--border)'}`, background: task.status === 'done' ? 'var(--green-mid)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', flexShrink: 0, marginTop: 1 }}>
          {task.status === 'done' && '✓'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--ink-3)' : 'var(--ink)' }}>{task.title}</div>
          {task.description && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>{task.description}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {project && <span className="badge badge-gray">{project.name}</span>}
            {task.dueDate && <span style={{ fontSize: 11, color: isOverdue ? 'var(--p-high)' : 'var(--ink-3)', fontWeight: isOverdue ? 600 : 400 }}>📅 {fmtDate(task.dueDate)}{isOverdue ? ' ⚠' : ''}</span>}
          </div>
        </div>
        <button className="icon-btn" onClick={onDelete}><IcoTrash /></button>
      </div>
    </div>
  );
}

// ─── PROJEKTY ─────────────────────────────────────────────────

function PracaProjekty() {
  const { workProjects, workContexts, workTasks, addWorkProject, deleteWorkProject } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(workProjects[0]?.id ?? null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [ctxId, setCtxId] = useState(workContexts[0]?.id ?? '');
  const [deadline, setDeadline] = useState('');

  const selected = workProjects.find(p => p.id === selectedId);
  const projectTasks = selected ? workTasks.filter(t => t.projectId === selected.id) : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Projekty</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+</button>
        </div>
        {workProjects.length === 0
          ? <EmptyState title="Brak projektów" cta="Nowy projekt" onCta={() => setShowAdd(true)} />
          : workProjects.map(p => {
            const ctx = workContexts.find(c => c.id === p.workContextId);
            return (
              <div key={p.id} onClick={() => setSelectedId(p.id)}
                style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: selectedId === p.id ? 'var(--green-text)' : 'var(--ink)', marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {ctx && <span className="badge badge-gray" style={{ fontSize: 10 }}>{ctx.name}</span>}
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ marginTop: 6 }}>
                  <ProgressBar value={p.progress} size="sm" />
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{p.progress}%</div>
                </div>
              </div>
            );
          })
        }
      </div>

      {selected ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{selected.name}</h2>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                {workContexts.find(c => c.id === selected.workContextId)?.name}
                {selected.deadline && ` · Do ${fmtDate(selected.deadline)}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatusBadge status={selected.status} />
              <button className="icon-btn" onClick={() => setDeleteId(selected.id)}><IcoTrash /></button>
            </div>
          </div>

          {selected.description && <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 16 }}>{selected.description}</p>}

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Postęp</span>
              <span style={{ fontWeight: 700 }}>{selected.progress}%</span>
            </div>
            <ProgressBar value={selected.progress} size="lg" />
          </div>

          <SectionHead title={`Zadania (${projectTasks.length})`} />
          {projectTasks.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '16px 0' }}>Brak zadań w tym projekcie</div>
            : projectTasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <div style={{ width: 16, height: 16, borderRadius: 99, border: `1.5px solid ${task.status === 'done' ? 'var(--green-mid)' : 'var(--border)'}`, background: task.status === 'done' ? 'var(--green-mid)' : 'transparent', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--ink-3)' : 'var(--ink)' }}>{task.title}</span>
                <PriorityBadge priority={task.priority} />
              </div>
            ))
          }
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <EmptyState title="Wybierz projekt" />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowy projekt"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addWorkProject({ workContextId: ctxId, name, description: desc, status: 'todo', deadline: deadline || undefined, progress: 0, notes: '' });
            setName(''); setDesc(''); setDeadline(''); setShowAdd(false);
          }}>Utwórz</button>
        </>}>
        <Field label="Nazwa projektu" required><input className="input" value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
        <div className="form-grid">
          <Field label="Kontekst"><select className="select" value={ctxId} onChange={e => setCtxId(e.target.value)}>
            {workContexts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></Field>
          <Field label="Termin"><input type="date" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} /></Field>
        </div>
      </Modal>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteWorkProject(deleteId!); setSelectedId(null); setDeleteId(null); }} label="ten projekt" />
    </div>
  );
}

// ─── KONTEKSTY ────────────────────────────────────────────────

function PracaKonteksty() {
  const { workContexts, workTasks, workProjects, addWorkContext, setActiveWorkContext } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Konteksty pracy</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowy kontekst</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>Konteksty pozwalają rozdzielić zadania między różne role: freelancer, etat, projekt osobisty.</p>
        {workContexts.map(ctx => {
          const ctxTasks = workTasks.filter(t => t.workContextId === ctx.id);
          const ctxProjects = workProjects.filter(p => p.workContextId === ctx.id);
          return (
            <div key={ctx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: ctx.active ? 'var(--green-soft2)' : 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>
                💼
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{ctx.name}</div>
                {ctx.company && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{ctx.company}</div>}
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{ctxTasks.length} zadań · {ctxProjects.length} projektów</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {ctx.active && <span className="badge badge-green">Aktywny</span>}
                {!ctx.active && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveWorkContext(ctx.id)}>Ustaw aktywny</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowy kontekst"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!name.trim()) return;
            addWorkContext({ name, company: company || undefined, active: workContexts.length === 0 });
            setName(''); setCompany(''); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Nazwa kontekstu"><input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="np. Freelance, Etat, Projekt X" /></Field>
        <Field label="Firma / Klient"><input className="input" value={company} onChange={e => setCompany(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
