import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const ORG_TYPE_LABEL: Record<Enums["org_type"], string> = {
  administradora: "Empresa administradora",
  self_managed: "PH autogestionado",
};

export const ORG_ROLE_LABEL: Record<Enums["org_role"], string> = {
  owner: "Propietario de la cuenta",
  administrador: "Administrador",
  asistente: "Asistente",
};

export const BUILDING_TYPE_LABEL: Record<Enums["building_type"], string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  mixto: "Mixto",
};

export const UNIT_TYPE_LABEL: Record<Enums["unit_type"], string> = {
  apartamento: "Apartamento",
  local: "Local",
  parqueo: "Parqueo",
  deposito: "Depósito",
  otro: "Otro",
};

export const UNIT_STATUS_LABEL: Record<Enums["unit_status"], string> = {
  ocupada: "Ocupada",
  desocupada: "Desocupada",
  en_venta: "En venta",
  en_alquiler: "En alquiler",
};

export const UNIT_STATUS_CLASS: Record<Enums["unit_status"], string> = {
  ocupada: "bg-emerald-50 text-emerald-700",
  desocupada: "bg-gray-100 text-gray-600",
  en_venta: "bg-amber-50 text-amber-700",
  en_alquiler: "bg-sky-50 text-sky-700",
};

export const DOC_TYPE_LABEL: Record<Enums["doc_type"], string> = {
  cedula: "Cédula",
  pasaporte: "Pasaporte",
  ruc: "RUC",
  otro: "Otro",
};

export const BUILDING_TYPE_OPTIONS = Object.entries(BUILDING_TYPE_LABEL) as [
  Enums["building_type"],
  string,
][];
export const UNIT_TYPE_OPTIONS = Object.entries(UNIT_TYPE_LABEL) as [
  Enums["unit_type"],
  string,
][];
export const UNIT_STATUS_OPTIONS = Object.entries(UNIT_STATUS_LABEL) as [
  Enums["unit_status"],
  string,
][];
export const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABEL) as [
  Enums["doc_type"],
  string,
][];
