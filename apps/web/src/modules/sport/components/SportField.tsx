import { useState } from 'react';
import { useCreateSport } from '@/features/sport/hooks';
import type { Sport } from '@/features/sport/types';

const NEW_SENTINEL = '__new__';

interface SportFieldProps {
  sports: Sport[];
  value: string;
  onChange: (sportId: string) => void;
}

/** Sport select with an inline "+ Nowy sport..." option — types a name or picks an existing one. */
export function SportField({ sports, value, onChange }: SportFieldProps) {
  const createSport = useCreateSport();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  if (adding) {
    return (
      <div className="sport-inline-create">
        <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa nowego sportu" />
        <button type="button" className="btn btn-secondary btn-sm" disabled={!name.trim()} onClick={async () => {
          const sport = await createSport.mutateAsync({ name: name.trim() });
          onChange(sport.id);
          setAdding(false);
          setName('');
        }}>Dodaj</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setName(''); }}>Anuluj</button>
      </div>
    );
  }

  return (
    <select className="select" value={value} onChange={(e) => e.target.value === NEW_SENTINEL ? setAdding(true) : onChange(e.target.value)}>
      {!sports.length && <option value="">— brak sportów —</option>}
      {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      <option value={NEW_SENTINEL}>+ Nowy sport...</option>
    </select>
  );
}
