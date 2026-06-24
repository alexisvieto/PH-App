"use server";

import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createYappyOrder, genOrderRef, getYappyConfig } from "@/lib/yappy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Inicia un pago de Yappy para una unidad del residente. Crea la orden y
 * devuelve la URL de pago de Yappy. (La llamada real a Yappy se conecta cuando
 * tengamos el sandbox; hoy devuelve un mensaje controlado.)
 */
export async function startYappyPayment(
  unitId: string,
  amount: number,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const res = await getResidentContext();
  if (!res?.orgId) return { ok: false, error: "Sin organización." };
  if (!UUID.test(unitId) || !res.units.some((u) => u.id === unitId))
    return { ok: false, error: "Unidad inválida." };
  if (!(amount > 0)) return { ok: false, error: "No tienes saldo pendiente." };

  const cfg = await getYappyConfig(res.orgId);
  if (!cfg?.enabled) return { ok: false, error: "Yappy no está disponible en este PH." };

  const orderRef = genOrderRef();
  const created = await createYappyOrder({ orgId: res.orgId, orderRef, amount });
  if (!created.ready) return { ok: false, error: created.error ?? "Yappy en configuración." };

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("building_id")
    .eq("id", unitId)
    .maybeSingle();
  if (!unit) return { ok: false, error: "Unidad no encontrada." };

  const { error } = await supabase.from("payment_orders").insert({
    organization_id: res.orgId,
    building_id: unit.building_id,
    unit_id: unitId,
    order_ref: orderRef,
    amount,
    created_by: res.userId,
  });
  if (error) {
    console.error("startYappyPayment:", error.code, error.message);
    return { ok: false, error: "No se pudo iniciar el pago." };
  }
  return { ok: true, url: created.url };
}
