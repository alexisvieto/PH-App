import { notFound } from "next/navigation";
import { Package } from "lucide-react";

import { PaqueteriaConsole } from "@/components/access/paqueteria-console";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PaqueteriaPage() {
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

  const [{ data: units }, { data: pending }] = await Promise.all([
    supabase.from("units").select("id, code").eq("organization_id", orgId).order("code"),
    supabase
      .from("packages")
      .select("id, unit_id, courier, notes, received_at, photo_path")
      .eq("organization_id", orgId)
      .eq("status", "en_garita")
      .order("received_at", { ascending: false })
      .limit(100),
  ]);

  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const unitOptions = (units ?? []).map((u) => ({ id: u.id, label: u.code }));
  const pendingList = (pending ?? []).map((p) => ({
    id: p.id,
    unitCode: unitCode.get(p.unit_id) ?? "—",
    courier: p.courier,
    notes: p.notes,
    received_at: p.received_at,
    has_photo: !!p.photo_path,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Package className="size-6 text-amber-600" /> Paquetería
        </h1>
        <p className="text-sm text-muted">Registra paquetes y avisa al propietario.</p>
      </div>

      <PaqueteriaConsole orgId={orgId} units={unitOptions} pending={pendingList} />
    </div>
  );
}
