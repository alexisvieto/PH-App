"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Siren } from "lucide-react";
import { toast } from "sonner";

import { acknowledgePanic, resolvePanic } from "@/app/app/accesos/panic-actions";
import { createClient } from "@/lib/supabase/client";
import { PANIC_KIND_LABEL, PANIC_STATUS_LABEL, PANIC_STATUS_STYLE } from "@/lib/panic";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["panic_status"];
type Kind = Database["public"]["Enums"]["panic_kind"];
type Item = {
  id: string;
  source: Database["public"]["Enums"]["panic_source"];
  unit_code: string;
  contact_name: string | null;
  kind: Kind | null;
  status: Status;
  created_at: string;
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString("es-PA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export function EmergencyConsole({ orgId, items }: { orgId: string; items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`panic-emergencias-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "panic_alerts", filter: `organization_id=eq.${orgId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [orgId, router]);

  async function act(id: string, fn: typeof acknowledgePanic) {
    if (busy) return;
    setBusy(id);
    const res = await fn(id);
    setBusy(null);
    if (res.ok) router.refresh();
    else toast.error(res.error ?? "Error");
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
        Sin alertas de emergencia.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((i) => {
        const live = i.status === "activa" || i.status === "atendida";
        return (
          <li
            key={i.id}
            className={`rounded-2xl border p-4 ${
              i.status === "activa" ? "border-red-300 bg-red-50" : "border-line bg-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {i.status === "activa" && <Siren className="size-4 text-red-600" />}
                  {i.contact_name ?? (i.source === "guardia" ? "Garita" : "Residente")}
                  <span className="text-sm font-normal text-muted">
                    {i.source === "guardia" ? "· Garita" : `· ${i.unit_code}`}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {i.kind ? `${PANIC_KIND_LABEL[i.kind]} · ` : ""}
                  {fmt(i.created_at)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PANIC_STATUS_STYLE[i.status]}`}
              >
                {PANIC_STATUS_LABEL[i.status]}
              </span>
            </div>

            {live && (
              <div className="mt-3 flex gap-2">
                {i.status === "activa" && (
                  <button
                    onClick={() => act(i.id, acknowledgePanic)}
                    disabled={busy === i.id}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {busy === i.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{" "}
                    Atender
                  </button>
                )}
                <button
                  onClick={() => act(i.id, resolvePanic)}
                  disabled={busy === i.id}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Marcar resuelto
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
