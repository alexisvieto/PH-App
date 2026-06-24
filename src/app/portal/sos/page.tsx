import Link from "next/link";
import { notFound } from "next/navigation";
import { Siren } from "lucide-react";

import { PanicButton } from "@/components/access/panic-button";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalSosPage() {
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
  const { data: open } = await supabase
    .from("panic_alerts")
    .select("id, status, kind")
    .eq("source", "residente")
    .in("unit_id", unitIds.length ? unitIds : ["00000000-0000-0000-0000-000000000000"])
    .in("status", ["activa", "atendida"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <Siren className="size-6 text-red-600" /> Botón de pánico
        </h1>
        <p className="text-sm text-muted">
          Alerta inmediata a la garita en caso de emergencia.
        </p>
      </div>

      <PanicButton
        units={res.units.map((u) => ({ id: u.id, code: u.code }))}
        active={open ?? null}
      />
    </div>
  );
}
