export interface Document {
  id: string;
  user_id: string;
  category_id: string | null;
  category: string;
  name: string;
  doc_number: string | null;
  doc_number_ciphertext?: string | null;
  file_path: string | null;
  issue_date: string | null;
  expires_on: string | null;
  reminder_enabled: boolean;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsurancePolicy {
  id: string;
  user_id: string;
  name: string | null;
  type: string;
  insurer: string;
  sum_insured: number | null;
  premium: number | null;
  start_date: string | null;
  end_date: string | null;
  expiry_date: string | null;
  frequency: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  plate: string | null;
  vin: string | null;
  mileage: number;
  insurance_expiry: string | null;
  inspection_date: string | null;
  oil_change_date: string | null;
  tire_change_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleService {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  type: string;
  date: string;
  cost: number | null;
  due_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface B2bSettlement {
  id: string;
  user_id: string;
  month: string;
  zus: number;
  pit: number;
  vat: number;
  status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface Employment {
  id: string;
  user_id: string;
  employer: string;
  position: string | null;
  start_date: string | null;
  vacation_pool: number;
  created_at: string;
  updated_at: string;
}

export interface Vacation {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  days: number;
  type: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type OfficeTaskPriority = 'low' | 'mid' | 'high';
export type OfficeTaskStatus = 'todo' | 'active' | 'waiting' | 'done' | 'blocked';

export interface OfficeCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface OfficeTask {
  id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  priority: OfficeTaskPriority;
  institution: string;
  category: string;
  status: OfficeTaskStatus;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewDocumentInput {
  category_id?: string | null;
  category?: string;
  name: string;
  doc_number?: string | null;
  issue_date?: string | null;
  expires_on?: string | null;
  reminder_enabled?: boolean;
  notes?: string;
  file_path?: string | null;
}

export interface NewInsurancePolicyInput {
  name?: string | null;
  type: string;
  insurer: string;
  sum_insured?: number | null;
  premium?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  expiry_date?: string | null;
  frequency?: string;
  notes?: string;
}

export interface NewVehicleInput {
  name: string;
  plate?: string | null;
  mileage?: number;
  insurance_expiry?: string | null;
  inspection_date?: string | null;
  oil_change_date?: string | null;
  tire_change_date?: string | null;
}

export interface NewVehicleServiceInput {
  vehicle_id?: string | null;
  type: string;
  date?: string;
  cost?: number | null;
  due_on?: string | null;
}

export interface NewB2bSettlementInput {
  month: string;
  zus?: number;
  pit?: number;
  vat?: number;
}

export interface NewVacationInput {
  start_date: string;
  end_date: string;
  days: number;
  type?: string;
  status?: string;
  notes?: string;
}

export interface NewOfficeTaskInput {
  title: string;
  due_date?: string | null;
  priority?: OfficeTaskPriority;
  institution?: string;
  category?: string;
  status?: OfficeTaskStatus;
  notes?: string;
  is_archived?: boolean;
}
