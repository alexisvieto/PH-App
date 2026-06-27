"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type OrgRole = Database["public"]["Enums"]["org_role"];

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

/** Un administrador del edificio crea un usuario de staff (administrador/asistente/garita). */
export async function createMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role)) return { error: "Solo un administrador puede crear usuarios.", ok: false };

  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as OrgRole;
  if (!name) return { error: "Escribe el nombre.", ok: false };
  if (!email) return { error: "Escribe el correo.", ok: false };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres.", ok: false };
  if (role !== "administrador" && role !== "asistente" && role !== "guardia") {
    return { error: "Elige un rol válido.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("org_create_member", {
    p_org_id: orgId,
    p_email: email,
    p_password: password,
    p_full_name: name,
    p_role: role,
  });
  if (error) {
    console.error("createMember:", error.code, error.message);
    return { error: error.message || "No se pudo crear el usuario.", ok: false };
  }
  revalidatePath("/app/configuracion");
  return { error: null, ok: true };
}
