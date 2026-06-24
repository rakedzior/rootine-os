import { useEffect, useMemo, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, PageHeader, IcoTrash } from '@/components/common';
import { useLocalStore, type ChecklistItem, type Note, type NoteType } from '@/store/localStore';
import '@/styles/notes.css';

type NoteIconName =
  | 'note' | 'pin' | 'tag' | 'clock' | 'calendar' | 'plus' | 'filter' | 'grid' | 'list' | 'settings'
  | 'idea' | 'project' | 'people' | 'user' | 'star' | 'book' | 'archive' | 'bold'
  | 'italic' | 'underline' | 'strike' | 'align' | 'check' | 'link' | 'image' | 'table'
  | 'code' | 'undo' | 'redo' | 'more' | 'save' | 'document';

type NoteCategory = {
  id: string;
  label: string;
  icon: NoteIconName;
  tone: string;
  matcher: (note: Note) => boolean;
};

const NOTE_COLORS = ['#1b2b33', '#21333d', '#14222a', '#261b33', '#1b3330'];

const CATEGORIES: NoteCategory[] = [
  { id: 'all', label: 'Wszystkie notatki', icon: 'note', tone: 'pink', matcher: () => true },
  { id: 'ideas', label: 'Pomysły', icon: 'idea', tone: 'teal', matcher: (n) => matches(n, ['pomysł', 'pomysl', 'idea', 'inspir']) },
  { id: 'projects', label: 'Projekty', icon: 'project', tone: 'blue', matcher: (n) => matches(n, ['projekt', 'aplikacja', 'product', 'mvp']) },
  { id: 'meetings', label: 'Spotkania', icon: 'people', tone: 'teal', matcher: (n) => matches(n, ['spotkan', 'zespół', 'zespol', 'meeting']) },
  { id: 'personal', label: 'Osobiste', icon: 'user', tone: 'violet', matcher: (n) => matches(n, ['osobiste', 'cele', 'plan']) },
  { id: 'inspiration', label: 'Inspiracje', icon: 'star', tone: 'amber', matcher: (n) => matches(n, ['inspir', 'produkt', 'wakacje']) },
  { id: 'reading', label: 'Do przeczytania', icon: 'book', tone: 'amber', matcher: (n) => matches(n, ['czyt', 'research', 'książ', 'ksiaz']) },
  { id: 'archive', label: 'Archiwum', icon: 'archive', tone: 'gray', matcher: (n) => n.archived },
];

function matches(note: Note, terms: string[]) {
  const source = `${note.title} ${note.content} ${note.category} ${note.tags.join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return terms.some((term) => source.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
}

function fmtDate(date: string) {
  return new Date(`${date}`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(date: string) {
  return new Date(`${date}`).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  return `${Math.round(hours / 24)} dni temu`;
}

function wordCount(note: Note) {
  return `${note.content.split(/\s+/).filter(Boolean).length} słów`;
}

function categoryFor(note: Note) {
  return CATEGORIES.find((cat) => cat.id !== 'all' && cat.id !== 'archive' && cat.matcher(note)) ?? CATEGORIES[0];
}

function notePreview(note: Note) {
  if (note.content.trim()) return note.content.trim();
  if (note.checklistItems?.length) return note.checklistItems.map((item) => item.text).join(', ');
  return 'Szybka notatka bez treści.';
}

export function NotesScreen() {
  const { notes, addNote, updateNote, deleteNote } = useLocalStore();
  const [categoryId, setCategoryId] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(notes.find((note) => !note.archived)?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'list'>('cards');

  const activeCategory = CATEGORIES.find((cat) => cat.id === categoryId) ?? CATEGORIES[0];
  const visibleNotes = useMemo(() => {
    const base = categoryId === 'archive' ? notes.filter((note) => note.archived) : notes.filter((note) => !note.archived);
    return base.filter(activeCategory.matcher).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [activeCategory, categoryId, notes]);
  const selected = notes.find((note) => note.id === selectedId) ?? visibleNotes[0] ?? notes.find((note) => !note.archived);

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
    if (selectedId && !notes.some((note) => note.id === selectedId)) setSelectedId(visibleNotes[0]?.id ?? null);
  }, [notes, selected, selectedId, visibleNotes]);

  return (
    <div className="module-page notes-os">
      <PageHeader
        icon={<NoteIcon name="note" />}
        title="Notatki"
        desc="Wszystkie notatki, pomysły i szybkie zapisy w jednym miejscu."
        actions={<>
          <button className="btn btn-primary" type="button" onClick={() => setShowAdd(true)}><NoteIcon name="plus" /> Nowa notatka</button>
          <div className="notes-view-toggle">
            <button className={view === 'list' ? 'is-active' : ''} type="button" onClick={() => setView('list')} aria-label="Widok listy"><NoteIcon name="list" /></button>
            <button className={view === 'cards' ? 'is-active' : ''} type="button" onClick={() => setView('cards')} aria-label="Widok kafelków"><NoteIcon name="grid" /></button>
          </div>
        </>}
      />

      <section className="notes-layout notes-layout-3">
        <aside className="notes-sidebar notes-card">
          <div className="notes-card-head">
            <h2>Kategorie</h2>
            <button type="button" aria-label="Dodaj kategorię"><NoteIcon name="plus" /></button>
          </div>
          <div className="notes-category-list">
            {CATEGORIES.map((cat) => {
              const count = cat.id === 'all'
                ? notes.filter((note) => !note.archived).length
                : notes.filter(cat.matcher).length;
              return (
                <button key={cat.id} className={`notes-category notes-tone-${cat.tone} ${categoryId === cat.id ? 'is-active' : ''}`} type="button" onClick={() => setCategoryId(cat.id)}>
                  <span><NoteIcon name={cat.icon} /></span>
                  <strong>{cat.label}</strong>
                  <em>{count}</em>
                </button>
              );
            })}
          </div>
          <button className="notes-add-category" type="button"><NoteIcon name="plus" /> Dodaj kategorię</button>
        </aside>

        <section className="notes-card notes-list-col">
          <div className="notes-card-head">
            <h2>{activeCategory.label}</h2>
            <span className="badge badge-gray">{visibleNotes.length}</span>
          </div>
          {visibleNotes.length === 0 ? (
            <EmptyState title="Brak notatek w tej kategorii" cta="Nowa notatka" onCta={() => setShowAdd(true)} />
          ) : view === 'cards' ? (
            <div className="notes-card-grid">
              {visibleNotes.map((note) => (
                <NoteTile key={note.id} note={note} selected={selected?.id === note.id} onSelect={() => setSelectedId(note.id)} onPin={() => updateNote(note.id, { pinned: !note.pinned })} />
              ))}
            </div>
          ) : (
            <div className="notes-list-rows">
              {visibleNotes.map((note) => (
                <button key={note.id} type="button" className={`notes-list-row ${selected?.id === note.id ? 'is-active' : ''}`} onClick={() => setSelectedId(note.id)}>
                  <div className="notes-list-row-main">
                    <strong>{note.pinned && <NoteIcon name="star" />}{note.title}</strong>
                    <small>{notePreview(note)}</small>
                  </div>
                  <em>{relativeTime(note.updatedAt)}</em>
                </button>
              ))}
            </div>
          )}
        </section>

        <main className="notes-editor-col">
          {selected ? (
            <EditorPanel note={selected} onUpdate={(patch) => updateNote(selected.id, patch)} onDelete={() => setDeleteId(selected.id)} />
          ) : (
            <div className="notes-card notes-empty-center"><EmptyState title="Wybierz notatkę" desc="Kliknij notatkę z listy lub utwórz nową." cta="Nowa notatka" onCta={() => setShowAdd(true)} /></div>
          )}
        </main>
      </section>

      <NoteModal open={showAdd} onClose={() => setShowAdd(false)} onSave={(data) => { addNote(data); setShowAdd(false); }} />
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteNote(deleteId); setDeleteId(null); }} label="tę notatkę" />
    </div>
  );
}

function EditorPanel({ note, onUpdate, onDelete }: { note: Note; onUpdate: (patch: Partial<Note>) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(note.content);

  useEffect(() => {
    setDraft(note.content);
  }, [note.id, note.content]);

  function saveDraft() {
    if (draft !== note.content) onUpdate({ content: draft });
  }

  const cat = categoryFor(note);

  return (
    <section className="notes-card notes-editor">
      <div className="notes-editor-head">
        <div>
          <h2>{note.title || 'Bez tytułu'} <button type="button" onClick={() => onUpdate({ pinned: !note.pinned })}><NoteIcon name="pin" /></button></h2>
          <div className="notes-editor-tags">
            <span className={`notes-tone-${cat.tone}`}>{cat.label.replace('Wszystkie notatki', 'Pomysły')}</span>
            {note.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
            <button type="button"><NoteIcon name="plus" /> Dodaj tag</button>
          </div>
        </div>
        <div className="notes-editor-meta">
          <span>Zapisano {relativeTime(note.updatedAt)}</span>
          <NoteIcon name="check" />
          <span><NoteIcon name="calendar" /> {fmtDate(note.updatedAt)}, {fmtTime(note.updatedAt)}</span>
          <button type="button" onClick={onDelete} aria-label="Usuń notatkę"><NoteIcon name="more" /></button>
        </div>
      </div>

      <div className="notes-toolbar">
        <select aria-label="Format"><option>Akapit</option><option>Nagłówek</option></select>
        {(['bold', 'italic', 'underline', 'strike', 'tag', 'list', 'align', 'grid', 'link', 'image', 'table', 'code', 'undo', 'redo'] as NoteIconName[]).map((icon) => (
          <button key={icon} type="button"><NoteIcon name={icon} /></button>
        ))}
        <button type="button" onClick={saveDraft}><NoteIcon name="save" /></button>
      </div>

      <div className="notes-editor-body">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={saveDraft} />
        {note.type === 'checklist' && note.checklistItems && (
          <div className="notes-inline-checklist">
            {note.checklistItems.map((item) => (
              <button key={item.id} type="button" className={item.done ? 'is-done' : ''} onClick={() => {
                onUpdate({ checklistItems: note.checklistItems!.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry) });
              }}>
                <span><NoteIcon name="check" /></span>{item.text}
              </button>
            ))}
          </div>
        )}
        <em>{wordCount({ ...note, content: draft })}</em>
      </div>
    </section>
  );
}

function NoteTile({ note, selected, onSelect, onPin }: { note: Note; selected: boolean; onSelect: () => void; onPin: () => void }) {
  const cat = categoryFor(note);
  return (
    <article className={`notes-tile ${selected ? 'is-selected' : ''}`}>
      <button type="button" className="notes-tile-main" onClick={onSelect}>
        <span className={`notes-tile-cat notes-tone-${cat.tone}`}>{cat.label === 'Wszystkie notatki' ? 'Pomysły' : cat.label}</span>
        <strong>{note.title}</strong>
        <p>{notePreview(note)}</p>
        <time>{fmtDate(note.updatedAt)}, {fmtTime(note.updatedAt)}</time>
        <NoteIcon name="more" />
      </button>
      <button type="button" onClick={onPin} className={`notes-tile-pin ${note.pinned ? 'is-pinned' : ''}`} aria-label="Przypnij"><NoteIcon name="pin" /></button>
    </article>
  );
}

function NoteModal({ open, onClose, note, onSave }: { open: boolean; onClose: () => void; note?: Note; onSave: (n: Omit<Note,'id'|'createdAt'|'updatedAt'>) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteType>('sticky');
  const [category, setCategory] = useState('Pomysły');
  const [tags, setTags] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setType(note?.type ?? 'sticky');
    setCategory(note?.category || 'Pomysły');
    setTags(note?.tags?.join(', ') ?? '');
    setItems(note?.checklistItems ?? []);
  }, [note, open]);

  function handleSave() {
    onSave({
      title: title.trim() || 'Bez tytułu',
      content,
      type,
      color: note?.color ?? NOTE_COLORS[0],
      category,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      pinned: note?.pinned ?? false,
      archived: note?.archived ?? false,
      checklistItems: type === 'checklist' ? items : undefined,
    });
    setTitle('');
    setContent('');
    setItems([]);
  }

  return (
    <Modal open={open} onClose={onClose} title={note ? 'Edytuj notatkę' : 'Nowa notatka'} size="md" footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={handleSave}>Zapisz</button>
      </>
    }>
      <div className="notes-modal-types">
        {(['sticky','full','checklist'] as NoteType[]).map((option) => (
          <button key={option} type="button" onClick={() => setType(option)} className={type === option ? 'is-active' : ''}>
            {option === 'sticky' ? 'Karteczka' : option === 'full' ? 'Pełna' : 'Lista'}
          </button>
        ))}
      </div>
      <Field label="Tytuł"><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <div className="form-grid">
        <Field label="Kategoria"><input className="input" value={category} onChange={(event) => setCategory(event.target.value)} /></Field>
        <Field label="Tagi"><input className="input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="AI, Aplikacja" /></Field>
      </div>
      {type !== 'checklist' ? (
        <Field label="Treść"><textarea className="textarea" value={content} onChange={(event) => setContent(event.target.value)} rows={7} /></Field>
      ) : (
        <Field label="Lista">
          <div className="notes-modal-list">
            {items.map((item) => (
              <div key={item.id}>
                <button type="button" onClick={() => setItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} className={item.done ? 'is-done' : ''}><NoteIcon name="check" /></button>
                <span>{item.text}</span>
                <button type="button" onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}><IcoTrash /></button>
              </div>
            ))}
            <div>
              <input className="input" value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder="Dodaj pozycję..." />
              <button className="btn btn-primary btn-sm" type="button" onClick={() => { if (newItem.trim()) { setItems((prev) => [...prev, { id: Date.now().toString(), text: newItem.trim(), done: false }]); setNewItem(''); } }}>+</button>
            </div>
          </div>
        </Field>
      )}
    </Modal>
  );
}

function NoteIcon({ name }: { name: NoteIconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'note' && <><path d="M6 3h9l3 3v15H6V3zM15 3v4h4M9 12h6M9 16h4" {...common} /></>}
      {name === 'pin' && <><path d="m14 4 6 6-3 1-4 4-1 5-2-2-4 4-2-2 4-4-2-2 5-1 4-4-1-5z" {...common} /></>}
      {name === 'tag' && <><path d="M20 12 12 20 4 12V4h8l8 8z" {...common} /><path d="M8 8h.01" {...common} /></>}
      {name === 'clock' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 7v5l3 2" {...common} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2" {...common} /><path d="M8 3v4M16 3v4M4 10h16" {...common} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...common} /></>}
      {name === 'filter' && <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" {...common} /></>}
      {name === 'grid' && <><rect x="4" y="4" width="6" height="6" rx="1.5" {...common} /><rect x="14" y="4" width="6" height="6" rx="1.5" {...common} /><rect x="4" y="14" width="6" height="6" rx="1.5" {...common} /><rect x="14" y="14" width="6" height="6" rx="1.5" {...common} /></>}
      {name === 'list' && <><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...common} /></>}
      {name === 'settings' && <><circle cx="12" cy="12" r="3" {...common} /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z" {...common} /></>}
      {name === 'idea' && <><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4z" {...common} /></>}
      {name === 'project' && <><rect x="4" y="5" width="16" height="14" rx="2" {...common} /><path d="M8 9h8M8 13h5" {...common} /></>}
      {name === 'people' && <><circle cx="9" cy="8" r="3" {...common} /><circle cx="17" cy="9" r="2.5" {...common} /><path d="M3 20a6 6 0 0 1 12 0M14 20a4.5 4.5 0 0 1 7 0" {...common} /></>}
      {name === 'user' && <><circle cx="12" cy="8" r="3.5" {...common} /><path d="M5 21a7 7 0 0 1 14 0" {...common} /></>}
      {name === 'star' && <><path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z" {...common} /></>}
      {name === 'book' && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12zM4 17.5A2.5 2.5 0 0 0 6.5 20" {...common} /><path d="M8 7h8" {...common} /></>}
      {name === 'archive' && <><rect x="4" y="5" width="16" height="4" rx="1" {...common} /><path d="M6 9v10h12V9M10 13h4" {...common} /></>}
      {name === 'bold' && <><path d="M7 5h6a3 3 0 0 1 0 6H7zM7 11h7a4 4 0 0 1 0 8H7z" {...common} /></>}
      {name === 'italic' && <><path d="M10 5h8M6 19h8M14 5l-4 14" {...common} /></>}
      {name === 'underline' && <><path d="M7 5v6a5 5 0 0 0 10 0V5M5 21h14" {...common} /></>}
      {name === 'strike' && <><path d="M5 12h14M8 7a4 4 0 0 1 7-1M9 17a4 4 0 0 0 7-1" {...common} /></>}
      {name === 'align' && <><path d="M4 6h16M4 10h11M4 14h16M4 18h11" {...common} /></>}
      {name === 'check' && <><path d="M20 6 9 17l-5-5" {...common} /></>}
      {name === 'link' && <><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" {...common} /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" {...common} /></>}
      {name === 'image' && <><rect x="4" y="5" width="16" height="14" rx="2" {...common} /><circle cx="9" cy="10" r="1.5" {...common} /><path d="m6 17 4-4 3 3 2-2 3 3" {...common} /></>}
      {name === 'table' && <><rect x="4" y="5" width="16" height="14" rx="2" {...common} /><path d="M4 10h16M4 15h16M10 5v14M15 5v14" {...common} /></>}
      {name === 'code' && <><path d="m9 8-4 4 4 4M15 8l4 4-4 4" {...common} /></>}
      {name === 'undo' && <><path d="M9 7H4v5" {...common} /><path d="M4 12a8 8 0 0 1 13.5-5.8" {...common} /></>}
      {name === 'redo' && <><path d="M15 7h5v5" {...common} /><path d="M20 12A8 8 0 0 0 6.5 6.2" {...common} /></>}
      {name === 'more' && <><path d="M12 7h.01M12 12h.01M12 17h.01" {...common} /></>}
      {name === 'save' && <><path d="M5 3h12l2 2v16H5V3z" {...common} /><path d="M8 3v6h8V3M8 21v-7h8v7" {...common} /></>}
      {name === 'document' && <><path d="M7 3h7l4 4v14H7V3zM14 3v5h5M10 13h6M10 17h4" {...common} /></>}
    </svg>
  );
}
