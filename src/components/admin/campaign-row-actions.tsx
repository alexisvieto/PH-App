"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCampaign, setCampaignStatus } from "@/app/admin/publicidad/actions";

export function CampaignRowActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: "active" | "paused";
}) {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

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
    } else toast.error(res.error ?? "Error");
  }

  return (
    <div className="flex items-center gap-2">
      {status === "active" ? (
        <button
          onClick={() => run(() => setCampaignStatus(campaignId, "paused"), "Campaña pausada.")}
          disabled={busy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-gray-50 disabled:opacity-60"
        >
          <Pause className="size-4" /> Pausar
        </button>
      ) : (
        <button
          onClick={() => run(() => setCampaignStatus(campaignId, "active"), "Campaña activada.")}
          disabled={busy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <Play className="size-4" /> Activar
        </button>
      )}
      <button
        onClick={() => {
          if (confirm("¿Eliminar esta campaña?")) run(() => deleteCampaign(campaignId), "Campaña eliminada.");
        }}
        disabled={busy}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 className="size-4" /> Eliminar
      </button>
    </div>
  );
}
