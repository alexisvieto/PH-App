import Link from "next/link";
import { notFound } from "next/navigation";

import { AmenityManager, type AmenityRow } from "@/components/rrhh/amenity-manager";
import { OwnerManager, type OwnerRow } from "@/components/rrhh/owner-manager";
import { UnitInfoForm } from "@/components/rrhh/unit-info-form";
import { TransferSale } from "@/components/forms/transfer-sale";
import { UnitFeeEditor } from "@/components/forms/unit-fee-editor";
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
    .select(
      "id, code, type, floor, area_m2, coefficient, status, monthly_fee, is_rented, tenant_name, tenant_phone, building:buildings(name)",
    )
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) notFound();

  const [{ data: ownerships }, { data: amenities }] = await Promise.all([
    supabase
      .from("unit_ownerships")
      .select(
        "id, is_primary, person:people(full_name, doc_type, doc_number, email, phone)",
      )
      .eq("unit_id", unitId)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false }),
    supabase
      .from("unit_amenities")
      .select("id, type, location, identifier")
      .eq("unit_id", unitId)
      .eq("organization_id", orgId)
      .order("type"),
  ]);

  const owners: OwnerRow[] = (ownerships ?? []).map((o) => {
    const p = o.person as {
      full_name: string;
      doc_type: string | null;
      doc_number: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    return {
      ownershipId: o.id,
      name: p?.full_name ?? "—",
      docType: p?.doc_type ?? null,
      docNumber: p?.doc_number ?? null,
      email: p?.email ?? null,
      phone: p?.phone ?? null,
      primary: o.is_primary,
    };
  });
  const amenityRows = (amenities ?? []) as AmenityRow[];
  const buildingName =
    (unit.building as { name: string } | null)?.name ?? "Edificio";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">Cuota de mantenimiento mensual</p>
        <div className="mt-1">
          <UnitFeeEditor unitId={unitId} fee={Number(unit.monthly_fee ?? 0)} />
        </div>
      </div>

      <OwnerManager unitId={unitId} owners={owners} />
      <TransferSale unitId={unitId} />
      <AmenityManager unitId={unitId} amenities={amenityRows} />
      <UnitInfoForm
        unitId={unitId}
        areaM2={unit.area_m2}
        isRented={unit.is_rented}
        tenantName={unit.tenant_name}
        tenantPhone={unit.tenant_phone}
      />
    </div>
  );
}
