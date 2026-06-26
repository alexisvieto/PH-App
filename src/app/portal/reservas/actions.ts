"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import {
  createReservation,
  getUnitOverdueMonths,
  MAX_OVERDUE_MONTHS,
  OVERDUE_BLOCK_MESSAGE,
} from "@/lib/reservas-server";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El residente reserva un área para una de sus unidades. */
export async function createResidentReservation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const res = await getResidentContext();
  if (!res?.orgId) return { error: "Sin organización.", ok: false };

  const unitId = String(formData.get("unit_id") ?? "");
  // El residente solo reserva para SUS unidades (defensa además de la RLS).
  if (!res.units.some((u) => u.id === unitId))
    return { error: "Selecciona una de tus unidades.", ok: false };

  // Bloqueo por morosidad: con 2+ meses de cuota vencidos no puede reservar.
  if ((await getUnitOverdueMonths(unitId)) >= MAX_OVERDUE_MONTHS)
    return { error: OVERDUE_BLOCK_MESSAGE, ok: false };

  const guestsRaw = String(formData.get("guests") ?? "").trim();
  const guests = guestsRaw === "" ? null : Number(guestsRaw);
  if (guests !== null && (!Number.isInteger(guests) || guests < 1))
    return { error: "Número de invitados inválido.", ok: false };

  const r = await createReservation({
    orgId: res.orgId,
    userId: res.userId,
    areaId: String(formData.get("area_id") ?? ""),
    unitId,
    date: String(formData.get("date") ?? ""),
    start: String(formData.get("start_time") ?? ""),
    end: String(formData.get("end_time") ?? ""),
    guests,
    notes: String(formData.get("notes") ?? ""),
  });
  if (!r.ok) return { error: r.error, ok: false };
  return { error: null, ok: true };
}

export async function cancelReservation(reservationId: string): Promise<ActionState> {
  const res = await getResidentContext();
  if (!res?.orgId) return { error: "Sin organización.", ok: false };
  if (!UUID.test(reservationId)) return { error: "Reserva inválida.", ok: false };

  const supabase = await createClient();
  // La RLS permite al residente dejar su reserva en 'cancelada' (solo eso).
  const { error } = await supabase
    .from("area_reservations")
    .update({ status: "cancelada" })
    .eq("id", reservationId)
    .eq("organization_id", res.orgId)
    .in("status", ["pendiente", "aprobada"]);
  if (error) {
    console.error("cancelReservation:", error.code, error.message);
    return { error: "No se pudo cancelar la reserva.", ok: false };
  }
  revalidatePath("/portal/reservas");
  return { error: null, ok: true };
}
