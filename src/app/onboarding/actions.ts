"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type OrgType = Database["public"]["Enums"]["org_type"];

export type OnboardingState = { error: string | null };

export async function createOrgAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "administradora") as OrgType;

  if (!name) return { error: "Escribe un nombre." };
  if (type !== "administradora" && type !== "self_managed") {
    return { error: "Tipo de organización inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_type: type,
  });
  if (error) return { error: error.message };

  redirect("/app");
}
