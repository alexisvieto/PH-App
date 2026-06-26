"use server";

import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";

/** El usuario define su contraseña definitiva (reemplaza la temporal de Nexera). */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo.", ok: false };

  const pwd = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (pwd.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres.", ok: false };
  if (pwd !== confirm) return { error: "Las contraseñas no coinciden.", ok: false };

  const { error } = await supabase.auth.updateUser({ password: pwd });
  if (error) {
    console.error("changePassword:", error.message);
    const same = /different from the old|should be different/i.test(error.message);
    return {
      error: same ? "La nueva contraseña debe ser distinta de la temporal." : "No se pudo cambiar la contraseña.",
      ok: false,
    };
  }

  await supabase.rpc("mark_password_changed");
  redirect("/");
}
