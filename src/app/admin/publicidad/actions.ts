"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import { getPlatformAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createCampaign(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin permiso.", ok: false };

  const advertiser = String(formData.get("advertiser_name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!advertiser || !title) return { error: "Anunciante y título son obligatorios.", ok: false };

  const imagePath = String(formData.get("image_path") ?? "").trim();
  if (!imagePath || !imagePath.startsWith("ads/"))
    return { error: "Sube una imagen del anuncio.", ok: false };

  const linkUrl = String(formData.get("link_url") ?? "").trim();
  if (linkUrl && !/^https?:\/\//i.test(linkUrl))
    return { error: "El enlace debe empezar con http(s)://", ok: false };

  const isGlobal = formData.get("is_global") === "on";
  const targetIds = formData
    .getAll("target_org_ids")
    .map((v) => String(v))
    .filter((v) => UUID.test(v));
  if (!isGlobal && targetIds.length === 0)
    return { error: "Marca “toda la red” o elige al menos una organización.", ok: false };

  const startsOn = String(formData.get("starts_on") ?? "").trim();
  const endsOn = String(formData.get("ends_on") ?? "").trim();
  if ((startsOn && !isValidIsoDate(startsOn)) || (endsOn && !isValidIsoDate(endsOn)))
    return { error: "Fechas de vigencia inválidas.", ok: false };
  if (startsOn && endsOn && endsOn < startsOn)
    return { error: "La fecha final debe ser posterior a la inicial.", ok: false };

  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const priority = priorityRaw === "" ? 0 : Number(priorityRaw);
  if (!Number.isInteger(priority) || priority < 0)
    return { error: "Prioridad inválida.", ok: false };

  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("ad_campaigns")
    .insert({
      advertiser_name: advertiser,
      title,
      image_path: imagePath,
      link_url: linkUrl || null,
      is_global: isGlobal,
      starts_on: startsOn || null,
      ends_on: endsOn || null,
      priority,
      created_by: admin.userId,
    })
    .select("id")
    .single();
  if (error || !campaign) {
    console.error("createCampaign:", error?.code, error?.message);
    return { error: "No se pudo crear la campaña.", ok: false };
  }

  if (!isGlobal && targetIds.length > 0) {
    const { error: tErr } = await supabase
      .from("ad_campaign_targets")
      .insert(targetIds.map((organization_id) => ({ campaign_id: campaign.id, organization_id })));
    if (tErr) {
      console.error("createCampaign targets:", tErr.code, tErr.message);
      // La campaña existe pero sin segmentación: avisar para reintentar.
      return { error: "Campaña creada, pero falló la segmentación. Edítala.", ok: false };
    }
  }

  revalidatePath("/admin/publicidad");
  return { error: null, ok: true };
}

export async function setCampaignStatus(
  campaignId: string,
  status: "active" | "paused",
): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin permiso.", ok: false };
  if (!UUID.test(campaignId)) return { error: "Campaña inválida.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ad_campaigns")
    .update({ status })
    .eq("id", campaignId);
  if (error) {
    console.error("setCampaignStatus:", error.code, error.message);
    return { error: "No se pudo cambiar el estado.", ok: false };
  }
  revalidatePath("/admin/publicidad");
  return { error: null, ok: true };
}

export async function deleteCampaign(campaignId: string): Promise<ActionState> {
  const admin = await getPlatformAdmin();
  if (!admin) return { error: "Sin permiso.", ok: false };
  if (!UUID.test(campaignId)) return { error: "Campaña inválida.", ok: false };

  const supabase = await createClient();
  // Recupera la imagen para limpiarla del bucket tras borrar la fila.
  const { data: row } = await supabase
    .from("ad_campaigns")
    .select("image_path")
    .eq("id", campaignId)
    .maybeSingle();

  const { error } = await supabase.from("ad_campaigns").delete().eq("id", campaignId);
  if (error) {
    console.error("deleteCampaign:", error.code, error.message);
    return { error: "No se pudo eliminar la campaña.", ok: false };
  }
  if (row?.image_path) {
    await supabase.storage.from("ph-ads").remove([row.image_path]);
  }
  revalidatePath("/admin/publicidad");
  return { error: null, ok: true };
}
