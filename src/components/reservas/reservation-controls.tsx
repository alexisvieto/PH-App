"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { reviewReservation, setAreaActive } from "@/app/app/reservas/actions";

/** Botones Aprobar / Rechazar para una solicitud pendiente (staff). */
export function ReviewButtons({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  async function decide(decision: "aprobada" | "rechazada") {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await reviewReservation(reservationId, decision);
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success(decision === "aprobada" ? "Reserva aprobada." : "Reserva rechazada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => decide("aprobada")}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Aprobar
      </button>
      <button
        onClick={() => decide("rechazada")}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
      >
        <X className="size-4" /> Rechazar
      </button>
    </div>
  );
}

/** Interruptor activo/inactivo de un área (staff). */
export function AreaToggle({ areaId, active }: { areaId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await setAreaActive(areaId, !active);
    setBusy(false);
    if (res.ok) {
      toast.success(active ? "Área desactivada." : "Área activada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-60 ${
        active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {busy && <Loader2 className="size-3 animate-spin" />}
      {active ? "Activa" : "Inactiva"}
    </button>
  );
}
