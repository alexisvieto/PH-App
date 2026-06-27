import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

import { NewBuildingForm } from "@/components/forms/new-building-form";
import { formatPct } from "@/lib/format";
import { BUILDING_TYPE_LABEL } from "@/lib/padron";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function EdificiosPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const [{ data: buildings }, { data: units }, { data: leases }] =
    await Promise.all([
      supabase
        .from("buildings")
        .select("id, name, type, address")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true }),
      supabase.from("units").select("id, building_id, is_rented").eq("organization_id", orgId),
      supabase
        .from("unit_leases")
        .select("unit_id, building_id")
        .eq("organization_id", orgId)
        .eq("is_active", true),
    ]);

  const unitBuilding = new Map<string, string>();
  const unitsByBuilding = new Map<string, number>();
  for (const u of units ?? []) {
    unitBuilding.set(u.id, u.building_id);
    unitsByBuilding.set(u.building_id, (unitsByBuilding.get(u.building_id) ?? 0) + 1);
  }
  // Alquilada = inquilino liviano (is_rented) o contrato formal (unit_leases), sin duplicar.
  const rentedUnits = new Set<string>();
  for (const u of units ?? []) if (u.is_rented) rentedUnits.add(u.id);
  for (const l of leases ?? []) if (l.unit_id) rentedUnits.add(l.unit_id);
  const rentedByBuilding = new Map<string, number>();
  for (const uid of rentedUnits) {
    const bid = unitBuilding.get(uid);
    if (bid) rentedByBuilding.set(bid, (rentedByBuilding.get(bid) ?? 0) + 1);
  }

  const list = buildings ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edificios</h1>
          <p className="text-sm text-muted">
            Los PH que administra {ctx.activeOrg?.name}.
          </p>
        </div>
        <NewBuildingForm />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Building2 className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Aún no hay edificios</p>
          <p className="text-sm text-muted">
            Crea el primero con el botón “Nuevo edificio”.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((b) => {
            const total = unitsByBuilding.get(b.id) ?? 0;
            const rented = rentedByBuilding.get(b.id) ?? 0;
            const pct = total > 0 ? (rented / total) * 100 : 0;
            return (
              <Link
                key={b.id}
                href={`/app/edificios/${b.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 transition hover:border-brand/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-muted">
                      {BUILDING_TYPE_LABEL[b.type]}
                      {b.address ? ` · ${b.address}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{total} unidades</p>
                    <p className="text-xs text-muted">
                      {formatPct(pct)} en alquiler
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
