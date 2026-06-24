import { useEffect, useMemo, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, PageHeader } from '@/components/common';
import { useLocalStore, type Priority, type TaskStatus, type WorkContext, type WorkProject, type WorkTask } from '@/store/localStore';
import '@/styles/work.css';

type WorkIconName =
  | 'briefcase' | 'project' | 'task' | 'week' | 'done' | 'plus' | 'edit' | 'trash'
  | 'list' | 'board' | 'calendar' | 'timeline' | 'filter' | 'settings' | 'more'
  | 'note' | 'link' | 'deadline' | 'progress' | 'user' | 'tag' | 'database'
  | 'chart' | 'shield' | 'target' | 'check' | 'chevron' | 'star';

const PROJECT_TONES = ['violet', 'pink', 'teal', 'amber', 'blue'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Do zrobienia',
  active: 'W trakcie',
  waiting: 'Oczekuje',
  done: 'Zrobione',
  blocked: 'Zablokowane',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Wysoki',
  mid: 'Średni',
  low: 'Niski',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date: string, delta: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(date?: string, withYear = false) {
  if (!date) return 'Brak terminu';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
}

function daysUntil(date?: string) {
  if (!date) return null;
  const today = new Date(`${todayStr()}T12:00:00`);
  const target = new Date(`${date}T12:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function projectTone(project: WorkProject, index: number) {
  if (project.status === 'done') return 'teal';
  if (project.status === 'blocked') return 'amber';
  return PROJECT_TONES[index % PROJECT_TONES.length];
}

function taskProject(task: WorkTask, projects: WorkProject[]) {
  return projects.find((project) => project.id === task.projectId);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'R';
}

function priorityRank(priority: Priority) {
  return priority === 'high' ? 0 : priority === 'mid' ? 1 : 2;
}

function statusRank(status: TaskStatus) {
  return status === 'active' ? 0 : status === 'todo' ? 1 : status === 'waiting' ? 2 : status === 'blocked' ? 3 : 4;
}

export function PracaScreen() {
  const {
    workContexts,
    workProjects,
    workTasks,
    activeWorkContextId,
    addWorkContext,
    setActiveWorkContext,
    addWorkProject,
    deleteWorkProject,
    addWorkTask,
    updateWorkTask,
    deleteWorkTask,
  } = useLocalStore();

  const activeContext = workContexts.find((context) => context.id === activeWorkContextId) ?? workContexts.find((context) => context.active) ?? workContexts[0];
  const [contextId, setContextId] = useState(activeContext?.id ?? '');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [activityCollapsed, setActivityCollapsed] = useState(false);

  useEffect(() => {
    if (!contextId && activeContext) setContextId(activeContext.id);
  }, [activeContext, contextId]);

  const context = workContexts.find((item) => item.id === contextId) ?? activeContext;
  const contextProjects = useMemo(
    () => workProjects.filter((project) => !context || project.workContextId === context.id),
    [context, workProjects],
  );
  const contextTasks = useMemo(
    () => workTasks.filter((task) => !context || task.workContextId === context.id),
    [context, workTasks],
  );

  const sortedTasks = useMemo(() => {
    return [...contextTasks].sort((a, b) => {
      const dateCmp = (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31');
      if (statusRank(a.status) !== statusRank(b.status)) return statusRank(a.status) - statusRank(b.status);
      if (priorityRank(a.priority) !== priorityRank(b.priority)) return priorityRank(a.priority) - priorityRank(b.priority);
      return dateCmp || a.title.localeCompare(b.title);
    });
  }, [contextTasks]);

  const selectedTask = sortedTasks.find((task) => task.id === selectedTaskId) ?? sortedTasks.find((task) => task.status !== 'done') ?? sortedTasks[0];

  useEffect(() => {
    if (!selectedTaskId && selectedTask) setSelectedTaskId(selectedTask.id);
    if (selectedTaskId && !sortedTasks.some((task) => task.id === selectedTaskId)) setSelectedTaskId(sortedTasks[0]?.id ?? null);
  }, [selectedTask, selectedTaskId, sortedTasks]);

  const metrics = buildWorkMetrics(contextProjects, contextTasks);
  const deadlines = buildDeadlines(contextTasks, contextProjects);
  const activity = buildActivity(contextTasks, contextProjects);

  return (
    <div className="module-page work-os">
      <PageHeader
        icon={<WorkIcon name="briefcase" />}
        title="Praca"
        desc="Wszystkie firmy, projekty, zadania i notatki w jednym miejscu."
      />

      <section className="work-shell">
        <main className="work-main">
          <section className="work-context-panel">
            <div className="work-company-bar">
              <label>
                <span>Firma</span>
                <select value={context?.id ?? ''} onChange={(event) => {
                  setContextId(event.target.value);
                  setActiveWorkContext(event.target.value);
                }}>
                  {workContexts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <button className="icon-btn work-icon-btn" type="button" onClick={() => setShowContextModal(true)} aria-label="Dodaj firmę"><WorkIcon name="plus" /></button>
              <button className="icon-btn work-icon-btn" type="button" aria-label="Edytuj firmę"><WorkIcon name="edit" /></button>
            </div>

            <div className="work-project-strip">
              {contextProjects.map((project, index) => {
                const projectTasks = contextTasks.filter((task) => task.projectId === project.id);
                const doneCount = projectTasks.filter((task) => task.status === 'done').length;
                const progress = project.progress || Math.round((doneCount / Math.max(projectTasks.length, 1)) * 100);
                const tone = projectTone(project, index);
                return (
                  <button
                    key={project.id}
                    className={`work-project-card work-tone-${tone} ${selectedProjectId === project.id ? 'is-selected' : ''}`}
                    type="button"
                    onClick={() => setSelectedProjectId(selectedProjectId === project.id ? null : project.id)}
                  >
                    <span className="work-project-icon"><WorkIcon name={index % 3 === 0 ? 'database' : index % 3 === 1 ? 'target' : 'chart'} /></span>
                    <span className="work-project-copy">
                      <strong>{project.name}</strong>
                      <small>{project.description || 'Projekt roboczy'}</small>
                      <i><span style={{ width: `${Math.min(progress, 100)}%` }} /></i>
                    </span>
                    <em>{projectTasks.length} zadań</em>
                    <b>{progress}%</b>
                  </button>
                );
              })}
              <button className="work-new-project" type="button" onClick={() => setShowProjectModal(true)}>
                <WorkIcon name="plus" /> Nowy projekt
              </button>
            </div>
          </section>

          <section className="work-task-board">
            <div className="work-viewbar">
              <div className="work-view-tabs">
                <button className="is-active" type="button"><WorkIcon name="list" /> Lista</button>
                <button type="button"><WorkIcon name="board" /> Tablica</button>
                <button type="button"><WorkIcon name="calendar" /> Kalendarz</button>
                <button type="button"><WorkIcon name="timeline" /> Oś czasu</button>
              </div>
              <div className="work-view-actions">
                <button type="button"><WorkIcon name="filter" /> Filtry</button>
                <button type="button">Sortuj: Priorytet</button>
                <button type="button" aria-label="Ustawienia"><WorkIcon name="settings" /></button>
              </div>
            </div>

            {sortedTasks.length === 0 ? (
              <EmptyState title="Brak zadań" desc="Dodaj pierwsze zadanie do bieżącej firmy." cta="Dodaj zadanie" onCta={() => setShowTaskModal(true)} />
            ) : (
              <div className="work-task-table">
                <div className="work-task-head">
                  <span>Zadanie</span><span>Projekt</span><span>Priorytet</span><span>Status</span><span>Termin</span><span>Przypisane</span><span />
                </div>
                {sortedTasks
                  .filter((task) => !selectedProjectId || task.projectId === selectedProjectId)
                  .map((task) => (
                    <WorkTaskRow
                      key={task.id}
                      task={task}
                      project={taskProject(task, workProjects)}
                      selected={selectedTask?.id === task.id}
                      onSelect={() => setSelectedTaskId(task.id)}
                      onToggle={() => updateWorkTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                      onDelete={() => setDeleteTaskId(task.id)}
                    />
                  ))}
                <button className="work-add-row" type="button" onClick={() => setShowTaskModal(true)}><WorkIcon name="plus" /> Dodaj zadanie</button>
              </div>
            )}
          </section>

          <section className="work-activity">
            <button type="button" className="collapse-toggle work-activity-title" onClick={() => setActivityCollapsed(v => !v)} aria-expanded={!activityCollapsed} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, transform: activityCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><path d="M6 9l6 6 6-6" /></svg>
              Ostatnie aktywności
            </button>
            {!activityCollapsed && (
              <div className="work-activity-list">
                {activity.map((item) => (
                  <div className={`work-activity-item work-tone-${item.tone}`} key={item.title}>
                    <span>{item.initial}</span>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                    <em>{item.time}</em>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="work-side">
          <TaskDetails task={selectedTask} project={selectedTask ? taskProject(selectedTask, workProjects) : undefined} context={context} onUpdate={(patch) => selectedTask && updateWorkTask(selectedTask.id, patch)} />
          <DeadlinesPanel deadlines={deadlines} />
          <WorkKpiPanel metrics={metrics} />
        </aside>
      </section>

      <TaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projects={contextProjects}
        context={context}
        onSave={(payload) => {
          addWorkTask(payload);
          setShowTaskModal(false);
        }}
      />
      <ProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        context={context}
        onSave={(payload) => {
          addWorkProject(payload);
          setShowProjectModal(false);
        }}
      />
      <ContextModal
        open={showContextModal}
        onClose={() => setShowContextModal(false)}
        onSave={(payload) => {
          addWorkContext(payload);
          setShowContextModal(false);
        }}
      />
      <ConfirmDelete open={!!deleteTaskId} onClose={() => setDeleteTaskId(null)} onConfirm={() => {
        if (deleteTaskId) deleteWorkTask(deleteTaskId);
        setDeleteTaskId(null);
      }} label="to zadanie" />
      <ConfirmDelete open={!!deleteProjectId} onClose={() => setDeleteProjectId(null)} onConfirm={() => {
        if (deleteProjectId) deleteWorkProject(deleteProjectId);
        setDeleteProjectId(null);
      }} label="ten projekt" />
    </div>
  );
}

function buildWorkMetrics(projects: WorkProject[], tasks: WorkTask[]) {
  const today = todayStr();
  const weekEnd = addDays(today, 7);
  return [
    {
      icon: 'project' as const,
      label: 'Aktywne projekty',
      value: projects.filter((project) => project.status !== 'done').length,
      note: '+1 w tym miesiącu',
      tone: 'blue',
    },
    {
      icon: 'task' as const,
      label: 'Otwarte zadania',
      value: tasks.filter((task) => task.status !== 'done').length,
      note: '-3 od wczoraj',
      tone: 'violet',
    },
    {
      icon: 'week' as const,
      label: 'Do zrobienia w tym tygodniu',
      value: tasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate >= today && task.dueDate <= weekEnd).length,
      note: '3 dziś',
      tone: 'amber',
    },
    {
      icon: 'done' as const,
      label: 'Zakończone zadania',
      value: tasks.filter((task) => task.status === 'done').length,
      note: '+8 w tym miesiącu',
      tone: 'teal',
    },
  ];
}

function buildDeadlines(tasks: WorkTask[], projects: WorkProject[]) {
  return tasks
    .filter((task) => task.dueDate && task.status !== 'done')
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5)
    .map((task) => ({ task, project: taskProject(task, projects), left: daysUntil(task.dueDate) }));
}

function buildActivity(tasks: WorkTask[], projects: WorkProject[]) {
  return tasks.slice(0, 3).map((task, index) => ({
    initial: initials(task.title)[0],
    title: index === 0 ? 'Zaktualizowałeś zadanie' : index === 1 ? 'Dodano notatkę do projektu' : 'Zakończono zadanie',
    subtitle: taskProject(task, projects)?.name ?? task.title,
    time: index === 0 ? '10 min temu' : index === 1 ? '35 min temu' : '2 godz. temu',
    tone: index === 0 ? 'pink' : index === 1 ? 'teal' : 'violet',
  }));
}

function WorkTaskRow({ task, project, selected, onSelect, onToggle, onDelete }: { task: WorkTask; project?: WorkProject; selected: boolean; onSelect: () => void; onToggle: () => void; onDelete: () => void }) {
  const left = daysUntil(task.dueDate);
  const overdue = typeof left === 'number' && left < 0 && task.status !== 'done';

  return (
    <div className={`work-task-row ${selected ? 'is-selected' : ''}`}>
      <button className="work-task-title" type="button" onClick={onSelect}>
        <span className="work-expand"><WorkIcon name="chevron" /></span>
        <span className={`work-check ${task.status === 'done' ? 'is-done' : ''}`} onClick={(event) => { event.stopPropagation(); onToggle(); }}>
          {task.status === 'done' && <WorkIcon name="check" />}
        </span>
        <strong>{task.title}</strong>
        <WorkIcon name="star" />
      </button>
      <span className="work-project-pill"><i />{project?.name ?? 'Bez projektu'}</span>
      <span className={`work-priority is-${task.priority}`}>{task.priority === 'high' ? '↑' : task.priority === 'mid' ? '↗' : '↓'} {PRIORITY_LABELS[task.priority]}</span>
      <span className={`work-status is-${task.status}`}>{STATUS_LABELS[task.status]}</span>
      <span className={`work-due ${overdue ? 'is-overdue' : ''}`}><WorkIcon name="calendar" /> {fmtDate(task.dueDate, true)}</span>
      <span className="work-assignee">{initials(project?.name ?? task.title)[0]}</span>
      <button className="work-row-more" type="button" onClick={onDelete} aria-label="Usuń zadanie"><WorkIcon name="more" /></button>
    </div>
  );
}

function TaskDetails({ task, project, context, onUpdate }: { task?: WorkTask; project?: WorkProject; context?: WorkContext; onUpdate?: (patch: Partial<WorkTask>) => void }) {
  const left = daysUntil(task?.dueDate);
  const progress = task?.status === 'done' ? 100 : task?.status === 'active' ? 65 : task?.status === 'waiting' ? 40 : task?.status === 'blocked' ? 20 : 15;
  const links = task?.links ?? [];

  function addLink() {
    const url = window.prompt('Adres URL linku:')?.trim();
    if (!url) return;
    const label = window.prompt('Etykieta (opcjonalnie):')?.trim() || url.replace(/^https?:\/\//, '').slice(0, 40);
    onUpdate?.({ links: [...links, { label, url }] });
  }
  function removeLink(idx: number) {
    onUpdate?.({ links: links.filter((_, i) => i !== idx) });
  }

  return (
    <section className="work-panel">
      <div className="work-panel-head">
        <h2>Szczegóły zadania</h2>
        <WorkIcon name="settings" />
      </div>
      {!task ? (
        <EmptyState title="Brak zadania" />
      ) : (
        <>
          <div className="work-detail-project"><i />{project?.name ?? context?.name ?? 'Praca'}</div>
          <h3>{task.title}</h3>
          <p>{task.description || 'Zbudować i zamodelować zakres zadania zgodnie z wymaganiami projektu.'}</p>
          <div className="work-detail-list">
            <DetailLine icon="note" label="Notatki" value={task.notes ? '1 notatka' : '0 notatek'} />
            <DetailLine icon="link" label="Linki" value={`${links.length} ${links.length === 1 ? 'link' : 'linków'}`} />
            <DetailLine icon="deadline" label="Deadline" value={task.dueDate ? `${fmtDate(task.dueDate, true)}${left !== null ? ` (${left} dni)` : ''}` : 'Brak'} />
            <DetailLine icon="progress" label="Postęp" value={`${progress}%`} progress={progress} />
            <DetailLine icon="user" label="Przypisane" value={project?.name ? initials(project.name)[0] : 'R'} avatar />
            <DetailLine icon="tag" label="Etykiety" value={project?.name ?? 'Projekt'} tag />
          </div>
          {task.notes && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 'var(--r-mid)', border: '1px solid var(--border-soft)', background: 'var(--surface-inset)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>Notatki</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{task.notes}</p>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Linki i załączniki</span>
              <button className="btn btn-ghost btn-sm" type="button" onClick={addLink}><WorkIcon name="plus" /> Dodaj link</button>
            </div>
            {links.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>Brak linków. Dodaj odnośnik do dokumentu, repozytorium lub pliku.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {links.map((link, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)', background: 'var(--surface-inset)' }}>
                    <WorkIcon name="link" />
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--acc-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</a>
                    <button className="icon-btn" type="button" onClick={() => removeLink(i)} aria-label="Usuń link"><WorkIcon name="trash" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function DetailLine({ icon, label, value, progress, avatar = false, tag = false }: { icon: WorkIconName; label: string; value: string; progress?: number; avatar?: boolean; tag?: boolean }) {
  return (
    <div className="work-detail-line">
      <WorkIcon name={icon} />
      <span>{label}</span>
      <strong className={avatar ? 'as-avatar' : tag ? 'as-tag' : ''}>{value}</strong>
      {typeof progress === 'number' && <i><span style={{ width: `${progress}%` }} /></i>}
    </div>
  );
}

function DeadlinesPanel({ deadlines }: { deadlines: { task: WorkTask; project?: WorkProject; left: number | null }[] }) {
  return (
    <section className="work-panel">
      <div className="work-panel-head">
        <h2>Najbliższe deadline'y</h2>
        <button type="button">Zobacz kalendarz <WorkIcon name="chevron" /></button>
      </div>
      <div className="work-deadline-list">
        {deadlines.length === 0 ? (
          <div className="work-empty-small">Brak najbliższych terminów.</div>
        ) : deadlines.map(({ task, project, left }) => (
          <div className="work-deadline" key={task.id}>
            <time>
              <strong>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('pl-PL', { day: '2-digit' })}</strong>
              <span>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' })}</span>
            </time>
            <div>
              <strong>{task.title}</strong>
              <small><i />{project?.name ?? 'Bez projektu'}</small>
            </div>
            <em>{left === null ? '' : left <= 0 ? 'dziś' : `${left} dni`}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkKpiPanel({ metrics }: { metrics: ReturnType<typeof buildWorkMetrics> }) {
  return (
    <section className="work-panel work-kpi-panel">
      <div className="work-panel-head">
        <h2>KPI pracy</h2>
        <WorkIcon name="chart" />
      </div>
      <div className="work-side-kpis">
        {metrics.map((metric) => (
          <article className={`work-side-kpi work-tone-${metric.tone}`} key={metric.label}>
            <span><WorkIcon name={metric.icon} /></span>
            <div>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
              <em>{metric.note}</em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TaskModal({ open, onClose, projects, context, onSave }: { open: boolean; onClose: () => void; projects: WorkProject[]; context?: WorkContext; onSave: (payload: Omit<WorkTask, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<Priority>('mid');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!open) return;
    setProjectId(projects[0]?.id ?? '');
  }, [open, projects]);

  return (
    <Modal open={open} onClose={onClose} title="Nowe zadanie" footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!title.trim() || !context) return;
          onSave({ workContextId: context.id, projectId: projectId || undefined, title: title.trim(), description, status, priority, dueDate: dueDate || undefined, notes: '' });
          setTitle(''); setDescription(''); setDueDate('');
        }}>Dodaj</button>
      </>
    }>
      <Field label="Tytuł" required><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="Opis"><textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Projekt"><select className="select" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Bez projektu</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
        <Field label="Priorytet"><select className="select" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="high">Wysoki</option><option value="mid">Średni</option><option value="low">Niski</option></select></Field>
        <Field label="Status"><select className="select" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}><option value="todo">Do zrobienia</option><option value="active">W trakcie</option><option value="waiting">Oczekuje</option><option value="blocked">Zablokowane</option></select></Field>
        <Field label="Termin"><input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ProjectModal({ open, onClose, context, onSave }: { open: boolean; onClose: () => void; context?: WorkContext; onSave: (payload: Omit<WorkProject, 'id' | 'createdAt' | 'updatedAt'>) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Nowy projekt" footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!name.trim() || !context) return;
          onSave({ workContextId: context.id, name: name.trim(), description, status: 'active', deadline: deadline || undefined, progress: 0, notes: '' });
          setName(''); setDescription(''); setDeadline('');
        }}>Utwórz</button>
      </>
    }>
      <Field label="Nazwa projektu" required><input className="input" value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Opis"><textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
      <Field label="Termin"><input className="input" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
    </Modal>
  );
}

function ContextModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (payload: Omit<WorkContext, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Nowa firma" footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!name.trim()) return;
          onSave({ name: name.trim(), company: company.trim() || undefined, active: false });
          setName(''); setCompany('');
        }}>Dodaj</button>
      </>
    }>
      <Field label="Nazwa" required><input className="input" value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Firma / klient"><input className="input" value={company} onChange={(event) => setCompany(event.target.value)} /></Field>
    </Modal>
  );
}

function WorkIcon({ name }: { name: WorkIconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'briefcase' && <><rect x="4" y="7" width="16" height="13" rx="2" {...common} /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16" {...common} /></>}
      {name === 'project' && <><rect x="5" y="5" width="14" height="14" rx="3" {...common} /><path d="M9 9h6M9 13h4M9 17h6" {...common} /></>}
      {name === 'task' && <><path d="m8 12 2.5 2.5L16 9" {...common} /><rect x="4" y="4" width="16" height="16" rx="3" {...common} /></>}
      {name === 'week' && <><rect x="4" y="5" width="16" height="15" rx="2" {...common} /><path d="M8 3v4M16 3v4M4 10h16M8 14h2M13 14h3" {...common} /></>}
      {name === 'done' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="m8 12 2.5 2.5L16 9" {...common} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...common} /></>}
      {name === 'edit' && <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" {...common} /></>}
      {name === 'trash' && <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" {...common} /></>}
      {name === 'list' && <><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...common} /></>}
      {name === 'board' && <><rect x="4" y="4" width="7" height="16" rx="2" {...common} /><rect x="13" y="4" width="7" height="10" rx="2" {...common} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2" {...common} /><path d="M8 3v4M16 3v4M4 10h16" {...common} /></>}
      {name === 'timeline' && <><path d="M4 6h4M4 18h4M8 6c4 0 4 12 8 12h4M8 18c4 0 4-12 8-12h4" {...common} /></>}
      {name === 'filter' && <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" {...common} /></>}
      {name === 'settings' && <><circle cx="12" cy="12" r="3" {...common} /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z" {...common} /></>}
      {name === 'more' && <><path d="M12 7h.01M12 12h.01M12 17h.01" {...common} /></>}
      {name === 'note' && <><path d="M6 3h9l3 3v15H6V3zM15 3v4h4M9 12h6M9 16h4" {...common} /></>}
      {name === 'link' && <><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" {...common} /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" {...common} /></>}
      {name === 'deadline' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 7v5l3 2" {...common} /></>}
      {name === 'progress' && <><path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7" {...common} /></>}
      {name === 'user' && <><circle cx="12" cy="8" r="3.5" {...common} /><path d="M5 21a7 7 0 0 1 14 0" {...common} /></>}
      {name === 'tag' && <><path d="M20 12 12 20 4 12V4h8l8 8z" {...common} /><path d="M8 8h.01" {...common} /></>}
      {name === 'database' && <><ellipse cx="12" cy="5" rx="7" ry="3" {...common} /><path d="M5 5v10c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 10c0 1.7 3.1 3 7 3s7-1.3 7-3" {...common} /></>}
      {name === 'chart' && <><path d="M4 19V5M4 19h16M8 15l3-3 3 2 5-7" {...common} /></>}
      {name === 'shield' && <><path d="M12 21s7-3.5 7-9.5V5l-7-3-7 3v6.5C5 17.5 12 21 12 21z" {...common} /></>}
      {name === 'target' && <><circle cx="12" cy="12" r="8.5" {...common} /><circle cx="12" cy="12" r="4" {...common} /><circle cx="12" cy="12" r="1" {...common} /></>}
      {name === 'check' && <><path d="M20 6 9 17l-5-5" {...common} /></>}
      {name === 'chevron' && <><path d="m9 6 6 6-6 6" {...common} /></>}
      {name === 'star' && <><path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z" {...common} /></>}
    </svg>
  );
}
