import { renderToBuffer } from "@react-pdf/renderer";

import { PazSalvoPDF } from "@/components/pdf/paz-salvo-pdf";
import { getSessionContext } from "@/lib/session";
import { getUnitStatement } from "@/lib/statement";

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

  // No se emite paz y salvo si la unidad tiene saldo pendiente.
  if (st.balance > 0.005) {
    return new Response(
      "La unidad tiene saldo pendiente; no se puede emitir paz y salvo.",
      { status: 409 },
    );
  }

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const buffer = await renderToBuffer(
    PazSalvoPDF({
      brand: ctx.brand,
      buildingName: st.buildingName,
      unitCode: st.unitCode,
      ownerName: st.ownerName,
      generatedOn,
    }),
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="paz-y-salvo-${st.unitCode}.pdf"`,
    },
  });
}
