"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El residente publica/edita su reseña (una por proveedor). El trigger recalcula el promedio. */
export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const res = await getResidentContext();
  if (!res?.userId) return { error: "Sin acceso.", ok: false };

  const providerId = String(formData.get("provider_id") ?? "");
  if (!UUID.test(providerId)) return { error: "Proveedor inválido.", ok: false };

  const name = String(formData.get("reviewer_name") ?? "").trim();
  if (!name) return { error: "Deja tu nombre.", ok: false };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Selecciona de 1 a 5 estrellas.", ok: false };

  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("service_provider_reviews").upsert(
    {
      provider_id: providerId,
      user_id: res.userId,
      reviewer_name: name.slice(0, 80),
      rating,
      comment: comment ? comment.slice(0, 2000) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_id,user_id" },
  );
  if (error) {
    console.error("submitReview:", error.code, error.message);
    return { error: "No se pudo guardar la reseña.", ok: false };
  }
  revalidatePath(`/portal/proveedores/${providerId}`);
  return { error: null, ok: true };
}
