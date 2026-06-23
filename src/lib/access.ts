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

type PassLike = {
  status: string;
  valid_to: string;
  max_uses: number | null;
  uses_count: number;
};

/** ¿El pase sigue activo (no anulado, vigente y con usos)? Hora de Panamá. */
export function isPassActive(p: PassLike): boolean {
  if (p.status === "anulado") return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  if (p.valid_to < today) return false;
  if (p.max_uses !== null && p.uses_count >= p.max_uses) return false;
  return true;
}

/** Estado efectivo de un pase (combina status guardado con vigencia/usos). */
export function passState(p: PassLike): { label: string; className: string } {
  if (p.status === "anulado") return { label: "Anulado", className: "bg-gray-100 text-gray-500" };
  // Fecha en hora de Panamá, igual que la validación de garita (canEnterNow).
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  if (p.valid_to < today) return { label: "Vencido", className: "bg-gray-100 text-gray-500" };
  if (p.max_uses !== null && p.uses_count >= p.max_uses)
    return { label: "Agotado", className: "bg-gray-100 text-gray-500" };
  return { label: "Activo", className: "bg-emerald-50 text-emerald-700" };
}
