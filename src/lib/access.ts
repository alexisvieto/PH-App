import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const PASS_TYPE_LABEL: Record<Enums["visitor_pass_type"], string> = {
  visita: "Visita",
  evento: "Evento",
  recurrente: "Recurrente",
  domestico: "Doméstico",
  proveedor: "Proveedor",
  delivery: "Delivery",
};
export const PASS_TYPE_OPTIONS = Object.entries(PASS_TYPE_LABEL) as [
  Enums["visitor_pass_type"],
  string,
][];

export const LOG_DIRECTION_LABEL: Record<Enums["log_direction"], string> = {
  entrada: "Entrada",
  salida: "Salida",
};

export const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Estado efectivo de un pase (combina status guardado con vigencia/usos). */
export function passState(p: {
  status: string;
  valid_to: string;
  max_uses: number | null;
  uses_count: number;
}): { label: string; className: string } {
  if (p.status === "anulado") return { label: "Anulado", className: "bg-gray-100 text-gray-500" };
  const today = new Date().toISOString().slice(0, 10);
  if (p.valid_to < today) return { label: "Vencido", className: "bg-gray-100 text-gray-500" };
  if (p.max_uses !== null && p.uses_count >= p.max_uses)
    return { label: "Agotado", className: "bg-gray-100 text-gray-500" };
  return { label: "Activo", className: "bg-emerald-50 text-emerald-700" };
}
