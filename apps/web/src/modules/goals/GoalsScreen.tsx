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
import type { Goal as GoalRow, GoalAction, GoalActionNode, GoalActionPriority, GoalActionStatus, GoalTask as GoalTaskRow, Milestone as MilestoneRow } from '@/features/goals/types';
import { buildGoalActionTree, getActionBreadcrumb } from '@/features/goals/utils/buildGoalActionTree';
import { getVisualCompletionState } from '@/features/goals/utils/goalActionProgress';

type Priority = 'low' | 'mid' | 'high';
type TaskStatus = 'todo' | 'active' | 'waiting' | 'done' | 'blocked';
type GoalType = 'simple' | 'project';

interface GoalTask {
  id: string; goalId: string; parentTaskId?: string;
  title: string; description: string; dueDate?: string;
  priority?: Priority; status: TaskStatus; progress: number;
  sortOrder?: number; createdAt?: string; updatedAt?: string;
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
const GOAL_FOLDER_MARKER = '[rootine-folder]';
const GOAL_EMOJI_FALLBACK = '🎯';

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

function isGoalFolder(task: GoalTask): boolean {
  return task.description.includes(GOAL_FOLDER_MARKER);
}

function taskDescription(description: string, folder: boolean) {
  const clean = description.replace(GOAL_FOLDER_MARKER, '').trim();
  return folder ? `${GOAL_FOLDER_MARKER}${clean ? ` ${clean}` : ''}` : clean;
}

function descendantsOf(task: GoalTask): Set<string> {
  return new Set(collectTasks(task.subtasks).map((item) => item.id));
}

function findTask(tasks: GoalTask[], id: string): GoalTask | null {
  for (const task of tasks) {
    if (task.id === id) return task;
    const nested = findTask(task.subtasks, id);
    if (nested) return nested;
  }
  return null;
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

function normalizeGoalEmoji(emoji?: string | null): string {
  const value = emoji?.trim();
  if (!value || value.toLowerCase() === 'target') return GOAL_EMOJI_FALLBACK;
  return value;
}

function buildGoalTaskTree(rows: GoalTaskRow[], goalId: string, parentTaskId: string | null = null): GoalTask[] {
  return rows
    .filter((task) => task.goal_id === goalId && task.parent_task_id === parentTaskId)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.created_at.localeCompare(b.created_at))
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
      sortOrder: task.sort_order ?? 0,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
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
    progress: row.progress ?? 0,
    streak: row.streak ?? 0,
    tasks: buildGoalTaskTree(taskRows, row.id),
    milestones: milestoneRows.filter((milestone) => milestone.goal_id === row.id).map(mapMilestone),
    archived: row.archived,
    emoji: normalizeGoalEmoji(row.emoji),
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

function GoalIcon({ name }: { name: 'target' | 'calendar' | 'flame' | 'clock' | 'gear' | 'repeat' | 'folder' | 'folder-open' | 'task' }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'target' && <><circle cx="12" cy="12" r="9" {...c} /><circle cx="12" cy="12" r="5" {...c} /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...c} /><path d="M8 3v4M16 3v4M4 10h16" {...c} /></>}
      {name === 'clock' && <><circle cx="12" cy="12" r="8.5" {...c} /><path d="M12 7v5l3 2" {...c} /></>}
      {name === 'flame' && <path d="M12 2c1 3-1 4-2 6-1 1.6-.5 3 1 3 1.2 0 2-1 2-2 1.5 1 3 2.8 3 5a6 6 0 1 1-12 0c0-2 1-3.7 2.5-5C8 12 9 9 12 2z" fill="currentColor" stroke="none" />}
      {name === 'gear' && <><circle cx="12" cy="12" r="3" {...c} /><path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.2-2-3.4-2.3.7a8 8 0 0 0-1.7-1l-.3-2.4H9.9l-.3 2.4a8 8 0 0 0-1.7 1l-2.3-.7-2 3.4L5.6 11a7.97 7.97 0 0 0 0 2l-2 1.2 2 3.4 2.3-.7c.5.4 1.1.8 1.7 1l.3 2.4h4.2l.3-2.4c.6-.2 1.2-.6 1.7-1l2.3.7 2-3.4-2-1.2z" {...c} /></>}
      {name === 'repeat' && <><path d="m17 1 4 4-4 4" {...c} /><path d="M3 11V9a4 4 0 0 1 4-4h14" {...c} /><path d="m7 23-4-4 4-4" {...c} /><path d="M21 13v2a4 4 0 0 1-4 4H3" {...c} /></>}
      {name === 'folder' && <path d="M3.8 6.8a2 2 0 0 1 2-2h4.3l2 2.3h6.1a2 2 0 0 1 2 2v8.1a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2Z" {...c} />}
      {name === 'folder-open' && <><path d="M3.8 8.8v-2a2 2 0 0 1 2-2h4.3l2 2.3h6.1a2 2 0 0 1 2 2v1.1" {...c} /><path d="M4.8 19.2h13.6a2 2 0 0 0 1.9-1.4l1.6-5.2a1.4 1.4 0 0 0-1.3-1.8H7.1a2 2 0 0 0-1.9 1.4l-1.7 5.2a1.4 1.4 0 0 0 1.3 1.8Z" {...c} /></>}
      {name === 'task' && <><rect x="4.5" y="4" width="15" height="16" rx="2.2" {...c} /><path d="M8.2 9.2h7.6M8.2 13h7.6M8.2 16.8h4.4" {...c} /></>}
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

  const goals = useMemo(
    () => (goalsQuery.data ?? []).map((goal) => mapGoal(goal, tasksQuery.data ?? [], milestonesQuery.data ?? [])),
    [goalsQuery.data, milestonesQuery.data, tasksQuery.data],
  );
  const goalCategories = useMemo(() => {
    const categories = [...DEFAULT_GOAL_CATEGORIES, ...extraCategories, ...goals.map((goal) => goal.category)].filter(Boolean);
    return Array.from(new Set(categories));
  }, [extraCategories, goals]);

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
                <span className="goals-folder-icon"><GoalIcon name="target" /></span>
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

          <button className="goals-archive-link" type="button">
            <GoalIcon name="calendar" /> Archiwalne cele <IcoChevRight />
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
                onNest={(taskId, parentTaskId) => updateGoalTask.mutate({ id: taskId, patch: { parent_task_id: parentTaskId } })}
                onAdd={(payload) => createGoalTask.mutate({ goal_id: selected.id, parent_task_id: payload.parentTaskId ?? null, title: payload.title, description: payload.description, due_date: payload.dueDate ?? null, priority: payload.priority ?? null, status: payload.status, progress: 0, sort_order: payload.sortOrder ?? 0 })}
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

export function GoalTaskTreeNested({ tasks, allTasks, draggedId, onDragStart, onDragEnd, onNest, onUpdate, onDelete, onPlanner, depth = 0 }: {
  tasks: GoalTask[];
  allTasks: GoalTask[];
  draggedId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onNest: (taskId: string, parentTaskId: string | null) => void;
  onUpdate: (taskId: string, patch: Partial<GoalTask>) => void;
  onDelete: (taskId: string) => void;
  onPlanner: (task: GoalTask) => void;
  depth?: number;
}) {
  if (tasks.length === 0 && depth === 0) return <div className="goals-muted">Brak działań. Dodaj pierwszy krok albo folder pod celem.</div>;
  return (
    <div className={depth === 0 ? 'goals-task-tree' : 'goals-task-children'}>
      {tasks.map((task) => {
        const folder = isGoalFolder(task);
        return (
          <div key={task.id} className="goals-task-node">
            <div
              className={`goals-task-row${task.status === 'done' ? ' is-done' : ''}${folder ? ' is-folder' : ''}${draggedId && draggedId !== task.id ? ' is-drop-target' : ''}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', task.id);
                event.dataTransfer.effectAllowed = 'move';
                onDragStart(task.id);
              }}
              onDragEnd={onDragEnd}
              onDragOver={(event) => {
                if (!draggedId || draggedId === task.id) return;
                const dragged = findTask(allTasks, draggedId);
                if (dragged && descendantsOf(dragged).has(task.id)) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData('text/plain') || draggedId;
                if (!id || id === task.id) return;
                const dragged = findTask(allTasks, id);
                if (dragged && descendantsOf(dragged).has(task.id)) return;
                onNest(id, task.id);
                onDragEnd();
              }}
              style={{ paddingLeft: depth ? 8 : undefined }}
            >
              <button className="goals-task-check" type="button" onClick={() => !folder && onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} aria-label="Zmień status">
                {folder ? <GoalIcon name={task.subtasks.length ? 'folder-open' : 'folder'} /> : task.status === 'done' && <IcoCheck />}
              </button>
              <span className="goals-task-title">{task.title}</span>
              {!folder && task.priority && <PriorityBadge priority={task.priority} />}
              {!folder && <span className="goals-task-date">{relativeDateLabel(task.dueDate)}</span>}
              {!folder && <button className="icon-btn" type="button" onClick={() => onPlanner(task)} aria-label="Dodaj do Planera"><GoalIcon name="calendar" /></button>}
              {task.parentTaskId && <button className="icon-btn" type="button" onClick={() => onNest(task.id, null)} aria-label="Przenieś na poziom celu"><GoalIcon name="folder" /></button>}
              <button className="icon-btn" type="button" onClick={() => onDelete(task.id)} aria-label="Usuń działanie"><IcoTrash /></button>
            </div>
            {task.subtasks.length > 0 && (
              <GoalTaskTreeNested tasks={task.subtasks} allTasks={allTasks} draggedId={draggedId} onDragStart={onDragStart} onDragEnd={onDragEnd} onNest={onNest} onUpdate={onUpdate} onDelete={onDelete} onPlanner={onPlanner} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GoalTaskFormNested({ tasks, onAdd }: { tasks: GoalTask[]; onAdd: (payload: Omit<GoalTask, 'id' | 'goalId' | 'subtasks' | 'progress'>) => void }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('mid');
  const [parentTaskId, setParentTaskId] = useState('');
  const [kind, setKind] = useState<'task' | 'folder'>('task');
  const flatTasks = collectTasks(tasks);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      parentTaskId: parentTaskId || undefined,
      description: taskDescription('', kind === 'folder'),
      dueDate: kind === 'folder' ? undefined : dueDate || undefined,
      priority: kind === 'folder' ? undefined : priority,
      status: 'todo',
    });
    setTitle('');
    setDueDate('');
    setPriority('mid');
  }

  return (
    <form className="goals-add-task-row goals-add-task-row-nested" onSubmit={submit}>
      <select className="input" value={kind} onChange={(event) => setKind(event.target.value as 'task' | 'folder')} aria-label="Typ wpisu">
        <option value="task">Działanie</option>
        <option value="folder">Folder</option>
      </select>
      <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'folder' ? 'Nazwa folderu' : 'Dodaj działanie'} />
      <select className="input" value={parentTaskId} onChange={(event) => setParentTaskId(event.target.value)} aria-label="Folder nadrzędny">
        <option value="">Poziom celu</option>
        {flatTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
      </select>
      <input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={kind === 'folder'} />
      <select className="input" value={priority} onChange={(event) => setPriority(event.target.value as Priority)} disabled={kind === 'folder'}>
        <option value="low">Niski</option>
        <option value="mid">Średni</option>
        <option value="high">Wysoki</option>
      </select>
      <button className="btn btn-secondary btn-sm" type="submit"><IcoPlus /> Dodaj</button>
    </form>
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

function taskPriorityToAction(priority?: Priority): GoalActionPriority {
  if (priority === 'low') return 'low';
  if (priority === 'high') return 'high';
  return 'medium';
}

function actionPriorityToTask(priority: GoalActionPriority): Priority {
  if (priority === 'low') return 'low';
  if (priority === 'high') return 'high';
  return 'mid';
}

function taskStatusToAction(status: TaskStatus): GoalActionStatus {
  if (status === 'done' || status === 'active' || status === 'blocked') return status;
  return 'todo';
}

function actionStatusToTask(status: GoalActionStatus): TaskStatus {
  return status;
}

function goalTaskToAction(task: GoalTask): GoalAction {
  const updatedAt = task.updatedAt ?? new Date().toISOString();
  return {
    id: task.id,
    goalId: task.goalId,
    parentId: task.parentTaskId ?? null,
    title: task.title,
    description: task.description,
    status: taskStatusToAction(task.status),
    priority: taskPriorityToAction(task.priority),
    dueDate: task.dueDate ?? null,
    sortOrder: task.sortOrder ?? 0,
    createdAt: task.createdAt ?? updatedAt,
    updatedAt,
    completedAt: task.status === 'done' ? updatedAt : null,
  };
}

function statusLabel(status: GoalActionStatus) {
  if (status === 'active') return 'Aktywne';
  if (status === 'done') return 'Ukończone';
  if (status === 'blocked') return 'Zablokowane';
  return 'Do zrobienia';
}

function priorityLabel(priority: GoalActionPriority) {
  if (priority === 'low') return 'Niski';
  if (priority === 'high') return 'Wysoki';
  return 'Średni';
}

function nextStatusAfterToggle(status: GoalActionStatus): GoalActionStatus {
  if (status === 'blocked') return 'blocked';
  return status === 'done' ? 'todo' : 'done';
}

function InlineGoalActionInput({ depth, placeholder, onCancel, onSave }: {
  depth: number;
  placeholder: string;
  onCancel: () => void;
  onSave: (title: string) => void;
}) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onSave(trimmed);
  }

  return (
    <div className="goal-action-row is-editing" style={{ '--depth': depth } as React.CSSProperties}>
      <span className="goal-action-chevron-spacer" />
      <span className="goal-action-status is-empty" aria-hidden="true" />
      <input
        ref={inputRef}
        className="goal-action-inline-input"
        value={title}
        placeholder={placeholder}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') save();
          if (event.key === 'Escape') onCancel();
        }}
      />
    </div>
  );
}

function GoalActionRow({ node, selectedId, expandedIds, editingId, onToggleExpanded, onSelect, onToggleStatus, onAddChild, onEdit, onRename, onSetStatus, onDelete, onPlanner }: {
  node: GoalActionNode;
  selectedId: string | null;
  expandedIds: Set<string>;
  editingId: string | null;
  onToggleExpanded: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleStatus: (node: GoalActionNode) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (id: string | null) => void;
  onRename: (id: string, title: string) => void;
  onSetStatus: (id: string, status: GoalActionStatus) => void;
  onDelete: (id: string) => void;
  onPlanner: (action: GoalAction) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const visualState = getVisualCompletionState(node);
  const [draft, setDraft] = useState(node.title);

  useEffect(() => setDraft(node.title), [node.title, editingId]);

  function saveRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== node.title) onRename(node.id, trimmed);
    else onEdit(null);
  }

  return (
    <div className={`goal-action-node depth-${Math.min(node.depth, 5)}`}>
      <div
        className={`goal-action-row${selectedId === node.id ? ' is-selected' : ''}${node.status === 'done' ? ' is-done' : ''}${node.depth >= 4 ? ' is-deep' : ''}`}
        style={{ '--depth': node.depth } as React.CSSProperties}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button className="goal-action-chevron" type="button" onClick={(event) => { event.stopPropagation(); onToggleExpanded(node.id); }} aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'} aria-expanded={isExpanded}>
            <IcoChevRight />
          </button>
        ) : <span className="goal-action-chevron-spacer" />}
        <button
          type="button"
          className={`goal-action-status is-${visualState}`}
          onClick={(event) => { event.stopPropagation(); onToggleStatus(node); }}
          aria-label="Zmień status"
        >
          {visualState === 'done' && <IcoCheck />}
        </button>
        {editingId === node.id ? (
          <input
            className="goal-action-inline-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onBlur={saveRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveRename();
              if (event.key === 'Escape') onEdit(null);
            }}
            autoFocus
          />
        ) : (
          <span className="goal-action-title" onDoubleClick={(event) => { event.stopPropagation(); onEdit(node.id); }}>{node.title}</span>
        )}
        {hasChildren && <span className="goal-action-progress">{node.progress.done}/{node.progress.total}</span>}
        <span className={`goal-action-priority is-${node.priority}`}>{priorityLabel(node.priority)}</span>
        <span className="goal-action-date"><GoalIcon name="calendar" /> {relativeDateLabel(node.dueDate ?? undefined)}</span>
        <MoreMenu actions={[
          { label: 'Zmień nazwę', onClick: () => onEdit(node.id) },
          { label: 'Dodaj poddziałanie', onClick: () => onAddChild(node.id) },
          { label: node.status === 'blocked' ? 'Odblokuj' : 'Zablokuj', onClick: () => onSetStatus(node.id, node.status === 'blocked' ? 'todo' : 'blocked') },
          { label: 'Dodaj do Planera', onClick: () => onPlanner(node) },
          { label: 'Usuń', onClick: () => onDelete(node.id), danger: true },
        ]} />
      </div>
      {hasChildren && isExpanded && (
        <div className="goal-action-children">
          {node.children.map((child) => (
            <GoalActionRow
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              editingId={editingId}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
              onToggleStatus={onToggleStatus}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRename={onRename}
              onSetStatus={onSetStatus}
              onDelete={onDelete}
              onPlanner={onPlanner}
            />
          ))}
          <button className="goal-action-add-child" type="button" style={{ '--depth': node.depth + 1 } as React.CSSProperties} onClick={() => onAddChild(node.id)}>
            <IcoPlus /> Dodaj poddziałanie
          </button>
        </div>
      )}
    </div>
  );
}

function GoalActionDetailsPanel({ action, actionsById, onAddChild, onEdit }: {
  action: GoalAction | null;
  actionsById: Map<string, GoalAction>;
  onAddChild: (parentId: string) => void;
  onEdit: (id: string) => void;
}) {
  if (!action) {
    return (
      <aside className="goal-action-details-panel is-empty">
        <span className="eyebrow">Szczegóły</span>
        <p>Wybierz działanie, aby zobaczyć status, termin, priorytet i ścieżkę.</p>
      </aside>
    );
  }

  const breadcrumb = getActionBreadcrumb(action.id, actionsById);

  return (
    <aside className="goal-action-details-panel">
      <span className="eyebrow">Szczegóły</span>
      <h3>{action.title}</h3>
      <div className="goal-action-detail-grid">
        <span>Status</span><strong>{statusLabel(action.status)}</strong>
        <span>Termin</span><strong>{relativeDateLabel(action.dueDate ?? undefined)}</strong>
        <span>Priorytet</span><strong>{priorityLabel(action.priority)}</strong>
        <span>Ścieżka</span><strong>{breadcrumb.map((item) => item.title).join(' > ')}</strong>
      </div>
      {action.description && <p className="goal-action-note">{action.description}</p>}
      <div className="goal-action-detail-actions">
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => onAddChild(action.id)}><IcoPlus /> Dodaj poddziałanie</button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => onEdit(action.id)}>Edytuj</button>
      </div>
    </aside>
  );
}

function GoalActionsPanel({ goal, onUpdate, onDelete, onPlanner, onNest: _onNest, onAdd }: {
  goal: Goal;
  onUpdate: (taskId: string, patch: Partial<GoalTask>) => void;
  onDelete: (taskId: string) => void;
  onPlanner: (task: GoalTask) => void;
  onNest: (taskId: string, parentTaskId: string | null) => void;
  onAdd: (payload: Omit<GoalTask, 'id' | 'goalId' | 'subtasks' | 'progress'>) => void;
}) {
  const flatTasks = useMemo(() => collectTasks(goal.tasks), [goal.tasks]);
  const actions = useMemo(() => flatTasks.map(goalTaskToAction), [flatTasks]);
  const tree = useMemo(() => buildGoalActionTree(actions), [actions]);
  const actionsById = useMemo(() => new Map(actions.map((action) => [action.id, action])), [actions]);
  const openTasks = actions.filter((task) => task.status !== 'done').length;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [creatingParentId, setCreatingParentId] = useState<string | null | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const key = `rootine:goal-actions-expanded:${goal.id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setExpandedIds(new Set(JSON.parse(saved) as string[]));
      else setExpandedIds(new Set(actions.filter((action) => action.parentId === null).map((action) => action.id)));
    } catch {
      setExpandedIds(new Set(actions.filter((action) => action.parentId === null).map((action) => action.id)));
    }
    setSelectedActionId(null);
    setCreatingParentId(undefined);
    setEditingId(null);
  }, [goal.id]);

  useEffect(() => {
    const key = `rootine:goal-actions-expanded:${goal.id}`;
    localStorage.setItem(key, JSON.stringify([...expandedIds]));
  }, [expandedIds, goal.id]);

  useEffect(() => {
    if (actions.length === 0) return;
    setExpandedIds((prev) => prev.size ? prev : new Set(actions.filter((action) => action.parentId === null).map((action) => action.id)));
  }, [actions]);

  useEffect(() => {
    if (selectedActionId && !actionsById.has(selectedActionId)) setSelectedActionId(null);
  }, [actionsById, selectedActionId]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startCreate(parentId: string | null) {
    setCreatingParentId(parentId);
    if (parentId) setExpandedIds((prev) => new Set(prev).add(parentId));
  }

  function addInline(parentId: string | null, title: string) {
    const siblings = actions.filter((action) => action.parentId === parentId);
    onAdd({
      title,
      parentTaskId: parentId ?? undefined,
      description: '',
      dueDate: undefined,
      priority: 'mid',
      status: 'todo',
      sortOrder: siblings.length + 1,
    });
    setCreatingParentId(undefined);
  }

  function updateAction(id: string, patch: Partial<GoalAction>) {
    onUpdate(id, {
      title: patch.title,
      description: patch.description,
      dueDate: patch.dueDate ?? undefined,
      priority: patch.priority ? actionPriorityToTask(patch.priority) : undefined,
      status: patch.status ? actionStatusToTask(patch.status) : undefined,
    });
  }

  function actionToTask(action: GoalAction): GoalTask {
    return {
      id: action.id,
      goalId: action.goalId,
      parentTaskId: action.parentId ?? undefined,
      title: action.title,
      description: action.description ?? '',
      dueDate: action.dueDate ?? undefined,
      priority: actionPriorityToTask(action.priority),
      status: actionStatusToTask(action.status),
      progress: 0,
      sortOrder: action.sortOrder,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
      subtasks: [],
    };
  }

  const selectedAction = selectedActionId ? actionsById.get(selectedActionId) ?? null : null;

  return (
    <section className="card goals-actions-card goal-actions-section">
      <div className="card-head">
        <div>
          <span className="card-title">Działania celu</span>
          <span className="goals-collapsed-summary">{actions.length} działań · {openTasks} aktywnych · {actions.length - openTasks} ukończone</span>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => startCreate(null)}><IcoPlus /> Dodaj działanie</button>
      </div>
      <div className="goal-actions-layout">
        <div className="goal-actions-tree">
          {actions.length === 0 ? (
            <div className="goal-actions-empty">
              <strong>Nie ma jeszcze działań dla tego celu.</strong>
              <span>Rozbij cel na pierwszy konkretny krok.</span>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => startCreate(null)}><IcoPlus /> Dodaj pierwsze działanie</button>
            </div>
          ) : (
            <>
              {tree.map((node) => (
                <GoalActionRow
                  key={node.id}
                  node={node}
                  selectedId={selectedActionId}
                  expandedIds={expandedIds}
                  editingId={editingId}
                  onToggleExpanded={toggleExpanded}
                  onSelect={setSelectedActionId}
                  onToggleStatus={(item) => updateAction(item.id, { status: nextStatusAfterToggle(item.status) })}
                  onAddChild={startCreate}
                  onEdit={setEditingId}
                  onRename={(id, title) => { updateAction(id, { title }); setEditingId(null); }}
                  onSetStatus={(id, status) => updateAction(id, { status })}
                  onDelete={onDelete}
                  onPlanner={(action) => onPlanner(actionToTask(action))}
                />
              ))}
              {creatingParentId === null && (
                <InlineGoalActionInput depth={0} placeholder="Wpisz nazwę działania..." onCancel={() => setCreatingParentId(undefined)} onSave={(title) => addInline(null, title)} />
              )}
            </>
          )}
          {creatingParentId && (
            <InlineGoalActionInput
              depth={actionsById.has(creatingParentId) ? getActionBreadcrumb(creatingParentId, actionsById).length : 1}
              placeholder="Wpisz nazwę poddziałania..."
              onCancel={() => setCreatingParentId(undefined)}
              onSave={(title) => addInline(creatingParentId, title)}
            />
          )}
        </div>
        <GoalActionDetailsPanel action={selectedAction} actionsById={actionsById} onAddChild={startCreate} onEdit={setEditingId} />
      </div>
    </section>
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
