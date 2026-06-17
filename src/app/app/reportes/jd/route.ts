import { renderToBuffer } from "@react-pdf/renderer";

import {
  JdReportPDF,
  type ReportItem,
  type ReportSection,
} from "@/components/pdf/jd-report-pdf";
import { ANNOUNCEMENT_KIND_LABEL } from "@/lib/announcements";
import { formatDate, isValidIsoDate } from "@/lib/format";
import { ANOMALY_STATUS_LABEL } from "@/lib/maintenance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { TICKET_STATUS_LABEL } from "@/lib/tickets";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REPORT_LIMIT = 500;

export async function GET(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg) return new Response("No autorizado", { status: 401 });
  const orgId = ctx.activeOrg.id;

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const building = url.searchParams.get("building") ?? "";
  if (!isValidIsoDate(from) || !isValidIsoDate(to))
    return new Response("Rango de fechas inválido", { status: 400 });
  if (from > to)
    return new Response("La fecha 'desde' debe ser anterior a 'hasta'.", { status: 400 });
  if (building && !UUID.test(building))
    return new Response("Edificio inválido", { status: 400 });
  const fromStart = `${from}T00:00:00`;
  const toEnd = `${to}T23:59:59`;

  const supabase = await createClient();

  let scope = "Todos los edificios";
  if (building) {
    const { data: b } = await supabase
      .from("buildings")
      .select("name")
      .eq("id", building)
      .maybeSingle();
    scope = b?.name ?? "Edificio";
  }

  // Comunicados/novedades: org-wide (sin edificio) o del edificio filtrado.
  let annQ = supabase
    .from("announcements")
    .select("title, kind, published_at, building_id")
    .eq("organization_id", orgId)
    .gte("published_at", fromStart)
    .lte("published_at", toEnd)
    .order("published_at", { ascending: true })
    .limit(REPORT_LIMIT);
  if (building) annQ = annQ.or(`building_id.eq.${building},building_id.is.null`);

  let ticketQ = supabase
    .from("tickets")
    .select("subject, status, created_at, building_id")
    .eq("organization_id", orgId)
    .gte("created_at", fromStart)
    .lte("created_at", toEnd)
    .order("created_at", { ascending: true })
    .limit(REPORT_LIMIT);
  if (building) ticketQ = ticketQ.eq("building_id", building);

  let anomQ = supabase
    .from("anomaly_reports")
    .select("title, status, created_at, building_id")
    .eq("organization_id", orgId)
    .gte("created_at", fromStart)
    .lte("created_at", toEnd)
    .order("created_at", { ascending: true })
    .limit(REPORT_LIMIT);
  if (building) anomQ = anomQ.eq("building_id", building);

  const [annRes, ticketRes, anomRes] = await Promise.all([annQ, ticketQ, anomQ]);

  const annItems: ReportItem[] = (annRes.data ?? []).map((a) => ({
    date: formatDate(a.published_at),
    label: a.title,
    meta: ANNOUNCEMENT_KIND_LABEL[a.kind],
  }));
  const ticketItems: ReportItem[] = (ticketRes.data ?? []).map((t) => ({
    date: formatDate(t.created_at),
    label: t.subject,
    meta: TICKET_STATUS_LABEL[t.status],
  }));
  const anomItems: ReportItem[] = (anomRes.data ?? []).map((a) => ({
    date: formatDate(a.created_at),
    label: a.title,
    meta: ANOMALY_STATUS_LABEL[a.status],
  }));

  const sections: ReportSection[] = [
    { title: "Comunicados y novedades", count: annItems.length, items: annItems },
    { title: "Quejas y solicitudes", count: ticketItems.length, items: ticketItems },
    { title: "Anomalías de mantenimiento", count: anomItems.length, items: anomItems },
  ];

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Panama",
  });

  try {
    const buffer = await renderToBuffer(
      JdReportPDF({
        brand: ctx.brand,
        scope,
        rangeLabel: `${formatDate(from)} — ${formatDate(to)}`,
        generatedOn,
        sections,
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="reporte-jd-${from}_${to}.pdf"`,
      },
    });
  } catch (err) {
    console.error("jd report pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
