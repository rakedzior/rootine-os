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
type GoalIconPreset = 'target' | 'book' | 'wallet' | 'heart' | 'briefcase' | 'run' | 'star' | 'flag';

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
const MONTH_FULL = ['Stycze\u0144', 'Luty', 'Marzec', 'Kwiecie\u0144', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpie\u0144', 'Wrzesie\u0144', 'Pa\u017adziernik', 'Listopad', 'Grudzie\u0144'];
const DEFAULT_GOAL_ICONS: Array<{ value: GoalIconPreset; label: string }> = [
  { value: 'target', label: 'Cel' },
  { value: 'book', label: 'Nauka' },
  { value: 'wallet', label: 'Finanse' },
  { value: 'heart', label: 'Zdrowie' },
  { value: 'briefcase', label: 'Praca' },
  { value: 'run', label: 'Sport' },
  { value: 'star', label: 'Priorytet' },
  { value: 'flag', label: 'Meta' },
];

function collectTasks(tasks: GoalTask[]): GoalTask[] {
  return tasks.flatMap((task) => [task, ...collectTasks(task.subtasks)]);
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function toDateStrParts(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateStr(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}

function firstOfMonth(date: string) {
  const d = parseDateStr(date) ?? new Date();
  return toDateStrParts(d.getFullYear(), d.getMonth(), 1);
}

function shiftMonth(month: string, delta: number) {
  const d = parseDateStr(month) ?? new Date();
  return toDateStrParts(d.getFullYear(), d.getMonth() + delta, 1);
}

function monthGridFor(year: number, month: number): Array<{ value: string; day: number; currentMonth: boolean }> {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return { value: toDateStrParts(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), currentMonth: d.getMonth() === month };
  });
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
  if (!date) return 'Kiedy\u015b';
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
  if (date === t) return 'Dzi\u015b';
  if (date === addDays(t, 1)) return 'Jutro';
  return fmtDate(date);
}

function goalNextStep(goal: Goal): string | null {
  return collectTasks(goal.tasks).find((task) => task.status !== 'done')?.title ?? null;
}

function goalStatus(goal: Goal): { label: string; cls: string } {
  if (goal.completedAt || goal.progress >= 100) return { label: 'Uko\u0144czony', cls: 'status-done' };
  if (!goal.deadline) return { label: 'Aktywny', cls: 'status-active' };
  const now = new Date();
  const deadline = new Date(`${goal.deadline}T23:59:59`);
  if (deadline < now) return { label: 'Op\u00f3\u017aniony', cls: 'status-overdue' };
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

function isImageIcon(value: string) {
  return value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://');
}

function GoalIconMark({ value }: { value: string }) {
  if (isImageIcon(value)) return <img src={value} alt="" />;
  const name = DEFAULT_GOAL_ICONS.some((icon) => icon.value === value) ? value as GoalIconPreset : null;
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {(name === 'target' || !name) && <><circle cx="12" cy="12" r="8.5" {...c} /><circle cx="12" cy="12" r="4.2" {...c} /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>}
      {name === 'book' && <><path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3-3V4.5z" {...c} /><path d="M5 17V6.5A2.5 2.5 0 0 1 7.5 4H19v15.5" {...c} /></>}
      {name === 'wallet' && <><path d="M4 7.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17V7a2.5 2.5 0 0 1 2.5-2.5H18" {...c} /><path d="M16 13h5" {...c} /><circle cx="17" cy="13" r=".8" fill="currentColor" stroke="none" /></>}
      {name === 'heart' && <path d="M20.5 8.5c0 5.5-8.5 10-8.5 10s-8.5-4.5-8.5-10A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.5 2.5z" {...c} />}
      {name === 'briefcase' && <><rect x="3.5" y="7.5" width="17" height="11.5" rx="2.5" {...c} /><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M3.5 12h17" {...c} /></>}
      {name === 'run' && <><circle cx="13.5" cy="4.5" r="1.8" {...c} /><path d="M11 8.5l3.2 1.8 2 3.2M14.2 10.3l-3.3 3.2M10.9 13.5l-1.4 5M11.2 8.8l-3.1 1.4M13.2 15l4 4" {...c} /></>}
      {name === 'star' && <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5z" {...c} />}
      {name === 'flag' && <><path d="M6 21V4" {...c} /><path d="M6 5h11l-2 4 2 4H6" {...c} /></>}
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
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [goalView, setGoalView] = useState<'active' | 'completed'>('active');

  const goals = useMemo(
    () => (goalsQuery.data ?? []).map((goal) => mapGoal(goal, tasksQuery.data ?? [], milestonesQuery.data ?? [])),
    [goalsQuery.data, milestonesQuery.data, tasksQuery.data],
  );
  const goalCategories = useMemo(() => {
    const categories = [...DEFAULT_GOAL_CATEGORIES, ...extraCategories, ...goals.map((goal) => goal.category)].filter(Boolean);
    return Array.from(new Set(categories)).filter((category) => !hiddenCategories.includes(category));
  }, [extraCategories, goals, hiddenCategories]);

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
                <span className="goals-folder-emoji"><GoalIconMark value={goal.emoji || 'target'} /></span>
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
            <GoalSidebarActions
              goal={selected}
              onEdit={() => setGoalModal({ goal: selected })}
              onToggleActive={() => {
                const nextArchived = !selected.archived;
                updateGoal.mutate({ id: selected.id, patch: { archived: nextArchived } });
                setGoalView(nextArchived ? 'completed' : 'active');
                setSelectedId(selected.id);
              }}
              onDelete={() => setDeleteGoalId(selected.id)}
            />
          )}

          <button className="goals-archive-link" type="button" onClick={() => setGoalView((view) => view === 'active' ? 'completed' : 'active')}>
            <GoalIcon name="calendar" /> {goalView === 'active' ? 'Archiwalne cele' : 'Aktywne cele'} <IcoChevRight />
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
        onAddCategory={(name) => {
          setHiddenCategories((items) => items.filter((item) => item !== name));
          setExtraCategories((items) => items.includes(name) ? items : [...items, name]);
        }}
        onEditCategory={(oldName, nextName) => {
          if (!nextName.trim() || oldName === nextName) return;
          setHiddenCategories((items) => Array.from(new Set([...items, oldName])).filter((item) => item !== nextName));
          setExtraCategories((items) => Array.from(new Set(items.filter((item) => item !== oldName).concat(nextName))));
        }}
        onDeleteCategory={(name) => {
          setHiddenCategories((items) => Array.from(new Set([...items, name])));
          setExtraCategories((items) => items.filter((item) => item !== name));
        }}
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

function GoalSidebarActions({ goal, onEdit, onToggleActive, onDelete }: { goal: Goal; onEdit: () => void; onToggleActive: () => void; onDelete: () => void }) {
  return (
    <div className="goals-sidebar-actions">
      <div className="goals-detail-actions">
        <button className={`goals-active-toggle ${goal.archived ? 'is-inactive' : 'is-active'}`} type="button" onClick={onToggleActive}>
          <GoalIcon name="target" /> {goal.archived ? 'Nieaktywny' : 'Aktywny'}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onEdit}>Edytuj cel</button>
        <button className="icon-btn goals-delete-goal" type="button" onClick={onDelete} aria-label="Usuń cel" title="Usuń cel"><IcoTrash /></button>
        <MoreMenu actions={[
          { label: goal.archived ? 'Ustaw jako aktywny' : 'Ustaw jako nieaktywny', onClick: onToggleActive },
          { label: 'Usuń cel', onClick: onDelete, danger: true },
        ]} />
      </div>
    </div>
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

function GoalFormModal({ open, goal, categories, onAddCategory, onEditCategory, onDeleteCategory, onClose, onSave }: {
  open: boolean;
  goal: Goal | null;
  categories: string[];
  onAddCategory: (name: string) => void;
  onEditCategory: (oldName: string, nextName: string) => void;
  onDeleteCategory: (name: string) => void;
  onClose: () => void;
  onSave: (payload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'milestones'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('project');
  const [category, setCategory] = useState(categories[0] ?? 'Osobiste');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [emoji, setEmoji] = useState('target');

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? '');
    setDescription(goal?.description ?? '');
    setType(goal?.type ?? 'project');
    setCategory(goal?.category ?? categories[0] ?? 'Osobiste');
    setPriority(goal?.priority ?? '');
    setDeadline(goal?.deadline ?? '');
    setProgress(goal?.progress ?? 0);
    setStreak(goal?.streak ?? 0);
    setCategoryDraft('');
    setEditingCategory(null);
    setEditingCategoryName('');
    setEmoji(goal?.emoji ?? 'target');
  }, [categories, goal, open]);

  function addCategory() {
    const next = categoryDraft.trim();
    if (!next) return;
    onAddCategory(next);
    setCategory(next);
    setCategoryDraft('');
  }

  function saveCategoryEdit() {
    if (!editingCategory) return;
    const next = editingCategoryName.trim();
    if (!next) return;
    onEditCategory(editingCategory, next);
    if (category === editingCategory) setCategory(next);
    setEditingCategory(null);
    setEditingCategoryName('');
  }

  function uploadIcon(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setEmoji(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      type,
      category: category.trim() || 'Osobiste',
      priority: priority || undefined,
      deadline: deadline || undefined,
      progress,
      streak,
      archived: goal?.archived ?? false,
      emoji: emoji.trim() || 'target',
      completedAt: goal?.completedAt,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edytuj cel' : 'Dodaj cel'} size="lg">
      <form className="modal-form goals-goal-form" onSubmit={submit}>
        <div className="goals-form-grid">
          <Field label="Nazwa celu"><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></Field>
          <Field label="Ikona">
            <div className="goals-icon-editor">
              <div className="goals-icon-preview"><GoalIconMark value={emoji || 'target'} /></div>
              <div className="goals-icon-tools">
                <div className="goals-icon-presets">
                  {DEFAULT_GOAL_ICONS.map((icon) => (
                    <button key={icon.value} type="button" className={emoji === icon.value ? 'is-active' : ''} onClick={() => setEmoji(icon.value)} title={icon.label} aria-label={icon.label}>
                      <GoalIconMark value={icon.value} />
                    </button>
                  ))}
                </div>
                <label className="goals-upload-btn">
                  Wgraj zdjęcie
                  <input type="file" accept="image/*" onChange={uploadIcon} />
                </label>
              </div>
            </div>
          </Field>
          <Field label="Termin końcowy"><GoalDatePicker value={deadline} onChange={setDeadline} /></Field>
          <Field label="Typ"><select className="input" value={type} onChange={(event) => setType(event.target.value as GoalType)}><option value="project">Projekt</option><option value="simple">Prosty cel</option></select></Field>
          <Field label="Kategoria">
            <div className="goals-category-picker">
              <input className="input" list="goal-categories" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Wpisz lub wybierz kategorię" />
              <datalist id="goal-categories">{categories.map((name) => <option key={name} value={name} />)}</datalist>
              <div className="goals-category-chips">
                {categories.map((name) => (
                  <span key={name} className={category === name ? 'is-active' : ''}>
                    {editingCategory === name ? (
                      <>
                        <input value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} />
                        <button type="button" onClick={saveCategoryEdit}><IcoCheck /></button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setCategory(name)}>{name}</button>
                        <button type="button" aria-label={`Edytuj ${name}`} onClick={() => { setEditingCategory(name); setEditingCategoryName(name); }}>Edytuj</button>
                        <button type="button" aria-label={`Usuń ${name}`} onClick={() => { onDeleteCategory(name); if (category === name) setCategory(categories.find((item) => item !== name) ?? 'Osobiste'); }}><IcoTrash /></button>
                      </>
                    )}
                  </span>
                ))}
              </div>
              <div className="goals-category-inline-add">
                <input className="input" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="Nowa kategoria" />
                <button className="btn btn-secondary btn-sm" type="button" onClick={addCategory}><IcoPlus /> Dodaj</button>
              </div>
            </div>
          </Field>
        <option value="mid">Średni</option>
          <Field label={`Postęp (${progress}%)`}><input className="goals-range" type="range" min={0} max={100} value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></Field>
          <Field label="Seria"><input className="input" type="number" min={0} value={streak} onChange={(event) => setStreak(Number(event.target.value))} /></Field>
        </div>
        <Field label="Opis"><textarea className="textarea" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <div className="modal-actions goals-form-actions"><button className="btn btn-secondary" type="button" onClick={onClose}>Anuluj</button><button className="btn btn-primary" type="submit">Zapisz cel</button></div>
      </form>
    </Modal>
  );
}

function GoalDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(value || todayStr()));
  const viewDate = parseDateStr(viewMonth) ?? new Date();
  const days = useMemo(() => monthGridFor(viewDate.getFullYear(), viewDate.getMonth()), [viewMonth]);

  useEffect(() => {
    if (open) setViewMonth(firstOfMonth(value || todayStr()));
  }, [open, value]);

  return (
    <div className="goals-date-picker">
      <button className="goals-date-trigger" type="button" onClick={() => setOpen((next) => !next)}>
        <span>{value ? fmtDate(value) : 'Bez terminu'}</span>
        <GoalIcon name="calendar" />
      </button>
      {open && (
        <div className="goals-date-pop">
          <div className="goals-date-nav">
            <button type="button" onClick={() => setViewMonth((month) => shiftMonth(month, -1))} aria-label="Poprzedni miesiąc">‹</button>
            <strong>{MONTH_FULL[viewDate.getMonth()]} <span>{viewDate.getFullYear()}</span></strong>
            <button type="button" onClick={() => setViewMonth((month) => shiftMonth(month, 1))} aria-label="Następny miesiąc">›</button>
          </div>
          <div className="goals-date-weekdays">{['P', 'W', 'Ś', 'C', 'P', 'S', 'N'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="goals-date-days">
            {days.map((day) => (
              <button key={day.value} type="button" className={`${day.currentMonth ? '' : 'is-out'}${day.value === value ? ' is-selected' : ''}${day.value === todayStr() ? ' is-today' : ''}`} onClick={() => { onChange(day.value); setOpen(false); }}>
                {day.day}
              </button>
            ))}
          </div>
          <div className="goals-date-footer">
            <button type="button" onClick={() => { onChange(todayStr()); setOpen(false); }}>Dziś</button>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}>Wyczyść</button>
          </div>
        </div>
      )}
    </div>
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
