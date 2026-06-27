import { useMemo, useState, type FormEvent } from 'react';
import { Field } from '@/components/common';
import { useHabits, useHabitLogs, useCreateHabit, useDeleteHabit, useToggleHabitLog } from './hooks';
import { ALL_WEEKDAYS, HABIT_WEEKDAYS, habitOccursOn, habitScheduleLabel, habitStats, todayStr } from './dates';
import type { HabitLog, HabitScheduleType } from './types';

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const FLAME = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2c1 3-1 4-2 6-1 1.6-.5 3 1 3 1.2 0 2-1 2-2 1.5 1 3 2.8 3 5a6 6 0 1 1-12 0c0-2 1-3.7 2.5-5C8 12 9 9 12 2z" />
  </svg>
);
const TRASH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
  </svg>
);

const HABIT_CATEGORIES = ['Zdrowie', 'Sport', 'Nauka', 'Praca', 'Regeneracja', 'Relacje', 'Inne'];

export function HabitList() {
  const habitsQ = useHabits();
  const logsQ = useHabitLogs();
  const create = useCreateHabit();
  const del = useDeleteHabit();
  const toggle = useToggleHabitLog();
  const today = todayStr();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Zdrowie');
  const [recurrenceType, setRecurrenceType] = useState<HabitScheduleType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');

  const datesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of (logsQ.data ?? []) as HabitLog[]) {
      let s = map.get(l.habit_id);
      if (!s) {
        s = new Set();
        map.set(l.habit_id, s);
      }
      s.add(l.log_date);
    }
    return map;
  }, [logsQ.data]);

  function resetForm() {
    setName('');
    setCategory('Zdrowie');
    setRecurrenceType('daily');
    setWeekdays(ALL_WEEKDAYS);
    setStartDate(todayStr());
    setEndDate('');
  }

  const add = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate(
      {
        name: n,
        category,
        schedule_type: recurrenceType === 'selected_weekdays' ? 'selected_weekdays' : 'daily',
        weekdays: recurrenceType === 'daily' ? ALL_WEEKDAYS : weekdays,
        start_date: startDate || today,
        end_date: endDate || null,
      },
      { onSuccess: resetForm },
    );
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => {
      if (prev.includes(day)) return prev.length === 1 ? prev : prev.filter((d) => d !== day);
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  if (habitsQ.isLoading) return <div className="note-peek">Ładowanie nawyków...</div>;
  if (habitsQ.isError) {
    return (
      <div>
        <div className="auth-banner warn">Nie udało się wczytać nawyków.</div>
        <button className="he-btn ghost" type="button" onClick={() => habitsQ.refetch()}>Spróbuj ponownie</button>
      </div>
    );
  }

  const habits = habitsQ.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div id="habitList">
        {habits.length === 0 && (
          <div className="agenda-empty">Brak nawyków. Dodaj pierwszy poniżej.</div>
        )}
        {habits.map((h) => {
          const stats = habitStats(datesByHabit.get(h.id) ?? new Set(), today, h);
          const scheduledToday = habitOccursOn(h, today);
          const canToggle = scheduledToday || stats.doneToday;
          return (
            <div
              key={h.id}
              className={`habit ed-row${stats.doneToday ? ' done' : ''}`}
              role={canToggle ? 'button' : undefined}
              tabIndex={canToggle ? 0 : -1}
              onClick={() => canToggle && toggle.mutate({ habitId: h.id, date: today, done: !stats.doneToday })}
              onKeyDown={(e) => {
                if (canToggle && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggle.mutate({ habitId: h.id, date: today, done: !stats.doneToday });
                }
              }}
              style={{ opacity: scheduledToday ? 1 : 0.58, cursor: canToggle ? 'pointer' : 'default' }}
            >
              <span className="check">{stats.doneToday ? CHECK : null}</span>
              <div className="info">
                <div className="n">{h.name}</div>
                <div className="c">
                  {[h.category, habitScheduleLabel(h), scheduledToday ? null : 'poza planem dziś'].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="hab-dots" aria-label="Ostatnie 7 dni">
                {stats.week.map((on, i) => (
                  <span key={i} className={`hd-dot${on ? ' on' : ''}`} />
                ))}
              </div>
              <span className="streak" title="Seria dni">
                {FLAME}
                {stats.streak}
              </span>
              <button
                className="fl-del"
                type="button"
                aria-label="Usuń nawyk"
                onClick={(e) => {
                  e.stopPropagation();
                  del.mutate(h.id);
                }}
              >
                {TRASH}
              </button>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={add}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 0.8fr)',
          gap: 12,
          padding: 14,
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--r-mid)',
          background: 'var(--surface-inset)',
        }}
      >
        <Field label="Nawyk" required>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. 10 minut mobilizacji"
            style={{ width: '100%' }}
          />
        </Field>
        <Field label="Kategoria">
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%' }}>
            {HABIT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Powtarzalność">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                ['daily', 'Codziennie'],
                ['selected_weekdays', 'Wybrane dni'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRecurrenceType(value);
                    if (value === 'daily') setWeekdays(ALL_WEEKDAYS);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: recurrenceType === value ? 'var(--acc-a-soft)' : 'var(--surface)',
                    color: recurrenceType === value ? 'var(--acc-a-ink)' : 'var(--ink-2)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Od">
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Do">
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
        </div>

        {recurrenceType === 'selected_weekdays' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {HABIT_WEEKDAYS.map((day) => {
                const active = weekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    style={{
                      width: 42,
                      height: 34,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: active ? 'var(--acc-b-soft)' : 'var(--surface)',
                      color: active ? 'var(--acc-b-ink)' : 'var(--ink-3)',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-sm" type="submit" disabled={create.isPending || !name.trim()} style={{ gridColumn: '1 / -1' }}>
          {create.isPending ? 'Dodawanie...' : 'Dodaj nawyk'}
        </button>
      </form>
    </div>
  );
}
