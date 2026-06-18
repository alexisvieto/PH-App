"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { isValidIsoDate } from "@/lib/format";
import {
  computeLiquidation,
  computePayroll,
  type LiquidationResult,
  type PayrollResult,
  type Scenario,
} from "@/lib/payroll/engine";
import { loadRuleSet } from "@/lib/payroll/rules";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isEnum = <T extends keyof Enums>(name: T, v: string) =>
  (Constants.public.Enums[name] as readonly string[]).includes(v);

const num = (v: FormDataEntryValue | null | undefined, def = 0): number => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : def;
};

// --------------------------------------------------------------------------
// Alta de empleado (admin)
// --------------------------------------------------------------------------
export async function createEmployee(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return { error: "Sin organización activa.", ok: false };
  if (!canManage(ctx.role))
    return { error: "Solo un administrador gestiona RRHH.", ok: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "El nombre es obligatorio.", ok: false };

  const hireDate = String(formData.get("hire_date") ?? "").trim();
  if (!isValidIsoDate(hireDate)) return { error: "Fecha de ingreso inválida.", ok: false };

  const baseSalary = num(formData.get("base_salary"));
  if (baseSalary <= 0) return { error: "El salario base debe ser mayor a 0.", ok: false };

  const contractType = String(formData.get("contract_type") ?? "");
  const workShift = String(formData.get("work_shift") ?? "");
  const payFrequency = String(formData.get("pay_frequency") ?? "");
  if (!isEnum("contract_type", contractType)) return { error: "Tipo de contrato inválido.", ok: false };
  if (!isEnum("work_shift", workShift)) return { error: "Jornada inválida.", ok: false };
  if (!isEnum("pay_frequency", payFrequency)) return { error: "Frecuencia inválida.", ok: false };

  const riskPct = num(formData.get("risk_premium_pct"));
  if (riskPct < 0 || riskPct > 15) return { error: "Riesgo profesional fuera de rango (0-15%).", ok: false };

  const buildingRaw = String(formData.get("building_id") ?? "").trim();
  if (buildingRaw && !UUID.test(buildingRaw)) return { error: "Edificio inválido.", ok: false };

  const supabase = await createClient();
  const { data: emp, error } = await supabase
    .from("employees")
    .insert({
      organization_id: orgId,
      building_id: buildingRaw || null,
      full_name: fullName,
      national_id: String(formData.get("national_id") ?? "").trim() || null,
      position: String(formData.get("position") ?? "").trim() || null,
      hire_date: hireDate,
      contract_type: contractType as Enums["contract_type"],
      work_shift: workShift as Enums["work_shift"],
      base_salary: baseSalary,
      pay_frequency: payFrequency as Enums["pay_frequency"],
      risk_premium_pct: riskPct,
      declares_dependents: formData.get("declares_dependents") === "on",
      created_by: ctx.userId,
    })
    .select("id")
    .maybeSingle();
  if (error || !emp) {
    console.error("createEmployee:", error?.code, error?.message);
    return { error: "No se pudo registrar el empleado.", ok: false };
  }

  // Salario inicial en el historial (no bloquea el alta, pero se reporta si falla).
  const { error: histErr } = await supabase.from("salary_history").insert({
    organization_id: orgId,
    employee_id: emp.id,
    effective_from: hireDate,
    base_salary: baseSalary,
    note: "Salario inicial",
  });
  if (histErr) console.error("createEmployee salary_history:", histErr.code, histErr.message);

  revalidatePath("/app/rrhh");
  return { error: null, ok: true };
}

// --------------------------------------------------------------------------
// Cálculo: carga empleado (RLS) + paquete legal de su país, y computa.
// --------------------------------------------------------------------------
type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

type LoadOk = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createClient>>;
  orgId: string;
  emp: EmployeeRow;
  rule: NonNullable<Awaited<ReturnType<typeof loadRuleSet>>>;
};
type LoadFail = { ok: false; error: string };

async function loadEmployeeAndRule(
  employeeId: string,
  onDate: string,
): Promise<LoadOk | LoadFail> {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId || !canManage(ctx?.role ?? null)) return { ok: false, error: "No autorizado." };
  if (!UUID.test(employeeId)) return { ok: false, error: "Empleado inválido." };

  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!emp) return { ok: false, error: "Empleado no encontrado." };

  const rule = await loadRuleSet(supabase, emp.country_code, onDate);
  if (!rule) return { ok: false, error: `Sin paquete legal vigente para ${emp.country_code}.` };
  return { ok: true, supabase, orgId, emp: emp as EmployeeRow, rule };
}

export type PayrollPreview =
  | { ok: true; result: PayrollResult }
  | { ok: false; error: string };

export async function previewPayroll(
  employeeId: string,
  vars: {
    overtime: { diurna: number; nocturna: number; mixta: number; fiesta: number; fiestaDomingo: number };
    commissions: number;
    otherIncome: number;
    otherDeductions: number;
  },
): Promise<PayrollPreview> {
  const today = new Date().toISOString().slice(0, 10);
  const loaded = await loadEmployeeAndRule(employeeId, today);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { emp, rule } = loaded;

  const result = computePayroll(rule, {
    baseSalary: Number(emp.base_salary),
    workShift: emp.work_shift,
    declaresDependents: emp.declares_dependents,
    riskPct: Number(emp.risk_premium_pct),
    overtime: vars.overtime,
    commissions: vars.commissions,
    otherIncome: vars.otherIncome,
    otherDeductions: vars.otherDeductions,
  });
  return { ok: true, result };
}

export type LiquidationPreview =
  | { ok: true; result: LiquidationResult }
  | { ok: false; error: string };

function liquidationInputFromVars(
  emp: EmployeeRow,
  vars: {
    scenario: string;
    terminationDate: string;
    cumplioPreaviso: boolean;
    empresaDioPreaviso: boolean;
    incentivoPactado: number;
    referenceSalary?: number;
  },
) {
  return {
    scenario: vars.scenario as Scenario,
    baseSalary: Number(emp.base_salary),
    hireDate: emp.hire_date,
    terminationDate: vars.terminationDate,
    contractType: emp.contract_type,
    cumplioPreaviso: vars.cumplioPreaviso,
    empresaDioPreaviso: vars.empresaDioPreaviso,
    incentivoPactado: vars.incentivoPactado,
    referenceSalary: vars.referenceSalary,
  };
}

export async function previewLiquidation(
  employeeId: string,
  vars: {
    scenario: string;
    terminationDate: string;
    cumplioPreaviso: boolean;
    empresaDioPreaviso: boolean;
    incentivoPactado: number;
    referenceSalary?: number;
  },
): Promise<LiquidationPreview> {
  if (!isEnum("termination_scenario", vars.scenario))
    return { ok: false, error: "Escenario inválido." };
  if (!isValidIsoDate(vars.terminationDate))
    return { ok: false, error: "Fecha de terminación inválida." };
  const loaded = await loadEmployeeAndRule(employeeId, vars.terminationDate);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const result = computeLiquidation(loaded.rule, liquidationInputFromVars(loaded.emp, vars));
  return { ok: true, result };
}

export async function saveLiquidation(
  employeeId: string,
  vars: {
    scenario: string;
    terminationDate: string;
    cumplioPreaviso: boolean;
    empresaDioPreaviso: boolean;
    incentivoPactado: number;
    referenceSalary?: number;
  },
): Promise<ActionState> {
  if (!isEnum("termination_scenario", vars.scenario))
    return { error: "Escenario inválido.", ok: false };
  if (!isValidIsoDate(vars.terminationDate))
    return { error: "Fecha de terminación inválida.", ok: false };
  const loaded = await loadEmployeeAndRule(employeeId, vars.terminationDate);
  if (!loaded.ok) return { error: loaded.error, ok: false };
  const { supabase, orgId, emp, rule } = loaded;

  const ctxSession = await getSessionContext();
  const r = computeLiquidation(rule, liquidationInputFromVars(emp, vars));
  const { error } = await supabase.from("liquidations").insert({
    organization_id: orgId,
    employee_id: emp.id,
    scenario: vars.scenario as Scenario,
    termination_date: vars.terminationDate,
    contract_type: emp.contract_type,
    years_service: r.yearsService,
    reference_salary: r.referenceSalary,
    vacaciones: r.vacaciones,
    xiii_proporcional: r.xiiiProporcional,
    prima_antiguedad: r.primaAntiguedad,
    preaviso: r.preaviso,
    indemnizacion: r.indemnizacion,
    incentivo_pactado: r.incentivoPactado,
    penalidad: r.penalidad,
    cumplio_preaviso: vars.cumplioPreaviso,
    empresa_dio_preaviso: vars.empresaDioPreaviso,
    total: r.total,
    rule_set_id: rule.ruleSetId,
    created_by: ctxSession?.userId ?? null,
  });
  if (error) {
    console.error("saveLiquidation:", error.code, error.message);
    return { error: "No se pudo guardar la liquidación.", ok: false };
  }

  // La liquidación es el finiquito: el empleado queda inactivo con su fecha de baja.
  const { error: updErr } = await supabase
    .from("employees")
    .update({ status: "inactivo", termination_date: vars.terminationDate })
    .eq("id", emp.id)
    .eq("organization_id", orgId);
  if (updErr) console.error("saveLiquidation update employee:", updErr.code, updErr.message);

  revalidatePath(`/app/rrhh/${employeeId}`);
  revalidatePath("/app/rrhh");
  return { error: null, ok: true };
}
