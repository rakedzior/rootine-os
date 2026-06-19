import { useState } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { useAddNote } from './hooks';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuickNoteSheet({ open, onClose }: Props) {
  const addNote = useAddNote();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function reset() { setTitle(''); setBody(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await addNote.mutateAsync({
      body: body.trim(),
      title: title.trim() || null,
      type: 'note',
      collection_id: null,
    });
    reset();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={() => { reset(); onClose(); }} title="Szybka notatka">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          className="bs-input"
          placeholder="Tytuł (opcjonalnie)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="bs-input"
          placeholder="Treść notatki *"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          style={{ resize: 'none' }}
          autoFocus
          required
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={addNote.isPending || !body.trim()}
          style={{ padding: '14px', fontSize: 15, fontWeight: 600 }}
        >
          {addNote.isPending ? 'Zapisywanie…' : 'Zapisz notatkę'}
        </button>
      </form>
    </BottomSheet>
  );
}
