import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDocuments, insertDocument, deleteDocument,
  fetchInsurancePolicies, insertInsurancePolicy, patchInsurancePolicy, deleteInsurancePolicy,
  fetchVehicles, insertVehicle, deleteVehicle,
  fetchVehicleServices, insertVehicleService, deleteVehicleService,
  fetchB2bSettlements, upsertB2bSettlement, patchB2bSettlement,
  fetchEmployment, insertEmployment, deleteEmployment,
  fetchVacations, insertVacation, deleteVacation,
} from './api';
import type {
  InsurancePolicy, B2bSettlement,
  NewDocumentInput, NewInsurancePolicyInput, NewVehicleInput, NewVehicleServiceInput,
  NewB2bSettlementInput, NewVacationInput,
} from './types';

const DOCS_KEY = ['office_documents'] as const;
const INSURANCE_KEY = ['insurance_policies'] as const;
const VEHICLES_KEY = ['vehicles'] as const;
const VEH_SERVICES_KEY = ['vehicle_services'] as const;
const B2B_KEY = ['b2b_settlements'] as const;
const EMPLOYMENT_KEY = ['employment'] as const;
const VACATIONS_KEY = ['vacations'] as const;

export function useOfficeDocs() {
  return useQuery({ queryKey: DOCS_KEY, queryFn: fetchDocuments });
}

export function useAddOfficeDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewDocumentInput) => insertDocument(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
}

export function useDeleteOfficeDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  });
}

export function useInsurancePolicies() {
  return useQuery({ queryKey: INSURANCE_KEY, queryFn: fetchInsurancePolicies });
}

export function useAddInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewInsurancePolicyInput) => insertInsurancePolicy(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}

export function usePatchInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<InsurancePolicy> }) => patchInsurancePolicy(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}

export function useDeleteInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInsurancePolicy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}

export function useVehicles() {
  return useQuery({ queryKey: VEHICLES_KEY, queryFn: fetchVehicles });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewVehicleInput) => insertVehicle(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useVehicleServices(vehicleId?: string | null) {
  return useQuery({
    queryKey: [...VEH_SERVICES_KEY, vehicleId ?? 'all'],
    queryFn: () => fetchVehicleServices(vehicleId),
  });
}

export function useAddVehicleService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewVehicleServiceInput) => insertVehicleService(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: VEH_SERVICES_KEY }),
  });
}

export function useDeleteVehicleService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVehicleService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VEH_SERVICES_KEY }),
  });
}

export function useB2bSettlements() {
  return useQuery({ queryKey: B2B_KEY, queryFn: fetchB2bSettlements });
}

export function useUpsertB2b() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewB2bSettlementInput) => upsertB2bSettlement(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: B2B_KEY }),
  });
}

export function usePatchB2b() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<B2bSettlement> }) => patchB2bSettlement(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: B2B_KEY }),
  });
}

export function useEmployment() {
  return useQuery({ queryKey: EMPLOYMENT_KEY, queryFn: fetchEmployment });
}

export function useAddEmployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employer, position, startDate, vacationPool }: { employer: string; position?: string | null; startDate?: string | null; vacationPool?: number }) =>
      insertEmployment(employer, position, startDate, vacationPool),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYMENT_KEY }),
  });
}

export function useDeleteEmployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYMENT_KEY }),
  });
}

export function useVacations() {
  return useQuery({ queryKey: VACATIONS_KEY, queryFn: fetchVacations });
}

export function useAddVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewVacationInput) => insertVacation(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: VACATIONS_KEY }),
  });
}

export function useDeleteVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVacation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: VACATIONS_KEY }),
  });
}
