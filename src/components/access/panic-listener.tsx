"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { playAlarm, shortVibrate } from "@/lib/alert-sound";
import { createClient } from "@/lib/supabase/client";

type AlertRow = { id: string; source: string; contact_name: string | null };

/**
 * Recibe SOS nuevos en toda la app del staff y avisa con ALARMA + toast urgente.
 * Doble vía para que NUNCA se pierda: realtime (entrega instantánea) + sondeo de
 * respaldo cada 12s (el realtime es poco fiable). Dedupe por id para no sonar dos
 * veces. No alarma por alertas que ya estaban activas al abrir la app.
 */
export function PanicListener({ orgId }: { orgId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const seen = new Set<string>();
    let ready = false;

    const fire = (a: AlertRow) => {
      if (!ready || seen.has(a.id)) return;
      seen.add(a.id);
      const guard = a.source === "guardia";
      const who = guard ? "Garita" : a.contact_name ?? "Un residente";
      playAlarm();
      shortVibrate([300, 150, 300, 150, 300]);
      toast.error(`🚨 SOS — ${who}`, {
        description: guard ? "El guardia pide ayuda en la garita." : "Un residente activó el botón de pánico.",
        duration: 20000,
        action: { label: "Ver", onClick: () => router.push(guard ? "/app/emergencias" : "/app/garita") },
      });
      router.refresh();
    };

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase
        .from("panic_alerts")
        .select("id, source, contact_name")
        .eq("organization_id", orgId)
        .eq("status", "activa");
      const rows = (data ?? []) as AlertRow[];
      if (!ready) {
        // Primera carga: las activas que ya existían NO disparan alarma.
        rows.forEach((r) => seen.add(r.id));
        ready = true;
        return;
      }
      rows.forEach(fire);
    };

    // Realtime: entrega instantánea cuando funciona.
    const ch = supabase
      .channel(`panic-staff-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "panic_alerts", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          ready = true; // si ya recibimos eventos, estamos sembrados
          fire(payload.new as AlertRow);
        },
      )
      .subscribe();

    // Respaldo: siembra al inicio y luego sondea (realtime poco fiable).
    void poll();
    const id = setInterval(() => void poll(), 12000);
    const onFocus = () => void poll();
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [orgId, router]);

  return null;
}
