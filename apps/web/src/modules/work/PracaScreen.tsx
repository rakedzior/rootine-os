import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useWorkCompanies, useAddCompany, useDeleteCompany,
  useWorkProjects, useAddProject, useDeleteProject,
  useWorkTasks, useAddWorkTask, useMoveWorkTask, useDeleteWorkTask,
  useSubtasks, useAddSubtask, useToggleSubtask, useDeleteSubtask,
} from '@/features/work/hooks';
import type { WorkTaskStatus } from '@/features/work/types';
import '@/styles/work.css';

type Sec = 'dashboard' | 'companies' | 'tasks';

const SECTIONS: { key: Sec; label: string }[] = [
  { key: 'dashboard', label: 'Kanban' },
  { key: 'companies', label: 'Firmy & Projekty' },
  { key: 'tasks', label: 'Zadania' },
];

const COLUMNS: { status: WorkTaskStatus; label: string }[] = [
  { status: 'todo', label: 'Do zrobienia' },
  { status: 'doing', label: 'W toku' },
  { status: 'done', label: 'Zrobione' },
];

function fmt(d: string | null) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return { date: new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }), overdue: diff < 0, soon: diff >= 0 && diff <= 3 };
}

export function PracaScreen() {
  const showKanban = useIsFeatureVisible('work.kanban');
  const showCompanies = useIsFeatureVisible('work.companies');
  const showTasks = useIsFeatureVisible('work.tasks');

  const [sec, setSec] = useState<Sec>('dashboard');

  const companiesQ = useWorkCompanies();
  const addCompany = useAddCompany();
  const deleteCompany = useDeleteCompany();
  const projectsQ = useWorkProjects();
  const addProject = useAddProject();
  const deleteProject = useDeleteProject();
  const tasksQ = useWorkTasks();
  const addTask = useAddWorkTask();
  const moveTask = useMoveWorkTask();
  const deleteTask = useDeleteWorkTask();

  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState<'client' | 'own'>('client');
  const [newProjName, setNewProjName] = useState('');
  const [newProjComp, setNewProjComp] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<WorkTaskStatus>('todo');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const companies = companiesQ.data ?? [];
  const projects = projectsQ.data ?? [];
  const tasks = tasksQ.data ?? [];

  function handleAddCompany() {
    if (!newCompName.trim()) return;
    addCompany.mutate({ name: newCompName.trim(), type: newCompType });
    setNewCompName('');
  }

  function handleAddProject() {
    if (!newProjName.trim()) return;
    addProject.mutate({ name: newProjName.trim(), companyId: newProjComp || null });
    setNewProjName('');
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    addTask.mutate({ title: newTaskTitle.trim(), status: newTaskStatus, due_date: newTaskDue || null, project_id: newTaskProject || null });
    setNewTaskTitle(''); setNewTaskDue('');
  }

  const tasksByStatus = (status: WorkTaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="app" style={{ minHeight: 'auto' }}>
      <div className="work-subnav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={`work-nav-btn${sec === s.key ? ' active' : ''}`} type="button" onClick={() => setSec(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 1200 }}>
        <section className="col">
          {/* KANBAN */}
          {sec === 'dashboard' && showKanban && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="card-title">Kanban projektów</span></div>
                <span className="pill">{tasks.length} zadań</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)' }}>
                {COLUMNS.map(({ status, label }) => (
                  <div key={status} style={{ background: 'var(--surface-inset)', borderRadius: 'var(--r-mid)', padding: 12, minHeight: 200 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{label}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 400 }}>{tasksByStatus(status).length}</span>
                    </div>
                    {tasksByStatus(status).length === 0 ? (
                      <div className="agenda-empty" style={{ fontSize: 12 }}>Brak zadań</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {tasksByStatus(status).map((t) => {
                          const due = fmt(t.due_date);
                          return (
                            <div key={t.id} style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '8px 10px', fontSize: 13 }}>
                              <div style={{ fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
                              {due && (
                                <div style={{ fontSize: 11, color: due.overdue ? 'var(--acc-b)' : due.soon ? 'var(--ev-yellow)' : 'var(--ink-3)' }}>
                                  {due.overdue ? '⚠ ' : ''}{due.date}
                                </div>
                              )}
                              {t.project_id && (
                                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{projects.find((p) => p.id === t.project_id)?.name ?? ''}</div>
                              )}
                              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                {status !== 'todo' && (
                                  <button type="button" onClick={() => moveTask.mutate({ id: t.id, status: status === 'doing' ? 'todo' : 'doing' })}
                                    style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface-inset)', border: 'none', borderRadius: 3, cursor: 'pointer' }}>←</button>
                                )}
                                {status !== 'done' && (
                                  <button type="button" onClick={() => moveTask.mutate({ id: t.id, status: status === 'todo' ? 'doing' : 'done' })}
                                    style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface-inset)', border: 'none', borderRadius: 3, cursor: 'pointer' }}>→</button>
                                )}
                                <button type="button" onClick={() => deleteTask.mutate(t.id)}
                                  style={{ fontSize: 11, padding: '2px 6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', marginLeft: 'auto' }}>×</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Quick add */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                <input type="text" placeholder="Nowe zadanie…" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} style={{ flex: 2, minWidth: 160 }} />
                <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value as WorkTaskStatus)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                  <option value="todo">Do zrobienia</option>
                  <option value="doing">W toku</option>
                  <option value="done">Zrobione</option>
                </select>
                {projects.length > 0 && (
                  <select value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                    <option value="">— projekt —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} style={{ width: 140 }} />
                <button className="add-btn" type="button" onClick={handleAddTask} disabled={addTask.isPending}>+ Dodaj</button>
              </div>
            </article>
          )}

          {/* COMPANIES & PROJECTS */}
          {sec === 'companies' && showCompanies && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
              <article className="card">
                <div className="card-head"><div className="lhs"><span className="card-title">Firmy / Klienci</span></div><span className="pill">{companies.length}</span></div>
                {companies.length === 0 ? (
                  <div className="agenda-empty">Brak firm — dodaj pierwszą.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {companies.map((c) => (
                      <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <div><span style={{ fontWeight: 500 }}>{c.name}</span><span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>{c.type}</span></div>
                        <button type="button" onClick={() => deleteCompany.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="text" placeholder="Nazwa firmy" value={newCompName} onChange={(e) => setNewCompName(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleAddCompany()} />
                  <select value={newCompType} onChange={(e) => setNewCompType(e.target.value as 'client' | 'own')} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                    <option value="client">Klient</option>
                    <option value="own">Własna</option>
                  </select>
                  <button className="add-btn" type="button" onClick={handleAddCompany}>+</button>
                </div>
              </article>

              <article className="card">
                <div className="card-head"><div className="lhs"><span className="card-title">Projekty</span></div><span className="pill">{projects.length}</span></div>
                {projects.length === 0 ? (
                  <div className="agenda-empty">Brak projektów.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {projects.map((p) => (
                      <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                          {p.company_id && <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>{companies.find((c) => c.id === p.company_id)?.name}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, padding: '1px 5px', background: 'var(--surface-inset)', borderRadius: 3 }}>{p.status}</span>
                          <button type="button" onClick={() => deleteProject.mutate(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="text" placeholder="Nazwa projektu" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleAddProject()} />
                  {companies.length > 0 && (
                    <select value={newProjComp} onChange={(e) => setNewProjComp(e.target.value)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                      <option value="">— firma —</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <button className="add-btn" type="button" onClick={handleAddProject}>+</button>
                </div>
              </article>
            </div>
          )}

          {/* TASKS LIST */}
          {sec === 'tasks' && showTasks && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Zadania</span></div><span className="pill">{tasks.length}</span></div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                <input type="text" placeholder="Nowe zadanie…" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} style={{ flex: 2, minWidth: 160 }} />
                <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value as WorkTaskStatus)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                  <option value="todo">Do zrobienia</option>
                  <option value="doing">W toku</option>
                  <option value="done">Zrobione</option>
                </select>
                <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} style={{ width: 140 }} />
                <button className="add-btn" type="button" onClick={handleAddTask} disabled={addTask.isPending}>+ Dodaj</button>
              </div>
              {tasks.length === 0 ? (
                <div className="agenda-empty">Brak zadań.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tasks.map((t) => {
                    const due = fmt(t.due_date);
                    return (
                      <li key={t.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}
                          onClick={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)}>
                          <div>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</span>
                            {due && <span style={{ fontSize: 11, marginLeft: 8, color: due.overdue ? 'var(--acc-b)' : due.soon ? 'var(--ev-yellow)' : 'var(--ink-3)' }}>{due.date}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {(['todo', 'doing', 'done'] as WorkTaskStatus[]).map((s) => (
                                <button key={s} type="button" onClick={(e) => { e.stopPropagation(); moveTask.mutate({ id: t.id, status: s }); }}
                                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, border: 'none', cursor: 'pointer', background: t.status === s ? 'var(--acc-a)' : 'var(--surface)', color: t.status === s ? '#fff' : 'inherit' }}>
                                  {s === 'todo' ? 'To do' : s === 'doing' ? 'Doing' : 'Done'}
                                </button>
                              ))}
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteTask.mutate(t.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                          </div>
                        </div>
                        {expandedTaskId === t.id && <SubtaskPanel taskId={t.id} />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

function SubtaskPanel({ taskId }: { taskId: string }) {
  const subtasksQ = useSubtasks(taskId);
  const addSub = useAddSubtask();
  const toggleSub = useToggleSubtask();
  const deleteSub = useDeleteSubtask();
  const [title, setTitle] = useState('');

  const subs = subtasksQ.data ?? [];

  function add() {
    if (!title.trim()) return;
    addSub.mutate({ taskId, title: title.trim() });
    setTitle('');
  }

  return (
    <div style={{ padding: '8px 10px 8px 20px', background: 'var(--surface)', borderRadius: '0 0 var(--r-sm) var(--r-sm)', borderTop: '1px solid var(--border)' }}>
      {subs.map((s) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 13 }}>
          <input type="checkbox" checked={s.done} onChange={(e) => toggleSub.mutate({ id: s.id, done: e.target.checked, taskId })} style={{ cursor: 'pointer' }} />
          <span style={{ textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--ink-3)' : 'inherit', flex: 1 }}>{s.title}</span>
          <button type="button" onClick={() => deleteSub.mutate({ id: s.id, taskId })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 12 }}>×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input type="text" placeholder="Subtask…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} style={{ flex: 1, fontSize: 12 }} />
        <button type="button" onClick={add} style={{ fontSize: 12, padding: '4px 10px', background: 'var(--surface-inset)', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}>+</button>
      </div>
    </div>
  );
}
