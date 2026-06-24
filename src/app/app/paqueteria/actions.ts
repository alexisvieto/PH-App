"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Registra un paquete recibido en garita, dirigido a una unidad.
 * Solo staff/guardia (RLS lo exige); el residente recibe el aviso, no escribe.
 */
export async function registerPackage(vars: {
  unitId: string;
  courier?: string;
  notes?: string;
  photoPath?: string | null;
}): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(vars.unitId)) return { error: "Selecciona una unidad.", ok: false };

  const photoPath = (vars.photoPath ?? "").trim() || null;
  if (photoPath && !photoPath.startsWith(`${orgId}/paquetes/`))
    return { error: "Ruta de foto inválida.", ok: false };

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("building_id")
    .eq("id", vars.unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.from("packages").insert({
    organization_id: orgId,
    building_id: unit.building_id,
    unit_id: vars.unitId,
    courier: (vars.courier ?? "").trim() || null,
    notes: (vars.notes ?? "").trim() || null,
    photo_path: photoPath,
    received_by: ctx.userId,
  });
  if (error) {
    console.error("registerPackage:", error.code, error.message);
    return { error: "No se pudo registrar el paquete.", ok: false };
  }

  revalidatePath("/app/paqueteria");
  revalidatePath("/portal", "layout"); // refresca la campanita y la lista del residente
  return { error: null, ok: true };
}

/**
 * Marca un paquete como entregado: registra quién lo entregó y cuándo, y a
 * quién se le dio (opcional) — deslinda la custodia del guardia. Limpia el
 * aviso del residente (sale de "en garita").
 */
export async function deliverPackage(
  packageId: string,
  deliveredTo?: string,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(packageId)) return { error: "Paquete inválido.", ok: false };

  const supabase = await createClient();
  // `.eq("status","en_garita")` evita la doble entrega; el `.select()` permite
  // distinguir "0 filas" (ya entregado / no existe) de una entrega real.
  const { data, error } = await supabase
    .from("packages")
    .update({
      status: "entregado",
      delivered_at: new Date().toISOString(),
      delivered_by: ctx.userId,
      delivered_to: (deliveredTo ?? "").trim() || null,
    })
    .eq("id", packageId)
    .eq("organization_id", orgId)
    .eq("status", "en_garita")
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("deliverPackage:", error.code, error.message);
    return { error: "No se pudo marcar como entregado.", ok: false };
  }
  if (!data) return { error: "Este paquete ya fue entregado.", ok: false };

  revalidatePath("/app/paqueteria");
  revalidatePath("/portal", "layout"); // baja la campanita del residente
  return { error: null, ok: true };
}
