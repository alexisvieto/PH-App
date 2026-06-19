import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { createPass } from "@/app/app/accesos/actions";
import { NewPassForm } from "@/components/forms/new-pass-form";
import { LOG_DIRECTION_LABEL, PASS_TYPE_LABEL, passState } from "@/lib/access";
import { formatDate } from "@/lib/format";
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

export default async function AccesosPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  // Gating del módulo pago (además del nav): ruta inaccesible si no está activo.
  const { data: mod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();
  if (!mod) notFound();

  const [{ data: units }, { data: passes }, { data: logs }] = await Promise.all([
    supabase.from("units").select("id, code").eq("organization_id", orgId).order("code"),
    supabase
      .from("visitor_passes")
      .select("id, code, visitor_name, type, valid_from, valid_to, status, max_uses, uses_count, unit_id")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("visitor_log")
      .select("id, visitor_name, direction, occurred_at, unit_id")
      .eq("organization_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(20),
  ]);

  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const unitOptions = (units ?? []).map((u) => ({ id: u.id, label: u.code }));
  const passList = passes ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="size-6 text-brand" /> Accesos
          </h1>
          <p className="text-sm text-muted">Pases de visita y bitácora de entradas.</p>
        </div>
        <NewPassForm units={unitOptions} action={createPass} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-5 py-3 font-semibold">Pases</h2>
        {passList.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Aún no hay pases. Crea el primero con “Nuevo pase”.</p>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Visitante</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {passList.map((p) => {
                  const st = passState(p);
                  return (
                    <tr key={p.id} className="border-b border-line last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/app/accesos/${p.id}`} className="font-mono font-medium text-brand hover:underline">
                          {p.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{p.visitor_name}</td>
                      <td className="px-4 py-3 text-muted">{unitCode.get(p.unit_id) ?? "—"}</td>
                      <td className="px-4 py-3 text-muted">{PASS_TYPE_LABEL[p.type]}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(p.valid_from)} — {formatDate(p.valid_to)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Móvil: tarjetas */}
            <ul className="divide-y divide-line md:hidden">
              {passList.map((p) => {
                const st = passState(p);
                return (
                  <li key={p.id}>
                    <Link href={`/app/accesos/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-gray-50">
                      <div className="min-w-0">
                        <p className="font-mono text-base font-semibold text-brand">{p.code}</p>
                        <p className="truncate text-sm">{p.visitor_name}</p>
                        <p className="text-xs text-muted">
                          {unitCode.get(p.unit_id) ?? "—"} · {PASS_TYPE_LABEL[p.type]} · {formatDate(p.valid_to)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-5 py-3 font-semibold">Bitácora reciente</h2>
        {(logs ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Sin registros de entrada/salida todavía.</p>
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
