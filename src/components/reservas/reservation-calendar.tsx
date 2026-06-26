"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { areaIcon, areaIconColor } from "@/components/reservas/area-icons";
import { EMPTY_ACTION_STATE, type ActionState } from "@/lib/action-state";
import { fmtTime, RULES_ACCEPT_LEGEND } from "@/lib/reservas";
import { createClient } from "@/lib/supabase/client";

type Area = {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
  capacity?: number | null;
  open_time: string;
  close_time: string;
  advance_days: number;
  requires_approval: boolean;
  rules?: string | null;
};
type UnitOption = { id: string; label: string };
type Slot = { s: string; e: string };

const WEEK = ["L", "M", "X", "J", "V", "S", "D"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function addDaysISO(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function ReservationCalendar({
  areas,
  units,
  today,
  action,
  allowBlock = false,
  requireRules = false,
}: {
  areas: Area[];
  units: UnitOption[];
  today: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  allowBlock?: boolean; // permite "bloquear" el área sin unidad (solo staff)
  requireRules?: boolean; // exige aceptar el reglamento del área (residente)
}) {
  const router = useRouter();
  const [areaId, setAreaId] = useState(areas.length === 1 ? areas[0].id : "");
  const area = areas.find((a) => a.id === areaId) ?? null;
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  const [view, setView] = useState({ y: ty, m: tm });
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const maxISO = area ? addDaysISO(today, area.advance_days) : today;

  const loadSlots = useCallback(async () => {
    if (!areaId) return;
    const from = iso(view.y, view.m, 1);
    const to = iso(view.y, view.m, new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate());
    const supabase = createClient();
    const { data } = await supabase.rpc("get_area_availability", {
      p_area_id: areaId,
      p_from: from,
      p_to: to,
    });
    const map: Record<string, Slot[]> = {};
    for (const r of data ?? []) {
      (map[r.reservation_date] ??= []).push({
        s: r.start_time.slice(0, 5),
        e: r.end_time.slice(0, 5),
      });
    }
    setSlots(map);
  }, [areaId, view]);

  useEffect(() => {
    // Carga de disponibilidad al cambiar área/mes: fetch legítimo a la RPC,
    // no es ajuste de estado derivado (el setState ocurre tras el await).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSlots();
  }, [loadSlots]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget; // capturar antes del await
    const fd = new FormData(form);
    setBusy(true);
    setErr(null);
    const res = await action(EMPTY_ACTION_STATE, fd);
    setBusy(false);
    if (res.ok) {
      toast.success(area?.requires_approval ? "Solicitud enviada · pendiente de aprobación." : "Reserva confirmada.");
      form.reset();
      setAccepted(false);
      setSelected(null); // cierra el formulario del día tras enviar
      await loadSlots(); // la nueva franja aparece como ocupada
      router.refresh(); // refresca "Mis reservas"
    } else {
      setErr(res.error);
    }
  }

  if (areas.length === 0) return null;

  // Grilla del mes (lunes primero).
  const first = new Date(Date.UTC(view.y, view.m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthLabel = first.toLocaleDateString("es-PA", { month: "long", year: "numeric", timeZone: "UTC" });

  const canPrev = view.y * 12 + view.m > ty * 12 + tm;
  const nextY = view.m + 1 > 11 ? view.y + 1 : view.y;
  const canNext = iso(nextY, (view.m + 1) % 12, 1) <= maxISO;
  const move = (delta: number) => {
    setSelected(null);
    const t = view.m + delta;
    setView({ y: view.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 });
  };

  const selectedSlots = selected ? slots[selected] ?? [] : [];

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <CalendarDays className="size-5 text-brand" /> Reservar un área
      </h2>

      {/* Carrusel de recursos: íconos deslizables con el dedo */}
      <div>
        <span className="mb-2 block text-sm font-medium">Elige un recurso</span>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {areas.map((a) => {
            const Icon = areaIcon(a.icon);
            const active = a.id === areaId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAreaId(a.id);
                  setSelected(null);
                  setView({ y: ty, m: tm });
                }}
                className="flex w-[4.5rem] shrink-0 snap-start flex-col items-center gap-1.5"
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-2xl transition ${areaIconColor(
                    a.icon,
                  )} ${active ? "ring-2 ring-brand ring-offset-2" : "ring-1 ring-line"}`}
                >
                  <Icon className="size-6" />
                </span>
                <span
                  className={`text-center text-xs leading-tight ${
                    active ? "font-semibold text-brand" : "text-muted"
                  }`}
                >
                  {a.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {area && (
        <>
          {area.description && <p className="text-sm text-ink/70">{area.description}</p>}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> {fmtTime(area.open_time)}–{fmtTime(area.close_time)}
            </span>
            {area.capacity != null && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> {area.capacity}
              </span>
            )}
          </p>

          {/* Navegación de mes */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={!canPrev}
              aria-label="Mes anterior"
              className="rounded-lg p-2 text-muted transition hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-semibold capitalize">{monthLabel}</span>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={!canNext}
              aria-label="Mes siguiente"
              className="rounded-lg p-2 text-muted transition hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Grilla */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((w) => (
              <div key={w} className="py-1 text-xs font-medium text-muted">
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`b${i}`} />;
              const date = iso(view.y, view.m, d);
              const outOfRange = date < today || date > maxISO;
              const occupied = (slots[date]?.length ?? 0) > 0;
              const isSel = selected === date;
              const base = "flex aspect-square items-center justify-center rounded-lg text-sm transition";
              let cls: string;
              if (outOfRange) cls = "text-gray-300 cursor-not-allowed";
              else if (occupied) cls = "bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer";
              else cls = "bg-sky-100 text-sky-800 hover:bg-sky-200 cursor-pointer";
              return (
                <button
                  key={date}
                  type="button"
                  disabled={outOfRange}
                  onClick={() => {
                    setSelected(date);
                    setAccepted(false);
                  }}
                  className={`${base} ${cls} ${isSel ? "ring-2 ring-brand" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-sky-200" /> Disponible
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-gray-300" /> Ocupado
            </span>
          </div>

          {/* Día seleccionado: horarios ocupados + reservar una franja libre */}
          {selected && (
            <div className="space-y-3 rounded-xl border border-line bg-white p-4">
              <p className="text-sm font-semibold capitalize">
                {new Date(`${selected}T00:00:00`).toLocaleDateString("es-PA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>

              {selectedSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <span className="w-full text-xs font-medium text-gray-500">Horarios ya reservados:</span>
                  {selectedSlots.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600"
                    >
                      <Clock className="size-3" /> {fmtTime(s.s)}–{fmtTime(s.e)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700">Todo el día está libre.</p>
              )}

              <form onSubmit={onSubmit} className="space-y-3 border-t border-line pt-3">
                <input type="hidden" name="area_id" value={areaId} />
                <input type="hidden" name="date" value={selected} />
                {units.length === 1 && !allowBlock ? (
                  <input type="hidden" name="unit_id" value={units[0].id} />
                ) : (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">
                      {allowBlock ? "Unidad o bloqueo" : "Unidad"}
                    </span>
                    <select name="unit_id" required defaultValue="" className={input}>
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      {allowBlock && (
                        <option value="__block__">Bloqueo del área (mantenimiento / evento)</option>
                      )}
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Desde</span>
                    <input name="start_time" type="time" required className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Hasta</span>
                    <input name="end_time" type="time" required className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Invitados</span>
                    <input name="guests" type="number" min="1" step="1" className={input} placeholder="Opcional" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Nota</span>
                    <input name="notes" className={input} placeholder="Opcional" />
                  </label>
                </div>

                {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
                {area.requires_approval && (
                  <p className="text-xs text-amber-700">Esta área requiere aprobación del administrador.</p>
                )}

                {requireRules && area.rules && (
                  <div className="space-y-2 rounded-xl border border-line bg-gray-50 p-3">
                    <p className="text-sm font-semibold">Reglamento del área</p>
                    <div className="max-h-44 overflow-y-auto whitespace-pre-line rounded-lg border border-line bg-white p-3 text-xs leading-relaxed text-ink/80">
                      {area.rules}
                    </div>
                    <label className="flex cursor-pointer items-start gap-2 text-xs text-ink/80">
                      <input
                        type="checkbox"
                        name="rules_accepted"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span>{RULES_ACCEPT_LEGEND}</span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || (requireRules && !!area.rules && !accepted)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {busy ? "Enviando…" : "Reservar este horario"}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
