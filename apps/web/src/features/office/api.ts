import { supabase } from '@/lib/supabase';
import type {
  Document, InsurancePolicy, Vehicle, VehicleService, B2bSettlement, Employment, Vacation,
  NewDocumentInput, NewInsurancePolicyInput, NewVehicleInput, NewVehicleServiceInput,
  NewB2bSettlementInput, NewVacationInput,
  OfficeCategory, OfficeTask, NewOfficeTaskInput,
} from './types';

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function safeFilename(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'document';
}

// ── documents ─────────────────────────────────────────────────────────────────

export async function fetchDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('expires_on', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function insertDocument(input: NewDocumentInput): Promise<Document> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      name: input.name,
      category_id: input.category_id ?? null,
      category: input.category ?? 'Dokumenty',
      doc_number: input.doc_number ?? null,
      issue_date: input.issue_date ?? null,
      expires_on: input.expires_on ?? null,
      reminder_enabled: input.reminder_enabled ?? false,
      notes: input.notes ?? '',
      file_path: input.file_path ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Document;
}

export async function patchDocument(id: string, patch: Partial<Document>): Promise<Document> {
  const { data, error } = await supabase.from('documents').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadDocumentFile(documentId: string, file: File): Promise<Document> {
  const userId = await uid();
  const path = `${userId}/${documentId}/${Date.now()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  return patchDocument(documentId, { file_path: path });
}

export async function createDocumentFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeDocumentFile(documentId: string, path: string): Promise<Document> {
  const { error } = await supabase.storage.from('documents').remove([path]);
  if (error) throw error;
  return patchDocument(documentId, { file_path: null });
}

// ── insurance_policies ────────────────────────────────────────────────────────

export async function fetchInsurancePolicies(): Promise<InsurancePolicy[]> {
  const { data, error } = await supabase
    .from('insurance_policies')
    .select('*')
    .order('end_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as InsurancePolicy[]).map((r) => ({
    ...r,
    sum_insured: r.sum_insured != null ? Number(r.sum_insured) : null,
    premium: r.premium != null ? Number(r.premium) : null,
  }));
}

export async function insertInsurancePolicy(input: NewInsurancePolicyInput): Promise<InsurancePolicy> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('insurance_policies')
    .insert({ user_id: userId, ...input })
    .select('*')
    .single();
  if (error) throw error;
  return data as InsurancePolicy;
}

export async function patchInsurancePolicy(id: string, patch: Partial<InsurancePolicy>): Promise<InsurancePolicy> {
  const { data, error } = await supabase.from('insurance_policies').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as InsurancePolicy;
}

export async function deleteInsurancePolicy(id: string): Promise<void> {
  const { error } = await supabase.from('insurance_policies').delete().eq('id', id);
  if (error) throw error;
}

// ── vehicles ──────────────────────────────────────────────────────────────────

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function insertVehicle(input: NewVehicleInput): Promise<Vehicle> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      user_id: userId,
      name: input.name,
      plate: input.plate ?? null,
      mileage: input.mileage ?? 0,
      insurance_expiry: input.insurance_expiry ?? null,
      inspection_date: input.inspection_date ?? null,
      oil_change_date: input.oil_change_date ?? null,
      tire_change_date: input.tire_change_date ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchVehicleServices(vehicleId?: string | null): Promise<VehicleService[]> {
  let q = supabase.from('vehicle_services').select('*').order('due_on', { ascending: true, nullsFirst: false });
  if (vehicleId) q = q.eq('vehicle_id', vehicleId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as VehicleService[]).map((r) => ({ ...r, cost: r.cost != null ? Number(r.cost) : null }));
}

export async function insertVehicleService(input: NewVehicleServiceInput): Promise<VehicleService> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('vehicle_services')
    .insert({ user_id: userId, vehicle_id: input.vehicle_id ?? null, type: input.type, date: input.date ?? today(), cost: input.cost ?? null, due_on: input.due_on ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as VehicleService;
}

export async function deleteVehicleService(id: string): Promise<void> {
  const { error } = await supabase.from('vehicle_services').delete().eq('id', id);
  if (error) throw error;
}

// ── b2b_settlements ───────────────────────────────────────────────────────────

export async function fetchB2bSettlements(): Promise<B2bSettlement[]> {
  const { data, error } = await supabase
    .from('b2b_settlements')
    .select('*')
    .order('month', { ascending: false })
    .limit(24);
  if (error) throw error;
  return ((data ?? []) as B2bSettlement[]).map((r) => ({
    ...r, zus: Number(r.zus), pit: Number(r.pit), vat: Number(r.vat),
  }));
}

export async function upsertB2bSettlement(input: NewB2bSettlementInput): Promise<B2bSettlement> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('b2b_settlements')
    .upsert({ user_id: userId, month: input.month, zus: input.zus ?? 0, pit: input.pit ?? 0, vat: input.vat ?? 0 }, { onConflict: 'user_id,month' })
    .select('*')
    .single();
  if (error) throw error;
  return data as B2bSettlement;
}

export async function patchB2bSettlement(id: string, patch: Partial<B2bSettlement>): Promise<B2bSettlement> {
  const { data, error } = await supabase.from('b2b_settlements').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as B2bSettlement;
}

// ── employment ────────────────────────────────────────────────────────────────

export async function fetchEmployment(): Promise<Employment[]> {
  const { data, error } = await supabase.from('employment').select('*').order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Employment[];
}

export async function insertEmployment(employer: string, position?: string | null, startDate?: string | null, vacationPool?: number): Promise<Employment> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('employment')
    .insert({ user_id: userId, employer, position: position ?? null, start_date: startDate ?? null, vacation_pool: vacationPool ?? 26 })
    .select('*')
    .single();
  if (error) throw error;
  return data as Employment;
}

export async function deleteEmployment(id: string): Promise<void> {
  const { error } = await supabase.from('employment').delete().eq('id', id);
  if (error) throw error;
}

// ── vacations ─────────────────────────────────────────────────────────────────

export async function fetchVacations(): Promise<Vacation[]> {
  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vacation[];
}

export async function insertVacation(input: NewVacationInput): Promise<Vacation> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('vacations')
    .insert({ user_id: userId, ...input, type: input.type ?? 'wypoczynkowy', status: input.status ?? 'planned', notes: input.notes ?? '' })
    .select('*')
    .single();
  if (error) throw error;
  return data as Vacation;
}

export async function patchVacation(id: string, patch: Partial<Vacation>): Promise<Vacation> {
  const { data, error } = await supabase.from('vacations').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Vacation;
}

export async function deleteVacation(id: string): Promise<void> {
  const { error } = await supabase.from('vacations').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchOfficeCategories(): Promise<OfficeCategory[]> {
  const { data, error } = await supabase.from('office_categories').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as OfficeCategory[];
}

export async function insertOfficeCategory(name: string): Promise<OfficeCategory> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('office_categories')
    .upsert({ user_id: userId, name }, { onConflict: 'user_id,name' })
    .select('*')
    .single();
  if (error) throw error;
  return data as OfficeCategory;
}

export async function deleteOfficeCategory(id: string): Promise<void> {
  const { error } = await supabase.from('office_categories').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchOfficeTasks(): Promise<OfficeTask[]> {
  const { data, error } = await supabase
    .from('office_tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OfficeTask[];
}

export async function insertOfficeTask(input: NewOfficeTaskInput): Promise<OfficeTask> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('office_tasks')
    .insert({
      user_id: userId,
      title: input.title,
      due_date: input.due_date ?? null,
      priority: input.priority ?? 'mid',
      institution: input.institution ?? '',
      category: input.category ?? 'Administracja',
      status: input.status ?? 'todo',
      notes: input.notes ?? '',
      is_archived: input.is_archived ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as OfficeTask;
}

export async function patchOfficeTask(id: string, patch: Partial<OfficeTask>): Promise<OfficeTask> {
  const { data, error } = await supabase.from('office_tasks').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as OfficeTask;
}

export async function deleteOfficeTask(id: string): Promise<void> {
  const { error } = await supabase.from('office_tasks').delete().eq('id', id);
  if (error) throw error;
}
