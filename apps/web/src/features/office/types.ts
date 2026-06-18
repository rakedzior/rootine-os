export interface Document {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  doc_number: string | null;
  file_path: string | null;
  expires_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsurancePolicy {
  id: string;
  user_id: string;
  type: string;
  insurer: string;
  sum_insured: number | null;
  premium: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  plate: string | null;
  vin: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface NewDocumentInput {
  category_id?: string | null;
  name: string;
  doc_number?: string | null;
  expires_on?: string | null;
}

export interface NewInsurancePolicyInput {
  type: string;
  insurer: string;
  sum_insured?: number | null;
  premium?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface NewVehicleInput {
  name: string;
  plate?: string | null;
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
}
