import { notFound } from "next/navigation";
import { Siren } from "lucide-react";

import { EmergencyConsole } from "@/components/access/emergency-console";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function EmergenciasPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: mod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();
  if (!mod) notFound();

  const [{ data: units }, { data: alerts }] = await Promise.all([
    supabase.from("units").select("id, code").eq("organization_id", orgId),
    supabase
      .from("panic_alerts")
      .select("id, source, unit_id, contact_name, kind, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const items = (alerts ?? []).map((a) => ({
    id: a.id,
    source: a.source,
    unit_code: a.unit_id ? unitCode.get(a.unit_id) ?? "—" : "—",
    contact_name: a.contact_name,
    kind: a.kind,
    status: a.status,
    created_at: a.created_at,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Siren className="size-6 text-red-600" /> Emergencias
        </h1>
        <p className="text-sm text-muted">Botón de pánico: alertas de residentes y de la garita.</p>
      </div>

      <EmergencyConsole orgId={orgId} items={items} />
    </div>
  );
}
