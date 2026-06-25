import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

import { DashboardFilters } from "@/components/reservas/dashboard-filters";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function ReservasDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  const sp = await searchParams;

  const panamaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Panama" }));
  const curY = panamaNow.getFullYear();
  const year = /^\d{4}$/.test(sp.y ?? "") ? (sp.y as string) : String(curY);
  const month = /^(0[1-9]|1[0-2])$/.test(sp.m ?? "") ? (sp.m as string) : "all";
  const y = Number(year);
  const from = month === "all" ? `${y}-01-01` : `${y}-${month}-01`;
  const to =
    month === "all"
      ? `${y}-12-31`
      : `${y}-${month}-${String(new Date(Date.UTC(y, Number(month), 0)).getUTCDate()).padStart(2, "0")}`;

  const supabase = await createClient();
  const [{ data: areas }, { data: reservations }] = await Promise.all([
    supabase.from("common_areas").select("id, name").eq("organization_id", orgId).eq("active", true).order("name"),
    supabase
      .from("area_reservations")
      .select("area_id")
      .eq("organization_id", orgId)
      .in("status", ["aprobada", "pendiente"])
      .gte("reservation_date", from)
      .lte("reservation_date", to),
  ]);

  const counts = new Map<string, number>();
  for (const r of reservations ?? []) counts.set(r.area_id, (counts.get(r.area_id) ?? 0) + 1);
  const rows = (areas ?? [])
    .map((a) => ({ id: a.id, name: a.name, count: counts.get(a.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const total = rows.reduce((s, r) => s + r.count, 0);
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  const years = Array.from({ length: 5 }, (_, i) => String(curY - i));
  if (!years.includes(year)) years.unshift(year);
  const periodLabel = month === "all" ? `Año ${year}` : `${MESES[Number(month) - 1]} ${year}`;
  const topName = total > 0 ? rows[0].name : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Logo Atrio arriba a la izquierda + volver */}
      <div className="flex items-center justify-between gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/atrio-lockup.png" alt="Atrio" className="h-8 w-auto" />
        <Link href="/app/reservas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Volver
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="h-1.5 w-full bg-brand" />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <BarChart3 className="size-6 text-brand" /> Dashboard de reservas
              </h1>
              <p className="text-sm text-muted">Cantidad de reservas por área · {periodLabel}</p>
            </div>
            <DashboardFilters year={year} month={month} years={years} />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-muted">
              Total de reservas: <span className="font-semibold text-ink tabular-nums">{total}</span>
            </span>
            {topName && (
              <span className="text-muted">
                Área más usada: <span className="font-semibold text-ink">{topName}</span>
              </span>
            )}
          </div>

          {rows.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-line bg-canvas p-6 text-center text-sm text-muted">
              Aún no hay áreas. Crea la primera en Reservas y el dashboard se actualizará.
            </p>
          ) : total === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-line bg-canvas p-6 text-center text-sm text-muted">
              No hubo reservas en {periodLabel}.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {rows.map((r) => (
                <div key={r.id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{r.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {r.count} {r.count === 1 ? "reserva" : "reservas"}
                    </span>
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.max(r.count > 0 ? 4 : 0, (r.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted">Atrio · One app. One community.</p>
    </div>
  );
}
