import { renderToBuffer } from "@react-pdf/renderer";

import { PazSalvoPDF } from "@/components/pdf/paz-salvo-pdf";
import { BALANCE_TOLERANCE } from "@/lib/finance";
import { getUnitStatement } from "@/lib/statement";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ unitId: string }> },
) {
  const { unitId } = await params;
  const st = await getUnitStatement(unitId);
  if (!st) return new Response("No autorizado", { status: 403 });

  if (st.balance > BALANCE_TOLERANCE) {
    return new Response(
      "Tu unidad tiene saldo pendiente; no se puede emitir paz y salvo.",
      { status: 409 },
    );
  }

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const buffer = await renderToBuffer(
      PazSalvoPDF({
        brand: st.brand,
        buildingName: st.buildingName,
        unitCode: st.unitCode,
        ownerName: st.ownerName,
        generatedOn,
      }),
    );
    const safeCode = st.unitCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="paz-y-salvo-${safeCode}.pdf"`,
      },
    });
  } catch (err) {
    console.error("portal paz y salvo pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
