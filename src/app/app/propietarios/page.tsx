import Link from "next/link";
import { Building2, Home, KeyRound, Users } from "lucide-react";

import { NewUnitPropietariosForm } from "@/components/forms/new-unit-propietarios-form";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PropietariosPage({
  searchParams,
}: {
  searchParams: Promise<{ building?: string; rented?: string }>;
}) {
  const { building: buildingParam, rented } = await searchParams;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: buildings } = await supabase
    .from("buildings")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name");
  const blist = buildings ?? [];

  if (blist.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Propietarios</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Building2 className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Primero crea un edificio</p>
          <p className="text-sm text-muted">
            Las unidades pertenecen a un edificio. Créalo en{" "}
            <Link href="/app/edificios" className="text-brand hover:underline">Edificios</Link>.
          </p>
        </div>
      </div>
    );
  }

  const activeBuilding = blist.find((b) => b.id === buildingParam) ?? blist[0];
  const onlyRented = rented === "1";

  const [{ data: units }, { data: ownerships }] = await Promise.all([
    supabase
      .from("units")
      .select("id, code, floor, letter, is_rented, area_m2")
      .eq("organization_id", orgId)
      .eq("building_id", activeBuilding.id)
      .order("floor")
      .order("letter"),
    supabase
      .from("unit_ownerships")
      .select("unit_id, is_primary, person:people(full_name)")
      .eq("organization_id", orgId)
      .eq("building_id", activeBuilding.id)
      .eq("is_active", true),
  ]);

  const ownersByUnit = new Map<string, { name: string; primary: boolean }[]>();
  for (const o of ownerships ?? []) {
    const person = o.person as { full_name: string } | null;
    if (!person) continue;
    const arr = ownersByUnit.get(o.unit_id) ?? [];
    arr.push({ name: person.full_name, primary: o.is_primary });
    ownersByUnit.set(o.unit_id, arr);
  }

  const allUnits = units ?? [];
  const rentedCount = allUnits.filter((u) => u.is_rented).length;
  const shown = onlyRented ? allUnits.filter((u) => u.is_rented) : allUnits;

  // Agrupar por piso (orden numérico cuando aplica).
  const floors = new Map<string, typeof shown>();
  for (const u of shown) {
    const f = u.floor ?? "—";
    const arr = floors.get(f) ?? [];
    arr.push(u);
    floors.set(f, arr);
  }
  const floorKeys = [...floors.keys()].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Propietarios</h1>
          <p className="text-sm text-muted">Unidades por piso y sus propietarios.</p>
        </div>
        <NewUnitPropietariosForm buildingId={activeBuilding.id} />
      </div>

      {blist.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {blist.map((b) => (
            <Link
              key={b.id}
              href={`/app/propietarios?building=${b.id}${onlyRented ? "&rented=1" : ""}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                b.id === activeBuilding.id ? "bg-brand-soft text-brand" : "text-ink/70 hover:bg-gray-100"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Home className="size-4" /> {allUnits.length} unidades
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2 py-1 font-medium text-sky-700">
          <KeyRound className="size-3.5" /> {rentedCount} alquiladas
        </span>
        <Link
          href={`/app/propietarios?building=${activeBuilding.id}${onlyRented ? "" : "&rented=1"}`}
          className="text-xs font-medium text-brand hover:underline"
        >
          {onlyRented ? "Ver todas" : "Ver solo alquiladas"}
        </Link>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Home className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">{onlyRented ? "Ninguna unidad alquilada" : "Sin unidades"}</p>
          {!onlyRented && <p className="text-sm text-muted">Crea la primera con “Nueva unidad”.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {floorKeys.map((f) => (
            <details key={f} open className="overflow-hidden rounded-2xl border border-line bg-surface">
              <summary className="cursor-pointer list-none px-5 py-3 font-semibold">
                Piso {f}{" "}
                <span className="text-sm font-normal text-muted">({floors.get(f)!.length})</span>
              </summary>
              <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
                {floors.get(f)!.map((u) => {
                  const owners = ownersByUnit.get(u.id) ?? [];
                  const primary = owners.find((o) => o.primary) ?? owners[0];
                  return (
                    <Link
                      key={u.id}
                      href={`/app/propietarios/${u.id}`}
                      className="block rounded-xl border border-line p-4 transition hover:border-brand hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{u.code}</span>
                        {u.is_rented && (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">Alquilada</span>
                        )}
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                        <Users className="size-3.5" />
                        {primary ? primary.name : "Sin propietario"}
                        {owners.length > 1 ? ` +${owners.length - 1}` : ""}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
