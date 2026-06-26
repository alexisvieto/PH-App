"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type EquipmentCategory = Database["public"]["Enums"]["equipment_category"];
type EquipmentStatus = Database["public"]["Enums"]["equipment_status"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export async function createEquipment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Edificio inválido.", ok: false };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio.", ok: false };

  const category = String(formData.get("category") ?? "") as EquipmentCategory;
  if (!(Constants.public.Enums.equipment_category as readonly string[]).includes(category))
    return { error: "Categoría inválida.", ok: false };
  const status = String(formData.get("status") ?? "operativo") as EquipmentStatus;
  if (!(Constants.public.Enums.equipment_status as readonly string[]).includes(status))
    return { error: "Estado inválido.", ok: false };

  const quantity = intOrNull(formData.get("quantity")) ?? 1;
  if (quantity < 1) return { error: "La cantidad debe ser al menos 1.", ok: false };
  const serial = String(formData.get("serial_number") ?? "").trim() || null;
  if (serial && quantity !== 1)
    return { error: "Un equipo con número de serie debe tener cantidad 1.", ok: false };

  const next = String(formData.get("next_maintenance") ?? "").trim();
  if (next && !ISO_DATE.test(next))
    return { error: "Fecha de próximo mantenimiento inválida.", ok: false };

  const supplierRaw = String(formData.get("supplier_id") ?? "").trim();
  if (supplierRaw && !UUID.test(supplierRaw))
    return { error: "Proveedor inválido.", ok: false };

  const frequency = intOrNull(formData.get("maintenance_frequency_days"));
  if (frequency !== null && frequency < 1)
    return { error: "La frecuencia debe ser de al menos 1 día.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("equipment").insert({
    organization_id: orgId,
    building_id: buildingId,
    category,
    name,
    location: String(formData.get("location") ?? "").trim() || null,
    quantity,
    serial_number: serial,
    supplier_id: supplierRaw || null,
    maintenance_frequency_days: frequency,
    next_maintenance: next || null,
    status,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) {
    console.error("createEquipment:", error.code, error.message);
    return { error: "No se pudo guardar el equipo (revisa edificio/proveedor).", ok: false };
  }

  revalidatePath("/app/mantenimiento");
  return { error: null, ok: true };
}

export async function logMaintenance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const equipmentId = String(formData.get("equipment_id") ?? "");
  if (!UUID.test(equipmentId)) return { error: "Equipo inválido.", ok: false };

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "Describe el mantenimiento.", ok: false };

  const performedOn = String(formData.get("performed_on") ?? "").trim();
  if (performedOn && !ISO_DATE.test(performedOn))
    return { error: "Fecha inválida.", ok: false };

  const costRaw = String(formData.get("cost") ?? "").trim();
  const cost = costRaw === "" ? null : Number(costRaw);
  if (cost !== null && (!Number.isFinite(cost) || cost < 0))
    return { error: "Costo inválido.", ok: false };

  const supplierRaw = String(formData.get("supplier_id") ?? "").trim();
  if (supplierRaw && !UUID.test(supplierRaw))
    return { error: "Proveedor inválido.", ok: false };

  const supabase = await createClient();
  // org/building desde el equipo (RLS lo limita a la org del usuario).
  const { data: eq } = await supabase
    .from("equipment")
    .select("organization_id, building_id")
    .eq("id", equipmentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!eq) return { error: "Equipo no encontrado.", ok: false };

  const { error } = await supabase.from("maintenance_logs").insert({
    organization_id: eq.organization_id,
    building_id: eq.building_id,
    equipment_id: equipmentId,
    description,
    supplier_id: supplierRaw || null,
    cost,
    ...(performedOn ? { performed_on: performedOn } : {}),
  });
  if (error) {
    console.error("logMaintenance:", error.code, error.message);
    return { error: "No se pudo registrar el mantenimiento.", ok: false };
  }

  // El trigger recalcula equipment.next_maintenance.
  revalidatePath("/app/mantenimiento");
  revalidatePath(`/app/mantenimiento/${equipmentId}`);
  return { error: null, ok: true };
}

/**
 * Marca un equipo como atendido HOY (registro rápido): inserta un mantenimiento
 * con la fecha de hoy y limpia la alerta. Con frecuencia, el trigger reprograma
 * el próximo (hoy + frecuencia); sin frecuencia, deja el equipo "sin programar".
 */
export async function markAttended(equipmentId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(equipmentId)) return { error: "Equipo inválido.", ok: false };

  const supabase = await createClient();
  const { data: eq } = await supabase
    .from("equipment")
    .select("organization_id, building_id, maintenance_frequency_days")
    .eq("id", equipmentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!eq) return { error: "Equipo no encontrado.", ok: false };

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const { error } = await supabase.from("maintenance_logs").insert({
    organization_id: eq.organization_id,
    building_id: eq.building_id,
    equipment_id: equipmentId,
    description: "Mantenimiento realizado",
    performed_on: today,
  });
  if (error) {
    console.error("markAttended:", error.code, error.message);
    return { error: "No se pudo registrar el mantenimiento.", ok: false };
  }

  // Sin frecuencia el trigger no reprograma → limpiamos la alerta dejándolo sin programar.
  if (eq.maintenance_frequency_days === null) {
    await supabase.from("equipment").update({ next_maintenance: null }).eq("id", equipmentId);
  }

  revalidatePath("/app/mantenimiento");
  revalidatePath(`/app/mantenimiento/${equipmentId}`);
  return { error: null, ok: true };
}
