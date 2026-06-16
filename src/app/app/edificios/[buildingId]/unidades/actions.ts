"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];
type ChargeConcept = Database["public"]["Enums"]["charge_concept"];

// Cargos manuales: multa / extraordinaria / otro (la cuota de mantenimiento
// se crea por el RPC de generación, no a mano).
const MANUAL_CONCEPTS: ChargeConcept[] = ["multa", "extraordinaria", "otro"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Edificio dueño de la unidad (para revalidar). Respeta RLS. */
async function buildingOf(unitId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("units")
    .select("building_id")
    .eq("id", unitId)
    .maybeSingle();
  return { supabase, buildingId: data?.building_id ?? null };
}

function revalidateUnit(buildingId: string, unitId: string) {
  revalidatePath(`/app/edificios/${buildingId}/unidades/${unitId}`);
  revalidatePath(`/app/edificios/${buildingId}/unidades/${unitId}/estado`);
  revalidatePath(`/app/edificios/${buildingId}`);
  revalidatePath(`/app/edificios/${buildingId}/cobros`);
  revalidatePath("/app");
}

/** Agrega un cargo manual (multa, extraordinaria u otro) a una unidad. */
export async function createCharge(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede agregar cargos.", ok: false };

  const unitId = String(formData.get("unit_id") ?? "");
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };

  const concept = String(formData.get("concept") ?? "") as ChargeConcept;
  if (!MANUAL_CONCEPTS.includes(concept))
    return { error: "Concepto de cargo inválido.", ok: false };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a cero.", ok: false };

  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "").trim();
  if (dueDate && !ISO_DATE.test(dueDate))
    return { error: "Fecha de vencimiento inválida.", ok: false };

  const { supabase, buildingId } = await buildingOf(unitId);
  if (!buildingId) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.from("charges").insert({
    organization_id: orgId,
    building_id: buildingId,
    unit_id: unitId,
    concept,
    description,
    amount,
    ...(dueDate ? { due_date: dueDate } : {}),
  });
  if (error) return { error: error.message, ok: false };

  revalidateUnit(buildingId, unitId);
  return { error: null, ok: true };
}

/** Registra un pago/abono de una unidad (ledger). */
export async function createPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede registrar pagos.", ok: false };

  const unitId = String(formData.get("unit_id") ?? "");
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a cero.", ok: false };

  const paidOn = String(formData.get("paid_on") ?? "").trim();
  if (paidOn && !ISO_DATE.test(paidOn))
    return { error: "Fecha de pago inválida.", ok: false };

  const method = String(formData.get("method") ?? "") as PaymentMethod;
  if (!(Constants.public.Enums.payment_method as readonly string[]).includes(method))
    return { error: "Método de pago inválido.", ok: false };

  const reference = String(formData.get("reference") ?? "").trim() || null;

  const { supabase, buildingId } = await buildingOf(unitId);
  if (!buildingId) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.from("payments").insert({
    organization_id: orgId,
    building_id: buildingId,
    unit_id: unitId,
    amount,
    method,
    reference,
    ...(paidOn ? { paid_on: paidOn } : {}),
  });
  if (error) return { error: error.message, ok: false };

  revalidateUnit(buildingId, unitId);
  return { error: null, ok: true };
}

/**
 * Transferencia de titularidad (venta). La atomicidad, la validación de
 * pertenencia de la persona a la org y el ajuste de `units.status` los
 * garantiza el RPC `transfer_ownership` (SECURITY DEFINER).
 */
export async function transferOwnership(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const unitId = String(formData.get("unit_id") ?? "");
  const personId = String(formData.get("person_id") ?? "");
  const acquiredOn = String(formData.get("acquired_on") ?? "").trim();
  if (!UUID.test(unitId) || !UUID.test(personId))
    return { error: "Falta la unidad o el propietario.", ok: false };
  if (acquiredOn && !ISO_DATE.test(acquiredOn))
    return { error: "Fecha de adquisición inválida.", ok: false };

  const { supabase, buildingId } = await buildingOf(unitId);
  if (!buildingId) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.rpc("transfer_ownership", {
    p_unit_id: unitId,
    p_person_id: personId,
    ...(acquiredOn ? { p_acquired_on: acquiredOn } : {}),
  });
  if (error) return { error: error.message, ok: false };

  revalidateUnit(buildingId, unitId);
  return { error: null, ok: true };
}

/** Registra un arrendamiento (cierra el anterior). Atómico vía RPC. */
export async function createLease(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const unitId = String(formData.get("unit_id") ?? "");
  const tenantPersonId = String(formData.get("tenant_person_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "").trim();
  const rentRaw = String(formData.get("rent_amount") ?? "").trim();
  if (!UUID.test(unitId) || !UUID.test(tenantPersonId))
    return { error: "Falta la unidad o el inquilino.", ok: false };
  if (startDate && !ISO_DATE.test(startDate))
    return { error: "Fecha de inicio inválida.", ok: false };
  const rent = rentRaw === "" ? null : Number(rentRaw);
  if (rent !== null && (!Number.isFinite(rent) || rent < 0))
    return { error: "Canon inválido.", ok: false };

  const { supabase, buildingId } = await buildingOf(unitId);
  if (!buildingId) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.rpc("register_lease", {
    p_unit_id: unitId,
    p_tenant_person_id: tenantPersonId,
    ...(startDate ? { p_start_date: startDate } : {}),
    ...(rent !== null ? { p_rent: rent } : {}),
  });
  if (error) return { error: error.message, ok: false };

  revalidateUnit(buildingId, unitId);
  return { error: null, ok: true };
}

/** Termina el arrendamiento activo. Atómico vía RPC. */
export async function endLease(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const unitId = String(formData.get("unit_id") ?? "");
  if (!UUID.test(unitId)) return { error: "Falta la unidad.", ok: false };

  const { supabase, buildingId } = await buildingOf(unitId);
  if (!buildingId) return { error: "Unidad no encontrada.", ok: false };

  const { error } = await supabase.rpc("end_lease", { p_unit_id: unitId });
  if (error) return { error: error.message, ok: false };

  revalidateUnit(buildingId, unitId);
  return { error: null, ok: true };
}
