import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const CONTRACT_TYPE_LABEL: Record<Enums["contract_type"], string> = {
  indefinido: "Tiempo indefinido",
  definido: "Tiempo definido",
};

export const WORK_SHIFT_LABEL: Record<Enums["work_shift"], string> = {
  diurna: "Diurna",
  mixta: "Mixta",
  nocturna: "Nocturna",
};

export const PAY_FREQUENCY_LABEL: Record<Enums["pay_frequency"], string> = {
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export const EMPLOYEE_STATUS_LABEL: Record<Enums["employee_status"], string> = {
  activo: "Activo",
  inactivo: "Inactivo",
};

export const TERMINATION_SCENARIO_LABEL: Record<Enums["termination_scenario"], string> = {
  renuncia: "Renuncia voluntaria",
  mutuo_acuerdo: "Mutuo acuerdo",
  despido_injustificado: "Despido injustificado",
};

export const TERMINATION_REASON_LABEL: Record<string, string> = {
  renuncia: "Renuncia",
  despido: "Despido",
  mutuo_acuerdo: "Mutuo acuerdo",
  otro: "Otro",
};
export const TERMINATION_REASON_OPTIONS = Object.entries(TERMINATION_REASON_LABEL);

export const WARNING_TYPE_LABEL: Record<string, string> = {
  verbal: "Verbal",
  escrita: "Escrita",
  suspension: "Suspensión",
};
export const WARNING_TYPE_OPTIONS = Object.entries(WARNING_TYPE_LABEL);

export const CONTRACT_TYPE_OPTIONS = Object.entries(
  CONTRACT_TYPE_LABEL,
) as [Enums["contract_type"], string][];
export const WORK_SHIFT_OPTIONS = Object.entries(
  WORK_SHIFT_LABEL,
) as [Enums["work_shift"], string][];
export const PAY_FREQUENCY_OPTIONS = Object.entries(
  PAY_FREQUENCY_LABEL,
) as [Enums["pay_frequency"], string][];
export const TERMINATION_SCENARIO_OPTIONS = Object.entries(
  TERMINATION_SCENARIO_LABEL,
) as [Enums["termination_scenario"], string][];
