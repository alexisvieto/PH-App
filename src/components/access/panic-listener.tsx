"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { playAlarm, shortVibrate } from "@/lib/alert-sound";
import { createClient } from "@/lib/supabase/client";

/** Escucha SOS nuevos en toda la app del staff y avisa con alarma + toast urgente. */
export function PanicListener({ orgId }: { orgId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`panic-staff-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "panic_alerts", filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const a = payload.new as { source: string; contact_name: string | null };
          const guard = a.source === "guardia";
          const who = guard ? "Garita" : a.contact_name ?? "Un residente";
          // Emergencia: alarma estridente + vibración fuerte (sin silenciar).
          playAlarm();
          shortVibrate([300, 150, 300, 150, 300]);
          toast.error(`🚨 SOS — ${who}`, {
            description: guard
              ? "El guardia pide ayuda en la garita."
              : "Un residente activó el botón de pánico.",
            duration: 20000,
            action: {
              label: "Ver",
              onClick: () => router.push(guard ? "/app/emergencias" : "/app/garita"),
            },
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [orgId, router]);
  return null;
}
