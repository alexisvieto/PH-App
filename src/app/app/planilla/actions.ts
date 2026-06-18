"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import {
  computePeriodPayroll,
  computeXiii,
  monthsBetweenIso,
  xiiiPartidaWindow,
} from "@/lib/payroll/engine";
import { loadRuleSet, type RuleSet } from "@/lib/payroll/rules";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Crea un período de planilla ordinaria (borrador). */
export async function createPayrollPeriod(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };

  const frequency = String(formData.get("frequency") ?? "");
  if (!(Constants.public.Enums.pay_frequency as readonly string[]).includes(frequency))
    return { error: "Frecuencia inválida.", ok: false };
  const start = String(formData.get("period_start") ?? "").trim();
  const end = String(formData.get("period_end") ?? "").trim();
  if (!isValidIsoDate(start) || !isValidIsoDate(end))
    return { error: "Fechas del período inválidas.", ok: false };
  if (end < start) return { error: "El fin del período debe ser posterior al inicio.", ok: false };
  const payRaw = String(formData.get("pay_date") ?? "").trim();
  if (payRaw && !isValidIsoDate(payRaw)) return { error: "Fecha de pago inválida.", ok: false };
  const label = String(formData.get("label") ?? "").trim() || `Planilla ${start} — ${end}`;

  const supabase = await createClient();
  const { error } = await supabase.from("payroll_periods").insert({
    organization_id: orgId,
    kind: "ordinaria",
    label,
    frequency: frequency as Enums["pay_frequency"],
    period_start: start,
    period_end: end,
    pay_date: payRaw || null,
    created_by: ctx.userId,
  });
  if (error) {
    console.error("createPayrollPeriod:", error.code, error.message);
    return { error: "No se pudo crear el período.", ok: false };
  }
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}

/** Crea una partida del XIII mes (borrador) con su ventana de cuatrimestre. */
export async function createXiiiPeriod(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };

  const partida = Number(formData.get("partida"));
  const year = Number(formData.get("year"));
  if (![1, 2, 3].includes(partida)) return { error: "Partida inválida.", ok: false };
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    return { error: "Año inválido.", ok: false };

  const win = xiiiPartidaWindow(partida as 1 | 2 | 3, year);
  const supabase = await createClient();
  const { error } = await supabase.from("payroll_periods").insert({
    organization_id: orgId,
    kind: "xiii",
    label: `XIII mes · ${partida}ª partida ${year}`,
    frequency: "mensual",
    period_start: win.start,
    period_end: win.end,
    created_by: ctx.userId,
  });
  if (error) {
    console.error("createXiiiPeriod:", error.code, error.message);
    return { error: "No se pudo crear la partida.", ok: false };
  }
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Procesa el período: calcula los renglones de todos los empleados activos. */
export async function processPayrollPeriod(periodId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };
  if (!UUID.test(periodId)) return { error: "Período inválido.", ok: false };

  const supabase = await createClient();
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, kind, frequency, period_start, period_end, pay_date, status")
    .eq("id", periodId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!period) return { error: "Período no encontrado.", ok: false };
  if (period.status === "pagada") return { error: "El período ya está pagado.", ok: false };

  let q = supabase
    .from("employees")
    .select("id, base_salary, country_code, declares_dependents, risk_premium_pct, hire_date")
    .eq("organization_id", orgId)
    .eq("status", "activo");
  if (period.kind === "ordinaria") q = q.eq("pay_frequency", period.frequency);
  const { data: employees } = await q;

  const onDate = period.pay_date ?? period.period_end;
  const ruleCache = new Map<string, RuleSet | null>();
  const getRule = async (country: string) => {
    if (!ruleCache.has(country)) ruleCache.set(country, await loadRuleSet(supabase, country, onDate));
    return ruleCache.get(country) ?? null;
  };

  type Item = Database["public"]["Tables"]["payroll_items"]["Insert"];
  const items: Item[] = [];
  let lastRuleId: string | null = null;

  for (const e of employees ?? []) {
    const rule = await getRule(e.country_code);
    if (!rule) continue;
    lastRuleId = rule.ruleSetId;
    const base = Number(e.base_salary);

    if (period.kind === "ordinaria") {
      const r = computePeriodPayroll(rule, {
        baseSalary: base,
        frequency: period.frequency,
        declaresDependents: e.declares_dependents,
        riskPct: Number(e.risk_premium_pct),
      });
      items.push({
        organization_id: orgId,
        payroll_period_id: periodId,
        employee_id: e.id,
        gross: r.gross,
        base_amount: r.gross,
        css_employee: r.cssEmployee,
        seguro_educativo_employee: r.seguroEducativoEmployee,
        isr: r.isr,
        css_employer: r.cssEmployer,
        seguro_educativo_employer: r.seguroEducativoEmployer,
        riesgos_employer: r.riesgosEmployer,
        net: r.net,
        detail: { kind: "ordinaria" },
      });
    } else {
      // XIII: meses trabajados dentro del cuatrimestre (cap 4).
      const from = e.hire_date > period.period_start ? e.hire_date : period.period_start;
      const today = new Date().toISOString().slice(0, 10);
      const to = period.period_end < today ? period.period_end : today;
      const months = clamp(to >= from ? monthsBetweenIso(from, to) : 0, 0, 4);
      const r = computeXiii(rule, { baseSalary: base, monthsInQuarter: months });
      items.push({
        organization_id: orgId,
        payroll_period_id: periodId,
        employee_id: e.id,
        gross: r.gross,
        base_amount: r.gross,
        css_employee: r.cssEmployee,
        isr: r.isr,
        css_employer: r.cssEmployer,
        net: r.net,
        detail: { kind: "xiii", monthsInQuarter: Math.round(months * 100) / 100 },
      });
    }
  }

  // Re-procesable: se reemplazan los renglones del período.
  await supabase.from("payroll_items").delete().eq("payroll_period_id", periodId);
  if (items.length > 0) {
    const { error } = await supabase.from("payroll_items").insert(items);
    if (error) {
      console.error("processPayrollPeriod insert:", error.code, error.message);
      return { error: "No se pudieron generar los renglones.", ok: false };
    }
  }
  await supabase
    .from("payroll_periods")
    .update({ status: "procesada", rule_set_id: lastRuleId })
    .eq("id", periodId)
    .eq("organization_id", orgId);

  revalidatePath(`/app/planilla/${periodId}`);
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}

/** Marca el período como pagado. */
export async function markPeriodPaid(periodId: string): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { error: "No autorizado.", ok: false };
  if (!UUID.test(periodId)) return { error: "Período inválido.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payroll_periods")
    .update({ status: "pagada", pay_date: new Date().toISOString().slice(0, 10) })
    .eq("id", periodId)
    .eq("organization_id", orgId);
  if (error) {
    console.error("markPeriodPaid:", error.code, error.message);
    return { error: "No se pudo marcar como pagada.", ok: false };
  }
  revalidatePath(`/app/planilla/${periodId}`);
  revalidatePath("/app/planilla");
  return { error: null, ok: true };
}
