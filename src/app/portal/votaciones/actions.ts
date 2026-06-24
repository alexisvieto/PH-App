"use server";

import { revalidatePath } from "next/cache";

import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** El propietario principal emite/cambia el voto de su unidad (vía RPC seguro). */
export async function castVote(
  votationId: string,
  optionId: string | null,
  abstention: boolean,
): Promise<{ ok: boolean; error: string | null }> {
  const res = await getResidentContext();
  if (!res?.orgId) return { ok: false, error: "Sin organización." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cast_vote", {
    p_votation: votationId,
    // El tipo generado lo marca como string; en runtime null es válido (abstención).
    p_option: optionId as string,
    p_abstention: abstention,
  });
  if (error) {
    console.error("castVote:", error.code, error.message);
    // El RPC lanza mensajes en español aptos para el usuario.
    return { ok: false, error: error.message || "No se pudo registrar el voto." };
  }
  revalidatePath("/portal/votaciones");
  return { ok: true, error: null };
}
