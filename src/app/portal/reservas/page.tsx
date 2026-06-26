import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { createResidentReservation } from "@/app/portal/reservas/actions";
import { ReservationCalendar } from "@/components/reservas/reservation-calendar";
import { CancelReservation } from "@/components/reservas/reservar-form";
import { fmtTime, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_STYLE } from "@/lib/reservas";
import {
  getUnitOverdueMonths,
  MAX_OVERDUE_MONTHS,
  OVERDUE_BLOCK_MESSAGE,
} from "@/lib/reservas-server";
import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalReservasPage() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const unitIds = res.units.map((u) => u.id);
  const todayPa = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const supabase = await createClient();
  const [{ data: areas }, { data: reservations }] = await Promise.all([
    supabase.from("common_areas").select("*").eq("organization_id", res.orgId).order("name"),
    supabase
      .from("area_reservations")
      .select("id, area_id, unit_id, reservation_date, start_time, end_time, guests, status, rules_accepted_at, rules_snapshot")
      .in("unit_id", unitIds.length ? unitIds : ["00000000-0000-0000-0000-000000000000"])
      .order("reservation_date", { ascending: false })
      .limit(100),
  ]);

  const allAreas = areas ?? [];
  const activeAreas = allAreas.filter((a) => a.active);
  const areaName = new Map(allAreas.map((a) => [a.id, a.name]));
  const showUnit = res.units.length > 1;
  const unitCode = new Map(res.units.map((u) => [u.id, u.code]));
  const calendarAreas = activeAreas.map((a) => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    description: a.description,
    capacity: a.capacity,
    open_time: a.open_time,
    close_time: a.close_time,
    advance_days: a.advance_days,
    requires_approval: a.requires_approval,
    rules: a.rules,
  }));
  // Morosidad: una unidad con 2+ meses de cuota vencidos no puede reservar.
  const overdueByUnit = await Promise.all(res.units.map((u) => getUnitOverdueMonths(u.id)));
  const allowedUnits = res.units.filter((_, i) => overdueByUnit[i] < MAX_OVERDUE_MONTHS);
  const unitOptions = allowedUnits.map((u) => ({ id: u.id, label: u.code }));
  const someBlocked = allowedUnits.length < res.units.length;

  const mine = reservations ?? [];
  const isCancelable = (r: (typeof mine)[number]) =>
    (r.status === "pendiente" || r.status === "aprobada") && r.reservation_date >= todayPa;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <CalendarDays className="size-6 text-brand" /> Reservas
        </h1>
        <p className="text-sm text-muted">Reserva las áreas comunes de tu edificio.</p>
      </div>

      {activeAreas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Por ahora no hay áreas disponibles para reservar.
        </p>
      ) : allowedUnits.length === 0 ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-medium text-amber-800">
          {OVERDUE_BLOCK_MESSAGE}
        </p>
      ) : (
        <>
          {someBlocked && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Una de tus unidades tiene 2 o más meses vencidos y no puede reservar; comunícate con la administración.
            </p>
          )}
          <ReservationCalendar
            areas={calendarAreas}
            units={unitOptions}
            today={todayPa}
            action={createResidentReservation}
            requireRules
          />
        </>
      )}

      {/* Mis reservas */}
      <section className="space-y-3">
        <h2 className="font-semibold">Mis reservas</h2>
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Aún no tienes reservas.
          </p>
        ) : (
          <div className="space-y-2">
            {mine.map((r) => (
              <article key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {areaName.get(r.area_id) ?? "Área"}
                    {showUnit && r.unit_id ? ` · Unidad ${unitCode.get(r.unit_id) ?? "—"}` : ""}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDate(r.reservation_date)} · {fmtTime(r.start_time)}–{fmtTime(r.end_time)}
                    {r.guests ? ` · ${r.guests} pers.` : ""}
                  </p>
                  {r.rules_accepted_at && (
                    <details className="mt-1 text-xs">
                      <summary className="cursor-pointer font-medium text-emerald-700">
                        ✓ Reglamento aceptado el{" "}
                        {new Date(r.rules_accepted_at).toLocaleDateString("es-PA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </summary>
                      {r.rules_snapshot && (
                        <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-gray-50 p-3 font-sans text-xs leading-relaxed text-ink/80">
                          {r.rules_snapshot}
                        </pre>
                      )}
                    </details>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RESERVATION_STATUS_STYLE[r.status]}`}>
                    {RESERVATION_STATUS_LABEL[r.status]}
                  </span>
                  {isCancelable(r) && <CancelReservation reservationId={r.id} />}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
