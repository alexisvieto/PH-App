"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isEnum = <T extends keyof Enums>(name: T, v: string) =>
  (Constants.public.Enums[name] as readonly string[]).includes(v);
const numOrNull = (v: FormDataEntryValue | null | undefined) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// --------------------------------------------------------------------------
// Unidad (piso + letra + metraje + coeficiente)
// --------------------------------------------------------------------------
export async function createUnit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Selecciona un edificio.", ok: false };
  const floor = String(formData.get("floor") ?? "").trim();
  const letter = String(formData.get("letter") ?? "").trim().toUpperCase();
  if (!floor) return { error: "El piso es obligatorio.", ok: false };
  if (!letter) return { error: "La letra/identificador del apartamento es obligatoria.", ok: false };

  const unitType = String(formData.get("type") ?? "apartamento");
  if (!isEnum("unit_type", unitType)) return { error: "Tipo de unidad inválido.", ok: false };

  const code = `${floor}${letter}`;
  const supabase = await createClient();
  const { error } = await supabase.from("units").insert({
    organization_id: orgId,
    building_id: buildingId,
    code,
    floor,
    letter,
    type: unitType as Enums["unit_type"],
    area_m2: numOrNull(formData.get("area_m2")) ?? undefined,
    coefficient: numOrNull(formData.get("coefficient")) ?? undefined,
    created_by: ctx.userId,
  });
  if (error) {
    if (error.code === "23505") return { error: `Ya existe la unidad ${code} en ese edificio.`, ok: false };
    console.error("createUnit:", error.code, error.message);
    return { error: "No se pudo crear la unidad (revisa el edificio).", ok: false };
  }
  revalidatePath("/app/propietarios");
  return { error: null, ok: true };
}

async function loadUnit(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, unitId: string) {
  const { data } = await supabase
    .from("units")
    .select("id, building_id")
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return data;
}

// --------------------------------------------------------------------------
// Propietarios de una unidad (sin límite). person + unit_ownership.
// --------------------------------------------------------------------------
export async function addOwner(
  unitId: string,
  vars: {
    fullName: string;
    docType: string;
    docNumber: string;
    email: string;
    phone: string;
    isPrimary: boolean;
    acquiredOn: string;
  },
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  const fullName = (vars.fullName ?? "").trim();
  if (!fullName) return { error: "El nombre es obligatorio.", ok: false };
  if (vars.docType && !isEnum("doc_type", vars.docType)) return { error: "Tipo de documento inválido.", ok: false };
  if (vars.acquiredOn && !isValidIsoDate(vars.acquiredOn)) return { error: "Fecha de adquisición inválida.", ok: false };

  // RPC atómico: persona + titularidad (+ limpia el principal anterior) en una transacción.
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_unit_owner", {
    p_unit_id: unitId,
    p_full_name: fullName,
    p_doc_type: vars.docType || "cedula",
    p_doc_number: vars.docNumber || "",
    p_email: vars.email || "",
    p_phone: vars.phone || "",
    p_is_primary: vars.isPrimary,
    p_acquired_on: vars.acquiredOn || undefined,
  });
  if (error) {
    console.error("addOwner:", error.code, error.message);
    const msg = error.code === "P0001" ? error.message : "No se pudo agregar al propietario.";
    return { error: msg, ok: false };
  }
  revalidatePath(`/app/propietarios/${unitId}`);
  return { error: null, ok: true };
}

/** Transferencia por venta: crea al nuevo dueño + cierra el anterior (RPC atómico). */
export async function transferSale(
  unitId: string,
  vars: { fullName: string; docType: string; docNumber: string; email: string; phone: string; acquiredOn: string },
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  const fullName = (vars.fullName ?? "").trim();
  if (!fullName) return { error: "El nombre del nuevo dueño es obligatorio.", ok: false };
  if (vars.docType && !isEnum("doc_type", vars.docType)) return { error: "Tipo de documento inválido.", ok: false };
  if (vars.acquiredOn && !isValidIsoDate(vars.acquiredOn)) return { error: "Fecha de la venta inválida.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_sale", {
    p_unit_id: unitId,
    p_full_name: fullName,
    p_doc_type: vars.docType || "cedula",
    p_doc_number: vars.docNumber || "",
    p_email: vars.email || "",
    p_phone: vars.phone || "",
    ...(vars.acquiredOn ? { p_acquired_on: vars.acquiredOn } : {}),
  });
  if (error) {
    console.error("transferSale:", error.code, error.message);
    return { error: error.code === "P0001" ? error.message : "No se pudo registrar la venta.", ok: false };
  }
  revalidatePath(`/app/propietarios/${unitId}`);
  return { error: null, ok: true };
}

/** Da acceso al portal a un inquilino: crea persona + arrendamiento (RPC atómico).
 *  Su correo entra al padrón → se auto-registra y entra con la vista de inquilino. */
export async function grantTenantAccess(
  unitId: string,
  vars: { fullName: string; email: string; phone: string },
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  const fullName = (vars.fullName ?? "").trim();
  const email = (vars.email ?? "").trim();
  if (!fullName) return { error: "El nombre del inquilino es obligatorio.", ok: false };
  if (!email) return { error: "El correo del inquilino es obligatorio para darle acceso.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_tenant_access", {
    p_unit_id: unitId,
    p_full_name: fullName,
    p_email: email,
    p_phone: vars.phone || "",
  });
  if (error) {
    console.error("grantTenantAccess:", error.code, error.message);
    return { error: error.code === "P0001" ? error.message : "No se pudo dar acceso al inquilino.", ok: false };
  }
  revalidatePath(`/app/propietarios/${unitId}`);
  return { error: null, ok: true };
}

/** Retira el acceso del inquilino (cierra su arrendamiento activo). */
export async function revokeTenantAccess(unitId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_tenant_access", { p_unit_id: unitId });
  if (error) return { error: error.message, ok: false };
  revalidatePath(`/app/propietarios/${unitId}`);
  return { error: null, ok: true };
}

export async function removeOwner(ownershipId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  // Quitar un propietario es destructivo → admin (coincide con RLS de DELETE).
  if (!canManage(ctx.role)) return { error: "Solo un administrador puede quitar propietarios.", ok: false };
  if (!UUID.test(ownershipId)) return { error: "Inválido.", ok: false };

  const supabase = await createClient();
  const { data: own } = await supabase
    .from("unit_ownerships")
    .select("id, unit_id, person_id, is_primary")
    .eq("id", ownershipId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!own) return { error: "No encontrado.", ok: false };

  const { error: delErr } = await supabase
    .from("unit_ownerships")
    .delete()
    .eq("id", ownershipId)
    .eq("organization_id", orgId);
  if (delErr) {
    console.error("removeOwner delete:", delErr.code, delErr.message);
    return { error: "No se pudo quitar al propietario.", ok: false };
  }

  // Si era el contacto principal y quedan otros, se promueve al siguiente.
  if (own.is_primary) {
    const { data: next } = await supabase
      .from("unit_ownerships")
      .select("id")
      .eq("unit_id", own.unit_id)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next)
      await supabase
        .from("unit_ownerships")
        .update({ is_primary: true })
        .eq("id", next.id)
        .eq("organization_id", orgId);
  }

  // Si la persona no tiene otras titularidades (en esta org) ni acceso al portal, se elimina del padrón.
  const { data: others } = await supabase
    .from("unit_ownerships")
    .select("id")
    .eq("person_id", own.person_id)
    .eq("organization_id", orgId)
    .limit(1);
  const { data: person } = await supabase
    .from("people")
    .select("user_id")
    .eq("id", own.person_id)
    .eq("organization_id", orgId)
    .maybeSingle();
  if ((others ?? []).length === 0 && !person?.user_id) {
    await supabase.from("people").delete().eq("id", own.person_id).eq("organization_id", orgId);
  }

  revalidatePath(`/app/propietarios/${own.unit_id}`);
  return { error: null, ok: true };
}

export async function setPrimaryOwner(ownershipId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(ownershipId)) return { error: "Inválido.", ok: false };

  const supabase = await createClient();
  const { data: own } = await supabase
    .from("unit_ownerships")
    .select("id, unit_id")
    .eq("id", ownershipId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!own) return { error: "No encontrado.", ok: false };

  await supabase.from("unit_ownerships").update({ is_primary: false }).eq("unit_id", own.unit_id).eq("organization_id", orgId);
  const { error } = await supabase
    .from("unit_ownerships")
    .update({ is_primary: true })
    .eq("id", ownershipId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("setPrimaryOwner:", error.code, error.message);
    return { error: "No se pudo actualizar el contacto principal.", ok: false };
  }
  revalidatePath(`/app/propietarios/${own.unit_id}`);
  return { error: null, ok: true };
}

// --------------------------------------------------------------------------
// Información de la unidad (metraje + inquilino liviano)
// --------------------------------------------------------------------------
export async function saveUnitInfo(
  unitId: string,
  vars: { areaM2: number | null; isRented: boolean; tenantName: string; tenantPhone: string },
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  if (vars.areaM2 !== null && (!Number.isFinite(vars.areaM2) || vars.areaM2 < 0))
    return { error: "Metraje inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("units")
    .update({
      area_m2: vars.areaM2,
      is_rented: vars.isRented,
      tenant_name: vars.isRented ? vars.tenantName.trim() || null : null,
      tenant_phone: vars.isRented ? vars.tenantPhone.trim() || null : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", unitId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("saveUnitInfo:", error.code, error.message);
    return { error: "No se pudo guardar.", ok: false };
  }
  revalidatePath(`/app/propietarios/${unitId}`);
  revalidatePath("/app/propietarios");
  return { error: null, ok: true };
}

// --------------------------------------------------------------------------
// Estacionamientos / depósitos
// --------------------------------------------------------------------------
export async function addAmenity(
  unitId: string,
  vars: { type: string; location: string; identifier: string },
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  if (!isEnum("amenity_type", vars.type)) return { error: "Tipo inválido.", ok: false };

  const supabase = await createClient();
  const unit = await loadUnit(supabase, orgId, unitId);
  if (!unit) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.from("unit_amenities").insert({
    organization_id: orgId,
    unit_id: unitId,
    type: vars.type as Enums["amenity_type"],
    location: vars.location.trim() || null,
    identifier: vars.identifier.trim() || null,
  });
  if (error) {
    console.error("addAmenity:", error.code, error.message);
    return { error: "No se pudo agregar.", ok: false };
  }
  revalidatePath(`/app/propietarios/${unitId}`);
  return { error: null, ok: true };
}

export async function removeAmenity(amenityId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(amenityId)) return { error: "Inválido.", ok: false };

  const supabase = await createClient();
  const { data: am } = await supabase
    .from("unit_amenities")
    .select("id, unit_id")
    .eq("id", amenityId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!am) return { error: "No encontrado.", ok: false };
  await supabase.from("unit_amenities").delete().eq("id", amenityId).eq("organization_id", orgId);
  revalidatePath(`/app/propietarios/${am.unit_id}`);
  return { error: null, ok: true };
}
