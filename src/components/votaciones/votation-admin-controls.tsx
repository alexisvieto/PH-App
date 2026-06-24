"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Play } from "lucide-react";
import { toast } from "sonner";

import { setVotationStatus } from "@/app/app/votaciones/actions";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["votation_status"];

export function VotationAdminControls({ votationId, status }: { votationId: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: "abierta" | "cerrada") {
    if (busy) return;
    setBusy(true);
    const res = await setVotationStatus(votationId, next);
    setBusy(false);
    if (res.ok) {
      toast.success(next === "abierta" ? "Votación abierta." : "Votación cerrada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  if (status === "cerrada") return null;

  return (
    <div className="flex gap-2">
      {status === "borrador" && (
        <button
          onClick={() => change("abierta")}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Abrir votación
        </button>
      )}
      {status === "abierta" && (
        <button
          onClick={() => change("cerrada")}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Cerrar votación
        </button>
      )}
    </div>
  );
}
