"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { startYappyPayment } from "@/app/portal/pagos/actions";
import { formatMoney } from "@/lib/format";

export function PayWithYappy({ unitId, amount }: { unitId: string; amount: number }) {
  const [busy, setBusy] = useState(false);

  async function onPay() {
    if (busy) return;
    setBusy(true);
    const res = await startYappyPayment(unitId, amount);
    if (res.ok && res.url) {
      window.location.href = res.url;
      return;
    }
    setBusy(false);
    toast.message(res.error ?? "No se pudo iniciar el pago.");
  }

  return (
    <button
      type="button"
      onClick={onPay}
      disabled={busy}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#00B2A9] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
      Pagar {formatMoney(amount)} con Yappy
    </button>
  );
}
