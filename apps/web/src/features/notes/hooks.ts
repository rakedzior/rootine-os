import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCollections, insertCollection, deleteCollection,
  fetchNotes, insertNote, patchNote, softDeleteNote,
  fetchJournalToday, upsertJournalToday,
} from './api';
import type { Note, NewNoteInput, JournalPatch } from './types';

const COLLECTIONS_KEY = ['note_collections'] as const;
const NOTES_KEY = ['notes'] as const;
const JOURNAL_TODAY_KEY = ['journal_entries', 'today'] as const;

export function useCollections() {
  return useQuery({ queryKey: COLLECTIONS_KEY, queryFn: fetchCollections });
}

export function useAddCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => insertCollection(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useNotes(collectionId?: string | null) {
  return useQuery({
    queryKey: [...NOTES_KEY, collectionId ?? 'all'],
    queryFn: () => fetchNotes(collectionId),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewNoteInput) => insertNote(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function usePinNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => patchNote(id, { pinned }),
    onMutate: async ({ id, pinned }) => {
      await qc.cancelQueries({ queryKey: NOTES_KEY });
      const prev = qc.getQueryData<Note[]>([...NOTES_KEY, 'all']);
      qc.setQueryData<Note[]>([...NOTES_KEY, 'all'], (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, pinned } : n)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData([...NOTES_KEY, 'all'], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteNote(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTES_KEY });
      const prev = qc.getQueryData<Note[]>([...NOTES_KEY, 'all']);
      qc.setQueryData<Note[]>([...NOTES_KEY, 'all'], (old) => (old ?? []).filter((n) => n.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData([...NOTES_KEY, 'all'], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useJournalToday() {
  return useQuery({ queryKey: JOURNAL_TODAY_KEY, queryFn: fetchJournalToday });
}

export function useUpsertJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: JournalPatch) => upsertJournalToday(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: JOURNAL_TODAY_KEY }),
  });
}
