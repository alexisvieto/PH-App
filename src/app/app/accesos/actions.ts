"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME = /^\d{2}:\d{2}$/;

function genCode() {
  return Array.from({ length: 8 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32)),
  ).join("");
}

export async function createPass(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };

  const unitId = String(formData.get("unit_id") ?? "");
  if (!UUID.test(unitId)) return { error: "Selecciona una unidad.", ok: false };

  const type = String(formData.get("type") ?? "visita");
  if (!(Constants.public.Enums.visitor_pass_type as readonly string[]).includes(type))
    return { error: "Tipo inválido.", ok: false };

  const visitorName = String(formData.get("visitor_name") ?? "").trim();
  if (!visitorName) return { error: "El nombre del visitante es obligatorio.", ok: false };

  const validFrom = String(formData.get("valid_from") ?? "").trim();
  const validTo = String(formData.get("valid_to") ?? "").trim();
  if (!isValidIsoDate(validFrom) || !isValidIsoDate(validTo))
    return { error: "Vigencia inválida.", ok: false };
  if (validTo < validFrom) return { error: "La fecha final debe ser posterior a la inicial.", ok: false };

  const timeFrom = String(formData.get("time_from") ?? "").trim();
  const timeTo = String(formData.get("time_to") ?? "").trim();
  if ((timeFrom && !TIME.test(timeFrom)) || (timeTo && !TIME.test(timeTo)))
    return { error: "Horario inválido.", ok: false };

  const recurringDays =
    type === "recurrente"
      ? formData
          .getAll("recurring_days")
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];

  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  let maxUses: number | null = maxUsesRaw === "" ? null : Number(maxUsesRaw);
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1))
    return { error: "Usos máximos inválido.", ok: false };
  if (type === "visita" && maxUses === null) maxUses = 1; // visita = un uso por defecto

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
    visitor_doc: String(formData.get("visitor_doc") ?? "").trim() || null,
    valid_from: validFrom,
    valid_to: validTo,
    recurring_days: recurringDays.length > 0 ? recurringDays : null,
    time_from: timeFrom || null,
    time_to: timeTo || null,
    max_uses: maxUses,
    vehicle_plate: String(formData.get("vehicle_plate") ?? "").trim().toUpperCase() || null,
    created_by: ctx.userId,
  };

  // Código único; reintenta una vez si colisiona.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase.from("visitor_passes").insert({ ...row, code: genCode() });
    if (!error) {
      revalidatePath("/app/accesos");
      return { error: null, ok: true };
    }
    if (error.code !== "23505") {
      console.error("createPass:", error.code, error.message);
      return { error: "No se pudo crear el pase.", ok: false };
    }
  }
  return { error: "No se pudo generar el código, intenta de nuevo.", ok: false };
}

// --------------------------------------------------------------------------
// GARITA: validar un código y registrar entrada/salida (+ walk-ins).
// --------------------------------------------------------------------------
type PassRow = Database["public"]["Tables"]["visitor_passes"]["Row"];

/** Evalúa si un pase puede ingresar AHORA (vigencia, usos, día y horario, en hora de Panamá). */
function canEnterNow(p: PassRow): { ok: boolean; reason: string | null } {
  if (p.status === "anulado") return { ok: false, reason: "Pase anulado." };
  const now = new Date();
  const todayPa = now.toLocaleDateString("en-CA", { timeZone: "America/Panama" }); // YYYY-MM-DD
  if (todayPa < p.valid_from) return { ok: false, reason: "El pase aún no está vigente." };
  if (todayPa > p.valid_to) return { ok: false, reason: "Pase vencido." };
  if (p.max_uses !== null && p.uses_count >= p.max_uses)
    return { ok: false, reason: "Pase sin usos disponibles." };
  const paNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Panama" }));
  if (p.recurring_days && p.recurring_days.length > 0 && !p.recurring_days.includes(paNow.getDay()))
    return { ok: false, reason: "Hoy no es un día permitido para este pase." };
  if (p.time_from || p.time_to) {
    const hhmm = `${String(paNow.getHours()).padStart(2, "0")}:${String(paNow.getMinutes()).padStart(2, "0")}`;
    if (p.time_from && hhmm < p.time_from.slice(0, 5)) return { ok: false, reason: "Fuera del horario permitido." };
    if (p.time_to && hhmm > p.time_to.slice(0, 5)) return { ok: false, reason: "Fuera del horario permitido." };
  }
  return { ok: true, reason: null };
}

export type PassLookup =
  | {
      ok: true;
      pass: Pick<
        PassRow,
        "id" | "visitor_name" | "visitor_doc" | "type" | "valid_from" | "valid_to" | "status" | "max_uses" | "uses_count" | "vehicle_plate" | "unit_id"
      >;
      unitCode: string | null;
      canEnter: boolean;
      reason: string | null;
    }
  | { ok: false; error: string };

export async function lookupPass(code: string): Promise<PassLookup> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { ok: false, error: "Sin organización activa." };
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, error: "Ingresa un código." };

  const supabase = await createClient();
  const { data: pass } = await supabase
    .from("visitor_passes")
    .select("*")
    .eq("organization_id", orgId)
    .eq("code", clean)
    .maybeSingle();
  if (!pass) return { ok: false, error: "Código no encontrado." };

  const { data: unit } = await supabase.from("units").select("code").eq("id", pass.unit_id).maybeSingle();
  const v = canEnterNow(pass);
  return {
    ok: true,
    pass: {
      id: pass.id,
      visitor_name: pass.visitor_name,
      visitor_doc: pass.visitor_doc,
      type: pass.type,
      valid_from: pass.valid_from,
      valid_to: pass.valid_to,
      status: pass.status,
      max_uses: pass.max_uses,
      uses_count: pass.uses_count,
      vehicle_plate: pass.vehicle_plate,
      unit_id: pass.unit_id,
    },
    unitCode: unit?.code ?? null,
    canEnter: v.ok,
    reason: v.reason,
  };
}

export async function registerVisit(vars: {
  passId?: string | null;
  visitorName: string;
  visitorDoc?: string;
  vehiclePlate?: string;
  unitId?: string | null;
  buildingId?: string | null;
  direction: string;
  photoPath?: string | null;
}): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (vars.direction !== "entrada" && vars.direction !== "salida")
    return { error: "Dirección inválida.", ok: false };
  const docPath = (vars.photoPath ?? "").trim() || null;
  if (docPath && !docPath.startsWith(`${orgId}/accesos/`))
    return { error: "Ruta de foto inválida.", ok: false };

  const supabase = await createClient();
  let buildingId: string | null = null;
  let unitId: string | null = null;
  let visitorName = (vars.visitorName ?? "").trim();
  let visitorDoc = (vars.visitorDoc ?? "").trim() || null;
  let plate = (vars.vehiclePlate ?? "").trim().toUpperCase() || null;
  let pass: PassRow | null = null;

  if (vars.passId) {
    if (!UUID.test(vars.passId)) return { error: "Pase inválido.", ok: false };
    const { data } = await supabase
      .from("visitor_passes")
      .select("*")
      .eq("id", vars.passId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!data) return { error: "Pase no encontrado.", ok: false };
    pass = data;
    // En la entrada se valida la vigencia; en la salida no.
    if (vars.direction === "entrada") {
      const v = canEnterNow(pass);
      if (!v.ok) return { error: v.reason ?? "Pase no válido.", ok: false };
    }
    buildingId = pass.building_id;
    unitId = pass.unit_id;
    visitorName = pass.visitor_name;
    visitorDoc = pass.visitor_doc;
    plate = plate ?? pass.vehicle_plate;
  } else {
    // Walk-in (sin pase)
    if (!visitorName) return { error: "El nombre del visitante es obligatorio.", ok: false };
    if (vars.unitId && UUID.test(vars.unitId)) {
      const { data: unit } = await supabase
        .from("units")
        .select("building_id")
        .eq("id", vars.unitId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!unit) return { error: "Unidad no encontrada.", ok: false };
      unitId = vars.unitId;
      buildingId = unit.building_id;
    } else if (vars.buildingId && UUID.test(vars.buildingId)) {
      buildingId = vars.buildingId;
    }
    if (!buildingId) return { error: "Selecciona la unidad o el edificio.", ok: false };
  }

  const { error } = await supabase.from("visitor_log").insert({
    organization_id: orgId,
    building_id: buildingId,
    unit_id: unitId,
    pass_id: vars.passId || null,
    visitor_name: visitorName,
    visitor_doc: visitorDoc,
    vehicle_plate: plate,
    direction: vars.direction as Enums["log_direction"],
    photo_path: docPath,
    guard_user: ctx.userId,
  });
  if (error) {
    console.error("registerVisit:", error.code, error.message);
    return { error: "No se pudo registrar.", ok: false };
  }

  // En la entrada con pase, se consume un uso.
  if (pass && vars.direction === "entrada") {
    await supabase
      .from("visitor_passes")
      .update({ uses_count: pass.uses_count + 1 })
      .eq("id", pass.id)
      .eq("organization_id", orgId);
  }

  revalidatePath("/app/garita");
  revalidatePath("/app/accesos");
  return { error: null, ok: true };
}

export async function anularPass(passId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!UUID.test(passId)) return { error: "Pase inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("visitor_passes")
    .update({ status: "anulado" })
    .eq("id", passId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("anularPass:", error.code, error.message);
    return { error: "No se pudo anular el pase.", ok: false };
  }
  revalidatePath("/app/accesos");
  revalidatePath(`/app/accesos/${passId}`);
  return { error: null, ok: true };
}
