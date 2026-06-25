import "server-only";

import { revalidatePath } from "next/cache";

import { fmtTime, timeToMinutes } from "@/lib/reservas";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISODATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

type Result = { ok: boolean; error: string | null; autoApproved?: boolean };

/**
 * Crea una reserva validando reglas del área y evitando choques de horario.
 * La RLS garantiza el acceso (el residente solo reserva para su unidad; el
 * staff para su organización). Usado por staff y residente.
 */
export async function createReservation(vars: {
  orgId: string;
  userId: string | null;
  areaId: string;
  unitId: string;
  date: string;
  start: string;
  end: string;
  guests?: number | null;
  notes?: string;
  forceApprove?: boolean;
}): Promise<Result> {
  if (!UUID.test(vars.areaId)) return { ok: false, error: "Selecciona un área." };
  if (!UUID.test(vars.unitId)) return { ok: false, error: "Selecciona una unidad." };
  if (!ISODATE.test(vars.date)) return { ok: false, error: "Fecha inválida." };
  if (!HHMM.test(vars.start) || !HHMM.test(vars.end))
    return { ok: false, error: "Horario inválido." };
  if (timeToMinutes(vars.end) <= timeToMinutes(vars.start))
    return { ok: false, error: "La hora de fin debe ser mayor a la de inicio." };

  const supabase = await createClient();
  const { data: area } = await supabase
    .from("common_areas")
    .select("building_id, open_time, close_time, max_minutes, advance_days, active, capacity, requires_approval")
    .eq("id", vars.areaId)
    .eq("organization_id", vars.orgId)
    .maybeSingle();
  if (!area) return { ok: false, error: "Área no encontrada." };
  if (!area.active) return { ok: false, error: "El área no está disponible." };

  const todayPa = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  if (vars.date < todayPa) return { ok: false, error: "No puedes reservar en una fecha pasada." };
  const diffDays = Math.round((Date.parse(vars.date) - Date.parse(todayPa)) / 86400000);
  if (diffDays > area.advance_days)
    return { ok: false, error: `Solo puedes reservar hasta con ${area.advance_days} días de anticipación.` };

  const open = area.open_time.slice(0, 5);
  const close = area.close_time.slice(0, 5);
  if (vars.start < open || vars.end > close)
    return { ok: false, error: `El horario debe estar entre ${fmtTime(open)} y ${fmtTime(close)}.` };
  if (area.max_minutes && timeToMinutes(vars.end) - timeToMinutes(vars.start) > area.max_minutes)
    return { ok: false, error: `La reserva no puede durar más de ${area.max_minutes} minutos.` };
  if (area.capacity && vars.guests && vars.guests > area.capacity)
    return { ok: false, error: `El aforo máximo es ${area.capacity} personas.` };

  // Choque con otra reserva activa del mismo día (pendiente o aprobada).
  const { data: others } = await supabase
    .from("area_reservations")
    .select("start_time, end_time")
    .eq("area_id", vars.areaId)
    .eq("reservation_date", vars.date)
    .in("status", ["pendiente", "aprobada"]);
  const s = timeToMinutes(vars.start);
  const e = timeToMinutes(vars.end);
  const clash = (others ?? []).some(
    (o) => s < timeToMinutes(o.end_time.slice(0, 5)) && e > timeToMinutes(o.start_time.slice(0, 5)),
  );
  if (clash) return { ok: false, error: "Ese horario ya está reservado. Elige otro." };

  // El staff es la autoridad: su reserva se aprueba aunque el área exija revisión.
  const autoApprove = vars.forceApprove === true || !area.requires_approval;
  const { error } = await supabase.from("area_reservations").insert({
    organization_id: vars.orgId,
    building_id: area.building_id,
    area_id: vars.areaId,
    unit_id: vars.unitId,
    reserved_by: vars.userId,
    reservation_date: vars.date,
    start_time: vars.start,
    end_time: vars.end,
    guests: vars.guests ?? null,
    notes: (vars.notes ?? "").trim() || null,
    status: autoApprove ? "aprobada" : "pendiente",
    reviewed_at: autoApprove ? new Date().toISOString() : null,
  });
  if (error) {
    console.error("createReservation:", error.code, error.message);
    return { ok: false, error: "No se pudo crear la reserva." };
  }

  revalidatePath("/app/reservas");
  revalidatePath("/portal/reservas");
  return { ok: true, error: null, autoApproved: autoApprove };
}
