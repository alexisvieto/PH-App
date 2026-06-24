"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function num(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}
function ts(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s ? new Date(s).toISOString() : null;
}

export async function createVotation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "El título es obligatorio.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Selecciona un edificio.", ok: false };

  const kind = String(formData.get("kind") ?? "si_no");
  if (!(Constants.public.Enums.votation_kind as readonly string[]).includes(kind))
    return { error: "Tipo inválido.", ok: false };

  let options: string[];
  if (kind === "si_no") {
    options = ["Sí", "No"];
  } else {
    options = formData
      .getAll("option")
      .map((o) => String(o).trim())
      .filter(Boolean);
    if (options.length < 2) return { error: "Agrega al menos dos opciones.", ok: false };
  }

  const supabase = await createClient();
  const { data: building } = await supabase
    .from("buildings")
    .select("id")
    .eq("id", buildingId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!building) return { error: "Edificio no encontrado.", ok: false };

  const { data: votation, error } = await supabase
    .from("votations")
    .insert({
      organization_id: orgId,
      building_id: buildingId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      kind: kind as "si_no" | "multiple",
      opens_at: ts(formData.get("opens_at")),
      closes_at: ts(formData.get("closes_at")),
      quorum_pct: num(formData.get("quorum_pct"), 51),
      approval_pct: num(formData.get("approval_pct"), 50.01),
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !votation) {
    console.error("createVotation:", error?.code, error?.message);
    return { error: "No se pudo crear la votación.", ok: false };
  }

  const { error: optErr } = await supabase.from("votation_options").insert(
    options.map((label, i) => ({
      organization_id: orgId,
      votation_id: votation.id,
      label,
      sort_order: i,
    })),
  );
  if (optErr) {
    console.error("createVotation options:", optErr.code, optErr.message);
    return { error: "No se pudieron guardar las opciones.", ok: false };
  }

  revalidatePath("/app/votaciones");
  return { error: null, ok: true };
}

export async function setVotationStatus(
  votationId: string,
  status: "abierta" | "cerrada",
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(votationId)) return { error: "Votación inválida.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("votations")
    .update({ status })
    .eq("id", votationId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("setVotationStatus:", error.code, error.message);
    return { error: "No se pudo actualizar la votación.", ok: false };
  }
  revalidatePath("/app/votaciones");
  revalidatePath(`/app/votaciones/${votationId}`);
  revalidatePath("/portal/votaciones");
  return { error: null, ok: true };
}
