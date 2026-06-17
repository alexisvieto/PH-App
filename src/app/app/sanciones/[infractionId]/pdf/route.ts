import { renderToBuffer } from "@react-pdf/renderer";

import { InfractionPDF } from "@/components/pdf/infraction-pdf";
import { brandFromOrg, ORG_BRAND_COLUMNS, type OrgBranding } from "@/lib/brand";
import { formatDate, formatMoney } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { INFRACTION_TYPE_LABEL } from "@/lib/sanctions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ infractionId: string }> },
) {
  const { infractionId } = await params;
  if (!UUID.test(infractionId)) return new Response("No encontrado", { status: 404 });
  const ctx = await getSessionContext();
  if (!ctx?.activeOrg) return new Response("No autorizado", { status: 401 });

  const supabase = await createClient();
  const { data: inf } = await supabase
    .from("infractions")
    .select("id, type, reason, description, amount, infraction_date, unit_id, charge_id")
    .eq("id", infractionId)
    .eq("organization_id", ctx.activeOrg.id)
    .maybeSingle();
  if (!inf) return new Response("No encontrado", { status: 404 });

  const { data: unit } = await supabase
    .from("units")
    .select(`code, building:buildings(name, org:organizations(${ORG_BRAND_COLUMNS}))`)
    .eq("id", inf.unit_id)
    .maybeSingle();
  if (!unit) return new Response("No encontrado", { status: 404 });

  const [ownerRes, chargeRes] = await Promise.all([
    supabase
      .from("unit_ownerships")
      .select("person:people(full_name)")
      .eq("unit_id", inf.unit_id)
      .eq("is_active", true)
      .order("share", { ascending: false })
      .limit(1)
      .maybeSingle(),
    inf.charge_id
      ? supabase.from("charges").select("due_date").eq("id", inf.charge_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const building = unit.building as {
    name: string;
    org: OrgBranding | null;
  } | null;
  const isMulta = inf.type === "multa";
  const dueDate = (chargeRes.data as { due_date: string | null } | null)?.due_date ?? null;
  const generatedOn = new Date().toLocaleDateString("es-PA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Panama",
  });

  try {
    const buffer = await renderToBuffer(
      InfractionPDF({
        brand: brandFromOrg(building?.org ?? null),
        buildingName: building?.name ?? "Edificio",
        unitCode: unit.code,
        ownerName:
          (ownerRes.data?.person as { full_name: string } | null)?.full_name ?? null,
        typeLabel: INFRACTION_TYPE_LABEL[inf.type],
        isMulta,
        reason: inf.reason,
        description: inf.description,
        amountLabel: inf.amount !== null ? formatMoney(inf.amount) : null,
        dueLabel: dueDate ? formatDate(dueDate) : null,
        infractionDate: formatDate(inf.infraction_date),
        generatedOn,
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="sancion-${inf.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("infraction pdf:", err);
    return new Response("No se pudo generar el documento.", { status: 500 });
  }
}
