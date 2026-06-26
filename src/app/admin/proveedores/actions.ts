"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getPlatformAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createProvider(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin acceso.", ok: false };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Escribe el nombre del proveedor.", ok: false };

  const categoryIds = formData.getAll("category").map(String).filter((c) => UUID.test(c));
  if (categoryIds.length === 0) return { error: "Elige al menos una categoría.", ok: false };

  const priority = Number(formData.get("priority"));

  const supabase = await createClient();
  const { data: prov, error } = await supabase
    .from("service_providers")
    .insert({
      name,
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      priority: Number.isFinite(priority) ? priority : 0,
      active: true,
    })
    .select("id")
    .single();
  if (error || !prov) {
    console.error("createProvider:", error?.code, error?.message);
    return { error: "No se pudo crear el proveedor.", ok: false };
  }

  const { error: e2 } = await supabase
    .from("service_provider_categories")
    .insert(categoryIds.map((c) => ({ provider_id: prov.id, category_id: c })));
  if (e2) {
    console.error("createProvider categories:", e2.code, e2.message);
    return { error: "Proveedor creado, pero falló asignar categorías.", ok: false };
  }

  revalidatePath("/admin/proveedores");
  return { error: null, ok: true };
}

export async function toggleProvider(providerId: string, active: boolean): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin acceso.", ok: false };
  if (!UUID.test(providerId)) return { error: "Proveedor inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("service_providers").update({ active }).eq("id", providerId);
  if (error) {
    console.error("toggleProvider:", error.code, error.message);
    return { error: "No se pudo actualizar.", ok: false };
  }
  revalidatePath("/admin/proveedores");
  return { error: null, ok: true };
}
