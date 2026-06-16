import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const TICKET_CATEGORY_LABEL: Record<Enums["ticket_category"], string> = {
  queja: "Queja",
  solicitud: "Solicitud",
  sugerencia: "Sugerencia",
};

export const TICKET_STATUS_LABEL: Record<Enums["ticket_status"], string> = {
  abierta: "Abierta",
  en_proceso: "En proceso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

export const TICKET_STATUS_CLASS: Record<Enums["ticket_status"], string> = {
  abierta: "bg-amber-50 text-amber-700",
  en_proceso: "bg-sky-50 text-sky-700",
  resuelta: "bg-emerald-50 text-emerald-700",
  cerrada: "bg-gray-100 text-gray-600",
};

export const TICKET_CATEGORY_OPTIONS = Object.entries(
  TICKET_CATEGORY_LABEL,
) as [Enums["ticket_category"], string][];
export const TICKET_STATUS_OPTIONS = Object.entries(TICKET_STATUS_LABEL) as [
  Enums["ticket_status"],
  string,
][];
