"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cancelReservation, createResidentReservation } from "@/app/portal/reservas/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { isoDay } from "@/lib/format";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

type AreaOption = { id: string; name: string };
type UnitOption = { id: string; label: string };

export function ReservarForm({ areas, units }: { areas: AreaOption[]; units: UnitOption[] }) {
  const [state, action] = useActionState(createResidentReservation, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const today = isoDay(new Date());

  useEffect(() => {
    if (state.ok) {
      toast.success("Reserva enviada.");
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  if (areas.length === 0) return null;

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <CalendarPlus className="size-5 text-brand" /> Reservar un área
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Área</span>
          <select name="area_id" required defaultValue="" className={input}>
            <option value="" disabled>Selecciona…</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        {units.length === 1 ? (
          <input type="hidden" name="unit_id" value={units[0].id} />
        ) : (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Unidad</span>
            <select name="unit_id" required defaultValue="" className={input}>
              <option value="" disabled>Selecciona…</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Fecha</span>
          <input name="date" type="date" required min={today} defaultValue={today} className={input} />
        </label>
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

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton pendingText="Enviando…">Reservar</SubmitButton>
    </form>
  );
}

/** Cancelar una reserva propia (residente). */
export function CancelReservation({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onCancel() {
    if (busy) return;
    setBusy(true);
    const res = await cancelReservation(reservationId);
    setBusy(false);
    if (res.ok) {
      toast.success("Reserva cancelada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <button
      onClick={onCancel}
      disabled={busy}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />} Cancelar
    </button>
  );
}
