import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { AmenityManager, type AmenityRow } from "@/components/rrhh/amenity-manager";
import { OwnerManager, type OwnerRow } from "@/components/rrhh/owner-manager";
import { UnitInfoForm } from "@/components/rrhh/unit-info-form";
import { UNIT_TYPE_LABEL } from "@/lib/padron";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function UnitOwnersPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("id, code, floor, letter, type, area_m2, coefficient, is_rented, tenant_name, tenant_phone, building_id")
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) notFound();

  const [{ data: building }, { data: ownerships }, { data: amenities }] = await Promise.all([
    supabase.from("buildings").select("name").eq("id", unit.building_id).maybeSingle(),
    supabase
      .from("unit_ownerships")
      .select("id, is_primary, person:people(full_name, doc_type, doc_number, email, phone)")
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/app/propietarios" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver a propietarios
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Unidad {unit.code}</h1>
            <p className="text-sm text-muted">
              {building?.name ?? "Edificio"} · Piso {unit.floor ?? "—"} · {UNIT_TYPE_LABEL[unit.type]}
            </p>
          </div>
          <Link
            href={`/app/edificios/${unit.building_id}/unidades/${unit.id}/estado`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-gray-50"
          >
            <FileText className="size-4" /> Estado de cuenta
          </Link>
        </div>
      </div>

      <OwnerManager unitId={unit.id} owners={owners} />
      <AmenityManager unitId={unit.id} amenities={amenityRows} />
      <UnitInfoForm
        unitId={unit.id}
        areaM2={unit.area_m2}
        isRented={unit.is_rented}
        tenantName={unit.tenant_name}
        tenantPhone={unit.tenant_phone}
      />
    </div>
  );
}
