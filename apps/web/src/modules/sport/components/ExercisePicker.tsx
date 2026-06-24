import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '@/features/sport/types';

interface ExercisePickerProps {
  exercises: Exercise[];
  onPickExisting: (exercise: Exercise) => void;
  onCreateNew: (name: string) => void;
  placeholder?: string;
}

/** Type-to-search exercise field: shows matching exercises as suggestions, falls back to
 * "+ Dodaj ... jako nowe ćwiczenie" when nothing matches. */
export function ExercisePicker({ exercises, onPickExisting, onCreateNew, placeholder = 'Szukaj ćwiczenia lub wpisz nowe...' }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmed = query.trim();
  const matches = trimmed
    ? exercises.filter(e => e.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 8)
    : [];
  const exactMatch = matches.find(e => e.name.toLowerCase() === trimmed.toLowerCase());

  function pick(exercise: Exercise) {
    onPickExisting(exercise);
    setQuery('');
    setOpen(false);
  }
  function createNew() {
    if (!trimmed) return;
    onCreateNew(trimmed);
    setQuery('');
    setOpen(false);
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (exactMatch) pick(exactMatch);
    else if (trimmed) createNew();
  }

  return (
    <div className="sport-exercise-picker" ref={ref}>
      <input
        className="input" value={query} placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && trimmed && (
        <div className="sport-exercise-picker-list" role="listbox">
          {matches.map(ex => (
            <button key={ex.id} type="button" className="sport-exercise-picker-item" onClick={() => pick(ex)}>{ex.name}</button>
          ))}
          {!exactMatch && (
            <button type="button" className="sport-exercise-picker-item is-create" onClick={createNew}>
              + Dodaj "{trimmed}" jako nowe ćwiczenie
            </button>
          )}
        </div>
      )}
    </div>
  );
}
