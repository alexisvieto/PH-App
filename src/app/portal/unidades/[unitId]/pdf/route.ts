import { renderToBuffer } from "@react-pdf/renderer";

import { StatementPDF } from "@/components/pdf/statement-pdf";
import { getResidentContext } from "@/lib/session";
import { getUnitStatement } from "@/lib/statement";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ unitId: string }> },
) {
  const { unitId } = await params;
  // Defensa en profundidad: además de RLS (getUnitStatement devuelve null sin
  // acceso), exige explícitamente que la unidad sea del residente.
  const res = await getResidentContext();
  if (!res?.units?.some((u) => u.id === unitId)) return new Response("No autorizado", { status: 403 });
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
