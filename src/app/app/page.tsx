import Link from "next/link";
import { Building2, DoorOpen, Home, KeyRound, Package, Users } from "lucide-react";

import { formatPct } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  // El guardia tiene un inicio propio (acotado): nada de padrón.
  if (ctx.role === "guardia") {
    const firstName = (ctx.fullName ?? "").split(" ")[0];
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Hola{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-sm text-muted">{ctx.activeOrg?.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/app/garita"
            className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-5 text-center transition hover:border-brand"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <DoorOpen className="size-6" />
            </span>
            <span className="font-semibold">Garita</span>
          </Link>
          <Link
            href="/app/paqueteria"
            className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-5 text-center transition hover:border-brand"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Package className="size-6" />
            </span>
            <span className="font-semibold">Paquetería</span>
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ count: buildingsCount }, { data: units }, { count: peopleCount }, { count: leasesCount }] =
    await Promise.all([
      supabase
        .from("buildings")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase.from("units").select("id, status").eq("organization_id", orgId),
      supabase
        .from("people")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("unit_leases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("is_active", true),
    ]);

  const totalUnits = units?.length ?? 0;
  const activeLeases = leasesCount ?? 0;
  const pctRented = totalUnits > 0 ? (activeLeases / totalUnits) * 100 : 0;

  const stats = [
    { label: "Edificios", value: buildingsCount ?? 0, icon: Building2 },
    { label: "Unidades", value: totalUnits, icon: Home },
    { label: "Personas en padrón", value: peopleCount ?? 0, icon: Users },
    { label: "% en alquiler", value: formatPct(pctRented), icon: KeyRound },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-muted">
          Resumen del padrón de {ctx.activeOrg?.name}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <Icon className="mb-3 size-5 text-brand" />
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-1 font-semibold">Comienza por el padrón</h2>
        <p className="mb-4 text-sm text-muted">
          Registra los edificios y sus unidades, luego asigna propietarios e
          inquilinos.
        </p>
        <Link
          href="/app/edificios"
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Ir a Edificios
        </Link>
      </div>
    </div>
  );
}
