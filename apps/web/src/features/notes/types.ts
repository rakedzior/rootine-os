export type NoteType = 'note' | 'checklist' | 'quote';

export interface NoteCollection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  collection_id: string | null;
  type: NoteType;
  title: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  prompt: string | null;
  body: string;
  mood: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewNoteInput {
  collection_id?: string | null;
  type?: NoteType;
  title?: string | null;
  body: string;
  pinned?: boolean;
}

export interface JournalPatch {
  body: string;
  prompt?: string | null;
  mood?: number | null;
}
