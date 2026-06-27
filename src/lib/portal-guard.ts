import { redirect } from "next/navigation";

import { getResidentContext } from "@/lib/session";

/**
 * Redirige al inicio del portal si el residente es INQUILINO.
 * Defensa para las páginas dueño-only (finanzas, votaciones, proyectos, pagos).
 * La RLS ya bloquea los datos; esto evita mostrar una página vacía o rota.
 */
export async function blockTenant(): Promise<void> {
  const res = await getResidentContext();
  if (res?.residentType === "inquilino") redirect("/portal");
}
