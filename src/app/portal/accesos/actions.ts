"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME = /^\d{2}:\d{2}$/;

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 símbolos → b % 32 es uniforme
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % 32]).join("");
}

/** El residente crea un pase para una de SUS unidades. */
export async function createResidentPass(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const res = await getResidentContext();
  const orgId = res?.orgId;
  if (!orgId) return { error: "Sin acceso.", ok: false };

  const unitId = String(formData.get("unit_id") ?? "");
  if (!res.units.some((u) => u.id === unitId))
    return { error: "Unidad inválida.", ok: false };

  const type = String(formData.get("type") ?? "visita");
  if (!(Constants.public.Enums.visitor_pass_type as readonly string[]).includes(type))
    return { error: "Tipo inválido.", ok: false };

  const visitorName = String(formData.get("visitor_name") ?? "").trim();
  if (!visitorName) return { error: "El nombre del visitante es obligatorio.", ok: false };
  const visitorDoc = String(formData.get("visitor_doc") ?? "").trim();

  // Indefinido (p. ej. doméstica): sin vencimiento, pero exige cédula/pasaporte
  // para dejar registro formal por lo delicado del tema.
  const isIndefinido = type === "indefinido";
  const todayPa = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  let validFrom: string;
  let validTo: string | null;
  if (isIndefinido) {
    if (!visitorDoc) return { error: "Para un pase indefinido, la cédula o pasaporte es obligatorio.", ok: false };
    validFrom = todayPa;
    validTo = null;
  } else {
    validFrom = String(formData.get("valid_from") ?? "").trim();
    const vt = String(formData.get("valid_to") ?? "").trim();
    if (!isValidIsoDate(validFrom) || !isValidIsoDate(vt)) return { error: "Vigencia inválida.", ok: false };
    if (vt < validFrom) return { error: "La fecha final debe ser posterior a la inicial.", ok: false };
    validTo = vt;
  }

  const timeFrom = String(formData.get("time_from") ?? "").trim();
  const timeTo = String(formData.get("time_to") ?? "").trim();
  if ((timeFrom && !TIME.test(timeFrom)) || (timeTo && !TIME.test(timeTo)))
    return { error: "Horario inválido.", ok: false };

  const recurringDays =
    type === "recurrente"
      ? formData.getAll("recurring_days").map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];

  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  let maxUses: number | null = maxUsesRaw === "" ? null : Number(maxUsesRaw);
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1))
    return { error: "Usos máximos inválido.", ok: false };
  if (type === "visita" && maxUses === null) maxUses = 1;

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("building_id")
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) return { error: "Unidad no encontrada.", ok: false };

  const row = {
    organization_id: orgId,
    building_id: unit.building_id,
    unit_id: unitId,
    type: type as Enums["visitor_pass_type"],
    visitor_name: visitorName,
    visitor_doc: visitorDoc || null,
    valid_from: validFrom,
    valid_to: validTo,
    recurring_days: recurringDays.length > 0 ? recurringDays : null,
    time_from: timeFrom || null,
    time_to: timeTo || null,
    max_uses: maxUses,
    vehicle_plate: String(formData.get("vehicle_plate") ?? "").trim().toUpperCase() || null,
    created_by: res.userId,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from("visitor_passes").insert({ ...row, code: genCode() });
    if (!error) {
      revalidatePath("/portal/accesos");
      return { error: null, ok: true };
    }
    if (error.code !== "23505") {
      console.error("createResidentPass:", error.code, error.message);
      return { error: "No se pudo crear el pase.", ok: false };
    }
  }
  return { error: "No se pudo generar el código, intenta de nuevo.", ok: false };
}

/** El residente anula un pase de su unidad. */
export async function anularResidentPass(passId: string): Promise<ActionState> {
  const res = await getResidentContext();
  const orgId = res?.orgId;
  if (!orgId) return { error: "Sin acceso.", ok: false };
  if (!UUID.test(passId)) return { error: "Pase inválido.", ok: false };

  const supabase = await createClient();
  // RLS (is_unit_resident) garantiza que solo afecta un pase de su unidad.
  const { error } = await supabase
    .from("visitor_passes")
    .update({ status: "anulado" })
    .eq("id", passId)
    .eq("organization_id", orgId)
    .in("unit_id", res.units.map((u) => u.id));
  if (error) {
    console.error("anularResidentPass:", error.code, error.message);
    return { error: "No se pudo anular el pase.", ok: false };
  }
  revalidatePath("/portal/accesos");
  revalidatePath(`/portal/accesos/${passId}`);
  return { error: null, ok: true };
}
