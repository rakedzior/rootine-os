import { useState } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { useCreateTask } from './hooks';
import type { TaskPriority } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Niski', color: 'var(--ink-3)' },
  { value: 'normal', label: 'Normalny', color: 'var(--acc-a)' },
  { value: 'high', label: 'Wysoki', color: 'var(--ev-orange, #f59e0b)' },
  { value: 'urgent', label: 'Pilny', color: 'var(--acc-b)' },
];

const RECURRENCES = [
  { value: '', label: 'Brak' },
  { value: 'daily', label: 'Codziennie' },
  { value: 'weekdays', label: 'Dni robocze (Pn–Pt)' },
  { value: 'weekly', label: 'Co tydzień' },
  { value: 'monthly', label: 'Co miesiąc' },
];

export function TaskSheet({ open, onClose, defaultDate }: Props) {
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate ?? '');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [recurrence, setRecurrence] = useState('');

  function reset() {
    setTitle(''); setDescription(''); setDueDate(defaultDate ?? '');
    setTime(''); setPriority('normal'); setRecurrence('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    await create.mutateAsync({
      title: t,
      description: description.trim() || null,
      due_date: dueDate || null,
      scheduled_time: time || null,
      priority,
      recurrence: recurrence || null,
    });
    reset();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={() => { reset(); onClose(); }} title="Nowe zadanie">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          className="bs-input"
          type="text"
          placeholder="Nazwa zadania *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <textarea
          className="bs-input"
          placeholder="Opis (opcjonalnie)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ resize: 'none' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="bs-label">Data</label>
            <input
              className="bs-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="bs-label">Godzina</label>
            <input
              className="bs-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="bs-label">Priorytet</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--mono)', letterSpacing: '.05em',
                  border: `1px solid ${priority === p.value ? p.color : 'var(--border)'}`,
                  background: priority === p.value ? p.color + '22' : 'transparent',
                  color: priority === p.value ? p.color : 'var(--ink-3)',
                  fontWeight: priority === p.value ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="bs-label">Cykliczność</label>
          <select
            className="bs-input"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            {RECURRENCES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={create.isPending || !title.trim()}
          style={{ marginTop: 4, padding: '14px', fontSize: 15, fontWeight: 600 }}
        >
          {create.isPending ? 'Dodawanie…' : 'Dodaj zadanie'}
        </button>
      </form>
    </BottomSheet>
  );
}
