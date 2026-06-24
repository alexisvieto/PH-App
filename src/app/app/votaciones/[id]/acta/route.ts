import { getSessionContext } from "@/lib/session";
import { renderActaPdf } from "@/lib/votacion-acta";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg) return new Response("No autorizado", { status: 403 });

  const res = await renderActaPdf(id, ctx.brand);
  if ("error" in res) {
    return new Response(res.error === "not_closed" ? "El acta está disponible al cerrar la votación." : "No encontrada", {
      status: res.error === "not_closed" ? 409 : 404,
    });
  }
  return new Response(new Uint8Array(res.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${res.filename}"`,
    },
  });
}
