"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { quoteFolder } from "@/lib/projects";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreateProjectResult = { ok: true; projectId: string } | { ok: false; error: string };

/** Crea un proyecto (p.ej. "Pintura de PH"). Admin-only. */
export async function createProject(input: {
  title: string;
  description?: string;
  buildingId?: string | null;
  category?: string;
}): Promise<CreateProjectResult> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };
  if (!canManage(ctx.role)) return { ok: false, error: "Solo la administración puede crear proyectos." };
  const title = (input.title ?? "").trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  if (input.buildingId && !UUID.test(input.buildingId)) return { ok: false, error: "Edificio inválido." };
  const category = (Constants.public.Enums.expense_category as readonly string[]).includes(input.category ?? "")
    ? (input.category as Database["public"]["Enums"]["expense_category"])
    : "mantenimiento";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: orgId,
      building_id: input.buildingId || null,
      title,
      description: (input.description ?? "").trim() || null,
      category,
      created_by: ctx.userId,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("createProject:", error?.code, error?.message);
    return { ok: false, error: "No se pudo crear el proyecto." };
  }
  revalidatePath("/app/proyectos");
  return { ok: true, projectId: data.id };
}

export type AddQuoteResult = { ok: true; quoteId: string } | { ok: false; error: string };

/** Agrega una cotización al proyecto (el archivo se sube antes en el cliente). Admin-only. */
export async function addQuote(input: {
  projectId: string;
  companyName: string;
  amount: number;
  notes?: string;
  filePath?: string | null;
}): Promise<AddQuoteResult> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };
  if (!canManage(ctx.role)) return { ok: false, error: "Solo la administración." };
  if (!UUID.test(input.projectId)) return { ok: false, error: "Proyecto inválido." };
  const company = (input.companyName ?? "").trim();
  if (!company) return { ok: false, error: "El nombre de la empresa es obligatorio." };
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "El monto debe ser mayor a 0." };
  const filePath = (input.filePath ?? "").trim() || null;
  if (filePath && !filePath.startsWith(quoteFolder(orgId, input.projectId)))
    return { ok: false, error: "Ruta de archivo inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_quotes")
    .insert({
      organization_id: orgId,
      project_id: input.projectId,
      company_name: company,
      amount,
      notes: (input.notes ?? "").trim() || null,
      file_path: filePath,
      created_by: ctx.userId,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("addQuote:", error?.code, error?.message);
    return { ok: false, error: "No se pudo agregar la cotización." };
  }
  revalidatePath(`/app/proyectos/${input.projectId}`);
  return { ok: true, quoteId: data.id };
}

/** Adjudica la cotización ganadora + justificación (RPC atómico). Admin-only. */
export async function awardQuote(projectId: string, quoteId: string, reason: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg?.id) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role)) return { error: "Solo la administración.", ok: false };
  if (!UUID.test(projectId) || !UUID.test(quoteId)) return { error: "Datos inválidos.", ok: false };
  const r = (reason ?? "").trim();
  if (!r) return { error: "Explica por qué se selecciona a esta empresa.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("award_project_quote", { p_project: projectId, p_quote: quoteId, p_reason: r });
  if (error) {
    console.error("awardQuote:", error.code, error.message);
    return { error: "No se pudo adjudicar la cotización.", ok: false };
  }
  revalidatePath(`/app/proyectos/${projectId}`);
  revalidatePath("/app/proyectos");
  return { error: null, ok: true };
}

/** Elimina una cotización (y su archivo). Admin-only. */
export async function deleteQuote(quoteId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role)) return { error: "Solo la administración.", ok: false };
  if (!UUID.test(quoteId)) return { error: "Cotización inválida.", ok: false };

  const supabase = await createClient();
  const { data: q } = await supabase
    .from("project_quotes")
    .select("project_id, file_path, is_winner")
    .eq("id", quoteId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (q?.is_winner)
    return { error: "No puedes eliminar la cotización ganadora. Re-adjudica primero.", ok: false };
  const { error } = await supabase
    .from("project_quotes")
    .delete()
    .eq("id", quoteId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("deleteQuote:", error.code, error.message);
    return { error: "No se pudo eliminar la cotización.", ok: false };
  }
  if (q?.file_path) await supabase.storage.from("ph-proyectos").remove([q.file_path]);
  if (q?.project_id) revalidatePath(`/app/proyectos/${q.project_id}`);
  return { error: null, ok: true };
}

/** Elimina el proyecto completo (cascada de cotizaciones + archivos). Admin-only. */
export async function deleteProject(projectId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role)) return { error: "Solo la administración.", ok: false };
  if (!UUID.test(projectId)) return { error: "Proyecto inválido.", ok: false };

  const supabase = await createClient();
  const { data: qs } = await supabase
    .from("project_quotes")
    .select("file_path")
    .eq("project_id", projectId)
    .eq("organization_id", orgId);
  const paths = (qs ?? []).map((q) => q.file_path).filter((p): p is string => !!p);
  const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("organization_id", orgId);
  if (error) {
    console.error("deleteProject:", error.code, error.message);
    return { error: "No se pudo eliminar el proyecto.", ok: false };
  }
  if (paths.length) await supabase.storage.from("ph-proyectos").remove(paths);
  revalidatePath("/app/proyectos");
  return { error: null, ok: true };
}
