"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type BuildingType = Database["public"]["Enums"]["building_type"];
type UnitType = Database["public"]["Enums"]["unit_type"];
type UnitStatus = Database["public"]["Enums"]["unit_status"];

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Valida que un valor sea miembro del enum (defensa ante FormData manipulado). */
function inEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export async function createBuilding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio.", ok: false };
  const type = (String(formData.get("type") ?? "") || "residencial") as BuildingType;
  if (!inEnum(type, Constants.public.Enums.building_type))
    return { error: "Tipo de edificio inválido.", ok: false };
  const address = String(formData.get("address") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("buildings")
    .insert({ organization_id: orgId, name, type, address });
  if (error) return { error: error.message, ok: false };

  revalidatePath("/app/edificios");
  revalidatePath("/app");
  return { error: null, ok: true };
}

export async function createUnit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!buildingId) return { error: "Falta el edificio.", ok: false };
  if (!code) return { error: "El código de la unidad es obligatorio.", ok: false };

  const type = (String(formData.get("type") ?? "") || "apartamento") as UnitType;
  if (!inEnum(type, Constants.public.Enums.unit_type))
    return { error: "Tipo de unidad inválido.", ok: false };
  const status = (String(formData.get("status") ?? "") || "desocupada") as UnitStatus;
  if (!inEnum(status, Constants.public.Enums.unit_status))
    return { error: "Estado de unidad inválido.", ok: false };
  const floor = String(formData.get("floor") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("units").insert({
    organization_id: orgId,
    building_id: buildingId,
    code,
    type,
    status,
    floor,
    area_m2: num(formData.get("area_m2")),
    coefficient: num(formData.get("coefficient")) ?? 0,
    parking_spots: num(formData.get("parking_spots")) ?? 0,
    monthly_fee: num(formData.get("monthly_fee")) ?? 0,
  });
  if (error) {
    if (error.code === "23505")
      return { error: `Ya existe una unidad "${code}" en este edificio.`, ok: false };
    return { error: error.message, ok: false };
  }

  revalidatePath(`/app/edificios/${buildingId}`);
  revalidatePath("/app");
  return { error: null, ok: true };
}

/** Actualiza la cuota de mantenimiento de una unidad (override individual). */
export async function setUnitFee(unitId: string, amount: number): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede editar la cuota.", ok: false };
  if (!Number.isFinite(amount) || amount < 0) return { error: "Monto inválido.", ok: false };

  const supabase = await createClient();
  const { data: unit, error } = await supabase
    .from("units")
    .update({ monthly_fee: amount })
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .select("building_id")
    .maybeSingle();
  if (error) return { error: error.message, ok: false };
  if (unit?.building_id) {
    revalidatePath(`/app/edificios/${unit.building_id}`);
    revalidatePath(`/app/edificios/${unit.building_id}/unidades/${unitId}`);
  }
  return { error: null, ok: true };
}
