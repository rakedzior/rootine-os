import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTrips, insertTrip, patchTrip, deleteTrip,
  fetchTripItems, insertTripItem, deleteTripItem,
  fetchTripDocuments, insertTripDocument, deleteTripDocument,
  fetchBucketList, insertBucketItem, patchBucketItem, deleteBucketItem,
  fetchTripBudget,
} from './api';
import type {
  Trip, TripItem, BucketListItem,
  NewTripInput, NewTripItemInput, NewTripDocumentInput, NewBucketItemInput,
} from './types';

const TRIPS_KEY = ['trips'] as const;
const DOCS_KEY = ['trip_documents'] as const;
const BUCKET_KEY = ['bucket_list'] as const;

export function useTrips() {
  return useQuery({ queryKey: TRIPS_KEY, queryFn: fetchTrips });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTripInput) => insertTrip(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRIPS_KEY }),
  });
}

export function usePatchTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Trip> }) => patchTrip(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRIPS_KEY }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TRIPS_KEY });
      const prev = qc.getQueryData<Trip[]>(TRIPS_KEY);
      qc.setQueryData<Trip[]>(TRIPS_KEY, (old) => (old ?? []).filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(TRIPS_KEY, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: TRIPS_KEY }),
  });
}

export function useTripItems(tripId?: string | null) {
  return useQuery({
    queryKey: ['trip_items', tripId ?? 'all'],
    queryFn: () => fetchTripItems(tripId),
  });
}

export function useAddTripItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTripItemInput) => insertTripItem(input),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['trip_items', v.trip_id ?? 'all'] }),
  });
}

export function useDeleteTripItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; tripId: string | null }) => deleteTripItem(id),
    onMutate: async ({ id, tripId }) => {
      const key = ['trip_items', tripId ?? 'all'];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TripItem[]>(key);
      qc.setQueryData<TripItem[]>(key, (old) => (old ?? []).filter((i) => i.id !== id));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev); },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: ['trip_items', v.tripId ?? 'all'] }),
  });
}

export function useTripDocuments() {
  return useQuery({ queryKey: DOCS_KEY, queryFn: fetchTripDocuments });
}

export function useAddTripDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTripDocumentInput) => insertTripDocument(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
}

export function useDeleteTripDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTripDocument(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: DOCS_KEY });
      const prev = qc.getQueryData(DOCS_KEY);
      qc.setQueryData(DOCS_KEY, (old: unknown[]) => (old ?? []).filter((d: any) => d.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(DOCS_KEY, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
}

export function useBucketList() {
  return useQuery({ queryKey: BUCKET_KEY, queryFn: fetchBucketList });
}

export function useAddBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBucketItemInput) => insertBucketItem(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUCKET_KEY }),
  });
}

export function usePatchBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BucketListItem> }) => patchBucketItem(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUCKET_KEY }),
  });
}

export function useDeleteBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBucketItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: BUCKET_KEY });
      const prev = qc.getQueryData<BucketListItem[]>(BUCKET_KEY);
      qc.setQueryData<BucketListItem[]>(BUCKET_KEY, (old) => (old ?? []).filter((b) => b.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(BUCKET_KEY, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: BUCKET_KEY }),
  });
}

export function useTripBudget(tripId: string | null) {
  return useQuery({
    queryKey: ['trip_budget', tripId],
    queryFn: () => fetchTripBudget(tripId!),
    enabled: !!tripId,
  });
}
