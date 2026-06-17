"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type AnomalyStatus = Database["public"]["Enums"]["anomaly_status"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreateAnomalyInput = {
  buildingId: string;
  title: string;
  description: string;
  equipmentId?: string | null;
  supplierId?: string | null;
};

export type CreateAnomalyResult =
  | { ok: true; anomalyId: string; orgId: string }
  | { ok: false; error: string };

/** Crea el reporte de anomalía y devuelve su id (las fotos se suben después). */
export async function createAnomaly(
  input: CreateAnomalyInput,
): Promise<CreateAnomalyResult> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };

  if (!UUID.test(input.buildingId))
    return { ok: false, error: "Edificio inválido." };
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  if (!description) return { ok: false, error: "Describe la anomalía." };
  if (input.equipmentId && !UUID.test(input.equipmentId))
    return { ok: false, error: "Equipo inválido." };
  if (input.supplierId && !UUID.test(input.supplierId))
    return { ok: false, error: "Proveedor inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anomaly_reports")
    .insert({
      organization_id: orgId,
      building_id: input.buildingId,
      equipment_id: input.equipmentId || null,
      supplier_id: input.supplierId || null,
      title,
      description,
      created_by: ctx.userId,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("createAnomaly:", error?.code, error?.message);
    return { ok: false, error: "No se pudo crear el reporte." };
  }

  revalidatePath("/app/anomalias");
  return { ok: true, anomalyId: data.id, orgId };
}

/** Registra las fotos ya subidas a Storage (valida que la ruta sea de la anomalía). */
export async function recordAnomalyPhotos(
  anomalyId: string,
  paths: string[],
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(anomalyId)) return { error: "Anomalía inválida.", ok: false };
  if (paths.length === 0) return { error: null, ok: true };

  const prefix = `${orgId}/anomalias/${anomalyId}/`;
  if (!paths.every((p) => typeof p === "string" && p.startsWith(prefix)))
    return { error: "Ruta de foto inválida.", ok: false };

  const supabase = await createClient();
  // La anomalía debe existir y ser visible bajo RLS (misma org).
  const { data: anomaly } = await supabase
    .from("anomaly_reports")
    .select("id")
    .eq("id", anomalyId)
    .maybeSingle();
  if (!anomaly) return { error: "Anomalía no encontrada.", ok: false };

  const rows = paths.map((storage_path, i) => ({
    organization_id: orgId,
    anomaly_id: anomalyId,
    storage_path,
    sort_order: i,
    uploaded_by: ctx.userId,
  }));
  const { error } = await supabase.from("anomaly_photos").insert(rows);
  if (error) {
    console.error("recordAnomalyPhotos:", error.code, error.message);
    return { error: "No se pudieron registrar las fotos.", ok: false };
  }

  revalidatePath(`/app/anomalias/${anomalyId}`);
  return { error: null, ok: true };
}

/** Cambia el estado de la anomalía (abierta/resuelta). */
export async function setAnomalyStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg?.id) return { error: "Sin organización activa.", ok: false };

  const anomalyId = String(formData.get("anomaly_id") ?? "");
  if (!UUID.test(anomalyId)) return { error: "Anomalía inválida.", ok: false };
  const status = String(formData.get("status") ?? "") as AnomalyStatus;
  if (!(Constants.public.Enums.anomaly_status as readonly string[]).includes(status))
    return { error: "Estado inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("anomaly_reports")
    .update({ status })
    .eq("id", anomalyId);
  if (error) {
    console.error("setAnomalyStatus:", error.code, error.message);
    return { error: "No se pudo actualizar el estado.", ok: false };
  }

  revalidatePath("/app/anomalias");
  revalidatePath(`/app/anomalias/${anomalyId}`);
  return { error: null, ok: true };
}
