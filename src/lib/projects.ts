import type { Database } from "@/lib/supabase/database.types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  abierto: "Abierto a cotizaciones",
  adjudicado: "Adjudicado",
  cerrado: "Cerrado",
};

export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  abierto: "bg-amber-50 text-amber-700",
  adjudicado: "bg-emerald-50 text-emerald-700",
  cerrado: "bg-gray-100 text-gray-500",
};

/** Carpeta de las cotizaciones en el bucket privado `ph-proyectos`. */
export function quoteFolder(orgId: string, projectId: string) {
  return `${orgId}/proyectos/${projectId}/`;
}
