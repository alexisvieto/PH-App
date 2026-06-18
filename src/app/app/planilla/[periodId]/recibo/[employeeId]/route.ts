import { renderToBuffer } from "@react-pdf/renderer";

import { PayslipPDF } from "@/components/pdf/payslip-pdf";
import { formatDate } from "@/lib/format";
import { PAYROLL_KIND_LABEL } from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ periodId: string; employeeId: string }> },
) {
  const { periodId, employeeId } = await params;
  if (!UUID.test(periodId) || !UUID.test(employeeId))
    return new Response("No encontrado", { status: 404 });
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg || !canManage(ctx.role))
    return new Response("No autorizado", { status: 401 });
  const orgId = ctx.activeOrg.id;

  const supabase = await createClient();
  const [{ data: period }, { data: item }, { data: emp }] = await Promise.all([
    supabase
      .from("payroll_periods")
      .select("label, kind, period_start, period_end, pay_date")
      .eq("id", periodId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("payroll_items")
      .select("gross, overtime_amount, css_employee, seguro_educativo_employee, isr, other_deductions, net, css_employer, seguro_educativo_employer, riesgos_employer")
      .eq("payroll_period_id", periodId)
      .eq("employee_id", employeeId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("employees")
      .select("full_name, position, national_id, social_security_no")
      .eq("id", employeeId)
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);
  if (!period || !item || !emp) return new Response("No encontrado", { status: 404 });

  const isXiii = period.kind === "xiii";
  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Panama",
  });

  try {
    const buffer = await renderToBuffer(
      PayslipPDF({
        brand: ctx.brand,
        periodLabel: period.label,
        kindLabel: PAYROLL_KIND_LABEL[period.kind],
        periodRange: `${formatDate(period.period_start)} — ${formatDate(period.period_end)}`,
        payDate: period.pay_date ? formatDate(period.pay_date) : null,
        employeeName: emp.full_name,
        position: emp.position,
        nationalId: emp.national_id,
        socialSecurity: emp.social_security_no,
        isXiii,
        gross: Number(item.gross),
        overtimeAmount: Number(item.overtime_amount),
        cssEmployee: Number(item.css_employee),
        seguroEducativoEmployee: Number(item.seguro_educativo_employee),
        isr: Number(item.isr),
        otherDeductions: Number(item.other_deductions),
        net: Number(item.net),
        cssEmployer: Number(item.css_employer),
        seguroEducativoEmployer: Number(item.seguro_educativo_employer),
        riesgosEmployer: Number(item.riesgos_employer),
        employerCost:
          Number(item.gross) + Number(item.css_employer) + Number(item.seguro_educativo_employer) + Number(item.riesgos_employer),
        generatedOn,
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="recibo-${employeeId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("payslip pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
