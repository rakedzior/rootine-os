import { useState } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, IcoEdit, IcoTrash } from '@/components/common';
import { useLocalStore, type Note, type NoteType, type ChecklistItem } from '@/store/localStore';

const TABS = [
  { id: 'wszystkie', label: 'Wszystkie',       icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { id: 'sticky',    label: 'Przyklejone',     icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="15 3 15 9 21 9"/></svg> },
  { id: 'listy',     label: 'Listy kontrolne', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id: 'pelne',     label: 'Pełne notatki',   icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
];

const NOTE_COLORS = ['#FEF3C7','#D1FAE5','#DBEAFE','#FCE7F3','#EDE9FE','#F3F3F0'];


export function NotesScreen() {
  const [tab, setTab] = useState('wszystkie');
  return (
    <div className="module-page">
      <div className="module-header">
        <span className="module-title">Notatki</span>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <NotesGrid filter={tab} />
    </div>
  );
}

function NotesGrid({ filter }: { filter: string }) {
  const { notes, addNote, updateNote, deleteNote } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = notes
    .filter(n => !n.archived)
    .filter(n => filter === 'wszystkie' ? true : filter === 'sticky' ? n.type === 'sticky' : filter === 'listy' ? n.type === 'checklist' : n.type === 'full')
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="input" style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj w notatkach…" />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Nowa notatka</button>
      </div>

      {pinned.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>📌 Przypięte</div>
          <div className="notes-grid" style={{ marginBottom: 20 }}>
            {pinned.map(n => <NoteCard key={n.id} note={n} onEdit={() => setEditNote(n)} onDelete={() => setDeleteId(n.id)} onUpdate={p => updateNote(n.id, p)} />)}
          </div>
        </>
      )}

      {unpinned.length === 0 && pinned.length === 0
        ? <EmptyState title="Brak notatek" desc="Dodaj pierwszą notatkę." cta="Nowa notatka" onCta={() => setShowAdd(true)} />
        : unpinned.length > 0 && (
          <div className="notes-grid">
            {unpinned.map(n => <NoteCard key={n.id} note={n} onEdit={() => setEditNote(n)} onDelete={() => setDeleteId(n.id)} onUpdate={p => updateNote(n.id, p)} />)}
          </div>
        )
      }

      <NoteModal open={showAdd} onClose={() => setShowAdd(false)} onSave={data => { addNote(data); setShowAdd(false); }} />
      <NoteModal open={!!editNote} note={editNote ?? undefined} onClose={() => setEditNote(null)} onSave={data => { updateNote(editNote!.id, data); setEditNote(null); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteNote(deleteId!); setDeleteId(null); }} label="tę notatkę" />
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onUpdate }: { note: Note; onEdit: () => void; onDelete: () => void; onUpdate: (p: Partial<Note>) => void }) {
  return (
    <div style={{ background: note.color || 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', minHeight: 120 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{note.title || 'Bez tytułu'}</div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="icon-btn" onClick={() => onUpdate({ pinned: !note.pinned })} title={note.pinned ? 'Odepnij' : 'Przypnij'} style={{ fontSize: 13, opacity: note.pinned ? 1 : 0.4 }}>📌</button>
          <button className="icon-btn" onClick={onEdit}><IcoEdit /></button>
          <button className="icon-btn" onClick={onDelete}><IcoTrash /></button>
        </div>
      </div>

      {note.type === 'checklist' && note.checklistItems ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {note.checklistItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div onClick={() => {
                const updated = note.checklistItems!.map(i => i.id === item.id ? { ...i, done: !i.done } : i);
                onUpdate({ checklistItems: updated });
              }} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.done ? 'var(--green-mid)' : 'var(--border)'}`, background: item.done ? 'var(--green-mid)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', flexShrink: 0 }}>
                {item.done && '✓'}
              </div>
              <span style={{ fontSize: 12, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--ink-3)' : 'var(--ink)' }}>{item.text}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
            {note.checklistItems.filter(i => i.done).length}/{note.checklistItems.length} zrobione
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' as const }}>
          {note.content}
        </div>
      )}

      {note.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
          {note.tags.map(tag => (
            <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(0,0,0,0.08)', color: 'var(--ink-2)' }}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteModal({ open, onClose, note, onSave }: { open: boolean; onClose: () => void; note?: Note; onSave: (n: Omit<Note,'id'|'createdAt'|'updatedAt'>) => void }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [type, setType] = useState<NoteType>(note?.type ?? 'sticky');
  const [color] = useState(note?.color ?? NOTE_COLORS[0]);
  const [tags] = useState(note?.tags?.join(', ') ?? '');
  const [items, setItems] = useState<ChecklistItem[]>(note?.checklistItems ?? []);
  const [newItem, setNewItem] = useState('');

  function handleSave() {
    onSave({
      title, content, type, color,
      category: '',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      pinned: note?.pinned ?? false,
      archived: false,
      checklistItems: type === 'checklist' ? items : undefined,
    });
    setTitle(''); setContent(''); setItems([]);
  }

  return (
    <Modal open={open} onClose={onClose} title={note ? 'Edytuj notatkę' : 'Nowa notatka'} size="md"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>Zapisz</button>
      </>}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['sticky','full','checklist'].map(t => (
          <button key={t} onClick={() => setType(t as NoteType)}
            style={{ padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: type === t ? 'var(--green)' : 'var(--surface-3)', color: type === t ? 'white' : 'var(--ink-2)' }}>
            {t === 'sticky' ? '🗒 Karteczka' : t === 'full' ? '📄 Pełna' : '✅ Lista'}
          </button>
        ))}
      </div>
      <Field label="Tytuł"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł notatki…" /></Field>
      {type !== 'checklist'
        ? <Field label="Treść"><textarea className="textarea" value={content} onChange={e => setContent(e.target.value)} rows={type === 'full' ? 8 : 4} placeholder="Treść notatki…" /></Field>
        : (
          <Field label="Lista">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid var(--border)', background: item.done ? 'var(--green-mid)' : 'transparent', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => setItems(prev => prev.map(it => it.id === item.id ? { ...it, done: !it.done } : it))} />
                  <span style={{ flex: 1, fontSize: 13, textDecoration: item.done ? 'line-through' : 'none', color: 'var(--ink)' }}>{item.text}</span>
                  <button className="icon-btn" style={{ padding: 2 }} onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input className="input" style={{ flex: 1, fontSize: 13 }} value={newItem} onChange={e => setNewItem(e.target.value)}
                  placeholder="Dodaj pozycję..." onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { setItems(prev => [...prev, { id: Date.now().toString(), text: newItem.trim(), done: false }]); setNewItem(''); }}} />
                <button className="btn btn-primary btn-sm" onClick={() => { if (newItem.trim()) { setItems(prev => [...prev, { id: Date.now().toString(), text: newItem.trim(), done: false }]); setNewItem(''); }}}>+</button>
              </div>
            </div>
          </Field>
        )}
      </Modal>
    );
}

