"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type AccountType = Database["public"]["Enums"]["account_type"];
type AccountFund = Database["public"]["Enums"]["account_fund"];

/** Crea una cuenta contable adicional en el catálogo del PH. Admin-only. */
export async function createLedgerAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role)) return { error: "Solo la administración puede crear cuentas.", ok: false };

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as AccountType;
  const fund = (String(formData.get("fund") ?? "operativo") || "operativo") as AccountFund;

  if (!/^\d{4,6}$/.test(code)) return { error: "El código debe ser numérico (4 a 6 dígitos).", ok: false };
  if (!name) return { error: "El nombre es obligatorio.", ok: false };
  if (!(Constants.public.Enums.account_type as readonly string[]).includes(type))
    return { error: "Tipo de cuenta inválido.", ok: false };
  if (!(Constants.public.Enums.account_fund as readonly string[]).includes(fund))
    return { error: "Fondo inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_accounts")
    .insert({ organization_id: orgId, code, name, type, fund });
  if (error) {
    if (error.code === "23505") return { error: "Ya existe una cuenta con ese código.", ok: false };
    console.error("createLedgerAccount:", error.code, error.message);
    return { error: "No se pudo crear la cuenta.", ok: false };
  }
  revalidatePath("/app/contabilidad/cuentas");
  return { error: null, ok: true };
}
