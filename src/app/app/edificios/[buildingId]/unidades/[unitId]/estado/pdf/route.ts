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

  const st = await getUnitStatement(unitId);
  if (!st) return new Response("No encontrado", { status: 404 });

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const buffer = await renderToBuffer(
      StatementPDF({ statement: st, brand: st.brand, generatedOn }),
    );
    const safeCode = st.unitCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="estado-cuenta-${safeCode}.pdf"`,
      },
    });
  } catch (err) {
    console.error("estado pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
