export type NoteType = 'note' | 'sticky' | 'full' | 'checklist' | 'quote';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

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
  color: string;
  category: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  checklist_items: ChecklistItem[];
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
  color?: string;
  category?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  checklist_items?: ChecklistItem[];
}

export interface JournalPatch {
  body: string;
  prompt?: string | null;
  mood?: number | null;
}
