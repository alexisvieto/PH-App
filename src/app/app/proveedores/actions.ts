"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function createSupplier(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    organization_id: orgId,
    name,
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) {
    if (error.code === "23505")
      return { error: `Ya existe un proveedor "${name}".`, ok: false };
    console.error("createSupplier:", error.code, error.message);
    return { error: "No se pudo guardar el proveedor.", ok: false };
  }

  revalidatePath("/app/proveedores");
  return { error: null, ok: true };
}
