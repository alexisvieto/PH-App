"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Guarda la config de Yappy (admin-only). El secret se almacena en Vault vía RPC. */
export async function saveYappyConfig(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role)) return { error: "Solo un administrador puede configurar pagos.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_yappy_config", {
    p_org: orgId,
    p_merchant_id: String(formData.get("merchant_id") ?? "").trim(),
    p_secret: String(formData.get("secret") ?? ""),
    p_sandbox: formData.get("sandbox") === "on",
    p_enabled: formData.get("enabled") === "on",
  });
  if (error) {
    console.error("saveYappyConfig:", error.code, error.message);
    return { error: "No se pudo guardar la configuración.", ok: false };
  }
  revalidatePath("/app/configuracion");
  return { error: null, ok: true };
}
