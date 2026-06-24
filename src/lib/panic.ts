import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["panic_status"];
type Kind = Database["public"]["Enums"]["panic_kind"];

export const PANIC_STATUS_LABEL: Record<Status, string> = {
  activa: "Activa",
  atendida: "Atendida",
  resuelta: "Resuelta",
  cancelada: "Cancelada",
};

export const PANIC_STATUS_STYLE: Record<Status, string> = {
  activa: "bg-red-100 text-red-700",
  atendida: "bg-amber-50 text-amber-700",
  resuelta: "bg-emerald-50 text-emerald-700",
  cancelada: "bg-gray-100 text-gray-500",
};

export const PANIC_KIND_LABEL: Record<Kind, string> = {
  medica: "Médica",
  seguridad: "Seguridad",
  incendio: "Incendio",
  otro: "Otra",
};
