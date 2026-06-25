import Link from "next/link";
import { BarChart3, CalendarDays, Clock, Users } from "lucide-react";

import { createStaffReservation } from "@/app/app/reservas/actions";
import { NewAreaForm } from "@/components/reservas/new-area-form";
import { ReservationCalendar } from "@/components/reservas/reservation-calendar";
import { AreaToggle, ReviewButtons } from "@/components/reservas/reservation-controls";
import { fmtTime, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_STYLE } from "@/lib/reservas";
import { formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ReservasStaffPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const todayPa = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const supabase = await createClient();
  const [{ data: areas }, { data: buildings }, { data: units }, { data: reservations }] =
    await Promise.all([
      supabase.from("common_areas").select("*").eq("organization_id", orgId).order("name"),
      supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
      supabase.from("units").select("id, code").eq("organization_id", orgId).order("code"),
      supabase
        .from("area_reservations")
        .select("id, area_id, unit_id, reservation_date, start_time, end_time, guests, notes, status")
        .eq("organization_id", orgId)
        .in("status", ["pendiente", "aprobada"])
        .gte("reservation_date", todayPa)
        .order("reservation_date")
        .order("start_time"),
    ]);

  const areaName = new Map((areas ?? []).map((a) => [a.id, a.name]));
  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, label: b.name }));
  // unit_id puede ser null = bloqueo del área (sin unidad).
  const unitLabel = (uid: string | null) => (uid ? `Unidad ${unitCode.get(uid) ?? "—"}` : "Bloqueo");

  const pending = (reservations ?? []).filter((r) => r.status === "pendiente");
  const upcoming = (reservations ?? []).filter((r) => r.status === "aprobada");

  // Para el calendario del admin: áreas activas + todas las unidades de la org.
  const activeAreas = (areas ?? []).filter((a) => a.active);
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
  }));
  const staffUnits = (units ?? []).map((u) => ({ id: u.id, label: u.code }));

  // "Próximas reservas" agrupadas por área (luego ya vienen ordenadas por fecha/hora).
  const upcomingByArea = new Map<string, typeof upcoming>();
  for (const r of upcoming) {
    const list = upcomingByArea.get(r.area_id);
    if (list) list.push(r);
    else upcomingByArea.set(r.area_id, [r]);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CalendarDays className="size-6 text-brand" /> Reservas de áreas comunes
          </h1>
          <p className="text-sm text-muted">Define las áreas y aprueba las solicitudes de los residentes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/reservas/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            <BarChart3 className="size-4" /> Generar Dashboard
          </Link>
          <NewAreaForm buildings={buildingOptions} />
        </div>
      </div>

      {/* Solicitudes por aprobar */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock className="size-4 text-amber-600" /> Por aprobar
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{areaName.get(r.area_id) ?? "Área"}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {unitLabel(r.unit_id)} · {formatDate(r.reservation_date)} ·{" "}
                      {fmtTime(r.start_time)}–{fmtTime(r.end_time)}
                      {r.guests ? ` · ${r.guests} pers.` : ""}
                    </p>
                    {r.notes && <p className="mt-1 text-sm text-ink/80">{r.notes}</p>}
                  </div>
                  <ReviewButtons reservationId={r.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reservar a nombre de una unidad (el admin reserva por un residente) */}
      {calendarAreas.length > 0 && staffUnits.length > 0 && (
        <ReservationCalendar
          areas={calendarAreas}
          units={staffUnits}
          today={todayPa}
          action={createStaffReservation}
          allowBlock
        />
      )}

      {/* Áreas */}
      <section className="space-y-3">
        <h2 className="font-semibold">Áreas</h2>
        {(areas ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
            Aún no hay áreas. Crea la primera (salón de fiestas, BBQ, gimnasio…).
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(areas ?? []).map((a) => (
              <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{a.name}</p>
                  <AreaToggle areaId={a.id} active={a.active} />
                </div>
                {buildingOptions.length > 1 && (
                  <p className="text-xs text-muted">{buildingName.get(a.building_id) ?? ""}</p>
                )}
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {fmtTime(a.open_time)}–{fmtTime(a.close_time)}
                  </span>
                  {a.capacity != null && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {a.capacity}
                    </span>
                  )}
                  <span>{a.requires_approval ? "Requiere aprobación" : "Aprobación automática"}</span>
                </p>
                {a.description && <p className="mt-1 text-sm text-ink/70">{a.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Próximas reservas — agrupadas por área (fecha · hora · unidad) */}
      <section className="space-y-3">
        <h2 className="font-semibold">Próximas reservas</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            No hay reservas próximas.
          </p>
        ) : (
          <div className="space-y-4">
            {[...upcomingByArea.entries()].map(([areaId, list]) => (
              <div key={areaId} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <h3 className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-semibold">
                  <CalendarDays className="size-4 text-brand" />
                  {areaName.get(areaId) ?? "Área"}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
                    {list.length}
                  </span>
                </h3>
                <ul className="divide-y divide-line">
                  {list.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <span>
                        <span className="font-medium capitalize">{formatDate(r.reservation_date)}</span>
                        <span className="text-muted">
                          {" "}
                          · {fmtTime(r.start_time)}–{fmtTime(r.end_time)} · {unitLabel(r.unit_id)}
                          {r.guests ? ` · ${r.guests} pers.` : ""}
                        </span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RESERVATION_STATUS_STYLE[r.status]}`}>
                        {RESERVATION_STATUS_LABEL[r.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
