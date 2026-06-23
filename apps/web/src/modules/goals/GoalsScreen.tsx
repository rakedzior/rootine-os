import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, EmptyState, ConfirmDelete, Field, ProgressBar, PriorityBadge, IcoTrash, IcoPlus, IcoCheck, IcoChevRight, IcoMore } from '@/components/common';
import { HabitList } from '@/features/habits/HabitList';
import { useHabits, useHabitLogs } from '@/features/habits/hooks';
import { todayStr, addDays, weekdayOf, habitOccursOn, habitStats, HABIT_WEEKDAYS } from '@/features/habits/dates';
import { useCreateTask } from '@/features/tasks/hooks';
import { useLocalStore, type Goal, type GoalTask, type GoalType, type Priority } from '@/store/localStore';

function collectTasks(tasks: GoalTask[]): GoalTask[] {
  return tasks.flatMap(t => [t, ...collectTasks(t.subtasks)]);
}
function mondayOf(dateStr: string): string {
  return addDays(dateStr, -(weekdayOf(dateStr) - 1));
}
function relativeDateLabel(dateStr: string) {
  const t = new Date().toISOString().split('T')[0];
  const tmr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === t) return 'Dziś';
  if (dateStr === tmr) return 'Jutro';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}
function fmtDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pl-PL');
}

function useGoalPlannerBridge() {
  const createTask = useCreateTask();
  function todayDate() { return new Date().toISOString().split('T')[0]; }
  function addToday(title: string, priority?: Priority) {
    createTask.mutate({ title, category: 'Cel', priority: priority ?? null, due_date: todayDate() });
  }
  function addPlanner(title: string, dueDate: string | undefined, priority?: Priority) {
    createTask.mutate({ title, category: 'Cel', priority: priority ?? null, due_date: dueDate || todayDate() });
  }
  return { addToday, addPlanner };
}

function GoalsIcon({ name }: { name: 'target' | 'calendar' | 'flame' | 'clock' | 'gear' }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'target' && <><circle cx="12" cy="12" r="9" {...c} /><circle cx="12" cy="12" r="5" {...c} /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...c} /><path d="M8 3v4M16 3v4M4 10h16" {...c} /></>}
      {name === 'clock' && <><circle cx="12" cy="12" r="8.5" {...c} /><path d="M12 7v5l3 2" {...c} /></>}
      {name === 'flame' && <path d="M12 2c1 3-1 4-2 6-1 1.6-.5 3 1 3 1.2 0 2-1 2-2 1.5 1 3 2.8 3 5a6 6 0 1 1-12 0c0-2 1-3.7 2.5-5C8 12 9 9 12 2z" fill="currentColor" stroke="none" />}
      {name === 'gear' && <><circle cx="12" cy="12" r="3" {...c} /><path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.2-2-3.4-2.3.7a8 8 0 0 0-1.7-1l-.3-2.4H9.9l-.3 2.4a8 8 0 0 0-1.7 1l-2.3-.7-2 3.4L5.6 11a7.97 7.97 0 0 0 0 2l-2 1.2 2 3.4 2.3-.7c.5.4 1.1.8 1.7 1l.3 2.4h4.2l.3-2.4c.6-.2 1.2-.6 1.7-1l2.3.7 2-3.4-2-1.2z" {...c} /></>}
    </svg>
  );
}

function MoreMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div className="goals-more" ref={ref}>
      <button className="icon-btn" type="button" onClick={() => setOpen(o => !o)} aria-label="Więcej opcji"><IcoMore /></button>
      {open && (
        <div className="goals-more-menu">
          {actions.map((a, i) => (
            <button key={i} type="button" className={a.danger ? 'danger' : ''} onClick={() => { a.onClick(); setOpen(false); }}>{a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalsMetric({ icon, tone, label, value, note }: { icon: 'target' | 'calendar' | 'clock' | 'flame'; tone: 'pink' | 'blue' | 'teal' | 'violet'; label: string; value: string; note: string }) {
  return (
    <article className={`goals-metric goals-metric-${tone}`}>
      <div className="goals-metric-icon"><GoalsIcon name={icon} /></div>
      <div className="goals-metric-body">
        <div className="goals-metric-label">{label}</div>
        <div className="goals-metric-value">{value}</div>
        <div className="goals-metric-note">{note}</div>
      </div>
    </article>
  );
}

// ─── MAIN SCREEN ────────────────────────────────────────────────

export function GoalsScreen() {
  const { goals, goalCategories, addGoal, updateGoal, deleteGoal, addGoalCategory, deleteGoalCategory, addGoalTask, updateGoalTask, deleteGoalTask } = useLocalStore();
  const { addToday, addPlanner } = useGoalPlannerBridge();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [goalModal, setGoalModal] = useState<{ goal: Goal | null } | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);

  const active = useMemo(() => goals.filter(g => !g.completedAt), [goals]);
  const completed = useMemo(
    () => goals.filter(g => !!g.completedAt).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [goals]
  );
  const filteredActive = useMemo(() => active.filter(g =>
    (filterCategories.length === 0 || filterCategories.includes(g.category)) &&
    (filterPriorities.length === 0 || (g.priority ? filterPriorities.includes(g.priority) : false))
  ), [active, filterCategories, filterPriorities]);

  useEffect(() => {
    if (selectedId && filteredActive.some(g => g.id === selectedId)) return;
    setSelectedId(filteredActive[0]?.id ?? null);
  }, [filteredActive, selectedId]);

  const selected = filteredActive.find(g => g.id === selectedId) ?? null;

  const todayStrV = new Date().toISOString().split('T')[0];
  const todayItems = useMemo(() => active.flatMap(g =>
    collectTasks(g.tasks).filter(t => t.dueDate === todayStrV).map(t => ({ task: t, goal: g }))
  ).sort((a, b) => Number(a.task.status === 'done') - Number(b.task.status === 'done')), [active, todayStrV]);
  const todayOpenCount = todayItems.filter(i => i.task.status !== 'done').length;

  const allTasksFlat = useMemo(() => active.flatMap(g => collectTasks(g.tasks)), [active]);
  const completionPct = allTasksFlat.length ? Math.round((allTasksFlat.filter(t => t.status === 'done').length / allTasksFlat.length) * 100) : 0;
  const bestStreak = Math.max(0, ...active.map(g => g.streak ?? 0));

  function toggleFilterCategory(name: string) {
    setFilterCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  }
  function toggleFilterPriority(p: Priority) {
    setFilterPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }
  const filterCount = filterCategories.length + filterPriorities.length;

  return (
    <div className="module-page">
      <div className="goals-shell">
        <div className="goals-header">
          <div className="goals-header-main">
            <span className="goals-header-icon"><GoalsIcon name="target" /></span>
            <div>
              <h1>Cele</h1>
              <p>Twoje cele, zadania i nawyki w jednym miejscu.</p>
            </div>
          </div>
          <div className="goals-header-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setGoalModal({ goal: null })}><IcoPlus /> Nowy cel</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowFilters(true)}>Filtry{filterCount > 0 ? ` (${filterCount})` : ''}</button>
            <button className="icon-btn" type="button" onClick={() => setShowCategoryManager(true)} aria-label="Ustawienia kategorii"><GoalsIcon name="gear" /></button>
          </div>
        </div>

        <div className="goals-kpi-grid">
          <GoalsMetric icon="target" tone="pink" label="Aktywne cele" value={String(active.length)} note={`${filteredActive.length} po filtrach`} />
          <GoalsMetric icon="calendar" tone="blue" label="Na dziś z celów" value={String(todayOpenCount)} note={`${todayItems.length} łącznie na dziś`} />
          <GoalsMetric icon="clock" tone="teal" label="Ukończone zadania" value={`${completionPct}%`} note="Wszystkie aktywne cele" />
          <GoalsMetric icon="flame" tone="violet" label="Łączna seria" value={`${bestStreak} dni`} note="Najlepsza passa" />
        </div>

        <div className="goals-layout">
          <GoalsSidebar goals={filteredActive} selectedId={selectedId} onSelect={setSelectedId} onAddCategory={() => setShowCategoryManager(true)} />

          {selected ? (
            <GoalDetail
              goal={selected}
              onAddToday={() => addToday(selected.title, selected.priority)}
              onAddPlanner={() => addPlanner(selected.title, selected.deadline, selected.priority)}
              onEdit={() => setGoalModal({ goal: selected })}
              onToggleComplete={() => updateGoal(selected.id, selected.completedAt ? { completedAt: undefined } : { completedAt: new Date().toISOString(), progress: 100 })}
              onDelete={() => setDeleteGoalId(selected.id)}
              onAddTask={(payload) => addGoalTask(selected.id, payload)}
              onUpdateTask={(taskId, patch) => updateGoalTask(selected.id, taskId, patch)}
              onDeleteTask={(taskId) => deleteGoalTask(selected.id, taskId)}
              onTaskAddToday={(task) => addToday(task.title, task.priority)}
              onTaskAddPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
            />
          ) : (
            <div className="card goals-empty-detail"><EmptyState title="Wybierz cel" desc="Kliknij cel po lewej, aby zobaczyć szczegóły." /></div>
          )}

          <div className="goals-right-rail">
            <GoalsTodayPanel items={todayItems} onToggle={(goalId, task) => updateGoalTask(goalId, task.id, { status: task.status === 'done' ? 'todo' : 'done' })} />
            <GoalsHabitsPanel onManage={() => setShowAllHabits(true)} />
          </div>
        </div>

        <GoalsCompletedStrip goals={completed} onShowAll={() => setShowAllCompleted(true)} />
      </div>

      <GoalFormModal
        open={!!goalModal}
        goal={goalModal?.goal ?? null}
        categories={goalCategories}
        onClose={() => setGoalModal(null)}
        onSave={(payload) => {
          if (goalModal?.goal) updateGoal(goalModal.goal.id, payload);
          else addGoal(payload);
          setGoalModal(null);
        }}
      />
      <ConfirmDelete open={!!deleteGoalId} onClose={() => setDeleteGoalId(null)} onConfirm={() => { if (deleteGoalId) deleteGoal(deleteGoalId); setDeleteGoalId(null); }} label="ten cel" />
      <CategoryManagerModal open={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={goalCategories} onAdd={addGoalCategory} onDelete={deleteGoalCategory} />
      <FiltersModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        categories={goalCategories}
        filterCategories={filterCategories}
        filterPriorities={filterPriorities}
        onToggleCategory={toggleFilterCategory}
        onTogglePriority={toggleFilterPriority}
        onClear={() => { setFilterCategories([]); setFilterPriorities([]); }}
      />
      <AllHabitsModal open={showAllHabits} onClose={() => setShowAllHabits(false)} />
      <AllCompletedModal
        open={showAllCompleted}
        onClose={() => setShowAllCompleted(false)}
        goals={completed}
        onReopen={(id) => updateGoal(id, { completedAt: undefined })}
        onDelete={(id) => deleteGoal(id)}
      />
    </div>
  );
}

// ─── SIDEBAR ────────────────────────────────────────────────────

function GoalsSidebar({ goals, selectedId, onSelect, onAddCategory }: { goals: Goal[]; selectedId: string | null; onSelect: (id: string) => void; onAddCategory: () => void }) {
  return (
    <div className="card goals-sidebar">
      <div className="card-head"><span className="card-title">Moje cele</span></div>
      <div className="goals-sidebar-list">
        {goals.length === 0
          ? <EmptyState title="Brak celów" desc="Dodaj pierwszy cel, aby zacząć." />
          : goals.map(g => (
            <button key={g.id} type="button" className={`goals-sidebar-row${g.id === selectedId ? ' is-active' : ''}`} onClick={() => onSelect(g.id)}>
              <span className="goals-sidebar-emoji">{g.emoji}</span>
              <span className="goals-sidebar-info">
                <strong>{g.title}</strong>
                <span className="goals-sidebar-cat">{g.category}</span>
                <ProgressBar value={g.progress} size="sm" />
              </span>
              <span className="goals-sidebar-pct">{g.progress}%</span>
            </button>
          ))
        }
      </div>
      <button className="goals-add-category-btn" type="button" onClick={onAddCategory}><IcoPlus /> Dodaj nową kategorię</button>
    </div>
  );
}

// ─── GOAL DETAIL ────────────────────────────────────────────────

interface TaskFormPayload { title: string; description: string; priority: Priority; dueDate?: string; }

function GoalDetail({ goal, onAddToday, onAddPlanner, onEdit, onToggleComplete, onDelete, onAddTask, onUpdateTask, onDeleteTask, onTaskAddToday, onTaskAddPlanner }: {
  goal: Goal;
  onAddToday: () => void;
  onAddPlanner: () => void;
  onEdit: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onAddTask: (payload: Omit<GoalTask, 'id' | 'goalId' | 'subtasks' | 'progress'>) => void;
  onUpdateTask: (taskId: string, patch: Partial<GoalTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskAddToday: (task: GoalTask) => void;
  onTaskAddPlanner: (task: GoalTask) => void;
}) {
  const [taskModal, setTaskModal] = useState<{ task: GoalTask | null; parentTaskId?: string } | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectTasks(goal.tasks).map(t => t.id)));
  const flatCount = collectTasks(goal.tasks).length;

  useEffect(() => {
    setExpanded(prev => {
      const next = new Set(prev);
      for (const t of collectTasks(goal.tasks)) next.add(t.id);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.id, flatCount]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="goals-detail">
      <div className="card goals-detail-card">
        <div className="goals-detail-head">
          <div className="goals-detail-head-main">
            <span className="goals-detail-emoji">{goal.emoji}</span>
            <div>
              <h2>{goal.title}</h2>
              <div className="goals-detail-meta">{goal.category} · {goal.type === 'project' ? 'Projekt' : 'Prosty cel'}</div>
            </div>
          </div>
          <div className="goals-detail-head-actions">
            <button className="btn btn-secondary btn-sm" type="button" onClick={onAddToday}><GoalsIcon name="clock" /> Dodaj do dzisiaj</button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={onAddPlanner}><GoalsIcon name="calendar" /> Dodaj do Planera</button>
            {goal.priority && <PriorityBadge priority={goal.priority} />}
            <MoreMenu actions={[
              { label: 'Edytuj cel', onClick: onEdit },
              { label: goal.completedAt ? 'Wznów cel' : 'Oznacz jako ukończony', onClick: onToggleComplete },
              { label: 'Usuń cel', onClick: onDelete, danger: true },
            ]} />
          </div>
        </div>

        {goal.description && <p className="goals-detail-desc">{goal.description}</p>}

        <div className="goals-progress-block">
          <div className="goals-progress-head"><span>Postęp</span><strong>{goal.progress}%</strong></div>
          <ProgressBar value={goal.progress} size="lg" />
          <div className="goals-progress-label">Postęp główny</div>
        </div>

        <div className="goals-detail-footer">
          {goal.deadline && <span>Termin: <strong>{fmtDate(goal.deadline)}</strong></span>}
          {!!goal.streak && goal.streak > 0 && <span>🔥 Seria: <strong>{goal.streak} dni</strong></span>}
        </div>
      </div>

      <div className="card goals-tasks-card">
        <div className="card-head">
          <span className="card-title">Zadania</span>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setTaskModal({ task: null })}><IcoPlus /> Dodaj zadanie</button>
        </div>

        {goal.tasks.length === 0
          ? <EmptyState title="Brak zadań" desc="Dodaj pierwsze zadanie do tego celu." />
          : (
            <div className="goals-tasks-list">
              {goal.tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  expanded={expanded}
                  onToggleExpand={toggleExpand}
                  onToggleDone={(t) => onUpdateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })}
                  onEdit={(t) => setTaskModal({ task: t })}
                  onDelete={(t) => setDeleteTaskId(t.id)}
                  onAddSubtask={(t) => setTaskModal({ task: null, parentTaskId: t.id })}
                  onAddToday={onTaskAddToday}
                  onAddPlanner={onTaskAddPlanner}
                />
              ))}
            </div>
          )
        }
      </div>

      <TaskFormModal
        open={!!taskModal}
        task={taskModal?.task ?? null}
        onClose={() => setTaskModal(null)}
        onSave={(payload) => {
          if (taskModal?.task) onUpdateTask(taskModal.task.id, payload);
          else onAddTask({ ...payload, status: 'todo', parentTaskId: taskModal?.parentTaskId });
          setTaskModal(null);
        }}
      />
      <ConfirmDelete open={!!deleteTaskId} onClose={() => setDeleteTaskId(null)} onConfirm={() => { if (deleteTaskId) onDeleteTask(deleteTaskId); setDeleteTaskId(null); }} label="to zadanie" />
    </div>
  );
}

function TaskRow({ task, expanded, onToggleExpand, onToggleDone, onEdit, onDelete, onAddSubtask, onAddToday, onAddPlanner }: {
  task: GoalTask;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleDone: (task: GoalTask) => void;
  onEdit: (task: GoalTask) => void;
  onDelete: (task: GoalTask) => void;
  onAddSubtask: (task: GoalTask) => void;
  onAddToday: (task: GoalTask) => void;
  onAddPlanner: (task: GoalTask) => void;
}) {
  const hasChildren = task.subtasks.length > 0;
  const isExpanded = expanded.has(task.id);
  const isDone = task.status === 'done';

  return (
    <>
      <div className={`goals-task-row${isDone ? ' is-done' : ''}`}>
        {hasChildren
          ? <button className={`goals-task-chevron${isExpanded ? ' is-open' : ''}`} type="button" onClick={() => onToggleExpand(task.id)} aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}><IcoChevRight /></button>
          : <span className="goals-task-chevron-spacer" />
        }
        <button className="goals-task-check" type="button" onClick={() => onToggleDone(task)} aria-label={isDone ? 'Oznacz jako niezrobione' : 'Oznacz jako zrobione'}>
          {isDone && <IcoCheck />}
        </button>
        <span className="goals-task-title">{task.title}</span>
        {task.priority && <PriorityBadge priority={task.priority} />}
        {task.dueDate && <span className="goals-task-date">{relativeDateLabel(task.dueDate)}</span>}
        <button className="icon-btn" type="button" onClick={() => onAddPlanner(task)} aria-label="Dodaj do Planera"><GoalsIcon name="calendar" /></button>
        <MoreMenu actions={[
          { label: 'Dodaj do dzisiaj', onClick: () => onAddToday(task) },
          { label: 'Dodaj podzadanie', onClick: () => onAddSubtask(task) },
          { label: 'Edytuj zadanie', onClick: () => onEdit(task) },
          { label: 'Usuń zadanie', onClick: () => onDelete(task), danger: true },
        ]} />
      </div>
      {hasChildren && isExpanded && (
        <div className="goals-task-children">
          {task.subtasks.map(st => (
            <TaskRow
              key={st.id}
              task={st}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onAddToday={onAddToday}
              onAddPlanner={onAddPlanner}
            />
          ))}
        </div>
      )}
    </>
  );
}

function TaskFormModal({ open, task, onClose, onSave }: { open: boolean; task: GoalTask | null; onClose: () => void; onSave: (payload: TaskFormPayload) => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('mid');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setTitle(task?.title ?? '');
    setPriority(task?.priority ?? 'mid');
    setDueDate(task?.dueDate ?? '');
    setDescription(task?.description ?? '');
  }, [task, open]);

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edytuj zadanie' : 'Nowe zadanie'} footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!title.trim()) return;
          onSave({ title: title.trim(), description, priority, dueDate: dueDate || undefined });
        }}>Zapisz</button>
      </>
    }>
      <Field label="Tytuł" required><input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
      <div className="form-grid">
        <Field label="Priorytet">
          <select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            <option value="low">Niski</option><option value="mid">Średni</option><option value="high">Wysoki</option>
          </select>
        </Field>
        <Field label="Termin"><input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
      </div>
      <Field label="Opis"><textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} /></Field>
    </Modal>
  );
}

// ─── RIGHT RAIL ─────────────────────────────────────────────────

function GoalsTodayPanel({ items, onToggle }: { items: { task: GoalTask; goal: Goal }[]; onToggle: (goalId: string, task: GoalTask) => void }) {
  return (
    <div className="card goals-today-card">
      <div className="card-head">
        <div>
          <span className="card-title">Dzisiaj z celów</span>
          <div className="goals-today-sub">Powiązane z Planerem i Kalendarzem</div>
        </div>
      </div>
      {items.length === 0
        ? <div className="goals-muted">Brak zadań na dziś.</div>
        : (
          <div className="goals-today-list">
            {items.map(({ task, goal }) => (
              <div key={task.id} className={`goals-today-row${task.status === 'done' ? ' is-done' : ''}`}>
                <button className="goals-task-check" type="button" onClick={() => onToggle(goal.id, task)} aria-label={task.status === 'done' ? 'Oznacz jako niezrobione' : 'Oznacz jako zrobione'}>
                  {task.status === 'done' && <IcoCheck />}
                </button>
                <span className="goals-today-info">
                  <strong>{task.title}</strong>
                  <small>{goal.title}</small>
                </span>
                {task.priority && <PriorityBadge priority={task.priority} />}
              </div>
            ))}
          </div>
        )
      }
      <Link to="/" className="goals-link-more">Zobacz cały plan dnia →</Link>
    </div>
  );
}

function GoalsHabitsPanel({ onManage }: { onManage: () => void }) {
  const habitsQ = useHabits();
  const logsQ = useHabitLogs();
  const habits = (habitsQ.data ?? []).slice(0, 5);
  const today = todayStr();
  const monday = mondayOf(today);

  const datesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of habitsQ.data ? (logsQ.data ?? []) : []) {
      let s = map.get(l.habit_id);
      if (!s) { s = new Set(); map.set(l.habit_id, s); }
      s.add(l.log_date);
    }
    return map;
  }, [logsQ.data, habitsQ.data]);

  return (
    <div className="card goals-habits-card">
      <div className="card-head">
        <span className="card-title">Nawyki</span>
        <button className="goals-link-inline" type="button" onClick={onManage}>Zarządzaj</button>
      </div>
      {habitsQ.isLoading
        ? <div className="goals-muted">Ładowanie…</div>
        : habits.length === 0
          ? <EmptyState title="Brak nawyków" desc="Dodaj swój pierwszy nawyk." cta="Zarządzaj nawykami" onCta={onManage} />
          : (
            <div className="goals-habit-table">
              <div className="goals-habit-table-head">
                <span />
                {HABIT_WEEKDAYS.map(d => <span key={d.value} className={weekdayOf(today) === d.value ? 'is-today' : ''}>{d.label}</span>)}
                <span />
              </div>
              {habits.map(h => {
                const dates = datesByHabit.get(h.id) ?? new Set<string>();
                const stats = habitStats(dates, today, h);
                return (
                  <div key={h.id} className="goals-habit-row">
                    <span className="goals-habit-name">{h.name}</span>
                    {HABIT_WEEKDAYS.map((d, i) => {
                      const dateForDay = addDays(monday, i);
                      const done = dates.has(dateForDay);
                      const scheduled = habitOccursOn(h, dateForDay);
                      return (
                        <span key={d.value} className={`goals-habit-dot${done ? ' done' : ''}${!scheduled ? ' off' : ''}`}>
                          {done && <IcoCheck />}
                        </span>
                      );
                    })}
                    <span className="goals-habit-streak">{stats.streak} dni</span>
                  </div>
                );
              })}
            </div>
          )
      }
      <button className="goals-link-more" type="button" onClick={onManage}>Zobacz wszystkie nawyki →</button>
    </div>
  );
}

// ─── COMPLETED STRIP ────────────────────────────────────────────

function GoalsCompletedStrip({ goals, onShowAll }: { goals: Goal[]; onShowAll: () => void }) {
  const preview = goals.slice(0, 3);
  return (
    <div className="card goals-completed-card">
      <div className="card-head">
        <span className="card-title">Ukończone cele</span>
        {goals.length > 3 && <button className="goals-link-inline" type="button" onClick={onShowAll}>Zobacz wszystkie ukończone →</button>}
      </div>
      {preview.length === 0
        ? <EmptyState title="Brak ukończonych celów" desc="Twoje ukończone cele pojawią się tutaj." />
        : (
          <div className="goals-completed-grid">
            {preview.map(g => (
              <div key={g.id} className="goals-completed-item">
                <span className="goals-completed-check"><IcoCheck /></span>
                <div className="goals-completed-info">
                  <strong>{g.title}</strong>
                  <small>{g.category} · Ukończono {fmtDate(g.completedAt!)}</small>
                </div>
                <span className="badge badge-green">{g.progress}%</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── MODALS ─────────────────────────────────────────────────────

function GoalFormModal({ open, goal, categories, onClose, onSave }: {
  open: boolean; goal: Goal | null; categories: string[]; onClose: () => void;
  onSave: (payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'milestones'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Inne');
  const [type, setType] = useState<GoalType>('simple');
  const [priority, setPriority] = useState<Priority>('mid');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTitle(goal?.title ?? '');
    setEmoji(goal?.emoji ?? '🎯');
    setDesc(goal?.description ?? '');
    setCategory(goal?.category ?? categories[0] ?? 'Inne');
    setType(goal?.type ?? 'simple');
    setPriority(goal?.priority ?? 'mid');
    setDeadline(goal?.deadline ?? '');
    setProgress(goal?.progress ?? 0);
  }, [goal, open, categories]);

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edytuj cel' : 'Nowy cel'} footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!title.trim()) return;
          onSave({
            title: title.trim(), emoji, description: desc, category, type, priority,
            deadline: deadline || undefined, progress, archived: false,
            streak: goal?.streak, completedAt: goal?.completedAt,
          });
        }}>{goal ? 'Zapisz' : 'Utwórz cel'}</button>
      </>
    }>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Emoji"><input className="input goals-emoji-input" value={emoji} onChange={e => setEmoji(e.target.value)} /></Field>
        <Field label="Tytuł celu" required><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Np. Przebiec maraton" /></Field>
      </div>
      <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
      <div className="form-grid">
        <Field label="Kategoria"><select className="select" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Typ"><select className="select" value={type} onChange={e => setType(e.target.value as GoalType)}>
          <option value="simple">Prosty cel</option><option value="project">Projekt</option>
        </select></Field>
        <Field label="Priorytet"><select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
          <option value="low">Niski</option><option value="mid">Średni</option><option value="high">Wysoki</option>
        </select></Field>
        <Field label="Termin"><input type="date" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} /></Field>
      </div>
      <Field label={`Postęp (${progress}%)`}><input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className="goals-range" /></Field>
    </Modal>
  );
}

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

function FiltersModal({ open, onClose, categories, filterCategories, filterPriorities, onToggleCategory, onTogglePriority, onClear }: {
  open: boolean; onClose: () => void; categories: string[];
  filterCategories: string[]; filterPriorities: Priority[];
  onToggleCategory: (c: string) => void; onTogglePriority: (p: Priority) => void; onClear: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Filtry" size="sm" footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClear}>Wyczyść</button>
        <button className="btn btn-primary btn-sm" onClick={onClose}>Gotowe</button>
      </>
    }>
      <div className="goals-filter-group">
        <div className="goals-filter-label">Kategoria</div>
        <div className="goals-filter-chips">
          {categories.map(c => (
            <button key={c} type="button" className={`goals-chip${filterCategories.includes(c) ? ' is-active' : ''}`} onClick={() => onToggleCategory(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="goals-filter-group">
        <div className="goals-filter-label">Priorytet</div>
        <div className="goals-filter-chips">
          {(['low', 'mid', 'high'] as Priority[]).map(p => (
            <button key={p} type="button" className={`goals-chip${filterPriorities.includes(p) ? ' is-active' : ''}`} onClick={() => onTogglePriority(p)}>
              {p === 'low' ? 'Niski' : p === 'mid' ? 'Średni' : 'Wysoki'}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function AllHabitsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Nawyki" size="lg">
      <HabitList />
    </Modal>
  );
}

function AllCompletedModal({ open, onClose, goals, onReopen, onDelete }: { open: boolean; onClose: () => void; goals: Goal[]; onReopen: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Wszystkie ukończone cele" size="lg">
      <div className="goals-modal-list">
        {goals.length === 0
          ? <EmptyState title="Brak ukończonych celów" />
          : goals.map(g => (
            <div key={g.id} className="goals-completed-item">
              <span className="goals-completed-check"><IcoCheck /></span>
              <div className="goals-completed-info">
                <strong>{g.title}</strong>
                <small>{g.category} · Ukończono {fmtDate(g.completedAt!)}</small>
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => onReopen(g.id)}>Wznów</button>
              <button className="icon-btn" type="button" onClick={() => onDelete(g.id)} aria-label={`Usuń cel ${g.title}`}><IcoTrash /></button>
            </div>
          ))
        }
      </div>
    </Modal>
  );
}
