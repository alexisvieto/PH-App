"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, PhoneCall, X } from "lucide-react";
import { toast } from "sonner";

import { respondIntercom } from "@/app/portal/citofono/actions";
import { createClient } from "@/lib/supabase/client";
import { INTERCOM_STATUS_LABEL, INTERCOM_STATUS_STYLE } from "@/lib/intercom";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["intercom_status"];
type Item = { id: string; unit_code: string; visitor_name: string; status: Status; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString("es-PA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Panama" });
}

export function IntercomInbox({ orgId, items }: { orgId: string; items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  // Tiempo real: nuevas solicitudes / respuestas refrescan la vista.
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("intercom-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "intercom_requests", filter: `organization_id=eq.${orgId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [orgId, router]);

  async function respond(id: string, authorize: boolean) {
    if (busy) return;
    setBusy(id);
    const res = await respondIntercom(id, authorize);
    setBusy(null);
    if (res.ok) {
      toast.success(authorize ? "Ingreso autorizado." : "Ingreso rechazado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  const pending = items.filter((i) => i.status === "pendiente");
  const history = items.filter((i) => i.status !== "pendiente");

  return (
    <div className="space-y-6">
      {/* Solicitudes pendientes (timbre) */}
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((i) => (
            <div key={i.id} className="rounded-3xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-800">
                <PhoneCall className="size-5 animate-pulse" />
                <span className="text-sm font-semibold uppercase tracking-wide">Visita en garita</span>
              </div>
              <p className="mt-2 text-lg font-semibold">{i.visitor_name}</p>
              <p className="text-sm text-muted">
                Quiere ingresar a tu unidad {i.unit_code} · {fmt(i.created_at)}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => respond(i.id, true)}
                  disabled={busy === i.id}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {busy === i.id ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} Autorizar
                </button>
                <button
                  onClick={() => respond(i.id, false)}
                  disabled={busy === i.id}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-base font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <X className="size-5" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay visitas esperando en la garita.
        </p>
      )}

      {/* Historial */}
      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Historial</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <ul className="divide-y divide-line">
              {history.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium">{i.visitor_name}</span>
                    <span className="text-muted"> · {i.unit_code} · {fmt(i.created_at)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${INTERCOM_STATUS_STYLE[i.status]}`}>
                    {INTERCOM_STATUS_LABEL[i.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
