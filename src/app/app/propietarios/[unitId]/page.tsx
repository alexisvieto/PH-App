import { redirect } from "next/navigation";

import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// La gestión de la unidad vive ahora en Edificios → unidad. Redirigimos al detalle.
export default async function UnitRedirect({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (orgId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("units")
      .select("building_id")
      .eq("id", unitId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (data?.building_id)
      redirect(`/app/edificios/${data.building_id}/unidades/${unitId}`);
  }
  redirect("/app/edificios");
}
