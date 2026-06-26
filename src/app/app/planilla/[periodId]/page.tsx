import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { OvertimeEditor } from "@/components/rrhh/overtime-editor";
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

  // Editor de horas extra: empleados elegibles + sus horas ya guardadas (solo ordinaria, no pagada).
  const OT_INCIDENCE = [
    "hora_extra_diurna",
    "hora_extra_nocturna",
    "hora_extra_mixta",
    "dia_fiesta",
    "hora_extra_fiesta_domingo",
  ] as const;
  const OT_FIELD: Record<string, "diurna" | "nocturna" | "mixta" | "fiesta" | "fiestaDomingo"> = {
    hora_extra_diurna: "diurna",
    hora_extra_nocturna: "nocturna",
    hora_extra_mixta: "mixta",
    dia_fiesta: "fiesta",
    hora_extra_fiesta_domingo: "fiestaDomingo",
  };
  const showOt = !isXiii && period.status !== "pagada";
  let otEmployees: {
    id: string;
    name: string;
    diurna: number;
    nocturna: number;
    mixta: number;
    fiesta: number;
    fiestaDomingo: number;
  }[] = [];
  if (showOt) {
    const [{ data: elig }, { data: incs }] = await Promise.all([
      supabase
        .from("employees")
        .select("id, full_name")
        .eq("organization_id", orgId)
        .eq("status", "activo")
        .eq("pay_frequency", period.frequency)
        .order("full_name"),
      supabase
        .from("payroll_incidences")
        .select("employee_id, type, hours")
        .eq("payroll_period_id", periodId)
        .in("type", OT_INCIDENCE),
    ]);
    const otMap = new Map<string, Record<string, number>>();
    for (const inc of incs ?? []) {
      const field = OT_FIELD[inc.type];
      if (!field) continue;
      const cur = otMap.get(inc.employee_id) ?? {};
      cur[field] = (cur[field] ?? 0) + Number(inc.hours ?? 0);
      otMap.set(inc.employee_id, cur);
    }
    otEmployees = (elig ?? []).map((e) => {
      const o = otMap.get(e.id) ?? {};
      return {
        id: e.id,
        name: e.full_name,
        diurna: o.diurna ?? 0,
        nocturna: o.nocturna ?? 0,
        mixta: o.mixta ?? 0,
        fiesta: o.fiesta ?? 0,
        fiestaDomingo: o.fiestaDomingo ?? 0,
      };
    });
  }

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
        <div className="mt-4 space-y-3">
          <PayrollPeriodActions periodId={period.id} status={period.status} />
          {period.status === "procesada" && rows.length > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>Pendiente de pago.</strong> Al procesar se causó el gasto (queda como <em>nómina por pagar</em>).
              Pulsa <strong>“Registrar pago”</strong> para el desembolso: <strong>neto a pagar {formatMoney(totals.net)}</strong>{" "}
              (sale del banco operativo).
            </p>
          )}
          {period.status === "pagada" && (
            <a
              href={`/app/planilla/${period.id}/comprobante`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              <FileText className="size-4" /> Comprobante de pago (PDF)
            </a>
          )}
        </div>
        {isXiii && (
          <p className="mt-3 text-xs text-muted">
            XIII: única deducción CSS especial 7.25% (Decreto Ley 221). No se retiene ISR aparte sobre
            el décimo: ya está incluido en la proyección mensual ×13 del salario (Decreto Ejecutivo
            170/1993, anualización DGI).
          </p>
        )}
      </div>

      {showOt && <OvertimeEditor periodId={period.id} employees={otEmployees} />}

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
                <th className="px-4 py-3" />
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/planilla/${period.id}/recibo/${r.employee_id}`}
                      target="_blank"
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Recibo
                    </Link>
                  </td>
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
                <td className="px-4 py-3" />
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
