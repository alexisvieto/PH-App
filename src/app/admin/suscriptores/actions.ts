"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getPlatformAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type OrgType = Database["public"]["Enums"]["org_type"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Alta de suscriptor: crea la organización + su primer usuario admin (dueño). */
export async function onboardSubscriber(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin acceso.", ok: false };

  const orgName = String(formData.get("org_name") ?? "").trim();
  const orgType = String(formData.get("org_type") ?? "administradora") as OrgType;
  const email = String(formData.get("admin_email") ?? "").trim();
  const password = String(formData.get("admin_password") ?? "");
  const name = String(formData.get("admin_name") ?? "").trim();

  if (!orgName) return { error: "Escribe el nombre del suscriptor.", ok: false };
  if (orgType !== "administradora" && orgType !== "self_managed") return { error: "Tipo inválido.", ok: false };
  if (!name) return { error: "Escribe el nombre del responsable.", ok: false };
  if (!email) return { error: "Escribe el correo del responsable.", ok: false };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_onboard_subscriber", {
    p_org_name: orgName,
    p_org_type: orgType,
    p_admin_email: email,
    p_admin_password: password,
    p_admin_name: name,
  });
  if (error) {
    console.error("onboardSubscriber:", error.code, error.message);
    return { error: error.message || "No se pudo crear el suscriptor.", ok: false };
  }
  revalidatePath("/admin/suscriptores");
  return { error: null, ok: true };
}

/** Agrega otro usuario admin a un suscriptor existente. */
export async function addOrgAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin acceso.", ok: false };

  const orgId = String(formData.get("org_id") ?? "");
  if (!UUID.test(orgId)) return { error: "Organización inválida.", ok: false };
  const email = String(formData.get("admin_email") ?? "").trim();
  const password = String(formData.get("admin_password") ?? "");
  const name = String(formData.get("admin_name") ?? "").trim();
  if (!name) return { error: "Escribe el nombre.", ok: false };
  if (!email) return { error: "Escribe el correo.", ok: false };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_create_org_admin", {
    p_org_id: orgId,
    p_email: email,
    p_password: password,
    p_full_name: name,
    p_role: "administrador",
  });
  if (error) {
    console.error("addOrgAdmin:", error.code, error.message);
    return { error: error.message || "No se pudo crear el admin.", ok: false };
  }
  revalidatePath("/admin/suscriptores");
  return { error: null, ok: true };
}

/** Nexera activa/desactiva un módulo (add-on pago) de un suscriptor. */
export async function setOrgModule(orgId: string, moduleKey: string, enabled: boolean): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin acceso.", ok: false };
  if (!UUID.test(orgId)) return { error: "Organización inválida.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_set_org_module", {
    p_org: orgId,
    p_module: moduleKey,
    p_enabled: enabled,
  });
  if (error) {
    console.error("setOrgModule:", error.code, error.message);
    return { error: "No se pudo actualizar el módulo.", ok: false };
  }
  revalidatePath("/admin/suscriptores");
  return { error: null, ok: true };
}
