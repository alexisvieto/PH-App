"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type InfractionType = Database["public"]["Enums"]["infraction_type"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registra una sanción. Multa → genera el cargo vinculado (RPC atómico). */
export async function createInfraction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const unitId = String(formData.get("unit_id") ?? "");
  if (!UUID.test(unitId)) return { error: "Selecciona una unidad.", ok: false };

  const type = String(formData.get("type") ?? "") as InfractionType;
  if (!(Constants.public.Enums.infraction_type as readonly string[]).includes(type))
    return { error: "Tipo inválido.", ok: false };

  // Dinero = admin-only (capa servidor, además del gate del RPC y del cliente).
  if (type === "multa" && !canManage(ctx.role))
    return { error: "Solo un administrador puede registrar multas.", ok: false };

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "El motivo es obligatorio.", ok: false };
  if (reason.length > 200)
    return { error: "El motivo es muy largo (máx. 200).", ok: false };

  const description = String(formData.get("description") ?? "").trim() || null;
  if (description && description.length > 2000)
    return { error: "El detalle es muy largo (máx. 2000).", ok: false };

  const dateRaw = String(formData.get("infraction_date") ?? "").trim();
  if (dateRaw && !isValidIsoDate(dateRaw))
    return { error: "Fecha inválida.", ok: false };

  let amount: number | null = null;
  let dueDate: string | null = null;
  if (type === "multa") {
    const amountRaw = String(formData.get("amount") ?? "").trim();
    amount = amountRaw === "" ? NaN : Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0)
      return { error: "La multa requiere un monto mayor a 0.", ok: false };
    const dueRaw = String(formData.get("due_date") ?? "").trim();
    if (dueRaw && !isValidIsoDate(dueRaw))
      return { error: "Fecha de vencimiento inválida.", ok: false };
    dueDate = dueRaw || null;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_infraction", {
    p_unit_id: unitId,
    p_type: type,
    p_reason: reason,
    p_description: description ?? undefined,
    p_amount: amount ?? undefined,
    p_infraction_date: dateRaw || undefined,
    p_due_date: dueDate ?? undefined,
  });
  if (error) {
    console.error("createInfraction:", error.code, error.message);
    // Solo los RAISE EXCEPTION del RPC (P0001) traen mensaje apto para el usuario;
    // cualquier otro error de BD se muestra genérico para no filtrar detalles.
    const userMsg =
      error.code === "P0001" ? error.message : "No se pudo registrar la sanción.";
    return { error: userMsg, ok: false };
  }

  revalidatePath("/app/sanciones");
  revalidatePath("/portal", "layout");
  return { error: null, ok: true };
}
