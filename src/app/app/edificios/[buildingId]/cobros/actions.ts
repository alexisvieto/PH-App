"use server";

import { revalidatePath } from "next/cache";

import type { ActionState, GenState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verifica que el edificio pertenezca a la org activa (anti-IDOR). */
async function buildingInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  buildingId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("buildings")
    .select("id")
    .eq("id", buildingId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

/** Guarda (upsert) la configuración de cuota del edificio. */
export async function saveFeeSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede configurar la cuota.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Edificio inválido.", ok: false };

  const lateFeePct = Number(formData.get("late_fee_pct"));
  if (!Number.isFinite(lateFeePct) || lateFeePct < 0 || lateFeePct > 20)
    return { error: "El recargo por morosidad debe estar entre 0% y 20%.", ok: false };

  const reservePct = Number(formData.get("reserve_pct"));
  if (!Number.isFinite(reservePct) || reservePct < 0 || reservePct > 100)
    return { error: "El aporte al Fondo de Imprevistos debe estar entre 0% y 100%.", ok: false };

  const lateDayRaw = String(formData.get("late_fee_day") ?? "").trim();
  const lateDay: number | null = lateDayRaw === "" ? null : Number(lateDayRaw);
  if (lateDay !== null && (!Number.isInteger(lateDay) || lateDay < 1 || lateDay > 28))
    return { error: "El día de corte debe estar entre 1 y 28.", ok: false };

  const supabase = await createClient();
  if (!(await buildingInOrg(supabase, buildingId, orgId)))
    return { error: "Edificio no encontrado.", ok: false };

  const { error } = await supabase
    .from("fee_settings")
    .upsert(
      {
        organization_id: orgId,
        building_id: buildingId,
        late_fee_pct: lateFeePct,
        late_fee_day: lateDay,
        reserve_pct: reservePct,
      },
      { onConflict: "building_id" },
    );
  if (error) return { error: error.message, ok: false };

  revalidatePath(`/app/edificios/${buildingId}/cobros`);
  return { error: null, ok: true };
}

/** Genera los cargos de mantenimiento del período (RPC admin-only, idempotente). */
export async function generateCharges(
  _prev: GenState,
  formData: FormData,
): Promise<GenState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false, count: 0 };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede generar cuotas.", ok: false, count: 0 };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId))
    return { error: "Edificio inválido.", ok: false, count: 0 };

  const month = String(formData.get("month") ?? "").trim(); // "YYYY-MM"
  if (!/^\d{4}-\d{2}$/.test(month))
    return { error: "Elige un mes válido.", ok: false, count: 0 };
  const period = `${month}-01`;
  const due = String(formData.get("due_date") ?? "").trim() || null;
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due))
    return { error: "Fecha de vencimiento inválida.", ok: false, count: 0 };

  const supabase = await createClient();
  if (!(await buildingInOrg(supabase, buildingId, orgId)))
    return { error: "Edificio no encontrado.", ok: false, count: 0 };

  const { data, error } = await supabase.rpc("generate_monthly_charges", {
    p_building_id: buildingId,
    p_period: period,
    ...(due ? { p_due_date: due } : {}),
  });
  if (error) return { error: error.message, ok: false, count: 0 };

  revalidatePath(`/app/edificios/${buildingId}/cobros`);
  revalidatePath(`/app/edificios/${buildingId}`);
  return { error: null, ok: true, count: data ?? 0 };
}

/** Reparte un presupuesto mensual entre las unidades según su coeficiente y lo
 *  guarda como cuota (monthly_fee) de cada unidad. Atajo del cálculo por metraje
 *  (cuota = m² × tasa = presupuesto × coeficiente). */
export async function calcFeesByCoefficient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede configurar la cuota.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Edificio inválido.", ok: false };

  const budget = Number(formData.get("budget"));
  if (!Number.isFinite(budget) || budget <= 0)
    return { error: "Escribe el presupuesto mensual del edificio.", ok: false };

  const supabase = await createClient();
  if (!(await buildingInOrg(supabase, buildingId, orgId)))
    return { error: "Edificio no encontrado.", ok: false };

  const { data: units } = await supabase
    .from("units")
    .select("id, coefficient")
    .eq("building_id", buildingId)
    .eq("organization_id", orgId);
  if (!units || units.length === 0)
    return { error: "El edificio no tiene unidades todavía.", ok: false };

  // cuota = presupuesto × coeficiente% (los coeficientes deberían sumar 100%).
  for (const u of units) {
    const fee = Math.round(budget * (Number(u.coefficient) || 0)) / 100;
    const { error } = await supabase
      .from("units")
      .update({ monthly_fee: fee })
      .eq("id", u.id)
      .eq("organization_id", orgId);
    if (error) return { error: error.message, ok: false };
  }

  revalidatePath(`/app/edificios/${buildingId}/cobros`);
  revalidatePath(`/app/edificios/${buildingId}`);
  return { error: null, ok: true };
}
