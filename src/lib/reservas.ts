import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const RESERVATION_STATUS_LABEL: Record<Enums["reservation_status"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const RESERVATION_STATUS_STYLE: Record<Enums["reservation_status"], string> = {
  pendiente: "bg-amber-50 text-amber-700",
  aprobada: "bg-emerald-50 text-emerald-700",
  rechazada: "bg-red-50 text-red-700",
  cancelada: "bg-gray-100 text-gray-500",
};

/** 'HH:MM' o 'HH:MM:SS' → '8:00 a. m.' (hora de 12h en español). */
export function fmtTime(t: string): string {
  const [hStr, m] = t.split(":");
  let h = Number(hStr);
  const ap = h < 12 ? "a. m." : "p. m.";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ap}`;
}

/** Minutos desde medianoche para una hora 'HH:MM'. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
