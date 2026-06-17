import Link from "next/link";
import { notFound } from "next/navigation";
import { Users2 } from "lucide-react";

import { NewEmployeeForm } from "@/components/forms/new-employee-form";
import { formatDate, formatMoney } from "@/lib/format";
import {
  CONTRACT_TYPE_LABEL,
  EMPLOYEE_STATUS_LABEL,
} from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function RrhhPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  // RRHH es admin-only (salarios sensibles).
  if (!canManage(ctx.role)) notFound();

  const supabase = await createClient();
  const [{ data: employees }, { data: buildings }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, position, base_salary, contract_type, status, hire_date")
      .eq("organization_id", orgId)
      .order("full_name")
      .limit(300),
    supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
  ]);
  const list = employees ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recursos Humanos</h1>
          <p className="text-sm text-muted">
            Trabajadores del PH, planilla y liquidaciones (cálculo automático según ley).
          </p>
        </div>
        <NewEmployeeForm buildings={buildings ?? []} />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Users2 className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Sin empleados registrados</p>
          <p className="text-sm text-muted">Agrega el primero con “Nuevo empleado”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Empleado</th>
                <th className="px-4 py-3 font-medium">Ingreso</th>
                <th className="px-4 py-3 font-medium">Contrato</th>
                <th className="px-4 py-3 text-right font-medium">Salario</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/app/rrhh/${e.id}`} className="font-medium text-brand hover:underline">
                      {e.full_name}
                    </Link>
                    {e.position && <span className="block text-xs text-muted">{e.position}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(e.hire_date)}</td>
                  <td className="px-4 py-3 text-muted">{CONTRACT_TYPE_LABEL[e.contract_type]}</td>
                  <td className="px-4 py-3 text-right text-muted">{formatMoney(e.base_salary)}</td>
                  <td className="px-4 py-3 text-muted">{EMPLOYEE_STATUS_LABEL[e.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
