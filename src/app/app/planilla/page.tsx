import Link from "next/link";
import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";

import { NewPayrollPeriodForm } from "@/components/forms/new-payroll-period-form";
import { NewXiiiForm } from "@/components/forms/new-xiii-form";
import { formatDate } from "@/lib/format";
import {
  PAYROLL_KIND_LABEL,
  PAYROLL_STATUS_CLASS,
  PAYROLL_STATUS_LABEL,
} from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PlanillaPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  if (!canManage(ctx.role)) notFound();

  const supabase = await createClient();
  const { data: periods } = await supabase
    .from("payroll_periods")
    .select("id, label, kind, status, period_start, period_end, pay_date")
    .eq("organization_id", orgId)
    .order("period_start", { ascending: false })
    .limit(200);
  const list = periods ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Planilla</h1>
          <p className="text-sm text-muted">
            Corridas de planilla ordinaria y décimo tercer mes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NewPayrollPeriodForm />
          <NewXiiiForm />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Receipt className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Sin planillas</p>
          <p className="text-sm text-muted">Crea la primera con “Nueva planilla”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Planilla</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/app/planilla/${p.id}`} className="font-medium text-brand hover:underline">
                      {p.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{PAYROLL_KIND_LABEL[p.kind]}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(p.period_start)} — {formatDate(p.period_end)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYROLL_STATUS_CLASS[p.status]}`}>
                      {PAYROLL_STATUS_LABEL[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
