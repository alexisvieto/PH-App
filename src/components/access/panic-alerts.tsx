"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Phone, ShieldAlert, Siren } from "lucide-react";
import { toast } from "sonner";

import {
  acknowledgePanic,
  resolvePanic,
  triggerGuardPanic,
} from "@/app/app/accesos/panic-actions";
import { HoldButton } from "@/components/access/hold-button";
import { createClient } from "@/lib/supabase/client";
import { PANIC_KIND_LABEL } from "@/lib/panic";
import { buildWaLink, waPhone } from "@/lib/whatsapp";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["panic_status"];
type Kind = Database["public"]["Enums"]["panic_kind"];
type Alert = {
  id: string;
  unit_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  kind: Kind | null;
  status: Status;
};

export function PanicAlerts({
  orgId,
  units,
  alerts,
}: {
  orgId: string;
  units: { id: string; label: string }[];
  alerts: Alert[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const unitCode = new Map(units.map((u) => [u.id, u.label]));

  // Tiempo real: cualquier SOS nuevo o cambio refresca la consola de la garita.
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`panic-garita-${orgId}`)
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

  async function guardSos() {
    const res = await triggerGuardPanic();
    if (res.ok) {
      toast.success("SOS enviado a la administración.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Alertas activas (residente) — arriba de todo, imposibles de ignorar */}
      {alerts.map((a) => {
        const attended = a.status === "atendida";
        const phone = waPhone(a.contact_phone);
        return (
          <div
            key={a.id}
            className={`rounded-3xl p-5 text-white shadow-lg ${
              attended ? "bg-amber-600" : "bg-red-600 animate-pulse"
            }`}
          >
            <div className="flex items-center gap-2">
              <Siren className="size-6" />
              <span className="text-sm font-bold uppercase tracking-wide">
                {attended ? "SOS — atendiendo" : "🚨 SOS activo"}
              </span>
            </div>
            <p className="mt-2 text-xl font-bold">
              {a.contact_name ?? "Residente"}
              {a.unit_id && (
                <span className="font-medium"> · {unitCode.get(a.unit_id) ?? "—"}</span>
              )}
            </p>
            {a.kind && (
              <p className="text-sm text-white/90">Emergencia: {PANIC_KIND_LABEL[a.kind]}</p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {!attended && (
                <button
                  onClick={() => act(a.id, acknowledgePanic)}
                  disabled={busy === a.id}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-base font-semibold text-red-700 transition hover:bg-white/90 disabled:opacity-60"
                >
                  {busy === a.id ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}{" "}
                  Atender
                </button>
              )}
              {phone && (
                <>
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-base font-semibold text-white transition hover:bg-white/30"
                  >
                    <Phone className="size-5" /> Llamar
                  </a>
                  <a
                    href={buildWaLink(phone, "Te contacto por tu alerta de emergencia.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/20 px-4 py-3 text-base font-semibold text-white transition hover:bg-white/30"
                  >
                    WhatsApp
                  </a>
                </>
              )}
              {attended && (
                <button
                  onClick={() => act(a.id, resolvePanic)}
                  disabled={busy === a.id}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-white px-4 py-3 text-base font-semibold text-amber-700 transition hover:bg-white/90 disabled:opacity-60"
                >
                  Marcar resuelto
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* SOS de la garita (guardia bajo amenaza) → avisa a la administración */}
      <HoldButton
        onFire={guardSos}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 active:bg-red-100"
      >
        <ShieldAlert className="size-5" /> SOS Garita (mantén presionado)
      </HoldButton>
    </div>
  );
}
