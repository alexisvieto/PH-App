import { renderToBuffer } from "@react-pdf/renderer";

import { StatementPDF } from "@/components/pdf/statement-pdf";
import { getSessionContext } from "@/lib/session";
import { getUnitStatement } from "@/lib/statement";

// @react-pdf/renderer requiere runtime Node (no Edge).
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ buildingId: string; unitId: string }> },
) {
  const { unitId } = await params;
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg) return new Response("No autorizado", { status: 401 });

  const st = await getUnitStatement(unitId, ctx.activeOrg.id);
  if (!st) return new Response("No encontrado", { status: 404 });

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const buffer = await renderToBuffer(
    StatementPDF({ statement: st, brand: ctx.brand, generatedOn }),
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="estado-cuenta-${st.unitCode}.pdf"`,
    },
  });
}
