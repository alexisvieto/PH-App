import Link from "next/link";
import { notFound } from "next/navigation";

import {
  UnitManager,
  type LeaseRow,
  type OwnershipRow,
  type PersonOpt,
} from "@/components/unit-manager";
import { formatPct } from "@/lib/format";
import {
  UNIT_STATUS_CLASS,
  UNIT_STATUS_LABEL,
  UNIT_TYPE_LABEL,
} from "@/lib/padron";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ buildingId: string; unitId: string }>;
}) {
  const { buildingId, unitId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("id, code, type, floor, area_m2, coefficient, status, building:buildings(name)")
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) notFound();

  const [{ data: ownerships }, { data: lease }, { data: people }] =
    await Promise.all([
      supabase
        .from("unit_ownerships")
        .select("id, acquired_on, ended_on, is_active, person:people(full_name)")
        .eq("unit_id", unitId)
        .order("is_active", { ascending: false })
        .order("acquired_on", { ascending: false }),
      supabase
        .from("unit_leases")
        .select(
          "id, start_date, rent_amount, person:people!unit_leases_tenant_person_id_fkey(full_name)",
        )
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("people")
        .select("id, full_name")
        .eq("organization_id", orgId)
        .order("full_name", { ascending: true }),
    ]);

  const history: OwnershipRow[] = (ownerships ?? []).map((o) => ({
    id: o.id,
    acquired_on: o.acquired_on,
    ended_on: o.ended_on,
    is_active: o.is_active,
    name: (o.person as { full_name: string } | null)?.full_name ?? "—",
  }));

  const leaseRow: LeaseRow = lease
    ? {
        id: lease.id,
        tenant:
          (lease.person as { full_name: string } | null)?.full_name ?? "—",
        start_date: lease.start_date,
        rent_amount: lease.rent_amount,
      }
    : null;

  const peopleOpts: PersonOpt[] = (people ?? []) as PersonOpt[];
  const buildingName =
    (unit.building as { name: string } | null)?.name ?? "Edificio";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/app/edificios/${buildingId}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {buildingName}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Unidad {unit.code}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${UNIT_STATUS_CLASS[unit.status]}`}
          >
            {UNIT_STATUS_LABEL[unit.status]}
          </span>
          <Link
            href={`/app/edificios/${buildingId}/unidades/${unitId}/estado`}
            className="ml-auto shrink-0 rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-soft/40"
          >
            Estado de cuenta
          </Link>
        </div>
        <p className="text-sm text-muted">
          {UNIT_TYPE_LABEL[unit.type]}
          {unit.floor ? ` · piso ${unit.floor}` : ""} · coef.{" "}
          {formatPct(unit.coefficient)}
          {unit.area_m2 ? ` · ${unit.area_m2} m²` : ""}
        </p>
      </div>

      <UnitManager
        unitId={unitId}
        history={history}
        lease={leaseRow}
        people={peopleOpts}
      />
    </div>
  );
}
