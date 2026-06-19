import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { GaritaConsole } from "@/components/access/garita-console";
import { LOG_DIRECTION_LABEL } from "@/lib/access";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

function dateTime(ts: string) {
  return new Date(ts).toLocaleString("es-PA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export default async function GaritaPage() {
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

  const [{ data: buildings }, { data: units }, { data: logs }] = await Promise.all([
    supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
    supabase.from("units").select("id, code").eq("organization_id", orgId).order("code"),
    supabase
      .from("visitor_log")
      .select("id, visitor_name, direction, occurred_at, unit_id")
      .eq("organization_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(15),
  ]);

  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const unitOptions = (units ?? []).map((u) => ({ id: u.id, label: u.code }));
  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, label: b.name }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="size-6 text-brand" /> Garita
        </h1>
        <p className="text-sm text-muted">Validar pases y registrar entradas/salidas.</p>
      </div>

      <GaritaConsole orgId={orgId} buildings={buildingOptions} units={unitOptions} />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-5 py-3 font-semibold">Movimientos recientes</h2>
        {(logs ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Sin movimientos todavía.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(logs ?? []).map((l) => (
              <li key={l.id} className="flex flex-col gap-0.5 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span>
                  <span className="font-medium">{l.visitor_name}</span>
                  <span className="text-muted"> · {unitCode.get(l.unit_id ?? "") ?? "—"}</span>
                </span>
                <span className="flex items-center gap-3 text-muted">
                  <span className={l.direction === "entrada" ? "text-emerald-700" : "text-gray-500"}>
                    {LOG_DIRECTION_LABEL[l.direction]}
                  </span>
                  {dateTime(l.occurred_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
