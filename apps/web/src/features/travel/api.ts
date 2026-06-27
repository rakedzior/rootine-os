import { supabase } from '@/lib/supabase';
import type {
  Trip, TripItem, TripDocument, TripBudgetItem, BucketListItem,
  NewTripInput, NewTripItemInput, NewTripDocumentInput, NewBucketItemInput,
} from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

// ── trips ─────────────────────────────────────────────────────────────────────

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Trip[];
}

export async function insertTrip(input: NewTripInput): Promise<Trip> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      dest: input.dest,
      country: input.country ?? null,
      city: input.city ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      status: input.status ?? 'planned',
      notes: input.notes ?? null,
      budget: input.budget ?? null,
      cover_emoji: input.cover_emoji ?? '',
      is_archived: input.is_archived ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Trip;
}

export async function patchTrip(id: string, patch: Partial<Trip>): Promise<Trip> {
  const { data, error } = await supabase.from('trips').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Trip;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

// ── trip_items ────────────────────────────────────────────────────────────────

export async function fetchTripItems(tripId?: string | null): Promise<TripItem[]> {
  let q = supabase.from('trip_items').select('*').order('datetime', { ascending: true });
  if (tripId) q = q.eq('trip_id', tripId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TripItem[];
}

export async function insertTripItem(input: NewTripItemInput): Promise<TripItem> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('trip_items')
    .insert({ user_id: userId, trip_id: input.trip_id ?? null, type: input.type ?? 'attraction', title: input.title, datetime: input.datetime ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as TripItem;
}

export async function deleteTripItem(id: string): Promise<void> {
  const { error } = await supabase.from('trip_items').delete().eq('id', id);
  if (error) throw error;
}

// ── trip_documents ────────────────────────────────────────────────────────────

export async function fetchTripDocuments(): Promise<TripDocument[]> {
  const { data, error } = await supabase
    .from('trip_documents')
    .select('*')
    .order('expires_on', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as TripDocument[];
}

export async function insertTripDocument(input: NewTripDocumentInput): Promise<TripDocument> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('trip_documents')
    .insert({ user_id: userId, trip_id: input.trip_id ?? null, name: input.name, expires_on: input.expires_on ?? null, status: input.status ?? 'valid' })
    .select('*')
    .single();
  if (error) throw error;
  return data as TripDocument;
}

export async function deleteTripDocument(id: string): Promise<void> {
  const { error } = await supabase.from('trip_documents').delete().eq('id', id);
  if (error) throw error;
}

// ── bucket_list ───────────────────────────────────────────────────────────────

export async function fetchBucketList(): Promise<BucketListItem[]> {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BucketListItem[];
}

export async function insertBucketItem(input: NewBucketItemInput): Promise<BucketListItem> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('bucket_list')
    .insert({ user_id: userId, name: input.name, note: input.note ?? null, status: input.status ?? 'dream' })
    .select('*')
    .single();
  if (error) throw error;
  return data as BucketListItem;
}

export async function patchBucketItem(id: string, patch: Partial<BucketListItem>): Promise<BucketListItem> {
  const { data, error } = await supabase.from('bucket_list').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as BucketListItem;
}

export async function deleteBucketItem(id: string): Promise<void> {
  const { error } = await supabase.from('bucket_list').delete().eq('id', id);
  if (error) throw error;
}

// ── trip_budget_items ─────────────────────────────────────────────────────────

export async function fetchTripBudget(tripId: string): Promise<TripBudgetItem[]> {
  const { data, error } = await supabase
    .from('trip_budget_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('category', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TripBudgetItem[]).map((r) => ({ ...r, planned: Number(r.planned), actual: Number(r.actual) }));
}
