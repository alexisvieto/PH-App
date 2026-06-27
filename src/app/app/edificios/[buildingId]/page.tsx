import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { NewUnitForm } from "@/components/forms/new-unit-form";
import { formatMoney, formatPct } from "@/lib/format";
import {
  BUILDING_TYPE_LABEL,
  UNIT_STATUS_CLASS,
  UNIT_STATUS_LABEL,
  UNIT_TYPE_LABEL,
} from "@/lib/padron";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { buildingId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: building } = await supabase
    .from("buildings")
    .select("id, name, type, address")
    .eq("id", buildingId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!building) notFound();

  const [{ data: units }, { data: ownerships }, { data: leases }] =
    await Promise.all([
      supabase
        .from("units")
        .select("id, code, type, floor, area_m2, coefficient, status, is_rented, tenant_name, monthly_fee")
        .eq("building_id", buildingId)
        .order("code", { ascending: true }),
      supabase
        .from("unit_ownerships")
        .select("unit_id, person:people(full_name)")
        .eq("building_id", buildingId)
        .eq("is_active", true),
      supabase
        .from("unit_leases")
        .select("unit_id, person:people!unit_leases_tenant_person_id_fkey(full_name)")
        .eq("building_id", buildingId)
        .eq("is_active", true),
    ]);

  const ownerByUnit = new Map<string, string>();
  for (const o of ownerships ?? []) {
    const p = o.person as { full_name: string } | null;
    if (p) ownerByUnit.set(o.unit_id, p.full_name);
  }
  const tenantByUnit = new Map<string, string>();
  for (const l of leases ?? []) {
    const p = l.person as { full_name: string } | null;
    if (p) tenantByUnit.set(l.unit_id, p.full_name);
  }

  const list = units ?? [];
  const coefSum = list.reduce((a, u) => a + Number(u.coefficient ?? 0), 0);
  const coefOk = Math.abs(coefSum - 100) < 0.5;
  // Alquilada = contrato formal (unit_leases) o inquilino liviano (is_rented).
  const rented = list.filter((u) => tenantByUnit.has(u.id) || u.is_rented).length;
  const pctRented = list.length > 0 ? (rented / list.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/app/edificios"
          className="text-sm text-muted hover:text-ink"
        >
          ← Edificios
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{building.name}</h1>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/app/edificios/${buildingId}/cobros`}
              className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-soft/40"
            >
              Cobros
            </Link>
            <Link
              href={`/app/edificios/${buildingId}/finanzas`}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              Finanzas
            </Link>
          </div>
        </div>
        <p className="text-sm text-muted">
          {BUILDING_TYPE_LABEL[building.type]}
          {building.address ? ` · ${building.address}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Unidades" value={String(list.length)} />
        <Stat label="% en alquiler" value={formatPct(pctRented)} />
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-2xl font-semibold">{formatPct(coefSum)}</p>
          <p className="text-sm text-muted">Suma de coeficientes</p>
          <p
            className={`mt-1 text-xs ${coefOk ? "text-emerald-600" : "text-amber-600"}`}
          >
            {coefOk ? "✓ Cuadra con 100%" : "⚠ Debería sumar 100%"}
          </p>
        </div>
      </div>

      <NewUnitForm buildingId={buildingId} />

      {list.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Coef.</th>
                <th className="px-4 py-3 font-medium">Cuota</th>
                <th className="px-4 py-3 font-medium">Propietario</th>
                <th className="px-4 py-3 font-medium">Inquilino</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/app/edificios/${buildingId}/unidades/${u.id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {u.code}
                    </Link>
                    {u.floor ? (
                      <span className="text-muted"> · piso {u.floor}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{UNIT_TYPE_LABEL[u.type]}</td>
                  <td className="px-4 py-3 text-muted">{formatPct(u.coefficient)}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(u.monthly_fee)}</td>
                  <td className="px-4 py-3">{ownerByUnit.get(u.id) ?? "—"}</td>
                  <td className="px-4 py-3">{tenantByUnit.get(u.id) ?? u.tenant_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${UNIT_STATUS_CLASS[u.status]}`}
                    >
                      {UNIT_STATUS_LABEL[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/edificios/${buildingId}/unidades/${u.id}`}
                      className="inline-flex text-muted hover:text-brand"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
