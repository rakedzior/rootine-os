import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, ProgressBar, PriorityBadge, IcoTrash, IcoPlus, IcoCheck, IcoChevRight, IcoMore } from '@/components/common';
import { useCreateTask } from '@/features/tasks/hooks';
import { useLocalStore, type Goal, type GoalTask, type GoalType, type Priority } from '@/store/localStore';

function collectTasks(tasks: GoalTask[]): GoalTask[] {
  return tasks.flatMap((task) => [task, ...collectTasks(task.subtasks)]);
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function addDays(date: string, delta: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

function mondayOf(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay() || 7;
  return addDays(date, 1 - day);
}

function fmtDate(date?: string) {
  if (!date) return '-';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL');
}

function shortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { weekday: 'short' }).toUpperCase();
}

function relativeDateLabel(date?: string) {
  if (!date) return 'Kiedyś';
  const t = todayStr();
  if (date === t) return 'Dziś';
  if (date === addDays(t, 1)) return 'Jutro';
  return fmtDate(date);
}

function goalNextStep(goal: Goal): string | null {
  return collectTasks(goal.tasks).find((task) => task.status !== 'done')?.title ?? null;
}

function goalStatus(goal: Goal): { label: string; cls: string } {
  if (goal.completedAt || goal.progress >= 100) return { label: 'Ukończony', cls: 'status-done' };
  if (!goal.deadline) return { label: 'Aktywny', cls: 'status-active' };
  const now = new Date();
  const deadline = new Date(`${goal.deadline}T23:59:59`);
  if (deadline < now) return { label: 'Opóźniony', cls: 'status-overdue' };
  const start = new Date(goal.createdAt);
  const expected = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / Math.max(deadline.getTime() - start.getTime(), 1)) * 100));
  if (goal.progress + 15 < expected) return { label: 'Ryzyko', cls: 'status-warn' };
  return { label: 'Na czasie', cls: 'status-active' };
}

function useGoalPlannerBridge() {
  const createTask = useCreateTask();
  function addPlanner(title: string, dueDate?: string, priority?: Priority) {
    createTask.mutate({ title, category: 'Cel', priority: priority ?? null, due_date: dueDate || todayStr() });
  }
  return { addPlanner };
}

function GoalIcon({ name }: { name: 'target' | 'calendar' | 'flame' | 'clock' | 'gear' | 'repeat' }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'target' && <><circle cx="12" cy="12" r="9" {...c} /><circle cx="12" cy="12" r="5" {...c} /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...c} /><path d="M8 3v4M16 3v4M4 10h16" {...c} /></>}
      {name === 'clock' && <><circle cx="12" cy="12" r="8.5" {...c} /><path d="M12 7v5l3 2" {...c} /></>}
      {name === 'flame' && <path d="M12 2c1 3-1 4-2 6-1 1.6-.5 3 1 3 1.2 0 2-1 2-2 1.5 1 3 2.8 3 5a6 6 0 1 1-12 0c0-2 1-3.7 2.5-5C8 12 9 9 12 2z" fill="currentColor" stroke="none" />}
      {name === 'gear' && <><circle cx="12" cy="12" r="3" {...c} /><path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.2-2-3.4-2.3.7a8 8 0 0 0-1.7-1l-.3-2.4H9.9l-.3 2.4a8 8 0 0 0-1.7 1l-2.3-.7-2 3.4L5.6 11a7.97 7.97 0 0 0 0 2l-2 1.2 2 3.4 2.3-.7c.5.4 1.1.8 1.7 1l.3 2.4h4.2l.3-2.4c.6-.2 1.2-.6 1.7-1l2.3.7 2-3.4-2-1.2z" {...c} /></>}
      {name === 'repeat' && <><path d="m17 1 4 4-4 4" {...c} /><path d="M3 11V9a4 4 0 0 1 4-4h14" {...c} /><path d="m7 23-4-4 4-4" {...c} /><path d="M21 13v2a4 4 0 0 1-4 4H3" {...c} /></>}
    </svg>
  );
}

function MoreMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="goals-more" ref={ref}>
      <button className="icon-btn" type="button" onClick={() => setOpen((value) => !value)} aria-label="Więcej opcji"><IcoMore /></button>
      {open && (
        <div className="goals-more-menu">
          {actions.map((action) => (
            <button key={action.label} type="button" className={action.danger ? 'danger' : ''} onClick={() => { action.onClick(); setOpen(false); }}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalsScreen() {
  const { goals, goalCategories, addGoal, updateGoal, deleteGoal, addGoalCategory, deleteGoalCategory, addGoalTask, updateGoalTask, deleteGoalTask } = useLocalStore();
  const { addPlanner } = useGoalPlannerBridge();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [goalModal, setGoalModal] = useState<{ goal: Goal | null } | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const activeGoals = useMemo(() => goals.filter((goal) => !goal.completedAt), [goals]);
  const selected = activeGoals.find((goal) => goal.id === selectedId) ?? activeGoals[0] ?? null;
  const selectedTasks = useMemo(() => selected ? collectTasks(selected.tasks) : [], [selected]);
  const todayTasks = useMemo(() => selectedTasks.filter((task) => task.dueDate === todayStr()), [selectedTasks]);

  useEffect(() => {
    if (!selectedId || !activeGoals.some((goal) => goal.id === selectedId)) {
      setSelectedId(activeGoals[0]?.id ?? null);
    }
  }, [activeGoals, selectedId]);

  return (
    <div className="module-page">
      <div className="goals-os">
        <section className="card goals-command-panel">
          <div className="goals-command-head">
            <div>
              <h1>Cele</h1>
              <p>Roadmapy, kamienie milowe i działania na dziś w jednym widoku.</p>
            </div>
            <div className="goals-command-actions">
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setGoalModal({ goal: null })}><IcoPlus /> Dodaj cel</button>
              <button className="icon-btn" type="button" onClick={() => setShowCategoryManager(true)} aria-label="Kategorie"><GoalIcon name="gear" /></button>
            </div>
          </div>

          <div className="goals-folder-list">
            {activeGoals.length === 0 ? (
              <EmptyState title="Brak celów" desc="Dodaj pierwszy cel, aby zacząć rozbijać go na działania." />
            ) : activeGoals.map((goal) => (
              <button key={goal.id} type="button" className={`goals-folder-row${goal.id === selected?.id ? ' is-active' : ''}`} onClick={() => setSelectedId(goal.id)}>
                <span className="goals-folder-emoji">{goal.emoji || '◎'}</span>
                <span className="goals-folder-main">
                  <strong>{goal.title}</strong>
                  <small>{goal.category}</small>
                  <ProgressBar value={goal.progress} size="sm" />
                </span>
                <span className="goals-folder-pct">{goal.progress}%</span>
                <IcoChevRight />
              </button>
            ))}
          </div>

          {selected && (
            <div className="goals-tree-panel">
              <div className="goals-tree-head">
                <div>
                  <span className="eyebrow">Folder celu</span>
                  <h2>{selected.title}</h2>
                </div>
                <MoreMenu actions={[
                  { label: 'Edytuj cel', onClick: () => setGoalModal({ goal: selected }) },
                  { label: selected.completedAt ? 'Otwórz ponownie' : 'Oznacz jako ukończony', onClick: () => updateGoal(selected.id, selected.completedAt ? { completedAt: undefined, progress: Math.min(selected.progress, 99) } : { completedAt: new Date().toISOString(), progress: 100 }) },
                  { label: 'Usuń cel', onClick: () => setDeleteGoalId(selected.id), danger: true },
                ]} />
              </div>
              <p className="goals-tree-desc">{selected.description || 'Rozbij cel na małe, powtarzalne kroki.'}</p>
              <div className="goals-tree-meta">
                <span><GoalIcon name="target" /> {goalStatus(selected).label}</span>
                <span><GoalIcon name="calendar" /> {relativeDateLabel(selected.deadline)}</span>
                <span><GoalIcon name="flame" /> {selected.streak ?? 0} dni</span>
              </div>
              <GoalTaskTree
                tasks={selected.tasks}
                goalId={selected.id}
                onUpdate={(taskId, patch) => updateGoalTask(selected.id, taskId, patch)}
                onDelete={(taskId) => deleteGoalTask(selected.id, taskId)}
                onPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
              />
              <NewGoalTaskForm onAdd={(payload) => addGoalTask(selected.id, payload)} />
            </div>
          )}
        </section>

        <main className="goals-main-stage">
          {selected ? (
            <>
              <GoalRoadmap goal={selected} />
              <GoalWeekPlan
                goal={selected}
                tasks={selectedTasks}
                todayTasks={todayTasks}
                onToggle={(task) => updateGoalTask(selected.id, task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                onPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
              />
            </>
          ) : (
            <div className="card goals-empty-detail"><EmptyState title="Brak aktywnego celu" desc="Dodaj cel, aby zobaczyć roadmapę i plan tygodnia." /></div>
          )}
        </main>
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
    </div>
  );
}

function GoalTaskTree({ tasks, goalId, onUpdate, onDelete, onPlanner, depth = 0 }: {
  tasks: GoalTask[];
  goalId: string;
  onUpdate: (taskId: string, patch: Partial<GoalTask>) => void;
  onDelete: (taskId: string) => void;
  onPlanner: (task: GoalTask) => void;
  depth?: number;
}) {
  if (tasks.length === 0 && depth === 0) return <div className="goals-muted">Brak działań. Dodaj pierwszy krok pod celem.</div>;
  return (
    <div className={depth === 0 ? 'goals-task-tree' : 'goals-task-children'}>
      {tasks.map((task) => (
        <div key={task.id}>
          <div className={`goals-task-row${task.status === 'done' ? ' is-done' : ''}`} style={{ paddingLeft: depth ? 8 : undefined }}>
            <button className="goals-task-check" type="button" onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} aria-label="Zmień status">
              {task.status === 'done' && <IcoCheck />}
            </button>
            <span className="goals-task-title">{task.title}</span>
            {task.priority && <PriorityBadge priority={task.priority} />}
            <span className="goals-task-date">{relativeDateLabel(task.dueDate)}</span>
            <button className="icon-btn" type="button" onClick={() => onPlanner(task)} aria-label="Dodaj do Planera"><GoalIcon name="calendar" /></button>
            <button className="icon-btn" type="button" onClick={() => onDelete(task.id)} aria-label="Usuń działanie"><IcoTrash /></button>
          </div>
          {task.subtasks.length > 0 && (
            <GoalTaskTree tasks={task.subtasks} goalId={goalId} onUpdate={onUpdate} onDelete={onDelete} onPlanner={onPlanner} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function NewGoalTaskForm({ onAdd }: { onAdd: (payload: Omit<GoalTask, 'id' | 'goalId' | 'subtasks' | 'progress'>) => void }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('mid');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({ title: trimmed, description: '', dueDate: dueDate || undefined, priority, status: 'todo' });
    setTitle('');
    setDueDate('');
    setPriority('mid');
  }

  return (
    <form className="goals-add-task-row" onSubmit={submit}>
      <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dodaj działanie" />
      <input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      <select className="input" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
        <option value="low">Niski</option>
        <option value="mid">Średni</option>
        <option value="high">Wysoki</option>
      </select>
      <button className="btn btn-secondary btn-sm" type="submit"><IcoPlus /> Dodaj</button>
    </form>
  );
}

function GoalRoadmap({ goal }: { goal: Goal }) {
  const fallback = [
    { title: 'Start', dueDate: goal.createdAt.split('T')[0], progress: 100, completed: true },
    { title: goalNextStep(goal) ?? 'Następny krok', dueDate: todayStr(), progress: goal.progress, completed: false },
    { title: 'Kontrola postępu', dueDate: goal.deadline ? addDays(goal.deadline, -14) : undefined, progress: Math.min(goal.progress, 80), completed: false },
    { title: 'Finalizacja', dueDate: goal.deadline, progress: goal.progress >= 100 ? 100 : 0, completed: goal.progress >= 100 },
  ];
  const milestones = goal.milestones.length > 0
    ? goal.milestones.map((milestone) => ({ title: milestone.title, dueDate: milestone.dueDate, progress: milestone.progress, completed: milestone.completed }))
    : fallback;

  return (
    <section className="card goals-roadmap-card">
      <div className="card-head">
        <span className="card-title">Roadmapa celu</span>
        <span className={`status-pill ${goalStatus(goal).cls}`}>{goalStatus(goal).label}</span>
      </div>
      <div className="goals-roadmap-track">
        {milestones.map((milestone, index) => (
          <div key={`${milestone.title}-${index}`} className={`goals-roadmap-node${milestone.completed ? ' is-done' : ''}${index === 1 && !milestone.completed ? ' is-active' : ''}`}>
            <div className="goals-roadmap-dot">{milestone.completed ? <IcoCheck /> : index + 1}</div>
            <div className="goals-roadmap-box">
              <strong>{milestone.title}</strong>
              <small>{milestone.progress}% postępu</small>
              <span>{fmtDate(milestone.dueDate)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GoalWeekPlan({ goal, tasks, todayTasks, onToggle, onPlanner }: {
  goal: Goal;
  tasks: GoalTask[];
  todayTasks: GoalTask[];
  onToggle: (task: GoalTask) => void;
  onPlanner: (task: GoalTask) => void;
}) {
  const start = mondayOf(todayStr());
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const weekTasks = tasks.filter((task) => task.dueDate && task.dueDate >= days[0] && task.dueDate <= days[6]);
  const fallbackTasks = tasks.filter((task) => task.status !== 'done').slice(0, 7);

  return (
    <section className="card goals-week-card">
      <div className="card-head">
        <span className="card-title">Plan na ten tydzień</span>
        <span className="goals-week-total">{weekTasks.length || fallbackTasks.length} działań</span>
      </div>
      <div className="goals-week-grid">
        {days.map((date, index) => {
          const dayTasks = weekTasks.filter((task) => task.dueDate === date);
          const suggested = dayTasks.length ? dayTasks : (fallbackTasks[index] ? [fallbackTasks[index]] : []);
          return (
            <div key={date} className={`goals-week-day${date === todayStr() ? ' is-today' : ''}`}>
              <div className="goals-week-day-head">
                <strong>{weekday(date)}</strong>
                <span>{shortDate(date)}</span>
              </div>
              {suggested.length === 0 ? (
                <div className="goals-week-empty">Wolne</div>
              ) : suggested.map((task) => (
                <button key={task.id} type="button" className={`goals-week-task${task.status === 'done' ? ' is-done' : ''}`} onClick={() => onToggle(task)}>
                  <span>{task.title}</span>
                  <small>{task.dueDate ? relativeDateLabel(task.dueDate) : goal.category}</small>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="goals-week-footer">
        <div>
          <span className="eyebrow">Dziś</span>
          <strong>{todayTasks.filter((task) => task.status !== 'done').length} aktywne działania</strong>
        </div>
        {todayTasks[0] && <button className="btn btn-secondary btn-sm" type="button" onClick={() => onPlanner(todayTasks[0])}><GoalIcon name="calendar" /> Dodaj do Planera</button>}
      </div>
    </section>
  );
}

function GoalFormModal({ open, goal, categories, onClose, onSave }: {
  open: boolean;
  goal: Goal | null;
  categories: string[];
  onClose: () => void;
  onSave: (payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'milestones'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('project');
  const [category, setCategory] = useState(categories[0] ?? 'Osobiste');
  const [priority, setPriority] = useState<Priority>('mid');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [emoji, setEmoji] = useState('🎯');

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? '');
    setDescription(goal?.description ?? '');
    setType(goal?.type ?? 'project');
    setCategory(goal?.category ?? categories[0] ?? 'Osobiste');
    setPriority(goal?.priority ?? 'mid');
    setDeadline(goal?.deadline ?? '');
    setProgress(goal?.progress ?? 0);
    setStreak(goal?.streak ?? 0);
    setEmoji(goal?.emoji ?? '🎯');
  }, [categories, goal, open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      type,
      category: category.trim() || 'Osobiste',
      priority,
      deadline: deadline || undefined,
      progress,
      streak,
      archived: false,
      emoji: emoji.trim() || '🎯',
      completedAt: goal?.completedAt,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edytuj cel' : 'Dodaj cel'} size="lg">
      <form className="modal-form" onSubmit={submit}>
        <div className="grid-2">
          <Field label="Nazwa celu"><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field>
          <Field label="Ikona"><input className="input goals-emoji-input" value={emoji} onChange={(event) => setEmoji(event.target.value)} /></Field>
          <Field label="Termin końcowy"><input className="input" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
          <Field label="Typ"><select className="input" value={type} onChange={(event) => setType(event.target.value as GoalType)}><option value="project">Projekt</option><option value="simple">Prosty cel</option></select></Field>
          <Field label="Kategoria"><input className="input" list="goal-categories" value={category} onChange={(event) => setCategory(event.target.value)} /><datalist id="goal-categories">{categories.map((name) => <option key={name} value={name} />)}</datalist></Field>
          <Field label="Priorytet"><select className="input" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Niski</option><option value="mid">Średni</option><option value="high">Wysoki</option></select></Field>
          <Field label={`Postęp (${progress}%)`}><input className="goals-range" type="range" min={0} max={100} value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></Field>
          <Field label="Seria"><input className="input" type="number" min={0} value={streak} onChange={(event) => setStreak(Number(event.target.value))} /></Field>
        </div>
        <Field label="Opis"><textarea className="textarea" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={onClose}>Anuluj</button><button className="btn btn-primary" type="submit">Zapisz cel</button></div>
      </form>
    </Modal>
  );
}

function CategoryManagerModal({ open, onClose, categories, onAdd, onDelete }: { open: boolean; onClose: () => void; categories: string[]; onAdd: (name: string) => void; onDelete: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Kategorie celów">
      <div className="goals-modal-list">
        {categories.map((category) => (
          <div className="goals-category-row" key={category}>
            <span>{category}</span>
            <button className="icon-btn" type="button" onClick={() => onDelete(category)} aria-label={`Usuń ${category}`}><IcoTrash /></button>
          </div>
        ))}
      </div>
      <form className="goals-category-add-row" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { onAdd(name.trim()); setName(''); } }}>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nowa kategoria" />
        <button className="btn btn-primary btn-sm" type="submit"><IcoPlus /> Dodaj</button>
      </form>
    </Modal>
  );
}
