import { renderToBuffer } from "@react-pdf/renderer";

import { LiquidationLetterPDF } from "@/components/pdf/liquidation-letter-pdf";
import { formatDate } from "@/lib/format";
import { CONTRACT_TYPE_LABEL, TERMINATION_SCENARIO_LABEL } from "@/lib/payroll/labels";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string; liquidationId: string }> },
) {
  const { employeeId, liquidationId } = await params;
  if (!UUID.test(employeeId) || !UUID.test(liquidationId))
    return new Response("No encontrado", { status: 404 });
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg || !canManage(ctx.role))
    return new Response("No autorizado", { status: 401 });
  const orgId = ctx.activeOrg.id;

  const supabase = await createClient();
  const [{ data: liq }, { data: emp }] = await Promise.all([
    supabase
      .from("liquidations")
      .select("scenario, contract_type, termination_date, years_service, reference_salary, vacaciones, xiii_proporcional, prima_antiguedad, preaviso, indemnizacion, incentivo_pactado, penalidad, total")
      .eq("id", liquidationId)
      .eq("employee_id", employeeId)
      .eq("organization_id", orgId)
      .maybeSingle(),
    supabase
      .from("employees")
      .select("full_name, position")
      .eq("id", employeeId)
      .eq("organization_id", orgId)
      .maybeSingle(),
  ]);
  if (!liq || !emp) return new Response("No encontrado", { status: 404 });

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Panama",
  });

  try {
    const buffer = await renderToBuffer(
      LiquidationLetterPDF({
        brand: ctx.brand,
        employeeName: emp.full_name,
        position: emp.position,
        scenarioLabel: TERMINATION_SCENARIO_LABEL[liq.scenario],
        contractLabel: CONTRACT_TYPE_LABEL[liq.contract_type],
        terminationDate: formatDate(liq.termination_date),
        yearsService: Number(liq.years_service),
        referenceSalary: Number(liq.reference_salary),
        vacaciones: Number(liq.vacaciones),
        xiiiProporcional: Number(liq.xiii_proporcional),
        primaAntiguedad: Number(liq.prima_antiguedad),
        preaviso: Number(liq.preaviso),
        indemnizacion: Number(liq.indemnizacion),
        incentivoPactado: Number(liq.incentivo_pactado),
        penalidad: Number(liq.penalidad),
        total: Number(liq.total),
        generatedOn,
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="liquidacion-${liquidationId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("liquidation letter pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
