"use server";

import { revalidatePath } from "next/cache";

import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IntercomCreate =
  | { ok: true; requestId: string; contactName: string | null }
  | { ok: false; error: string };

/** El guardia "llama" a una unidad: crea una solicitud y resuelve a quién avisar
 *  (inquilino si está alquilada, propietario principal si no). */
export async function createIntercom(
  unitId: string,
  visitorName: string,
  photoPath?: string | null,
): Promise<IntercomCreate> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };
  if (!UUID.test(unitId)) return { ok: false, error: "Selecciona una unidad." };
  const name = (visitorName ?? "").trim();
  if (!name) return { ok: false, error: "El nombre del visitante es obligatorio." };

  const docPath = (photoPath ?? "").trim() || null;
  if (docPath && !docPath.startsWith(`${orgId}/accesos/`))
    return { ok: false, error: "Ruta de foto inválida." };

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("building_id, is_rented, tenant_name")
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) return { ok: false, error: "Unidad no encontrada." };

  // Solo el NOMBRE para la etiqueta del guardia ("Esperando a…"). El TELÉFONO
  // del residente nunca sale al cliente: privacidad (el aviso llega in-app).
  let contactName: string | null = null;
  if (unit.is_rented && (unit.tenant_name ?? "").trim()) {
    contactName = unit.tenant_name;
  } else {
    const { data: own } = await supabase
      .from("unit_ownerships")
      .select("person_id")
      .eq("unit_id", unitId)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .eq("is_primary", true)
      .maybeSingle();
    if (own?.person_id) {
      const { data: p } = await supabase
        .from("people")
        .select("full_name")
        .eq("id", own.person_id)
        .maybeSingle();
      contactName = p?.full_name ?? null;
    }
  }

  const { data: req, error } = await supabase
    .from("intercom_requests")
    .insert({
      organization_id: orgId,
      building_id: unit.building_id,
      unit_id: unitId,
      guard_id: ctx.userId,
      visitor_name: name,
      photo_path: docPath,
    })
    .select("id")
    .maybeSingle();
  if (error || !req) {
    console.error("createIntercom:", error?.code, error?.message);
    return { ok: false, error: "No se pudo iniciar la llamada." };
  }

  revalidatePath("/app/garita");
  return { ok: true, requestId: req.id, contactName };
}

export async function cancelIntercom(requestId: string): Promise<{ ok: boolean; error: string | null }> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };
  if (!UUID.test(requestId)) return { ok: false, error: "Solicitud inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("intercom_requests")
    .update({ status: "cancelada" })
    .eq("id", requestId)
    .eq("organization_id", orgId)
    .eq("status", "pendiente");
  if (error) return { ok: false, error: "No se pudo cancelar." };
  return { ok: true, error: null };
}
