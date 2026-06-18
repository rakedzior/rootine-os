import { supabase } from '@/lib/supabase';
import type { Note, NoteCollection, JournalEntry, NewNoteInput, JournalPatch } from './types';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ── note_collections ──────────────────────────────────────────────────────────

export async function fetchCollections(): Promise<NoteCollection[]> {
  const { data, error } = await supabase
    .from('note_collections')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as NoteCollection[];
}

export async function insertCollection(name: string, color?: string): Promise<NoteCollection> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('note_collections')
    .insert({ user_id: userId, name, color: color ?? '#888888' })
    .select('*')
    .single();
  if (error) throw error;
  return data as NoteCollection;
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('note_collections').delete().eq('id', id);
  if (error) throw error;
}

// ── notes ─────────────────────────────────────────────────────────────────────

export async function fetchNotes(collectionId?: string | null): Promise<Note[]> {
  let q = supabase
    .from('notes')
    .select('*')
    .is('deleted_at', null)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (collectionId) q = q.eq('collection_id', collectionId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function insertNote(input: NewNoteInput): Promise<Note> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      collection_id: input.collection_id ?? null,
      type: input.type ?? 'note',
      title: input.title ?? null,
      body: input.body,
      pinned: input.pinned ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Note;
}

export async function patchNote(id: string, patch: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase.from('notes').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Note;
}

export async function softDeleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ── journal_entries ───────────────────────────────────────────────────────────

export async function fetchJournalToday(): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('date', today())
    .maybeSingle();
  if (error) throw error;
  return data as JournalEntry | null;
}

export async function upsertJournalToday(patch: JournalPatch): Promise<JournalEntry> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert({ user_id: userId, date: today(), ...patch }, { onConflict: 'user_id,date' })
    .select('*')
    .single();
  if (error) throw error;
  return data as JournalEntry;
}
