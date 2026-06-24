import { CalendarDays, Clock, Users } from "lucide-react";

import { NewAreaForm } from "@/components/reservas/new-area-form";
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

  const pending = (reservations ?? []).filter((r) => r.status === "pendiente");
  const upcoming = (reservations ?? []).filter((r) => r.status === "aprobada");

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CalendarDays className="size-6 text-brand" /> Reservas de áreas comunes
          </h1>
          <p className="text-sm text-muted">Define las áreas y aprueba las solicitudes de los residentes.</p>
        </div>
        <NewAreaForm buildings={buildingOptions} />
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
                      Unidad {unitCode.get(r.unit_id) ?? "—"} · {formatDate(r.reservation_date)} ·{" "}
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

      {/* Próximas reservas */}
      <section className="space-y-3">
        <h2 className="font-semibold">Próximas reservas</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            No hay reservas próximas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <ul className="divide-y divide-line">
              {upcoming.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium">{areaName.get(r.area_id) ?? "Área"}</span>
                    <span className="text-muted">
                      {" "}
                      · Unidad {unitCode.get(r.unit_id) ?? "—"} · {formatDate(r.reservation_date)} ·{" "}
                      {fmtTime(r.start_time)}–{fmtTime(r.end_time)}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RESERVATION_STATUS_STYLE[r.status]}`}>
                    {RESERVATION_STATUS_LABEL[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
