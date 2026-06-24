"use server";

import { revalidatePath } from "next/cache";

import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Kind = Database["public"]["Enums"]["panic_kind"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS: Kind[] = ["medica", "seguridad", "incendio", "otro"];

export type PanicTrigger =
  | { ok: true; alertId: string }
  | { ok: false; error: string };

/** El residente dispara un SOS desde su unidad (le suena a la garita). */
export async function triggerResidentPanic(unitId: string): Promise<PanicTrigger> {
  const res = await getResidentContext();
  if (!res?.orgId) return { ok: false, error: "Sin organización." };
  if (!UUID.test(unitId) || !res.units.some((u) => u.id === unitId))
    return { ok: false, error: "Unidad inválida." };

  const supabase = await createClient();

  // Una sola alerta en curso por residente: si ya hay una activa/atendida,
  // la reusamos (anti-spam, incluso si llaman la action directamente).
  const { data: existing } = await supabase
    .from("panic_alerts")
    .select("id")
    .eq("organization_id", res.orgId)
    .eq("triggered_by", res.userId)
    .eq("source", "residente")
    .in("status", ["activa", "atendida"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, alertId: existing.id };

  const { data: unit } = await supabase
    .from("units")
    .select("building_id")
    .eq("id", unitId)
    .eq("organization_id", res.orgId)
    .maybeSingle();

  // Contacto a mostrar/llamar en la garita: el propio residente.
  const { data: me } = await supabase
    .from("people")
    .select("full_name, phone")
    .eq("user_id", res.userId)
    .eq("organization_id", res.orgId)
    .maybeSingle();

  const { data: alert, error } = await supabase
    .from("panic_alerts")
    .insert({
      organization_id: res.orgId,
      building_id: unit?.building_id ?? null,
      unit_id: unitId,
      source: "residente",
      triggered_by: res.userId,
      contact_name: me?.full_name ?? res.fullName ?? null,
      contact_phone: me?.phone ?? null,
    })
    .select("id")
    .maybeSingle();
  if (error || !alert) {
    console.error("triggerResidentPanic:", error?.code, error?.message);
    return { ok: false, error: "No se pudo enviar el SOS." };
  }

  revalidatePath("/portal/sos");
  return { ok: true, alertId: alert.id };
}

export async function setPanicKind(
  alertId: string,
  kind: Kind,
): Promise<{ ok: boolean }> {
  const res = await getResidentContext();
  if (!res?.orgId || !UUID.test(alertId) || !KINDS.includes(kind)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("panic_alerts")
    .update({ kind })
    .eq("id", alertId)
    .eq("organization_id", res.orgId)
    .eq("status", "activa");
  return { ok: !error };
}

/** Estado actual de una alerta del residente (sondeo de respaldo del Realtime). */
export async function getPanicStatus(
  alertId: string,
): Promise<{ status: Database["public"]["Enums"]["panic_status"] | null }> {
  const res = await getResidentContext();
  if (!res?.orgId || !UUID.test(alertId)) return { status: null };
  const supabase = await createClient();
  const { data } = await supabase
    .from("panic_alerts")
    .select("status")
    .eq("id", alertId)
    .eq("organization_id", res.orgId)
    .maybeSingle();
  return { status: data?.status ?? null };
}

export async function cancelPanic(alertId: string): Promise<{ ok: boolean }> {
  const res = await getResidentContext();
  if (!res?.orgId || !UUID.test(alertId)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("panic_alerts")
    .update({ status: "cancelada" })
    .eq("id", alertId)
    .eq("organization_id", res.orgId)
    .eq("status", "activa");
  if (!error) revalidatePath("/portal/sos");
  return { ok: !error };
}
