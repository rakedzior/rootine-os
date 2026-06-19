import { useState } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, ProgressBar, StatusBadge, PriorityBadge, IcoTrash } from '@/components/common';
import { useLocalStore, type Goal, type GoalTask, type GoalType, type Priority } from '@/store/localStore';

const TABS = [
  { id: 'lista',     label: 'Lista celów' },
  { id: 'dzisiaj',   label: 'Dzisiaj' },
  { id: 'ukonczone', label: 'Ukończone' },
];

const CATEGORIES = ['Zdrowie', 'Finanse', 'Kariera', 'Edukacja', 'Relacje', 'Hobby', 'Inne'];

export function GoalsScreen() {
  const [tab, setTab] = useState('lista');
  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">🎯 Cele</h1>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'lista'     && <GoalsList />}
      {tab === 'dzisiaj'   && <GoalsToday />}
      {tab === 'ukonczone' && <GoalsDone />}
    </div>
  );
}

// ─── LISTA CELÓW ──────────────────────────────────────────────

function GoalsList() {
  const { goals, addGoal, deleteGoal } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(goals[0]?.id ?? null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const active = goals.filter(g => !g.archived);
  const selected = active.find(g => g.id === selectedId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Sidebar */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Cele</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowy</button>
        </div>
        {active.length === 0
          ? <EmptyState title="Brak celów" cta="Dodaj cel" onCta={() => setShowAdd(true)} />
          : active.map(g => (
            <div key={g.id}
              onClick={() => setSelectedId(g.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}>
              <span style={{ fontSize: 22 }}>{g.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedId === g.id ? 'var(--green-text)' : 'var(--ink)' }}>{g.title}</div>
                <ProgressBar value={g.progress} size="sm" />
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>{g.progress}%</span>
            </div>
          ))
        }
      </div>

      {/* Detail */}
      {selected
        ? <GoalDetail goal={selected} onDelete={() => setDeleteId(selected.id)} />
        : <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <EmptyState title="Wybierz cel" desc="Kliknij cel po lewej, aby zobaczyć szczegóły." />
          </div>
      }

      <AddGoalModal open={showAdd} onClose={() => setShowAdd(false)} onSave={data => { addGoal(data); setShowAdd(false); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteGoal(deleteId!); setSelectedId(null); setDeleteId(null); }} label="ten cel" />
    </div>
  );
}

function GoalDetail({ goal, onDelete }: { goal: Goal; onDelete: () => void }) {
  const { addGoalTask, updateGoalTask } = useLocalStore();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('mid');
  const [taskDue, setTaskDue] = useState('');

  function handleAddTask() {
    if (!taskTitle.trim()) return;
    addGoalTask(goal.id, { title: taskTitle.trim(), description: '', status: 'todo', priority: taskPriority, dueDate: taskDue || undefined });
    setTaskTitle(''); setTaskDue(''); setShowAddTask(false);
  }

  return (
    <div className="col">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{goal.emoji}</span>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{goal.title}</h2>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{goal.category} · {goal.type === 'project' ? 'Projekt' : 'Prosty cel'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {goal.priority && <PriorityBadge priority={goal.priority} />}
            <button className="icon-btn" onClick={onDelete}><IcoTrash /></button>
          </div>
        </div>

        {goal.description && <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 16 }}>{goal.description}</p>}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Postęp</span>
            <span style={{ fontWeight: 700 }}>{goal.progress}%</span>
          </div>
          <ProgressBar value={goal.progress} size="lg" />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {goal.deadline && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Termin: <strong>{new Date(goal.deadline).toLocaleDateString('pl-PL')}</strong></span>}
          {goal.streak !== undefined && goal.streak > 0 && <span style={{ fontSize: 12 }}>🔥 Seria: <strong>{goal.streak} dni</strong></span>}
        </div>
      </div>

      {/* Tasks */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Zadania</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(!showAddTask)}>+ Dodaj</button>
        </div>

        {showAddTask && (
          <div style={{ background: 'var(--surface-3)', borderRadius: 10, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Tytuł zadania" onKeyDown={e => e.key === 'Enter' && handleAddTask()} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="select" value={taskPriority} onChange={e => setTaskPriority(e.target.value as Priority)} style={{ flex: 1 }}>
                <option value="low">Niski</option>
                <option value="mid">Średni</option>
                <option value="high">Wysoki</option>
              </select>
              <input type="date" className="input" value={taskDue} onChange={e => setTaskDue(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={handleAddTask}>Dodaj</button>
            </div>
          </div>
        )}

        {goal.tasks.length === 0
          ? <EmptyState title="Brak zadań" desc="Dodaj pierwsze zadanie do tego celu." />
          : goal.tasks.map(task => (
            <GoalTaskItem key={task.id} task={task} onUpdate={(p) => updateGoalTask(goal.id, task.id, p)} />
          ))
        }
      </div>
    </div>
  );
}

function GoalTaskItem({ task, onUpdate }: { task: GoalTask; onUpdate: (p: Partial<GoalTask>) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div
        onClick={() => onUpdate({ status: task.status === 'done' ? 'todo' : 'done' })}
        style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${task.status === 'done' ? 'var(--green-mid)' : 'var(--border)'}`, background: task.status === 'done' ? 'var(--green-mid)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', flexShrink: 0 }}>
        {task.status === 'done' && '✓'}
      </div>
      <span style={{ flex: 1, fontSize: 13, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--ink-3)' : 'var(--ink)' }}>{task.title}</span>
      {task.priority && <PriorityBadge priority={task.priority} />}
      {task.dueDate && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{new Date(task.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>}
      <StatusBadge status={task.status} />
    </div>
  );
}

function AddGoalModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (g: Omit<Goal,'id'|'createdAt'|'updatedAt'|'tasks'|'milestones'>) => void }) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Inne');
  const [type, setType] = useState<GoalType>('simple');
  const [priority, setPriority] = useState<Priority>('mid');
  const [deadline, setDeadline] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Nowy cel"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!title.trim()) return;
          onSave({ title, emoji, description: desc, category, type, priority, deadline: deadline || undefined, progress: 0, archived: false });
          setTitle(''); setDesc('');
        }}>Utwórz cel</button>
      </>}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Emoji">
          <input className="input" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ width: 60, textAlign: 'center', fontSize: 20 }} />
        </Field>
        <Field label="Tytuł celu" required>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Np. Przebiec maraton" style={{ width: '100%' }} />
        </Field>
      </div>
      <Field label="Opis"><textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></Field>
      <div className="form-grid">
        <Field label="Kategoria"><select className="select" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select></Field>
        <Field label="Typ"><select className="select" value={type} onChange={e => setType(e.target.value as GoalType)}>
          <option value="simple">Prosty cel</option>
          <option value="project">Projekt</option>
        </select></Field>
        <Field label="Priorytet"><select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
          <option value="low">Niski</option>
          <option value="mid">Sredni</option>
          <option value="high">Wysoki</option>
        </select></Field>
        <Field label="Termin"><input type="date" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

// ─── DZISIAJ ──────────────────────────────────────────────────

function GoalsToday() {
  const { goals, updateGoalTask } = useLocalStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const dueToday = goals.flatMap(g =>
    g.tasks.filter(t => t.dueDate === todayStr && t.status !== 'done')
      .map(t => ({ ...t, goalTitle: g.title, goalEmoji: g.emoji, goalId: g.id }))
  );
  const overdue = goals.flatMap(g =>
    g.tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done')
      .map(t => ({ ...t, goalTitle: g.title, goalEmoji: g.emoji, goalId: g.id }))
  );

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {overdue.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
          <div className="card-head"><span className="card-title" style={{ color: 'var(--p-high)' }}>Przeterminowane ({overdue.length})</span></div>
          {overdue.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span>{t.goalEmoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.goalTitle} · {new Date(t.dueDate!).toLocaleDateString('pl-PL')}</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => updateGoalTask(t.goalId, t.id, { status: 'done' })}>Zrób</button>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <div className="card-head"><span className="card-title">Na dzis</span></div>
        {dueToday.length === 0
          ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-3)', fontSize: 13 }}>Brak zadan na dzis!</div>
          : dueToday.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div onClick={() => updateGoalTask(t.goalId, t.id, { status: 'done' })}
                style={{ width: 20, height: 20, borderRadius: 99, border: '2px solid var(--border)', cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ fontSize: 18 }}>{t.goalEmoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.goalTitle}</div>
              </div>
              {t.priority && <PriorityBadge priority={t.priority} />}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── UKONCZONE ────────────────────────────────────────────────

function GoalsDone() {
  const { goals, updateGoal } = useLocalStore();
  const done = goals.filter(g => g.archived || g.progress >= 100);
  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {done.length === 0
        ? <div className="card"><EmptyState title="Brak ukończonych celów" desc="Ukonczone lub zarchiwizowane cele pojawia sie tutaj." /></div>
        : done.map(g => (
          <div key={g.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{g.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{g.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{g.category} · {g.progress}%</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => updateGoal(g.id, { archived: false })}>Wznow</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
