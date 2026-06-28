import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, PageHeader, ProgressBar, PriorityBadge, IcoTrash, IcoPlus, IcoCheck, IcoChevRight, IcoMore } from '@/components/common';
import { PageLayout } from '@/components/layout/primitives';
import { useCreateTask } from '@/features/tasks/hooks';
import {
  useCreateGoal,
  useCreateGoalTask,
  useDeleteGoal,
  useDeleteGoalTask,
  useGoalTasks,
  useGoals,
  useMilestones,
  useUpdateGoal,
  useUpdateGoalTask,
} from '@/features/goals/hooks';
import { computeGoalProgress, type Goal as GoalRow, type GoalTask as GoalTaskRow, type Milestone as MilestoneRow } from '@/features/goals/types';

type Priority = 'low' | 'mid' | 'high';
type TaskStatus = 'todo' | 'active' | 'waiting' | 'done' | 'blocked';
type GoalType = 'simple' | 'project';

interface GoalTask {
  id: string; goalId: string; parentTaskId?: string;
  title: string; description: string; dueDate?: string;
  priority?: Priority; status: TaskStatus; progress: number;
  subtasks: GoalTask[];
}

interface Milestone { id: string; goalId: string; title: string; dueDate?: string; progress: number; completed: boolean; }
interface Goal {
  id: string; createdAt: string; updatedAt: string;
  title: string; description: string; type: GoalType;
  category: string; priority?: Priority; deadline?: string;
  progress: number; streak?: number; tasks: GoalTask[];
  milestones: Milestone[]; archived: boolean; emoji: string;
  completedAt?: string;
}

const DEFAULT_GOAL_CATEGORIES = ['Osobiste', 'Zdrowie', 'Finanse', 'Nauka', 'Praca'];

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

function normalizePriority(priority?: string | null): Priority | undefined {
  return priority === 'low' || priority === 'mid' || priority === 'high' ? priority : undefined;
}

function normalizeStatus(status?: string | null): TaskStatus {
  if (status === 'active' || status === 'waiting' || status === 'done' || status === 'blocked') return status;
  return 'todo';
}

function buildGoalTaskTree(rows: GoalTaskRow[], goalId: string, parentTaskId: string | null = null): GoalTask[] {
  return rows
    .filter((task) => task.goal_id === goalId && task.parent_task_id === parentTaskId)
    .map((task) => ({
      id: task.id,
      goalId: task.goal_id,
      parentTaskId: task.parent_task_id ?? undefined,
      title: task.title,
      description: task.description ?? '',
      dueDate: task.due_date ?? undefined,
      priority: normalizePriority(task.priority),
      status: normalizeStatus(task.status),
      progress: task.progress ?? 0,
      subtasks: buildGoalTaskTree(rows, goalId, task.id),
    }));
}

function mapMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    dueDate: row.due_date ?? undefined,
    progress: row.progress ?? (row.done ? 100 : 0),
    completed: row.done,
  };
}

function mapGoal(row: GoalRow, taskRows: GoalTaskRow[], milestoneRows: MilestoneRow[]): Goal {
  const goalMilestones = milestoneRows.filter((milestone) => milestone.goal_id === row.id);
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.name,
    description: row.description ?? '',
    type: row.type ?? 'project',
    category: row.category ?? 'Osobiste',
    priority: normalizePriority(row.priority),
    deadline: row.deadline ?? undefined,
    progress: goalMilestones.length ? computeGoalProgress(goalMilestones) : row.progress ?? 0,
    streak: row.streak ?? 0,
    tasks: buildGoalTaskTree(taskRows, row.id),
    milestones: goalMilestones.map(mapMilestone),
    archived: row.archived,
    emoji: row.emoji || 'target',
    completedAt: row.completed_at ?? undefined,
  };
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
  const goalsQuery = useGoals();
  const milestonesQuery = useMilestones();
  const tasksQuery = useGoalTasks();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const removeGoal = useDeleteGoal();
  const createGoalTask = useCreateGoalTask();
  const updateGoalTask = useUpdateGoalTask();
  const removeGoalTask = useDeleteGoalTask();
  const { addPlanner } = useGoalPlannerBridge();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [goalModal, setGoalModal] = useState<{ goal: Goal | null } | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [goalView, setGoalView] = useState<'active' | 'completed'>('active');

  const goals = useMemo(
    () => (goalsQuery.data ?? []).map((goal) => mapGoal(goal, tasksQuery.data ?? [], milestonesQuery.data ?? [])),
    [goalsQuery.data, milestonesQuery.data, tasksQuery.data],
  );
  const goalCategories = useMemo(() => {
    const categories = [...DEFAULT_GOAL_CATEGORIES, ...extraCategories, ...goals.map((goal) => goal.category)].filter(Boolean);
    return Array.from(new Set(categories));
  }, [extraCategories, goals]);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goalView === 'completed' ? Boolean(goal.completedAt) || goal.archived : !goal.completedAt && !goal.archived),
    [goalView, goals],
  );
  const selected = activeGoals.find((goal) => goal.id === selectedId) ?? activeGoals[0] ?? null;
  const selectedTasks = useMemo(() => selected ? collectTasks(selected.tasks) : [], [selected]);
  const todayTasks = useMemo(() => selectedTasks.filter((task) => task.dueDate === todayStr()), [selectedTasks]);

  useEffect(() => {
    if (!selectedId || !activeGoals.some((goal) => goal.id === selectedId)) {
      setSelectedId(activeGoals[0]?.id ?? null);
    }
  }, [activeGoals, selectedId]);

  return (
    <PageLayout
      className="goals-page"
      header={<PageHeader
        icon={<GoalIcon name="target" />}
        title="Cele"
        desc="Roadmapy, kamienie milowe i działania na dziś w jednym widoku."
        actions={<>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setGoalModal({ goal: null })}><IcoPlus /> Dodaj cel</button>
          <button className="icon-btn" type="button" onClick={() => setShowCategoryManager(true)} aria-label="Kategorie"><GoalIcon name="gear" /></button>
        </>}
      />}
    >

      <div className="goals-os">
        <section className="card goals-command-panel">
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

          <button className="goals-archive-link" type="button" onClick={() => setGoalView((view) => view === 'active' ? 'completed' : 'active')}>
            <GoalIcon name="calendar" /> {goalView === 'active' ? 'Archiwalne cele' : 'Aktywne cele'} <IcoChevRight />
          </button>
        </section>

        <main className="goals-main-stage">
          {selected ? (
            <>
              <GoalDetailHeader
                goal={selected}
                onEdit={() => setGoalModal({ goal: selected })}
                onToggleDone={() => updateGoal.mutate({ id: selected.id, patch: selected.completedAt ? { completed_at: null, progress: Math.min(selected.progress, 99) } : { completed_at: new Date().toISOString(), progress: 100 } })}
                onDelete={() => setDeleteGoalId(selected.id)}
              />
              <GoalRoadmap goal={selected} />
              <GoalWeekPlan
                goal={selected}
                tasks={selectedTasks}
                todayTasks={todayTasks}
                onToggle={(task) => updateGoalTask.mutate({ id: task.id, patch: { status: task.status === 'done' ? 'todo' : 'done' } })}
                onPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
              />
              <GoalActionsPanel
                goal={selected}
                onUpdate={(taskId, patch) => updateGoalTask.mutate({ id: taskId, patch: { status: patch.status, title: patch.title, description: patch.description, due_date: patch.dueDate, priority: patch.priority, progress: patch.progress } })}
                onDelete={(taskId) => removeGoalTask.mutate(taskId)}
                onPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
                onAdd={(payload) => createGoalTask.mutate({ goal_id: selected.id, title: payload.title, description: payload.description, due_date: payload.dueDate ?? null, priority: payload.priority ?? null, status: payload.status, progress: 0 })}
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
          const patch = {
            name: payload.title,
            description: payload.description,
            type: payload.type,
            category: payload.category,
            priority: payload.priority ?? null,
            deadline: payload.deadline ?? null,
            progress: payload.progress,
            streak: payload.streak ?? 0,
            archived: payload.archived,
            emoji: payload.emoji,
            completed_at: payload.completedAt ?? null,
          };
          if (goalModal?.goal) updateGoal.mutate({ id: goalModal.goal.id, patch });
          else createGoal.mutate(patch);
          setGoalModal(null);
        }}
      />
      <ConfirmDelete open={!!deleteGoalId} onClose={() => setDeleteGoalId(null)} onConfirm={() => { if (deleteGoalId) removeGoal.mutate(deleteGoalId); setDeleteGoalId(null); }} label="ten cel" />
      <CategoryManagerModal open={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={goalCategories} onAdd={(name) => setExtraCategories((items) => items.includes(name) ? items : [...items, name])} onDelete={(name) => setExtraCategories((items) => items.filter((item) => item !== name))} />
    </PageLayout>
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

function GoalDetailHeader({ goal, onEdit, onToggleDone, onDelete }: { goal: Goal; onEdit: () => void; onToggleDone: () => void; onDelete: () => void }) {
  return (
    <header className="goals-detail-header">
      <div>
        <h2>{goal.title}</h2>
        <p>{goal.description || 'Rozbij cel na małe, powtarzalne kroki.'}</p>
        <div className="goals-tree-meta">
          <span><GoalIcon name="target" /> {goalStatus(goal).label}</span>
          <span><GoalIcon name="calendar" /> {relativeDateLabel(goal.deadline)}</span>
          <span><GoalIcon name="flame" /> {goal.streak ?? 0} dni</span>
        </div>
      </div>
      <div className="goals-detail-actions">
        <button className="btn btn-secondary btn-sm" type="button" onClick={onEdit}>Edytuj cel</button>
        <button className="btn btn-secondary btn-sm goals-delete-goal" type="button" onClick={onDelete}><IcoTrash /> Usuń cel</button>
        <MoreMenu actions={[
          { label: goal.completedAt ? 'Otwórz ponownie' : 'Oznacz jako ukończony', onClick: onToggleDone },
          { label: 'Usuń cel', onClick: onDelete, danger: true },
        ]} />
      </div>
    </header>
  );
}

function GoalActionsPanel({ goal, onUpdate, onDelete, onPlanner, onAdd }: {
  goal: Goal;
  onUpdate: (taskId: string, patch: Partial<GoalTask>) => void;
  onDelete: (taskId: string) => void;
  onPlanner: (task: GoalTask) => void;
  onAdd: (payload: Omit<GoalTask, 'id' | 'goalId' | 'subtasks' | 'progress'>) => void;
}) {
  const tasks = collectTasks(goal.tasks);
  const openTasks = tasks.filter((task) => task.status !== 'done').length;

  return (
    <section className="card goals-actions-card">
      <div className="card-head">
        <div>
          <span className="card-title">Działania celu</span>
          <span className="goals-collapsed-summary">{openTasks} otwarte · {tasks.length} wszystkich</span>
        </div>
      </div>
      <GoalTaskTree
        tasks={goal.tasks}
        goalId={goal.id}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onPlanner={onPlanner}
      />
      <NewGoalTaskForm onAdd={onAdd} />
    </section>
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
  const [expanded, setExpanded] = useState(false);
  const fallback = [
    { title: 'Start', dueDate: goal.createdAt.split('T')[0], progress: 100, completed: true },
    { title: goalNextStep(goal) ?? 'Następny krok', dueDate: todayStr(), progress: goal.progress, completed: false },
    { title: 'Kontrola postępu', dueDate: goal.deadline ? addDays(goal.deadline, -14) : undefined, progress: Math.min(goal.progress, 80), completed: false },
    { title: 'Finalizacja', dueDate: goal.deadline, progress: goal.progress >= 100 ? 100 : 0, completed: goal.progress >= 100 },
  ];
  const milestones = goal.milestones.length > 0
    ? goal.milestones.map((milestone) => ({ title: milestone.title, dueDate: milestone.dueDate, progress: milestone.progress, completed: milestone.completed }))
    : fallback;
  const doneCount = milestones.filter((milestone) => milestone.completed).length;

  useEffect(() => setExpanded(false), [goal.id]);

  return (
    <section className={`card goals-roadmap-card ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="card-head">
        <div>
          <span className="card-title">Roadmapa celu</span>
          <span className="goals-collapsed-summary">{doneCount}/{milestones.length} kamieni milowych · {goalStatus(goal).label}</span>
        </div>
        <button className="goals-collapse-btn" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Zwiń' : 'Rozwiń'} <IcoChevRight />
        </button>
      </div>
      {expanded && <div className="goals-roadmap-track">
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
      </div>}
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
  const [expanded, setExpanded] = useState(false);
  const start = mondayOf(todayStr());
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const weekTasks = tasks.filter((task) => task.dueDate && task.dueDate >= days[0] && task.dueDate <= days[6]);
  const fallbackTasks = tasks.filter((task) => task.status !== 'done').slice(0, 7);
  const plannedCount = weekTasks.length || fallbackTasks.length;
  const activeTodayCount = todayTasks.filter((task) => task.status !== 'done').length;

  useEffect(() => setExpanded(false), [goal.id]);

  return (
    <section className={`card goals-week-card ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="card-head">
        <div>
          <span className="card-title">Plan na ten tydzień</span>
          <span className="goals-collapsed-summary">{plannedCount} działań · dzisiaj {activeTodayCount} aktywne</span>
        </div>
        <button className="goals-collapse-btn" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Zwiń' : 'Rozwiń'} <IcoChevRight />
        </button>
      </div>
      {expanded && (
        <>
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
              <strong>{activeTodayCount} aktywne działania</strong>
            </div>
            {todayTasks[0] && <button className="btn btn-secondary btn-sm" type="button" onClick={() => onPlanner(todayTasks[0])}><GoalIcon name="calendar" /> Dodaj do Planera</button>}
          </div>
        </>
      )}
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
