import { renderToBuffer } from "@react-pdf/renderer";

import { StatementPDF } from "@/components/pdf/statement-pdf";
import { getUnitStatement } from "@/lib/statement";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ unitId: string }> },
) {
  const { unitId } = await params;
  // getUnitStatement corre bajo RLS: solo devuelve la unidad si el residente
  // (o staff) tiene acceso; null en cualquier otro caso.
  const st = await getUnitStatement(unitId);
  if (!st) return new Response("No autorizado", { status: 403 });

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
    console.error("portal statement pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
