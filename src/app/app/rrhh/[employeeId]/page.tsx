import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LiquidationCalculator } from "@/components/rrhh/liquidation-calculator";
import { PlanillaCalculator } from "@/components/rrhh/planilla-calculator";
import { formatDate, formatMoney } from "@/lib/format";
import {
  CONTRACT_TYPE_LABEL,
  PAY_FREQUENCY_LABEL,
  TERMINATION_SCENARIO_LABEL,
  WORK_SHIFT_LABEL,
} from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  if (!canManage(ctx.role)) notFound();

  const supabase = await createClient();
  const { data: emp } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!emp) notFound();

  const { data: liquidations } = await supabase
    .from("liquidations")
    .select("id, scenario, termination_date, total, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/app/rrhh" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver a RRHH
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h1 className="text-2xl font-semibold">{emp.full_name}</h1>
        <p className="text-sm text-muted">{emp.position ?? "Sin cargo"}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Salario base" value={formatMoney(emp.base_salary)} />
          <Field label="Frecuencia" value={PAY_FREQUENCY_LABEL[emp.pay_frequency]} />
          <Field label="Contrato" value={CONTRACT_TYPE_LABEL[emp.contract_type]} />
          <Field label="Jornada" value={WORK_SHIFT_LABEL[emp.work_shift]} />
          <Field label="Ingreso" value={formatDate(emp.hire_date)} />
          <Field label="Riesgo prof." value={`${emp.risk_premium_pct}%`} />
          <Field label="País" value={emp.country_code} />
          <Field label="Dependientes" value={emp.declares_dependents ? "Sí declara" : "No"} />
        </dl>
      </div>

      <PlanillaCalculator employeeId={emp.id} />

      <LiquidationCalculator employeeId={emp.id} contractType={emp.contract_type} />

      {(liquidations ?? []).length > 0 && (
        <div className="rounded-2xl border border-line bg-surface">
          <h2 className="border-b border-line px-5 py-3 font-semibold">Liquidaciones guardadas</h2>
          <ul className="divide-y divide-line">
            {(liquidations ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  {TERMINATION_SCENARIO_LABEL[l.scenario]} · {formatDate(l.termination_date)}
                </span>
                <span className="font-medium">{formatMoney(l.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
