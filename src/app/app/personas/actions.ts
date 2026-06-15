"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DocType = Database["public"]["Enums"]["doc_type"];

export async function createPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "El nombre es obligatorio.", ok: false };

  const docTypeRaw = String(formData.get("doc_type") ?? "");
  const docType = (docTypeRaw || null) as DocType | null;
  const docNumber = String(formData.get("doc_number") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  // "Conoce a tu cliente": campos opcionales guardados en kyc.
  const nationality = String(formData.get("nationality") ?? "").trim();
  const occupation = String(formData.get("occupation") ?? "").trim();
  const kyc: Record<string, string> = {};
  if (nationality) kyc.nacionalidad = nationality;
  if (occupation) kyc.ocupacion = occupation;

  const supabase = await createClient();
  const { error } = await supabase.from("people").insert({
    organization_id: orgId,
    full_name: fullName,
    doc_type: docType,
    doc_number: docNumber,
    email,
    phone,
    kyc,
  });
  if (error) return { error: error.message, ok: false };

  revalidatePath("/app/personas");
  revalidatePath("/app");
  return { error: null, ok: true };
}
