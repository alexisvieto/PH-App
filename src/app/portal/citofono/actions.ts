"use server";

import { revalidatePath } from "next/cache";

import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El residente autoriza o rechaza una solicitud de la garita. */
export async function respondIntercom(
  requestId: string,
  authorize: boolean,
  note?: string,
): Promise<{ ok: boolean; error: string | null }> {
  const res = await getResidentContext();
  if (!res?.orgId) return { ok: false, error: "Sin organización." };
  if (!UUID.test(requestId)) return { ok: false, error: "Solicitud inválida." };

  const supabase = await createClient();
  // La RLS permite al residente dejar la solicitud solo en autorizada/rechazada.
  const { error } = await supabase
    .from("intercom_requests")
    .update({
      status: authorize ? "autorizada" : "rechazada",
      response_note: (note ?? "").trim() || null,
      responded_by: res.userId,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("organization_id", res.orgId)
    .eq("status", "pendiente");
  if (error) {
    console.error("respondIntercom:", error.code, error.message);
    return { ok: false, error: "No se pudo responder." };
  }
  revalidatePath("/portal/citofono");
  return { ok: true, error: null };
}
