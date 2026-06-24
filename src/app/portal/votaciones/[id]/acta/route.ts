import { getResidentContext } from "@/lib/session";
import { renderActaPdf } from "@/lib/votacion-acta";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getResidentContext();
  if (!res?.orgId) return new Response("No autorizado", { status: 403 });

  const out = await renderActaPdf(id, res.brand);
  if ("error" in out) {
    return new Response(out.error === "not_closed" ? "El acta está disponible al cerrar la votación." : "No encontrada", {
      status: out.error === "not_closed" ? 409 : 404,
    });
  }
  return new Response(new Uint8Array(out.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${out.filename}"`,
    },
  });
}
