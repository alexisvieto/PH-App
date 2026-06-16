"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Registra un gasto del edificio (egreso) para los reportes. */
export async function createExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const buildingId = String(formData.get("building_id") ?? "");
  if (!UUID.test(buildingId)) return { error: "Edificio inválido.", ok: false };

  const category = String(formData.get("category") ?? "") as ExpenseCategory;
  if (
    !(Constants.public.Enums.expense_category as readonly string[]).includes(
      category,
    )
  )
    return { error: "Categoría inválida.", ok: false };

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "La descripción es obligatoria.", ok: false };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a cero.", ok: false };

  const spentOn = String(formData.get("spent_on") ?? "").trim();
  if (spentOn && !ISO_DATE.test(spentOn))
    return { error: "Fecha inválida.", ok: false };

  const supplier = String(formData.get("supplier") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    organization_id: orgId,
    building_id: buildingId,
    category,
    description,
    amount,
    supplier,
    ...(spentOn ? { spent_on: spentOn } : {}),
  });
  if (error) return { error: error.message, ok: false };

  revalidatePath(`/app/edificios/${buildingId}/finanzas`);
  return { error: null, ok: true };
}
