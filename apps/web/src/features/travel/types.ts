export type TripStatus = 'planned' | 'active' | 'done' | 'completed' | 'archived';
export type TripItemType = 'flight' | 'lodging' | 'transport' | 'attraction' | 'packing';
export type DocStatus = 'valid' | 'expiring' | 'expired';
export type BucketStatus = 'dream' | 'planned' | 'done';

export interface Trip {
  id: string;
  user_id: string;
  dest: string;
  country: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  notes: string | null;
  budget: number | null;
  cover_emoji: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripItem {
  id: string;
  user_id: string;
  trip_id: string | null;
  type: TripItemType;
  title: string;
  datetime: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TripDocument {
  id: string;
  user_id: string;
  trip_id: string | null;
  name: string;
  expires_on: string | null;
  status: DocStatus;
  created_at: string;
  updated_at: string;
}

export interface TripBudgetItem {
  id: string;
  user_id: string;
  trip_id: string | null;
  category: string;
  planned: number;
  actual: number;
  created_at: string;
  updated_at: string;
}

export interface BucketListItem {
  id: string;
  user_id: string;
  name: string;
  note: string | null;
  status: BucketStatus;
  created_at: string;
  updated_at: string;
}

export interface NewTripInput {
  dest: string;
  country?: string | null;
  city?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: TripStatus;
  notes?: string | null;
  budget?: number | null;
  cover_emoji?: string;
  is_archived?: boolean;
}

export interface NewTripItemInput {
  trip_id?: string | null;
  type?: TripItemType;
  title: string;
  datetime?: string | null;
}

export interface NewTripDocumentInput {
  trip_id?: string | null;
  name: string;
  expires_on?: string | null;
  status?: DocStatus;
}

export interface NewBucketItemInput {
  name: string;
  note?: string | null;
  status?: BucketStatus;
}
