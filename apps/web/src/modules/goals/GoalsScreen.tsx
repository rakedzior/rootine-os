import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, PageHeader, ProgressBar, PriorityBadge, IcoTrash, IcoPlus, IcoCheck, IcoChevRight, IcoMore, IcoEdit } from '@/components/common';
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
import { buildGoalActionTree, canMoveAction, getActionBreadcrumb } from '@/features/goals/utils/buildGoalActionTree';
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
const GOAL_CATEGORIES_KEY = 'rootine:goal-categories';
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
  const [managedCategories, setManagedCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(GOAL_CATEGORIES_KEY);
      if (saved) return JSON.parse(saved) as string[];
    } catch { /* ignore */ }
    return DEFAULT_GOAL_CATEGORIES;
  });

  useEffect(() => {
    try { localStorage.setItem(GOAL_CATEGORIES_KEY, JSON.stringify(managedCategories)); } catch { /* ignore */ }
  }, [managedCategories]);

  const goals = useMemo(
    () => (goalsQuery.data ?? []).map((goal) => mapGoal(goal, tasksQuery.data ?? [], milestonesQuery.data ?? [])),
    [goalsQuery.data, milestonesQuery.data, tasksQuery.data],
  );
  const goalCategories = useMemo(() => {
    const used = goals.map((goal) => goal.category).filter(Boolean);
    return Array.from(new Set([...managedCategories, ...used]));
  }, [managedCategories, goals]);

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setManagedCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  const renameCategory = (oldName: string, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === oldName) return;
    setManagedCategories((prev) => Array.from(new Set(prev.map((cat) => (cat === oldName ? trimmed : cat)))));
    goals.filter((goal) => goal.category === oldName).forEach((goal) => updateGoal.mutate({ id: goal.id, patch: { category: trimmed } }));
  };

  const deleteCategory = (name: string) => {
    const fallback = managedCategories.find((cat) => cat !== name) ?? 'Osobiste';
    setManagedCategories((prev) => prev.filter((cat) => cat !== name));
    goals.filter((goal) => goal.category === name).forEach((goal) => updateGoal.mutate({ id: goal.id, patch: { category: fallback } }));
  };

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
        </>}
      />}
    >

      <div className="goals-os">
        <section className="card goals-command-panel">
          <div className="goals-folder-list">
            {activeGoals.length === 0 ? (
              <EmptyState title="Brak celów" desc="Dodaj pierwszy cel, aby zacząć rozbijać go na działania." />
            ) : activeGoals.map((goal) => (
              <div key={goal.id} role="button" tabIndex={0} className={`goals-folder-row${goal.id === selected?.id ? ' is-active' : ''}`} onClick={() => setSelectedId(goal.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedId(goal.id); }}>
                <span className="goals-folder-icon"><GoalIcon name="target" /></span>
                <span className="goals-folder-main">
                  <strong>{goal.title}</strong>
                  <small>{goal.category}</small>
                  <ProgressBar value={goal.progress} size="sm" />
                </span>
                <span className="goals-folder-pct">{goal.progress}%</span>
                <span className="goals-folder-actions" onClick={(event) => event.stopPropagation()}>
                  <MoreMenu actions={[
                    { label: 'Edytuj', onClick: () => setGoalModal({ goal }) },
                    { label: goal.completedAt ? 'Otwórz ponownie' : 'Oznacz jako ukończony', onClick: () => updateGoal.mutate({ id: goal.id, patch: { completed_at: goal.completedAt ? null : new Date().toISOString(), progress: goal.completedAt ? goal.progress : 100 } }) },
                    { label: 'Usuń', onClick: () => setDeleteGoalId(goal.id), danger: true },
                  ]} />
                </span>
              </div>
            ))}
          </div>

          <button className="goals-archive-link" type="button">
            <GoalIcon name="calendar" /> Archiwalne cele <IcoChevRight />
          </button>
        </section>

        <main className="goals-main-stage">
          {selected ? (
            <>
              <GoalRoadmap goal={selected} />
              <GoalWeekPlan
                goal={selected}
                tasks={selectedTasks}
                todayTasks={todayTasks}
                onToggle={(task) => updateGoalTask.mutate({ id: task.id, patch: { status: task.status === 'done' ? 'todo' : 'done' } })}
                onReschedule={(task, dueDate) => updateGoalTask.mutate({ id: task.id, patch: { due_date: dueDate } })}
                onPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
              />
              <GoalActionsPanel
                goal={selected}
                onUpdate={(taskId, patch) => updateGoalTask.mutate({ id: taskId, patch: { status: patch.status, title: patch.title, description: patch.description, due_date: patch.dueDate, priority: patch.priority, progress: patch.progress } })}
                onDelete={(taskId) => removeGoalTask.mutate(taskId)}
                onPlanner={(task) => addPlanner(task.title, task.dueDate, task.priority)}
                onNest={(taskId: string, parentTaskId: string | null, sortOrder?: number) => updateGoalTask.mutate({ id: taskId, patch: { parent_task_id: parentTaskId, sort_order: sortOrder } })}
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
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
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
    </PageLayout>
  );
}

export function GoalTaskTreeNested({ tasks, allTasks, draggedId, onDragStart, onDragEnd, onNest, onUpdate, onDelete, onPlanner, depth = 0 }: {
  tasks: GoalTask[];
  allTasks: GoalTask[];
  draggedId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onNest: (taskId: string, parentTaskId: string | null, sortOrder?: number) => void;
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
      <GoalListSelect value={kind} options={[{ value: 'task', label: 'Działanie' }, { value: 'folder', label: 'Folder' }]} onChange={(value) => setKind(value as 'task' | 'folder')} />
      <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'folder' ? 'Nazwa folderu' : 'Dodaj działanie'} />
      <GoalListSelect
        value={parentTaskId}
        options={[{ value: '', label: 'Poziom celu' }, ...flatTasks.map((task) => ({ value: task.id, label: task.title }))]}
        onChange={setParentTaskId}
      />
      <GoalDeadlineSelect value={dueDate || todayStr()} onChange={setDueDate} disabled={kind === 'folder'} />
      <GoalListSelect
        value={priority}
        options={[{ value: 'low', label: 'Niski' }, { value: 'mid', label: 'Średni' }, { value: 'high', label: 'Wysoki' }]}
        onChange={(value) => setPriority(value as Priority)}
        disabled={kind === 'folder'}
      />
      <button className="btn btn-secondary btn-sm" type="submit"><IcoPlus /> Dodaj</button>
    </form>
  );
}

export function GoalDetailHeader({ goal, onEdit, onToggleDone, onDelete }: { goal: Goal; onEdit: () => void; onToggleDone: () => void; onDelete: () => void }) {
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

function collectActionNodeDescendantIds(node: GoalActionNode): string[] {
  return node.children.flatMap((child) => [child.id, ...collectActionNodeDescendantIds(child)]);
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
      <div className="goal-action-main">
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
    </div>
  );
}

function GoalActionRow({ node, selectedId, expandedIds, editingId, draggingId, dropTargetId, onDragStart, onDragEnd, onDragOverAction, onDropOnAction, onToggleExpanded, onSelect, onToggleStatus, onAddChild, onEdit, onRename }: {
  node: GoalActionNode;
  selectedId: string | null;
  expandedIds: Set<string>;
  editingId: string | null;
  draggingId: string | null;
  dropTargetId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverAction: (targetId: string) => void;
  onDropOnAction: (targetId: string) => void;
  onToggleExpanded: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleStatus: (node: GoalActionNode) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (id: string | null) => void;
  onRename: (id: string, title: string) => void;
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
        className={`goal-action-row${selectedId === node.id ? ' is-selected' : ''}${node.status === 'done' ? ' is-done' : ''}${node.depth >= 4 ? ' is-deep' : ''}${draggingId === node.id ? ' is-dragging' : ''}${dropTargetId === node.id ? ' is-drop-target' : ''}`}
        style={{ '--depth': node.depth } as React.CSSProperties}
        draggable={editingId !== node.id}
        onDragStart={(event) => {
          event.stopPropagation();
          event.dataTransfer.setData('text/plain', node.id);
          event.dataTransfer.effectAllowed = 'move';
          onDragStart(node.id);
        }}
        onDragEnd={onDragEnd}
        onDragOver={(event) => {
          if (!draggingId || draggingId === node.id) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          onDragOverAction(node.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDropOnAction(node.id);
        }}
        onClick={() => onSelect(node.id)}
      >
        <div className="goal-action-main">
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
        </div>
        <div className="goal-action-meta">
          <button
            className="goal-action-add-btn"
            type="button"
            aria-label="Dodaj poddziałanie"
            title="Dodaj poddziałanie"
            onClick={(event) => {
              event.stopPropagation();
              onAddChild(node.id);
            }}
          >
            <IcoPlus />
          </button>
          <span className="goal-action-progress">{hasChildren ? `${node.progress.done}/${node.progress.total}` : ''}</span>
          <span className={`goal-action-priority is-${node.priority}`}>{priorityLabel(node.priority)}</span>
          <span className="goal-action-date"><GoalIcon name="calendar" /> {relativeDateLabel(node.dueDate ?? undefined)}</span>
        </div>
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
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOverAction={onDragOverAction}
              onDropOnAction={onDropOnAction}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
              onToggleStatus={onToggleStatus}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type GoalActionEditField = 'title' | 'status' | 'dueDate' | 'priority' | 'path' | 'notes';

function GoalActionDetailsPanel({ action, actions, actionsById, onAddChild, onQuickAdd, onUpdate, onReparent, onDelete, onPlanner }: {
  action: GoalAction | null;
  actions: GoalAction[];
  actionsById: Map<string, GoalAction>;
  onAddChild: (parentId: string) => void;
  onQuickAdd: (parentId: string, title: string) => void;
  onUpdate: (id: string, patch: Partial<GoalAction>) => void;
  onReparent: (id: string, parentId: string | null) => void;
  onDelete: (id: string) => void;
  onPlanner: (action: GoalAction) => void;
}) {
  const [editingField, setEditingField] = useState<GoalActionEditField | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftDate, setDraftDate] = useState(todayStr());

  useEffect(() => { setEditingField(null); }, [action?.id]);

  if (!action) {
    return (
      <aside className="goal-action-details-panel is-empty">
        <span className="eyebrow">Szczegóły</span>
        <p>Wybierz działanie, aby zobaczyć status, termin, priorytet i ścieżkę.</p>
      </aside>
    );
  }

  const current = action;
  const breadcrumb = getActionBreadcrumb(current.id, actionsById);
  const parentOptions = actions.filter((item) => item.id !== current.id && canMoveAction(current.id, item.id, actions));

  function startEdit(field: GoalActionEditField) {
    if (field === 'title') setDraftTitle(current.title);
    if (field === 'notes') setDraftNotes(current.description ?? '');
    if (field === 'dueDate') setDraftDate(current.dueDate ?? todayStr());
    setEditingField(field);
  }

  function saveTitle() {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== current.title) onUpdate(current.id, { title: trimmed });
    setEditingField(null);
  }

  function saveNotes() {
    onUpdate(current.id, { description: draftNotes.trim() });
    setEditingField(null);
  }

  return (
    <aside className="goal-action-details-panel">
      <div className="goal-action-details-head">
        <span className="eyebrow">Szczegóły</span>
        <div className="goal-action-details-tools">
          <button type="button" className="goal-action-tool-btn" onClick={() => onPlanner(current)} title="Dodaj do Planera" aria-label="Dodaj do Planera">
            <GoalIcon name="calendar" />
          </button>
          <button type="button" className="goal-action-tool-btn is-danger" onClick={() => onDelete(current.id)} title="Usuń działanie" aria-label="Usuń działanie">
            <IcoTrash />
          </button>
        </div>
      </div>

      <div className="goal-action-detail-title">
        {editingField === 'title' ? (
          <input
            className="input"
            value={draftTitle}
            autoFocus
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveTitle();
              if (event.key === 'Escape') setEditingField(null);
            }}
          />
        ) : (
          <>
            <h3>{current.title}</h3>
            <button type="button" className="goal-action-edit-btn" onClick={() => startEdit('title')} title="Edytuj nazwę" aria-label="Edytuj nazwę"><IcoEdit /></button>
          </>
        )}
      </div>

      <div className="goal-action-detail-grid">
        <span>Status</span>
        <div className="goal-action-detail-value">
          {editingField === 'status' ? (
            <GoalListSelect
              value={current.status}
              options={[
                { value: 'todo', label: 'Do zrobienia' },
                { value: 'active', label: 'Aktywne' },
                { value: 'done', label: 'Ukończone' },
                { value: 'blocked', label: 'Zablokowane' },
              ]}
              onChange={(value) => { onUpdate(current.id, { status: value as GoalActionStatus }); setEditingField(null); }}
            />
          ) : (
            <>
              <strong>{statusLabel(current.status)}</strong>
              <button type="button" className="goal-action-edit-btn" onClick={() => setEditingField('status')} title="Edytuj status" aria-label="Edytuj status"><IcoEdit /></button>
            </>
          )}
        </div>

        <span>Termin</span>
        <div className="goal-action-detail-value">
          {editingField === 'dueDate' ? (
            <div className="goal-action-edit-date">
              <GoalDeadlineSelect value={draftDate} onChange={(value) => { setDraftDate(value); onUpdate(current.id, { dueDate: value }); }} />
              <div className="goal-action-edit-date-actions">
                <button type="button" className="goal-action-inline-link" onClick={() => { onUpdate(current.id, { dueDate: null }); setEditingField(null); }}>Bez terminu</button>
                <button type="button" className="goal-action-edit-confirm" onClick={() => setEditingField(null)} title="Gotowe" aria-label="Gotowe"><IcoCheck /></button>
              </div>
            </div>
          ) : (
            <>
              <strong>{relativeDateLabel(current.dueDate ?? undefined)}</strong>
              <button type="button" className="goal-action-edit-btn" onClick={() => startEdit('dueDate')} title="Edytuj termin" aria-label="Edytuj termin"><IcoEdit /></button>
            </>
          )}
        </div>

        <span>Priorytet</span>
        <div className="goal-action-detail-value">
          {editingField === 'priority' ? (
            <GoalListSelect
              value={current.priority}
              options={[{ value: 'low', label: 'Niski' }, { value: 'medium', label: 'Średni' }, { value: 'high', label: 'Wysoki' }]}
              onChange={(value) => { onUpdate(current.id, { priority: value as GoalActionPriority }); setEditingField(null); }}
            />
          ) : (
            <>
              <strong>{priorityLabel(current.priority)}</strong>
              <button type="button" className="goal-action-edit-btn" onClick={() => setEditingField('priority')} title="Edytuj priorytet" aria-label="Edytuj priorytet"><IcoEdit /></button>
            </>
          )}
        </div>

        <span>Ścieżka</span>
        <div className="goal-action-detail-value">
          {editingField === 'path' ? (
            <GoalListSelect
              value={current.parentId ?? ''}
              options={[
                { value: '', label: '— Najwyższy poziom' },
                ...parentOptions.map((option) => ({ value: option.id, label: getActionBreadcrumb(option.id, actionsById).map((item) => item.title).join(' › ') })),
              ]}
              onChange={(value) => { onReparent(current.id, value || null); setEditingField(null); }}
            />
          ) : (
            <>
              <strong>{breadcrumb.map((item) => item.title).join(' › ')}</strong>
              <button type="button" className="goal-action-edit-btn" onClick={() => setEditingField('path')} title="Zmień ścieżkę" aria-label="Zmień ścieżkę"><IcoEdit /></button>
            </>
          )}
        </div>
      </div>

      <div className="goal-action-notes">
        <div className="goal-action-notes-head">
          <span className="eyebrow">Notatki</span>
          {editingField !== 'notes' && (
            <button type="button" className="goal-action-edit-btn" onClick={() => startEdit('notes')} title="Edytuj notatki" aria-label="Edytuj notatki"><IcoEdit /></button>
          )}
        </div>
        {editingField === 'notes' ? (
          <textarea
            className="textarea"
            rows={4}
            autoFocus
            value={draftNotes}
            onChange={(event) => setDraftNotes(event.target.value)}
            onBlur={saveNotes}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setEditingField(null);
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) saveNotes();
            }}
            placeholder="Dodaj dodatkowe informacje o tym działaniu..."
          />
        ) : current.description ? (
          <p className="goal-action-note">{current.description}</p>
        ) : (
          <p className="goal-action-note is-empty">Brak notatek. Kliknij ołówek, aby dodać.</p>
        )}
      </div>

      <QuickAddActionBar parentId={current.id} onQuickAdd={onQuickAdd} onDetails={onAddChild} />
    </aside>
  );
}

function QuickAddActionBar({ parentId, onQuickAdd, onDetails }: {
  parentId: string;
  onQuickAdd: (parentId: string, title: string) => void;
  onDetails: (parentId: string) => void;
}) {
  const [title, setTitle] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onQuickAdd(parentId, trimmed);
    setTitle('');
  }

  return (
    <form className="goal-action-quick-add" onSubmit={submit}>
      <input
        className="goal-action-quick-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Dodaj podzadanie..."
        aria-label="Tytuł podzadania"
      />
      <button className="icon-btn" type="button" onClick={() => onDetails(parentId)} aria-label="Dodaj ze szczegółami" title="Dodaj ze szczegółami">
        <GoalIcon name="gear" />
      </button>
    </form>
  );
}

function GoalActionsPanel({ goal, onUpdate, onDelete, onPlanner, onNest, onAdd }: {
  goal: Goal;
  onUpdate: (taskId: string, patch: Partial<GoalTask>) => void;
  onDelete: (taskId: string) => void;
  onPlanner: (task: GoalTask) => void;
  onNest: (taskId: string, parentTaskId: string | null, sortOrder?: number) => void;
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
  const [draggingActionId, setDraggingActionId] = useState<string | null>(null);
  const [dropTargetActionId, setDropTargetActionId] = useState<string | null>(null);

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
    setDraggingActionId(null);
    setDropTargetActionId(null);
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
    const next: Partial<GoalTask> = {};
    if (patch.title !== undefined) next.title = patch.title;
    if (patch.description !== undefined) next.description = patch.description;
    // `null` clears the date; leaving the key absent keeps the current value.
    if ('dueDate' in patch) (next as { dueDate?: string | null }).dueDate = patch.dueDate ?? null;
    if (patch.priority) next.priority = actionPriorityToTask(patch.priority);
    if (patch.status) next.status = actionStatusToTask(patch.status);
    onUpdate(id, next);
  }

  function moveActionToParent(targetId: string) {
    const draggedId = draggingActionId;
    setDraggingActionId(null);
    setDropTargetActionId(null);
    if (!draggedId || draggedId === targetId) return;
    if (!canMoveAction(draggedId, targetId, actions)) return;
    const dragged = actionsById.get(draggedId);
    if (dragged?.parentId === targetId) return;
    const targetChildren = actions.filter((action) => action.parentId === targetId && action.id !== draggedId);
    onNest(draggedId, targetId, targetChildren.length + 1);
    setExpandedIds((prev) => new Set(prev).add(targetId));
    setSelectedActionId(draggedId);
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
        <div className="goals-card-head-title">
          <span className="card-title">Działania celu</span>
          <span className="goals-collapsed-summary">{actions.length} działań · {openTasks} aktywnych · {actions.length - openTasks} ukończone</span>
        </div>
        <div className="goals-card-head-actions">
          <button className="btn btn-primary btn-sm" type="button" onClick={() => startCreate(null)}><IcoPlus /> Dodaj działanie</button>
        </div>
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
                  draggingId={draggingActionId}
                  dropTargetId={dropTargetActionId}
                  onDragStart={(id) => {
                    setDraggingActionId(id);
                    setDropTargetActionId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingActionId(null);
                    setDropTargetActionId(null);
                  }}
                  onDragOverAction={(targetId) => {
                    if (!draggingActionId || draggingActionId === targetId) return;
                    setDropTargetActionId(canMoveAction(draggingActionId, targetId, actions) ? targetId : null);
                  }}
                  onDropOnAction={moveActionToParent}
                  onToggleExpanded={toggleExpanded}
                  onSelect={setSelectedActionId}
                  onToggleStatus={(item) => {
                    if (item.status === 'blocked') return;
                    // Checkbox nadrzędnego działania odzwierciedla stan podzadań, więc przełączamy
                    // względem stanu widocznego i kaskadowo ustawiamy ten sam status na całym poddrzewie:
                    // zaznaczenie → wszystko wykonane, odznaczenie → wszystko niewykonane.
                    const nextStatus: GoalActionStatus = getVisualCompletionState(item) === 'done' ? 'todo' : 'done';
                    updateAction(item.id, { status: nextStatus });
                    collectActionNodeDescendantIds(item).forEach((childId) => updateAction(childId, { status: nextStatus }));
                  }}
                  onAddChild={startCreate}
                  onEdit={setEditingId}
                  onRename={(id, title) => { updateAction(id, { title }); setEditingId(null); }}
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
        <GoalActionDetailsPanel
          action={selectedAction}
          actions={actions}
          actionsById={actionsById}
          onAddChild={startCreate}
          onQuickAdd={addInline}
          onUpdate={updateAction}
          onReparent={(id, parentId) => {
            const siblings = actions.filter((item) => item.parentId === parentId && item.id !== id);
            onNest(id, parentId, siblings.length + 1);
          }}
          onDelete={(id) => { onDelete(id); setSelectedActionId(null); }}
          onPlanner={(item) => onPlanner(actionToTask(item))}
        />
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
        <div className="goals-card-head-title">
          <span className="card-title">Roadmapa celu</span>
          <span className="goals-collapsed-summary">{doneCount}/{milestones.length} kamieni milowych · {goalStatus(goal).label}</span>
        </div>
        <div className="goals-card-head-actions">
          <button className="goals-collapse-btn" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
            {expanded ? 'Zwiń' : 'Rozwiń'} <IcoChevRight />
          </button>
        </div>
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

function GoalWeekPlan({ goal, tasks, todayTasks, onToggle, onReschedule, onPlanner }: {
  goal: Goal;
  tasks: GoalTask[];
  todayTasks: GoalTask[];
  onToggle: (task: GoalTask) => void;
  onReschedule: (task: GoalTask, dueDate: string) => void;
  onPlanner: (task: GoalTask) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const lastDragEndAtRef = useRef(0);
  const start = mondayOf(todayStr());
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const weekTasks = tasks.filter((task) => task.dueDate && task.dueDate >= days[0] && task.dueDate <= days[6]);
  const fallbackTasks = tasks.filter((task) => task.status !== 'done').slice(0, 7);
  const plannedCount = weekTasks.length || fallbackTasks.length;
  const activeTodayCount = todayTasks.filter((task) => task.status !== 'done').length;

  useEffect(() => {
    setExpanded(false);
    setDraggingTaskId(null);
    setDropDate(null);
  }, [goal.id]);

  function dragTask(event: React.DragEvent, task: GoalTask) {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  }

  function dropTaskOnDay(event: React.DragEvent, date: string) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || draggingTaskId;
    const task = id ? tasks.find((item) => item.id === id) : null;
    setDraggingTaskId(null);
    setDropDate(null);
    if (!task || task.dueDate === date) return;
    onReschedule(task, date);
  }

  return (
    <section className={`card goals-week-card ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="card-head">
        <div className="goals-card-head-title">
          <span className="card-title">Plan na ten tydzień</span>
          <span className="goals-collapsed-summary">{plannedCount} działań · dzisiaj {activeTodayCount} aktywne</span>
        </div>
        <div className="goals-card-head-actions">
          <button className="goals-collapse-btn" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
            {expanded ? 'Zwiń' : 'Rozwiń'} <IcoChevRight />
          </button>
        </div>
      </div>
      {expanded && (
        <>
          <div className="goals-week-grid">
            {days.map((date, index) => {
              const dayTasks = weekTasks.filter((task) => task.dueDate === date);
              const suggested = dayTasks.length ? dayTasks : (fallbackTasks[index] ? [fallbackTasks[index]] : []);
              return (
                <div
                  key={date}
                  className={`goals-week-day${date === todayStr() ? ' is-today' : ''}${dropDate === date ? ' is-drop-target' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDropDate(date);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropDate(null);
                  }}
                  onDrop={(event) => dropTaskOnDay(event, date)}
                >
                  <div className="goals-week-day-head">
                    <strong>{weekday(date)}</strong>
                    <span>{shortDate(date)}</span>
                  </div>
                  {suggested.length === 0 ? (
                    <div className="goals-week-empty">Wolne</div>
                  ) : suggested.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={`goals-week-task${task.status === 'done' ? ' is-done' : ''}${draggingTaskId === task.id ? ' is-dragging' : ''}`}
                      draggable
                      onDragStart={(event) => dragTask(event, task)}
                      onDragEnd={() => {
                        lastDragEndAtRef.current = Date.now();
                        setDraggingTaskId(null);
                        setDropDate(null);
                      }}
                      onClick={() => {
                        if (Date.now() - lastDragEndAtRef.current < 250) return;
                        onToggle(task);
                      }}
                      title="Przeciągnij na inny dzień, aby zmienić termin"
                    >
                      <span>{task.title}</span>
                      <small>{task.dueDate ? relativeDateLabel(task.dueDate) : goal.category}</small>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {todayTasks[0] && (
            <div className="goals-week-footer">
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => onPlanner(todayTasks[0])}><GoalIcon name="calendar" /> Dodaj do Planera</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function splitDateParts(value: string) {
  const fallback = new Date();
  const [year, month, day] = value.split('-').map(Number);
  return {
    year: year || fallback.getFullYear(),
    month: month || fallback.getMonth() + 1,
    day: day || fallback.getDate(),
  };
}

const GOAL_MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const GOAL_WEEKDAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

function parseGoalDate(value: string): Date {
  const parts = splitDateParts(value || todayStr());
  return new Date(parts.year, parts.month - 1, parts.day, 12);
}

function GoalDeadlineSelect({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseGoalDate(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    const date = parseGoalDate(value);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function pick(day: number) {
    onChange(toDateStr(new Date(viewYear, viewMonth, day, 12)));
    setOpen(false);
  }

  const first = new Date(viewYear, viewMonth, 1);
  const last = new Date(viewYear, viewMonth + 1, 0);
  const offset = (first.getDay() + 6) % 7;
  const cells: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: last.getDate() }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const selectedIso = toDateStr(selected);
  const todayIso = todayStr();

  return (
    <div className={`goal-date-picker${disabled ? ' is-disabled' : ''}`} ref={ref}>
      <button className="goal-date-trigger" type="button" disabled={disabled} onClick={() => setOpen((prev) => !prev)} aria-haspopup="dialog" aria-expanded={open}>
        <GoalIcon name="calendar" />
        <span>{fmtDate(value || todayIso)}</span>
        <IcoChevRight />
      </button>
      {open && !disabled && (
        <div className="goal-date-panel">
          <div className="goal-date-head">
            <button className="icon-btn" type="button" onClick={() => shiftMonth(-1)} aria-label="Poprzedni miesiąc"><IcoChevRight /></button>
            <strong>{GOAL_MONTHS[viewMonth]} <span>{viewYear}</span></strong>
            <button className="icon-btn" type="button" onClick={() => shiftMonth(1)} aria-label="Następny miesiąc"><IcoChevRight /></button>
          </div>
          <div className="goal-date-weekdays">
            {GOAL_WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="goal-date-grid">
            {cells.map((day, index) => {
              const iso = day ? toDateStr(new Date(viewYear, viewMonth, day, 12)) : '';
              return day ? (
                <button
                  key={iso}
                  type="button"
                  className={`${iso === selectedIso ? 'is-selected' : ''}${iso === todayIso ? ' is-today' : ''}`}
                  onClick={() => pick(day)}
                >
                  {day}
                </button>
              ) : <span key={`empty-${index}`} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GoalFormModal({ open, goal, categories, onAddCategory, onRenameCategory, onDeleteCategory, onClose, onSave }: {
  open: boolean;
  goal: Goal | null;
  categories: string[];
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, nextName: string) => void;
  onDeleteCategory: (name: string) => void;
  onClose: () => void;
  onSave: (payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'milestones'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Osobiste');
  const [priority, setPriority] = useState<Priority>('mid');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? '');
    setDescription(goal?.description ?? '');
    setCategory(goal?.category ?? categories[0] ?? 'Osobiste');
    setPriority(goal?.priority ?? 'mid');
    setDeadline(goal?.deadline ?? '');
    setProgress(goal?.progress ?? 0);
    setStreak(goal?.streak ?? 0);
  }, [categories, goal, open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      type: goal?.type ?? 'project',
      category: category.trim() || 'Osobiste',
      priority,
      deadline: deadline || undefined,
      progress,
      streak,
      archived: goal?.archived ?? false,
      emoji: goal?.emoji ?? GOAL_EMOJI_FALLBACK,
      completedAt: goal?.completedAt,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edytuj cel' : 'Dodaj cel'} size="lg">
      <form className="modal-form goal-form-modal" onSubmit={submit}>
        <Field label="Nazwa celu"><input className="input goal-form-title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Wpisz nazwę celu..." autoFocus /></Field>
        <Field label="Termin końcowy"><GoalDeadlineSelect value={deadline || todayStr()} onChange={setDeadline} /></Field>
        <Field label="Kategoria">
          <CategorySelect
            value={category}
            categories={categories}
            onChange={setCategory}
            onAddCategory={onAddCategory}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </Field>
        <Field label="Priorytet">
          <GoalListSelect
            value={priority}
            options={[{ value: 'low', label: 'Niski' }, { value: 'mid', label: 'Średni' }, { value: 'high', label: 'Wysoki' }]}
            onChange={(value) => setPriority(value as Priority)}
            icon={<GoalIcon name="target" />}
          />
        </Field>
        <Field label={`Postęp (${progress}%)`}>
          <div className="goal-form-progress-row">
            <output>{progress}%</output>
            <input className="goals-range" type="range" min={0} max={100} value={progress} onChange={(event) => setProgress(Number(event.target.value))} />
          </div>
        </Field>
        <Field label="Seria">
          <div className="goal-form-icon-field">
            <GoalIcon name="flame" />
            <input className="input" type="number" min={0} value={streak} onChange={(event) => setStreak(Number(event.target.value))} />
          </div>
        </Field>
        <Field label="Opis"><textarea className="textarea goal-form-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Dodaj opis celu..." /></Field>
        <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={onClose}>Anuluj</button><button className="btn btn-primary" type="submit">Zapisz cel</button></div>
      </form>
    </Modal>
  );
}

function GoalListSelect<T extends string>({ value, options, onChange, icon, disabled = false, placeholder = 'Wybierz' }: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  icon?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={`goal-list-select${disabled ? ' is-disabled' : ''}`} ref={ref}>
      <button type="button" className="input goal-list-trigger" disabled={disabled} onClick={() => setOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={open}>
        {icon && <span className="goal-list-icon">{icon}</span>}
        <span className="goal-list-value">{selected?.label ?? placeholder}</span>
        <span className="goal-list-caret"><IcoChevRight /></span>
      </button>
      {open && !disabled && (
        <div className="goal-list-panel" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`goal-list-option${option.value === value ? ' is-active' : ''}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
              role="option"
              aria-selected={option.value === value}
            >
              <span className="goal-list-check">{option.value === value && <IcoCheck />}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CategorySelect({ value, categories, onChange, onAddCategory, onRenameCategory, onDeleteCategory }: {
  value: string;
  categories: string[];
  onChange: (name: string) => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, nextName: string) => void;
  onDeleteCategory: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setEditing(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function startRename(cat: string) {
    setEditing(cat);
    setEditDraft(cat);
  }

  function commitRename() {
    const trimmed = editDraft.trim();
    if (editing && trimmed && trimmed !== editing) {
      onRenameCategory(editing, trimmed);
      if (value === editing) onChange(trimmed);
    }
    setEditing(null);
  }

  function addNew() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    onChange(trimmed);
    setNewName('');
  }

  return (
    <div className="category-select" ref={ref}>
      <button type="button" className="input category-select-trigger" onClick={() => setOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={open}>
        <GoalIcon name="folder" />
        <span className="category-select-value">{value || 'Wybierz kategorię'}</span>
        <span className="category-select-caret"><IcoChevRight /></span>
      </button>
      {open && (
        <div className="category-select-panel" role="listbox">
          <div className="category-select-list">
            {categories.length === 0 && <p className="category-select-empty">Brak kategorii. Dodaj pierwszą poniżej.</p>}
            {categories.map((cat) => (
              <div className={`category-select-item${cat === value ? ' is-active' : ''}`} key={cat}>
                {editing === cat ? (
                  <input
                    className="input category-select-edit"
                    autoFocus
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') { event.preventDefault(); commitRename(); }
                      if (event.key === 'Escape') setEditing(null);
                    }}
                  />
                ) : (
                  <>
                    <button type="button" className="category-select-name" onClick={() => { onChange(cat); setOpen(false); }}>
                      <span className="category-select-check">{cat === value && <IcoCheck />}</span>
                      <span className="category-select-label">{cat}</span>
                    </button>
                    <span className="category-select-actions">
                      <button type="button" className="category-icon-btn" onClick={() => startRename(cat)} title="Edytuj kategorię" aria-label={`Edytuj kategorię ${cat}`}><IcoEdit /></button>
                      <button type="button" className="category-icon-btn is-danger" onClick={() => { onDeleteCategory(cat); if (value === cat) onChange(categories.find((item) => item !== cat) ?? 'Osobiste'); }} title="Usuń kategorię" aria-label={`Usuń kategorię ${cat}`}><IcoTrash /></button>
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="category-select-add">
            <input
              className="input"
              value={newName}
              placeholder="Nowa kategoria..."
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addNew(); } }}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={addNew} aria-label="Dodaj kategorię"><IcoPlus /></button>
          </div>
        </div>
      )}
    </div>
  );
}
