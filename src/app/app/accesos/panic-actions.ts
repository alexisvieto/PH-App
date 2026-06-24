"use server";

import { revalidatePath } from "next/cache";

import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PanicTrigger =
  | { ok: true; alertId: string }
  | { ok: false; error: string };

/** El guardia dispara un SOS (garita bajo amenaza): le suena a la administración. */
export async function triggerGuardPanic(note?: string): Promise<PanicTrigger> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };

  const supabase = await createClient();
  const { data: me } = await supabase
    .from("people")
    .select("full_name, phone")
    .eq("user_id", ctx.userId)
    .eq("organization_id", orgId)
    .maybeSingle();

  const { data: alert, error } = await supabase
    .from("panic_alerts")
    .insert({
      organization_id: orgId,
      source: "guardia",
      triggered_by: ctx.userId,
      kind: "seguridad",
      note: (note ?? "").trim() || null,
      contact_name: me?.full_name ?? "Guardia",
      contact_phone: me?.phone ?? null,
    })
    .select("id")
    .single();
  if (error || !alert) {
    console.error("triggerGuardPanic:", error?.code, error?.message);
    return { ok: false, error: "No se pudo enviar el SOS." };
  }

  revalidatePath("/app/garita");
  return { ok: true, alertId: alert.id };
}

async function setStatus(alertId: string, to: "atendida" | "resuelta") {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };
  if (!UUID.test(alertId)) return { ok: false, error: "Alerta inválida." };

  const supabase = await createClient();
  const stamp =
    to === "atendida"
      ? { status: to, acknowledged_by: ctx.userId, acknowledged_at: new Date().toISOString() }
      : { status: to, resolved_by: ctx.userId, resolved_at: new Date().toISOString() };
  const { error } = await supabase
    .from("panic_alerts")
    .update(stamp)
    .eq("id", alertId)
    .eq("organization_id", orgId);
  if (error) return { ok: false, error: "No se pudo actualizar." };
  revalidatePath("/app/garita");
  revalidatePath("/app/emergencias");
  return { ok: true, error: null };
}

/** El staff marca que ya está atendiendo el SOS (el residente lo ve en vivo). */
export async function acknowledgePanic(alertId: string) {
  return setStatus(alertId, "atendida");
}

/** El staff cierra el SOS como resuelto. */
export async function resolvePanic(alertId: string) {
  return setStatus(alertId, "resuelta");
}
