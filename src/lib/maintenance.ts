import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const EQUIPMENT_CATEGORY_LABEL: Record<Enums["equipment_category"], string> = {
  elevador: "Elevador",
  piscina: "Piscina",
  gimnasio: "Gimnasio",
  planta_electrica: "Planta eléctrica",
  bomba: "Bomba",
  tanque_reserva: "Tanque de reserva",
  alarma_incendio: "Alarma contra incendio",
  aire_acondicionado: "Aire acondicionado",
  computadora: "Computadora",
  jardin: "Jardín",
  herramienta: "Herramienta",
  otro: "Otro",
};

export const EQUIPMENT_STATUS_LABEL: Record<Enums["equipment_status"], string> = {
  operativo: "Operativo",
  en_reparacion: "En reparación",
  fuera_servicio: "Fuera de servicio",
};

export const EQUIPMENT_STATUS_CLASS: Record<Enums["equipment_status"], string> = {
  operativo: "bg-emerald-50 text-emerald-700",
  en_reparacion: "bg-amber-50 text-amber-700",
  fuera_servicio: "bg-red-50 text-red-700",
};

export const ANOMALY_STATUS_LABEL: Record<Enums["anomaly_status"], string> = {
  abierta: "Abierta",
  resuelta: "Resuelta",
};

export const ANOMALY_STATUS_CLASS: Record<Enums["anomaly_status"], string> = {
  abierta: "bg-amber-50 text-amber-700",
  resuelta: "bg-emerald-50 text-emerald-700",
};

export const ANOMALY_STATUS_OPTIONS = Object.entries(
  ANOMALY_STATUS_LABEL,
) as [Enums["anomaly_status"], string][];

export const EQUIPMENT_CATEGORY_OPTIONS = Object.entries(
  EQUIPMENT_CATEGORY_LABEL,
) as [Enums["equipment_category"], string][];
export const EQUIPMENT_STATUS_OPTIONS = Object.entries(
  EQUIPMENT_STATUS_LABEL,
) as [Enums["equipment_status"], string][];

/** Días dentro de los cuales un mantenimiento se considera "próximo". */
export const MAINTENANCE_SOON_DAYS = 14;

export type MaintenanceAlert = {
  kind: "vencido" | "proximo" | "ok" | "sin_programar";
  label: string;
  className: string;
};

/** Clasifica el estado de una fecha límite para alertas. `soonDays` define la
 *  ventana de "próximo" (14 para mantenimiento; 30 para vencimiento de contrato). */
export function maintenanceAlert(
  nextMaintenance: string | null,
  soonDays: number = MAINTENANCE_SOON_DAYS,
): MaintenanceAlert {
  if (!nextMaintenance) {
    return { kind: "sin_programar", label: "Sin programar", className: "bg-gray-100 text-gray-500" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${nextMaintenance}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)
    return { kind: "vencido", label: "Vencido", className: "bg-red-50 text-red-700" };
  if (diffDays <= soonDays)
    return { kind: "proximo", label: "Próximo", className: "bg-amber-50 text-amber-700" };
  return { kind: "ok", label: "Al día", className: "bg-emerald-50 text-emerald-700" };
}
