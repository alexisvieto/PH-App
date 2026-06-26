"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { markPeriodPaid, processPayrollPeriod } from "@/app/app/planilla/actions";

export function PayrollPeriodActions({
  periodId,
  status,
}: {
  periodId: string;
  status: "borrador" | "procesada" | "pagada";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function run(fn: () => Promise<{ ok: boolean; error: string | null }>, okMsg: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await fn();
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success(okMsg);
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  if (status === "pagada") return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => run(() => processPayrollPeriod(periodId), "Planilla procesada.")}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {status === "borrador" ? "Procesar" : "Reprocesar"}
      </button>
      {status === "procesada" && (
        <button
          onClick={() => run(() => markPeriodPaid(periodId), "Pago de planilla registrado.")}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />} Registrar pago
        </button>
      )}
    </div>
  );
}
