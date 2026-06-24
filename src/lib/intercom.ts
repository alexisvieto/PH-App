import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["intercom_status"];

export const INTERCOM_STATUS_LABEL: Record<Status, string> = {
  pendiente: "Esperando respuesta",
  autorizada: "Autorizada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const INTERCOM_STATUS_STYLE: Record<Status, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  autorizada: "bg-emerald-50 text-emerald-700",
  rechazada: "bg-red-50 text-red-700",
  cancelada: "bg-gray-100 text-gray-500",
};
