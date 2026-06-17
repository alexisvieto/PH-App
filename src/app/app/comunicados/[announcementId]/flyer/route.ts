import { renderToBuffer } from "@react-pdf/renderer";

import { AnnouncementFlyerPDF } from "@/components/pdf/announcement-flyer-pdf";
import { ANNOUNCEMENT_KIND_LABEL } from "@/lib/announcements";
import { formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  const { announcementId } = await params;
  if (!UUID.test(announcementId)) return new Response("No encontrado", { status: 404 });
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg) return new Response("No autorizado", { status: 401 });

  const supabase = await createClient();
  const { data: ann } = await supabase
    .from("announcements")
    .select("id, title, body, published_at, building_id, kind")
    .eq("id", announcementId)
    .eq("organization_id", ctx.activeOrg.id)
    .maybeSingle();
  if (!ann) return new Response("No encontrado", { status: 404 });

  let audience = "Todos los edificios";
  if (ann.building_id) {
    const { data: b } = await supabase
      .from("buildings")
      .select("name")
      .eq("id", ann.building_id)
      .maybeSingle();
    if (b?.name) audience = b.name;
  }

  try {
    const buffer = await renderToBuffer(
      AnnouncementFlyerPDF({
        brand: ctx.brand,
        title: ann.title,
        body: ann.body,
        audience,
        kindLabel: ANNOUNCEMENT_KIND_LABEL[ann.kind],
        publishedOn: formatDate(ann.published_at),
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="comunicado-${ann.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("flyer pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
