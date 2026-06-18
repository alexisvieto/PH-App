import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PayrollPeriodActions } from "@/components/rrhh/payroll-period-actions";
import { formatDate, formatMoney } from "@/lib/format";
import {
  PAYROLL_KIND_LABEL,
  PAYROLL_STATUS_CLASS,
  PAYROLL_STATUS_LABEL,
} from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PayrollPeriodDetailPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  if (!canManage(ctx.role)) notFound();

  const supabase = await createClient();
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, label, kind, status, frequency, period_start, period_end, pay_date")
    .eq("id", periodId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!period) notFound();

  const [{ data: items }, { data: employees }] = await Promise.all([
    supabase
      .from("payroll_items")
      .select("id, employee_id, gross, css_employee, seguro_educativo_employee, isr, net, css_employer, seguro_educativo_employer, riesgos_employer")
      .eq("payroll_period_id", periodId),
    supabase.from("employees").select("id, full_name").eq("organization_id", orgId),
  ]);
  const name = new Map((employees ?? []).map((e) => [e.id, e.full_name]));
  const rows = items ?? [];
  const isXiii = period.kind === "xiii";

  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0);
  const totals = {
    gross: sum((r) => Number(r.gross)),
    css: sum((r) => Number(r.css_employee)),
    se: sum((r) => Number(r.seguro_educativo_employee)),
    isr: sum((r) => Number(r.isr)),
    net: sum((r) => Number(r.net)),
    employer: sum(
      (r) => Number(r.gross) + Number(r.css_employer) + Number(r.seguro_educativo_employer) + Number(r.riesgos_employer),
    ),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/app/planilla" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver a planilla
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{period.label}</h1>
            <p className="text-sm text-muted">
              {PAYROLL_KIND_LABEL[period.kind]} · {formatDate(period.period_start)} — {formatDate(period.period_end)}
              {period.pay_date ? ` · pago ${formatDate(period.pay_date)}` : ""}
            </p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYROLL_STATUS_CLASS[period.status]}`}>
            {PAYROLL_STATUS_LABEL[period.status]}
          </span>
        </div>
        <div className="mt-4">
          <PayrollPeriodActions periodId={period.id} status={period.status} />
        </div>
        {isXiii && (
          <p className="mt-3 text-xs text-muted">
            XIII: deducción de CSS especial 7.25%. El ISR proporcional sobre el XIII se retiene según
            proyección anual y debe revisarse manualmente si aplica.
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
          {period.status === "borrador"
            ? "Aún no procesada. Pulsa “Procesar” para generar los renglones."
            : "Sin renglones (no hay empleados activos que apliquen)."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Empleado</th>
                <th className="px-4 py-3 text-right font-medium">Bruto</th>
                <th className="px-4 py-3 text-right font-medium">CSS</th>
                {!isXiii && <th className="px-4 py-3 text-right font-medium">Seg. Educ.</th>}
                {!isXiii && <th className="px-4 py-3 text-right font-medium">ISR</th>}
                <th className="px-4 py-3 text-right font-medium">Neto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{name.get(r.employee_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(r.gross)}</td>
                  <td className="px-4 py-3 text-right text-muted">{formatMoney(r.css_employee)}</td>
                  {!isXiii && <td className="px-4 py-3 text-right text-muted">{formatMoney(r.seguro_educativo_employee)}</td>}
                  {!isXiii && <td className="px-4 py-3 text-right text-muted">{formatMoney(r.isr)}</td>}
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(r.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Totales ({rows.length})</td>
                <td className="px-4 py-3 text-right">{formatMoney(totals.gross)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(totals.css)}</td>
                {!isXiii && <td className="px-4 py-3 text-right">{formatMoney(totals.se)}</td>}
                {!isXiii && <td className="px-4 py-3 text-right">{formatMoney(totals.isr)}</td>}
                <td className="px-4 py-3 text-right">{formatMoney(totals.net)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Costo patronal total del período: {formatMoney(totals.employer)}
          </p>
        </div>
      )}
    </div>
  );
}
