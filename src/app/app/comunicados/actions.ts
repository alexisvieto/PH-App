"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type AnnouncementKind = Database["public"]["Enums"]["announcement_kind"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Publica un comunicado (admin). building_id vacío = a toda la organización. */
export async function createAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador puede publicar comunicados.", ok: false };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return { error: "El título es obligatorio.", ok: false };
  if (!body) return { error: "El mensaje es obligatorio.", ok: false };
  if (title.length > 200)
    return { error: "El título es muy largo (máx. 200).", ok: false };
  if (body.length > 5000)
    return { error: "El mensaje es muy largo (máx. 5000).", ok: false };

  const buildingRaw = String(formData.get("building_id") ?? "").trim();
  const buildingId = buildingRaw || null;
  if (buildingId && !UUID.test(buildingId))
    return { error: "Edificio inválido.", ok: false };

  const kind = String(formData.get("kind") ?? "anuncio") as AnnouncementKind;
  if (!(Constants.public.Enums.announcement_kind as readonly string[]).includes(kind))
    return { error: "Tipo inválido.", ok: false };

  const supabase = await createClient();
  if (buildingId) {
    const { data: b } = await supabase
      .from("buildings")
      .select("id")
      .eq("id", buildingId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!b) return { error: "Edificio no encontrado.", ok: false };
  }

  const { error } = await supabase.from("announcements").insert({
    organization_id: orgId,
    building_id: buildingId,
    kind,
    title,
    body,
    created_by: ctx.userId,
  });
  if (error) {
    console.error("createAnnouncement:", error);
    return { error: "No se pudo publicar el comunicado.", ok: false };
  }

  revalidatePath("/app/comunicados");
  revalidatePath("/portal", "layout");
  return { error: null, ok: true };
}
