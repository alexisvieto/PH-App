import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneCall } from "lucide-react";

import { IntercomInbox } from "@/components/access/intercom-inbox";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalCitofonoPage() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data: mod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", res.orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();
  if (!mod) notFound();

  const unitIds = res.units.map((u) => u.id);
  const { data: reqs } = await supabase
    .from("intercom_requests")
    .select("id, unit_id, visitor_name, status, created_at, responded_at")
    .eq("organization_id", res.orgId)
    .in("unit_id", unitIds.length ? unitIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(30);

  const unitCode = new Map(res.units.map((u) => [u.id, u.code]));
  const items = (reqs ?? []).map((r) => ({
    id: r.id,
    unit_code: unitCode.get(r.unit_id) ?? "—",
    visitor_name: r.visitor_name,
    status: r.status,
    created_at: r.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <PhoneCall className="size-6 text-brand" /> Citófono
        </h1>
        <p className="text-sm text-muted">Autoriza o rechaza el ingreso de visitas desde la garita.</p>
      </div>

      <IntercomInbox orgId={res.orgId} items={items} />
    </div>
  );
}
