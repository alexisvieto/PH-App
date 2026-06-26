"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import { type OvertimeHours, xiiiPartidaWindow } from "@/lib/payroll/engine";
import { runPayrollPeriod } from "@/lib/payroll/run";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Crea un período de planilla ordinaria (borrador). */
export async function createPayrollPeriod(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };

  const frequency = String(formData.get("frequency") ?? "");
  if (!(Constants.public.Enums.pay_frequency as readonly string[]).includes(frequency))
    return { error: "Frecuencia inválida.", ok: false };
  const start = String(formData.get("period_start") ?? "").trim();
  const end = String(formData.get("period_end") ?? "").trim();
  if (!isValidIsoDate(start) || !isValidIsoDate(end))
    return { error: "Fechas del período inválidas.", ok: false };
  if (end < start) return { error: "El fin del período debe ser posterior al inicio.", ok: false };
  const payRaw = String(formData.get("pay_date") ?? "").trim();
  if (payRaw && !isValidIsoDate(payRaw)) return { error: "Fecha de pago inválida.", ok: false };
  const label = String(formData.get("label") ?? "").trim() || `Planilla ${start} — ${end}`;

  const supabase = await createClient();
  const { error } = await supabase.from("payroll_periods").insert({
    organization_id: orgId,
    kind: "ordinaria",
    label,
    frequency: frequency as Enums["pay_frequency"],
    period_start: start,
    period_end: end,
    pay_date: payRaw || null,
    created_by: ctx.userId,
  });
  if (error) {
    console.error("createPayrollPeriod:", error.code, error.message);
    return { error: "No se pudo crear el período.", ok: false };
  }
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}

/** Crea una partida del XIII mes (borrador) con su ventana de cuatrimestre. */
export async function createXiiiPeriod(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };

  const partida = Number(formData.get("partida"));
  const year = Number(formData.get("year"));
  if (![1, 2, 3].includes(partida)) return { error: "Partida inválida.", ok: false };
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    return { error: "Año inválido.", ok: false };

  const win = xiiiPartidaWindow(partida as 1 | 2 | 3, year);
  const supabase = await createClient();
  const { error } = await supabase.from("payroll_periods").insert({
    organization_id: orgId,
    kind: "xiii",
    label: `XIII mes · ${partida}ª partida ${year}`,
    frequency: "mensual",
    period_start: win.start,
    period_end: win.end,
    created_by: ctx.userId,
  });
  if (error) {
    console.error("createXiiiPeriod:", error.code, error.message);
    return { error: "No se pudo crear la partida.", ok: false };
  }
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}

// Mapeo tipo de incidencia (DB) ↔ campo de horas extra.
const OT_TYPES = {
  hora_extra_diurna: "diurna",
  hora_extra_nocturna: "nocturna",
  hora_extra_mixta: "mixta",
  dia_fiesta: "fiesta",
  hora_extra_fiesta_domingo: "fiestaDomingo",
} as const;
type OtIncidence = keyof typeof OT_TYPES;
const OT_INCIDENCE_TYPES = Object.keys(OT_TYPES) as OtIncidence[];

export type OvertimeEntry = { employeeId: string } & OvertimeHours;

/** Guarda (reemplaza) las horas extra manuales por empleado de un período ordinario. */
export async function saveOvertimeIncidences(
  periodId: string,
  entries: OvertimeEntry[],
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };
  if (!UUID.test(periodId)) return { error: "Período inválido.", ok: false };

  const supabase = await createClient();
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, kind, status")
    .eq("id", periodId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!period) return { error: "Período no encontrado.", ok: false };
  if (period.kind !== "ordinaria") return { error: "Solo aplica a planilla ordinaria.", ok: false };
  if (period.status === "pagada") return { error: "El período ya está pagado.", ok: false };

  type IncInsert = Database["public"]["Tables"]["payroll_incidences"]["Insert"];
  const rows: IncInsert[] = [];
  for (const e of entries) {
    if (!UUID.test(e.employeeId)) continue;
    for (const t of OT_INCIDENCE_TYPES) {
      const hours = Number(e[OT_TYPES[t]]);
      if (Number.isFinite(hours) && hours > 0) {
        rows.push({
          organization_id: orgId,
          payroll_period_id: periodId,
          employee_id: e.employeeId,
          type: t,
          hours: Math.round(hours * 100) / 100,
        });
      }
    }
  }

  // Reemplaza las incidencias de horas extra del período.
  await supabase
    .from("payroll_incidences")
    .delete()
    .eq("payroll_period_id", periodId)
    .in("type", OT_INCIDENCE_TYPES);
  if (rows.length > 0) {
    const { error } = await supabase.from("payroll_incidences").insert(rows);
    if (error) {
      console.error("saveOvertimeIncidences:", error.code, error.message);
      return { error: "No se pudieron guardar las horas extra.", ok: false };
    }
  }

  revalidatePath(`/app/planilla/${periodId}`);
  return { error: null, ok: true };
}

/** Procesa el período: calcula los renglones de todos los empleados activos. */
export async function processPayrollPeriod(periodId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };
  if (!UUID.test(periodId)) return { error: "Período inválido.", ok: false };

  const supabase = await createClient();
  const res = await runPayrollPeriod(supabase, orgId, periodId);
  if (!res.ok) return { error: res.error, ok: false };

  revalidatePath(`/app/planilla/${periodId}`);
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}

/** Marca el período como pagado. */
export async function markPeriodPaid(periodId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };
  if (!UUID.test(periodId)) return { error: "Período inválido.", ok: false };

  const supabase = await createClient();
  const todayPa = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  // Guard: solo se paga un período PROCESADO (no un borrador sin renglones).
  const { data, error } = await supabase
    .from("payroll_periods")
    .update({ status: "pagada", pay_date: todayPa })
    .eq("id", periodId)
    .eq("organization_id", orgId)
    .eq("status", "procesada")
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("markPeriodPaid:", error.code, error.message);
    return { error: "No se pudo registrar el pago.", ok: false };
  }
  if (!data) return { error: "El período debe estar procesado para registrar el pago.", ok: false };
  revalidatePath(`/app/planilla/${periodId}`);
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}
