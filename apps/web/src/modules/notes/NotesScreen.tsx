import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useCollections, useAddCollection, useDeleteCollection,
  useNotes, useAddNote, usePinNote, useDeleteNote,
  useJournalToday, useUpsertJournal,
} from '@/features/notes/hooks';
import '@/styles/notes.css';

const PROMPTS = [
  'Jaki jeden mały sukces z dziś warto zapamiętać?',
  'Co dziś było trudne i jak sobie z tym poradziłem/am?',
  'Za co jestem wdzięczny/a dziś?',
  'Co zrobiłbym/abym inaczej?',
  'Co mnie dziś zaskoczyło?',
];

export function NotesScreen() {
  const showCapture = useIsFeatureVisible('notes.quick_capture');
  const showCollections = useIsFeatureVisible('notes.collections');
  const showJournal = useIsFeatureVisible('notes.journal');
  const showRecent = useIsFeatureVisible('notes.recent');

  // Quick capture
  const [body, setBody] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'checklist' | 'quote'>('note');
  const [selectedCollId, setSelectedCollId] = useState<string | null>(null);

  // Collections
  const collectionsQ = useCollections();
  const addCollection = useAddCollection();
  const deleteCollection = useDeleteCollection();
  const [newCollName, setNewCollName] = useState('');

  // Notes
  const notesQ = useNotes(null);
  const addNote = useAddNote();
  const pinNote = usePinNote();
  const deleteNote = useDeleteNote();

  // Journal
  const journalQ = useJournalToday();
  const upsertJournal = useUpsertJournal();
  const [journalBody, setJournalBody] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const todayPrompt = PROMPTS[new Date().getDay() % PROMPTS.length];
  const journal = journalQ.data;

  const collections = collectionsQ.data ?? [];
  const allNotes = notesQ.data ?? [];

  const filteredNotes = selectedCollId
    ? allNotes.filter((n) => n.collection_id === selectedCollId)
    : allNotes;

  const recentNotes = [...allNotes].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);

  function saveNote() {
    if (!body.trim()) return;
    addNote.mutate({ body: body.trim(), type: noteType, collection_id: selectedCollId });
    setBody('');
  }

  function saveJournal() {
    upsertJournal.mutate({ body: journalBody, prompt: todayPrompt });
    setJournalSaved(true);
  }

  function addColl() {
    if (!newCollName.trim()) return;
    addCollection.mutate({ name: newCollName.trim() });
    setNewCollName('');
  }

  return (
    <main className="grid">
      {/* LEFT */}
      <section className="col">
        {showCapture && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">01</span><span className="card-title">Szybki zapis</span></div>
              <span className="pill accent"><span className="led" />Szkic</span>
            </div>
            <textarea
              className="cap-area"
              placeholder="Zapisz myśl, listę, cokolwiek…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {collections.length > 0 && (
              <div className="cap-collrow">
                <span className="lbl">Do</span>
                <button
                  className={`cap-chip${selectedCollId === null ? ' on' : ''}`}
                  type="button"
                  onClick={() => setSelectedCollId(null)}
                >Wszystkie</button>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    className={`cap-chip${selectedCollId === c.id ? ' on' : ''}`}
                    type="button"
                    onClick={() => setSelectedCollId(c.id)}
                  >{c.name}</button>
                ))}
              </div>
            )}
            <div className="cap-foot">
              <div className="seg">
                <button className={noteType === 'note' ? 'on' : ''} type="button" onClick={() => setNoteType('note')}>Notatka</button>
                <button className={noteType === 'checklist' ? 'on' : ''} type="button" onClick={() => setNoteType('checklist')}>Lista</button>
                <button className={noteType === 'quote' ? 'on' : ''} type="button" onClick={() => setNoteType('quote')}>Cytat</button>
              </div>
              <button className="cap-save" type="button" onClick={saveNote} disabled={addNote.isPending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
                Zapisz
              </button>
            </div>
          </article>
        )}

        {showCollections && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">02</span><span className="card-title">Kolekcje</span></div>
              <span className="pill">{allNotes.length} notatek</span>
            </div>
            <div
              className={`coll c-all${selectedCollId === null ? ' on' : ''}`}
              onClick={() => setSelectedCollId(null)}
              style={{ cursor: 'pointer' }}
            >
              <span className="dot" /><span className="n">Wszystkie notatki</span><span className="ct">{allNotes.length}</span>
            </div>
            {collections.map((c) => (
              <div
                key={c.id}
                className={`coll${selectedCollId === c.id ? ' on' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => setSelectedCollId(selectedCollId === c.id ? null : c.id)}
              >
                <span className="dot" style={{ background: c.color }} />
                <span className="n" style={{ flex: 1 }}>{c.name}</span>
                <span className="ct">{allNotes.filter((n) => n.collection_id === c.id).length}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); deleteCollection.mutate(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', marginLeft: 4 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input className="fi" type="text" placeholder="Nowa kolekcja…" value={newCollName} onChange={(e) => setNewCollName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addColl()} style={{ flex: 1, fontSize: 13 }} />
              <button className="add-btn" type="button" onClick={addColl}>+</button>
            </div>
          </article>
        )}
      </section>

      {/* CENTER */}
      <section className="col">
        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="idx">03</span><span className="card-title">
              {selectedCollId ? (collections.find((c) => c.id === selectedCollId)?.name ?? 'Kolekcja') : 'Wszystkie notatki'}
            </span></div>
            <span className="pill">{filteredNotes.length} notatek</span>
          </div>
          <div className="nboard">
            {notesQ.isLoading ? (
              <div className="agenda-empty">Ładowanie…</div>
            ) : filteredNotes.length === 0 ? (
              <div className="agenda-empty">Brak notatek — zapisz pierwszą po lewej.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredNotes.map((n) => (
                  <div key={n.id} style={{ background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', padding: '10px 12px', position: 'relative' }}>
                    {n.title && <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{n.title}</div>}
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{n.body}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', flex: 1 }}>{new Date(n.updated_at).toLocaleDateString('pl-PL')}</span>
                      <span style={{ fontSize: 10, padding: '1px 5px', background: 'var(--surface)', borderRadius: 3 }}>{n.type}</span>
                      <button type="button" onClick={() => pinNote.mutate({ id: n.id, pinned: !n.pinned })} title={n.pinned ? 'Odepnij' : 'Przypnij'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.pinned ? 'var(--acc-a)' : 'var(--ink-3)', fontSize: 14 }}>📌</button>
                      <button type="button" onClick={() => deleteNote.mutate(n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      {/* RIGHT */}
      <section className="col">
        {showJournal && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">04</span><span className="card-title">Dziennik dziś</span></div>
              <span className="pill">Dziś</span>
            </div>
            <div className="prompt">
              <div className="k">Pytanie dnia</div>
              <div className="q">{todayPrompt}</div>
            </div>
            {journal && !journalSaved ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{journal.body}</div>
                <button type="button" className="add-btn" style={{ marginTop: 8 }} onClick={() => { setJournalBody(journal.body); setJournalSaved(false); }}>
                  Edytuj wpis
                </button>
              </div>
            ) : (
              <>
                <textarea
                  className="cap-area"
                  placeholder="Pisz swobodnie…"
                  value={journalBody}
                  onChange={(e) => { setJournalBody(e.target.value); setJournalSaved(false); }}
                  style={{ marginTop: 10 }}
                />
                <button className="cap-save" type="button" onClick={saveJournal} disabled={upsertJournal.isPending} style={{ marginTop: 8 }}>
                  Zapisz wpis
                </button>
                {journalSaved && <div style={{ fontSize: 12, color: 'var(--acc-a)', marginTop: 4 }}>✓ Zapisano</div>}
              </>
            )}
          </article>
        )}

        {showRecent && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">05</span><span className="card-title">Ostatnio edytowane</span></div>
              <span className="pill">Ostatnie 5</span>
            </div>
            {recentNotes.length === 0 ? (
              <div className="agenda-empty">Brak ostatnich wpisów.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentNotes.map((n) => (
                  <li key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{n.title ?? n.body.slice(0, 40)}{(!n.title && n.body.length > 40) ? '…' : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{new Date(n.updated_at).toLocaleString('pl-PL')}</div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}
      </section>
    </main>
  );
}
