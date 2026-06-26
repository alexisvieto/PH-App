"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { createReservation } from "@/lib/reservas-server";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HHMM = /^\d{2}:\d{2}$/;

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export async function createArea(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre del área es obligatorio.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Selecciona un edificio.", ok: false };

  const open = String(formData.get("open_time") ?? "06:00");
  const close = String(formData.get("close_time") ?? "22:00");
  if (!HHMM.test(open) || !HHMM.test(close) || close <= open)
    return { error: "Horario de apertura/cierre inválido.", ok: false };

  const ICON_KEYS = ["party", "bbq", "elevator", "truck", "gym", "pool", "garden", "default"];
  const iconRaw = String(formData.get("icon") ?? "default");
  const icon = ICON_KEYS.includes(iconRaw) ? iconRaw : "default";

  const supabase = await createClient();
  const { data: building } = await supabase
    .from("buildings")
    .select("id")
    .eq("id", buildingId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!building) return { error: "Edificio no encontrado.", ok: false };

  const { error } = await supabase.from("common_areas").insert({
    organization_id: orgId,
    building_id: buildingId,
    name,
    icon,
    description: String(formData.get("description") ?? "").trim() || null,
    capacity: intOrNull(formData.get("capacity")),
    open_time: open,
    close_time: close,
    max_minutes: intOrNull(formData.get("max_minutes")),
    advance_days: intOrNull(formData.get("advance_days")) ?? 90,
    requires_approval: formData.get("requires_approval") === "on",
    rules: String(formData.get("rules") ?? "").trim() || null,
  });
  if (error) {
    console.error("createArea:", error.code, error.message);
    return { error: "No se pudo crear el área.", ok: false };
  }
  revalidatePath("/app/reservas");
  return { error: null, ok: true };
}

/** El administrador reserva un área a nombre de una unidad (auto-aprobada). */
export async function createStaffReservation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  // "__block__" = bloqueo del área sin unidad (mantenimiento / evento del edificio).
  const raw = String(formData.get("unit_id") ?? "");
  let unitId: string | null = null;
  if (raw !== "__block__") {
    if (!UUID.test(raw)) return { error: "Selecciona una unidad.", ok: false };
    const supabase = await createClient();
    const { data: unit } = await supabase
      .from("units")
      .select("id")
      .eq("id", raw)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!unit) return { error: "Unidad no encontrada.", ok: false };
    unitId = raw;
  }

  const guestsRaw = String(formData.get("guests") ?? "").trim();
  const guests = guestsRaw === "" ? null : Number(guestsRaw);
  if (guests !== null && (!Number.isInteger(guests) || guests < 1))
    return { error: "Número de invitados inválido.", ok: false };

  const r = await createReservation({
    orgId,
    userId: ctx.userId,
    areaId: String(formData.get("area_id") ?? ""),
    unitId,
    date: String(formData.get("date") ?? ""),
    start: String(formData.get("start_time") ?? ""),
    end: String(formData.get("end_time") ?? ""),
    guests,
    notes: String(formData.get("notes") ?? ""),
    forceApprove: true,
  });
  if (!r.ok) return { error: r.error, ok: false };
  return { error: null, ok: true };
}

export async function setAreaActive(areaId: string, active: boolean): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(areaId)) return { error: "Área inválida.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("common_areas")
    .update({ active })
    .eq("id", areaId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("setAreaActive:", error.code, error.message);
    return { error: "No se pudo actualizar el área.", ok: false };
  }
  revalidatePath("/app/reservas");
  return { error: null, ok: true };
}

/** Aprobar o rechazar una reserva (solo staff; la RLS lo exige). */
export async function reviewReservation(
  reservationId: string,
  decision: "aprobada" | "rechazada",
  note?: string,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(reservationId)) return { error: "Reserva inválida.", ok: false };
  if (decision !== "aprobada" && decision !== "rechazada")
    return { error: "Decisión inválida.", ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("area_reservations")
    .update({
      status: decision,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      review_note: (note ?? "").trim() || null,
    })
    .eq("id", reservationId)
    .eq("organization_id", orgId)
    .eq("status", "pendiente")
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("reviewReservation:", error.code, error.message);
    return { error: "No se pudo procesar la reserva.", ok: false };
  }
  if (!data) return { error: "La reserva ya fue procesada.", ok: false };

  revalidatePath("/app/reservas");
  revalidatePath("/portal/reservas");
  return { error: null, ok: true };
}
