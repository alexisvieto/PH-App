import { formatDate } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const PASS_TYPE_LABEL: Record<Enums["visitor_pass_type"], string> = {
  visita: "Visita",
  evento: "Evento",
  recurrente: "Recurrente",
  domestico: "Doméstico",
  indefinido: "Indefinido",
  proveedor: "Proveedor",
  delivery: "Delivery",
};
// Tipos ofrecidos en el formulario (curado). El enum conserva los demás
// (domestico/proveedor/delivery) para pases históricos; aquí solo se muestran
// los vigentes: Visita absorbe proveedor/delivery; Recurrente/Indefinido cubren
// al personal doméstico.
const PASS_TYPE_FORM: Enums["visitor_pass_type"][] = ["visita", "evento", "recurrente", "indefinido"];
export const PASS_TYPE_OPTIONS = PASS_TYPE_FORM.map(
  (v) => [v, PASS_TYPE_LABEL[v]] as [Enums["visitor_pass_type"], string],
);

export const LOG_DIRECTION_LABEL: Record<Enums["log_direction"], string> = {
  entrada: "Entrada",
  salida: "Salida",
};

export const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type PassLike = {
  status: string;
  valid_to: string | null; // null = indefinido (sin vencimiento)
  max_uses: number | null;
  uses_count: number;
};

/** ¿El pase sigue activo (no anulado, vigente y con usos)? Hora de Panamá. */
export function isPassActive(p: PassLike): boolean {
  if (p.status === "anulado") return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  if (p.valid_to && p.valid_to < today) return false;
  if (p.max_uses !== null && p.uses_count >= p.max_uses) return false;
  return true;
}

/** Estado efectivo de un pase (combina status guardado con vigencia/usos). */
export function passState(p: PassLike): { label: string; className: string } {
  if (p.status === "anulado") return { label: "Anulado", className: "bg-gray-100 text-gray-500" };
  // Fecha en hora de Panamá, igual que la validación de garita (canEnterNow).
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  if (p.valid_to && p.valid_to < today) return { label: "Vencido", className: "bg-gray-100 text-gray-500" };
  if (p.max_uses !== null && p.uses_count >= p.max_uses)
    return { label: "Agotado", className: "bg-gray-100 text-gray-500" };
  return { label: "Activo", className: "bg-emerald-50 text-emerald-700" };
}

/** Texto de vigencia de un pase: rango de fechas, o "Indefinido" si no vence. */
export function vigenciaText(validFrom: string, validTo: string | null): string {
  return validTo ? `${formatDate(validFrom)} — ${formatDate(validTo)}` : "Indefinido";
}
