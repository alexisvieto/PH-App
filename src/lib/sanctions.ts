import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const INFRACTION_TYPE_LABEL: Record<Enums["infraction_type"], string> = {
  llamado_atencion: "Llamado de atención",
  multa: "Multa",
};

export const INFRACTION_TYPE_CLASS: Record<Enums["infraction_type"], string> = {
  llamado_atencion: "bg-amber-50 text-amber-700",
  multa: "bg-red-50 text-red-700",
};

export const INFRACTION_TYPE_OPTIONS = Object.entries(
  INFRACTION_TYPE_LABEL,
) as [Enums["infraction_type"], string][];
