"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type FeeMethod = Database["public"]["Enums"]["fee_method"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type GenState = { error: string | null; ok: boolean; count: number };
export const GEN_EMPTY: GenState = { error: null, ok: false, count: 0 };

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

  const method = String(formData.get("method") ?? "") as FeeMethod;
  if (!(Constants.public.Enums.fee_method as readonly string[]).includes(method))
    return { error: "Método de cuota inválido.", ok: false };

  const base = Number(formData.get("base_amount"));
  if (!Number.isFinite(base) || base < 0)
    return { error: "Monto inválido.", ok: false };

  const supabase = await createClient();
  if (!(await buildingInOrg(supabase, buildingId, orgId)))
    return { error: "Edificio no encontrado.", ok: false };

  const { error } = await supabase
    .from("fee_settings")
    .upsert(
      { organization_id: orgId, building_id: buildingId, method, base_amount: base },
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
