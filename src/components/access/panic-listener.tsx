"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { playAlarm, shortVibrate } from "@/lib/alert-sound";
import { createClient } from "@/lib/supabase/client";

type AlertRow = { id: string; source: string; contact_name: string | null };

/**
 * Recibe SOS en toda la app del staff. La alarma se REPITE cada ~3.5s mientras
 * haya alguna alerta `activa` (sin atender) y se detiene cuando el staff toca
 * "Atender" (pasa a `atendida`). Doble vía: realtime (instantáneo) + sondeo de
 * respaldo (el realtime es poco fiable). El toast se muestra una vez por alerta.
 */
export function PanicListener({ orgId }: { orgId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const announced = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const announce = (a: AlertRow) => {
      const guard = a.source === "guardia";
      const who = guard ? "Garita" : a.contact_name ?? "Un residente";
      toast.error(`🚨 SOS — ${who}`, {
        description: guard ? "El guardia pide ayuda en la garita." : "Un residente activó el botón de pánico.",
        duration: 30000,
        action: { label: "Ver", onClick: () => router.push(guard ? "/app/emergencias" : "/app/garita") },
      });
    };

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, ms);
    };

    async function tick() {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        schedule(8000);
        return;
      }
      const { data } = await supabase
        .from("panic_alerts")
        .select("id, source, contact_name")
        .eq("organization_id", orgId)
        .eq("status", "activa");
      if (stopped) return;
      const rows = (data ?? []) as AlertRow[];

      let isNew = false;
      for (const r of rows) {
        if (!announced.has(r.id)) {
          announced.add(r.id);
          announce(r);
          isNew = true;
        }
      }
      if (isNew) router.refresh();

      // Alarma MIENTRAS haya alguna alerta sin atender; se detiene al tocar "Atender".
      if (rows.length > 0) {
        playAlarm();
        shortVibrate([300, 150, 300, 150, 300]);
      }
      schedule(rows.length > 0 ? 3500 : 10000);
    }

    // Realtime: dispara un chequeo inmediato cuando entra un SOS.
    const ch = supabase
      .channel(`panic-staff-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "panic_alerts", filter: `organization_id=eq.${orgId}` },
        () => void tick(),
      )
      .subscribe();

    void tick();
    const onFocus = () => void tick();
    window.addEventListener("focus", onFocus);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
    };
  }, [orgId, router]);

  return null;
}
