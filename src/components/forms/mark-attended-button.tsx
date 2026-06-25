"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { markAttended } from "@/app/app/mantenimiento/actions";

/** Registra el mantenimiento de hoy de un clic y limpia la alerta de vencido/próximo. */
export function MarkAttendedButton({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (busy) return;
    setBusy(true);
    const res = await markAttended(equipmentId);
    setBusy(false);
    if (res.ok) {
      toast.success("Marcado como atendido. La alerta se actualizó.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo registrar.");
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Marcar como atendido
    </button>
  );
}
