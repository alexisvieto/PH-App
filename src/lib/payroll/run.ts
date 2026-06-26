import "server-only";

import {
  computePeriodPayroll,
  computeXiii,
  EMPTY_OVERTIME,
  monthsBetweenIso,
  type OvertimeHours,
} from "@/lib/payroll/engine";
import { loadRuleSet, type RuleSet } from "@/lib/payroll/rules";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type Enums = Database["public"]["Enums"];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const OT_TYPES = {
  hora_extra_diurna: "diurna",
  hora_extra_nocturna: "nocturna",
  hora_extra_mixta: "mixta",
  dia_fiesta: "fiesta",
  hora_extra_fiesta_domingo: "fiestaDomingo",
} as const;
type OtIncidence = keyof typeof OT_TYPES;
const OT_INCIDENCE_TYPES = Object.keys(OT_TYPES) as OtIncidence[];

/**
 * Calcula y guarda los renglones de un período (lo deja "procesada"). Sin
 * verificación de permisos: el llamador (acción o auto-generación) la hace.
 */
export async function runPayrollPeriod(
  supabase: SupabaseServer,
  orgId: string,
  periodId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, kind, frequency, period_start, period_end, pay_date, status")
    .eq("id", periodId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!period) return { ok: false, error: "Período no encontrado." };
  if (period.status === "pagada") return { ok: false, error: "El período ya está pagado." };

  let q = supabase
    .from("employees")
    .select("id, base_salary, work_shift, country_code, declares_dependents, risk_premium_pct, hire_date")
    .eq("organization_id", orgId)
    .eq("status", "activo");
  if (period.kind === "ordinaria") q = q.eq("pay_frequency", period.frequency);
  const { data: employees } = await q;

  const otByEmployee = new Map<string, OvertimeHours>();
  if (period.kind === "ordinaria") {
    const { data: incidences } = await supabase
      .from("payroll_incidences")
      .select("employee_id, type, hours")
      .eq("payroll_period_id", periodId)
      .in("type", OT_INCIDENCE_TYPES);
    for (const inc of incidences ?? []) {
      const field = OT_TYPES[inc.type as OtIncidence];
      if (!field) continue;
      const cur = otByEmployee.get(inc.employee_id) ?? { ...EMPTY_OVERTIME };
      cur[field] = (cur[field] ?? 0) + Number(inc.hours ?? 0);
      otByEmployee.set(inc.employee_id, cur);
    }
  }

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
        workShift: e.work_shift,
        frequency: period.frequency,
        declaresDependents: e.declares_dependents,
        riskPct: Number(e.risk_premium_pct),
        overtime: otByEmployee.get(e.id),
      });
      items.push({
        organization_id: orgId,
        payroll_period_id: periodId,
        employee_id: e.id,
        gross: r.gross,
        base_amount: r.base,
        overtime_amount: r.overtimeAmount,
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

  await supabase.from("payroll_items").delete().eq("payroll_period_id", periodId);
  if (items.length > 0) {
    const { error } = await supabase.from("payroll_items").insert(items);
    if (error) {
      console.error("runPayrollPeriod insert:", error.code, error.message);
      return { ok: false, error: "No se pudieron generar los renglones." };
    }
  }
  await supabase
    .from("payroll_periods")
    .update({ status: "procesada", rule_set_id: lastRuleId })
    .eq("id", periodId)
    .eq("organization_id", orgId);
  return { ok: true, error: null };
}

// --------------------------------------------------------------------------
// Auto-generación: las quincenas (15 y último día) que ya vencieron se crean
// y se calculan solas, listas para revisar y autorizar el pago.
// --------------------------------------------------------------------------
const MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

type DuePeriod = {
  frequency: Enums["pay_frequency"];
  period_start: string;
  period_end: string;
  pay_date: string;
  label: string;
};

/** Períodos cuya fecha de pago ya pasó (15 / último día), dentro de la ventana. */
function computeDuePeriods(
  frequency: Enums["pay_frequency"],
  today: string,
  windowStart: string,
): DuePeriod[] {
  const [ty, tm] = today.split("-").map(Number);
  const months: [number, number][] = [
    [ty, tm],
    [tm === 1 ? ty - 1 : ty, tm === 1 ? 12 : tm - 1],
  ];
  const out: DuePeriod[] = [];
  for (const [y, m] of months) {
    const ld = lastDay(y, m);
    const mName = `${MES[m - 1]} ${y}`;
    if (frequency === "quincenal") {
      out.push({ frequency, period_start: iso(y, m, 1), period_end: iso(y, m, 15), pay_date: iso(y, m, 15), label: `Planilla 1ª quincena · ${mName}` });
      out.push({ frequency, period_start: iso(y, m, 16), period_end: iso(y, m, ld), pay_date: iso(y, m, ld), label: `Planilla 2ª quincena · ${mName}` });
    } else if (frequency === "mensual") {
      out.push({ frequency, period_start: iso(y, m, 1), period_end: iso(y, m, ld), pay_date: iso(y, m, ld), label: `Planilla · ${mName}` });
    }
  }
  return out.filter((d) => d.pay_date <= today && d.pay_date >= windowStart);
}

/** Asegura que existan (creadas y procesadas) las planillas vencidas del PH. Idempotente. */
export async function ensureDuePayrollPeriods(supabase: SupabaseServer, orgId: string): Promise<void> {
  const { data: emps } = await supabase
    .from("employees")
    .select("pay_frequency")
    .eq("organization_id", orgId)
    .eq("status", "activo");
  if (!emps || emps.length === 0) return;
  const freqs = Array.from(new Set(emps.map((e) => e.pay_frequency)));

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const ws = new Date(`${today}T00:00:00Z`);
  ws.setUTCDate(ws.getUTCDate() - 35); // ventana ~ una quincena atrás
  const windowStart = ws.toISOString().slice(0, 10);

  const due = freqs.flatMap((f) => computeDuePeriods(f, today, windowStart));
  if (due.length === 0) return;

  const { data: existing } = await supabase
    .from("payroll_periods")
    .select("frequency, period_start")
    .eq("organization_id", orgId)
    .eq("kind", "ordinaria")
    .gte("period_start", windowStart);
  const has = new Set((existing ?? []).map((p) => `${p.frequency}|${p.period_start}`));

  for (const d of due) {
    if (has.has(`${d.frequency}|${d.period_start}`)) continue;
    const { data: created, error } = await supabase
      .from("payroll_periods")
      .insert({
        organization_id: orgId,
        kind: "ordinaria",
        label: d.label,
        frequency: d.frequency,
        period_start: d.period_start,
        period_end: d.period_end,
        pay_date: d.pay_date,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.code !== "23505") console.error("ensureDuePayrollPeriods:", error.code, error.message);
      continue; // 23505 = ya existe (carrera) → ok
    }
    if (created?.id) await runPayrollPeriod(supabase, orgId, created.id);
  }
}
