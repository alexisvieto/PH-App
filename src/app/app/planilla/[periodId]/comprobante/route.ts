import { renderToBuffer } from "@react-pdf/renderer";

import { PayrollDisbursementPDF } from "@/components/pdf/payroll-disbursement-pdf";
import { formatDate } from "@/lib/format";
import { PAYROLL_KIND_LABEL } from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  if (!UUID.test(periodId)) return new Response("No encontrado", { status: 404 });
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg || !canManage(ctx.role)) return new Response("No autorizado", { status: 401 });
  const orgId = ctx.activeOrg.id;

  const supabase = await createClient();
  const [{ data: period }, { data: items }, { data: employees }] = await Promise.all([
    supabase
      .from("payroll_periods")
      .select("label, kind, period_start, period_end, pay_date")
      .eq("id", periodId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("payroll_items")
      .select("employee_id, gross, css_employer, seguro_educativo_employer, riesgos_employer, net")
      .eq("payroll_period_id", periodId)
      .eq("organization_id", orgId),
    supabase.from("employees").select("id, full_name").eq("organization_id", orgId),
  ]);
  if (!period || !items || items.length === 0) return new Response("No encontrado", { status: 404 });

  const name = new Map((employees ?? []).map((e) => [e.id, e.full_name]));
  const rows = items
    .map((it) => ({ name: name.get(it.employee_id) ?? "—", net: Number(it.net ?? 0) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const totalNet = items.reduce((a, it) => a + Number(it.net ?? 0), 0);
  const totalEmployer = items.reduce(
    (a, it) => a + Number(it.gross ?? 0) + Number(it.css_employer ?? 0) + Number(it.seguro_educativo_employer ?? 0) + Number(it.riesgos_employer ?? 0),
    0,
  );

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Panama",
  });

  try {
    const buffer = await renderToBuffer(
      PayrollDisbursementPDF({
        brand: ctx.brand,
        orgName: ctx.activeOrg.name ?? ctx.brand.name,
        periodLabel: `${period.label} (${PAYROLL_KIND_LABEL[period.kind]})`,
        periodRange: `${formatDate(period.period_start)} — ${formatDate(period.period_end)}`,
        payDate: period.pay_date ? formatDate(period.pay_date) : null,
        rows,
        totalNet,
        totalEmployer,
        generatedOn,
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Comprobante de pago - ${period.label}.pdf"`,
      },
    });
  } catch (err) {
    console.error("comprobante pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
