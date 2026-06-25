"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

/** Timbre de citófono con Web Audio (sin assets). Suena en bucle hasta `stop()`.
 *  En móvil el audio puede quedar suspendido sin un gesto previo (la alerta
 *  visual siempre aparece); con la app abierta tras interactuar, suele sonar. */
function makeRing(): { stop: () => void } {
  let AC: typeof AudioContext | undefined;
  try {
    AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  } catch {
    return { stop: () => {} };
  }
  if (!AC) return { stop: () => {} };
  const ctx = new AC();
  void ctx.resume?.();
  let stopped = false;
  const beep = () => {
    if (stopped) return;
    [0, 0.4].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 0 ? 880 : 660;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  };
  beep();
  const timer = window.setInterval(beep, 2400);
  return {
    stop: () => {
      stopped = true;
      window.clearInterval(timer);
      void ctx.close?.();
    },
  };
}

type Row = { id: string; unit_id: string; visitor_name: string; status: string };

/** Escucha llamadas de citófono (garita→unidad) en TODO el portal y avisa con
 *  timbre + toast, esté el residente donde esté. Realtime + polling de respaldo
 *  (la entrega por Realtime del lado residente es poco fiable). */
export function IntercomListener({ orgId, unitIds }: { orgId: string; unitIds: string[] }) {
  const router = useRouter();
  const seen = useRef<Set<string>>(new Set());
  const ring = useRef<{ stop: () => void } | null>(null);
  const key = unitIds.join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) return;
    const units = new Set(ids);
    const supabase = createClient();
    let active = true;

    const stopRing = () => {
      ring.current?.stop();
      ring.current = null;
    };

    const alertCall = (r: Row) => {
      if (seen.current.has(r.id) || r.status !== "pendiente" || !units.has(r.unit_id)) return;
      seen.current.add(r.id);
      if (!ring.current) ring.current = makeRing();
      toast(`📞 Visita en garita`, {
        id: r.id,
        description: `${r.visitor_name} quiere ingresar. Toca para autorizar o rechazar.`,
        duration: 90000,
        action: {
          label: "Responder",
          onClick: () => {
            stopRing();
            router.push("/portal/citofono");
          },
        },
        onDismiss: stopRing,
        onAutoClose: stopRing,
      });
    };

    // Realtime: nueva solicitud entrante.
    const ch = supabase
      .channel(`intercom-portal-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "intercom_requests", filter: `organization_id=eq.${orgId}` },
        (payload) => alertCall(payload.new as Row),
      )
      .subscribe();

    // Polling de respaldo: por si el evento Realtime no llega.
    const poll = async () => {
      const { data } = await supabase
        .from("intercom_requests")
        .select("id, unit_id, visitor_name, status")
        .eq("organization_id", orgId)
        .in("unit_id", ids)
        .eq("status", "pendiente")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!active) return;
      const rows = (data ?? []) as Row[];
      rows.forEach(alertCall);
      if (rows.length === 0) stopRing(); // ya respondidas/canceladas → calla el timbre
    };
    void poll();
    const iv = window.setInterval(poll, 12000);

    return () => {
      active = false;
      window.clearInterval(iv);
      supabase.removeChannel(ch);
      stopRing();
    };
  }, [orgId, key, router]);

  return null;
}
