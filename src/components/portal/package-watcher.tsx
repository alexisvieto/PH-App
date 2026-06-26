"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { playChime, shortVibrate } from "@/lib/alert-sound";
import { createClient } from "@/lib/supabase/client";

/**
 * Vigila los paquetes en garita de las unidades del residente: sondea cada ~30s
 * (y al volver el foco). Si el conteo SUBE, avisa (sonido + vibración corta) y
 * refresca el badge/tarjeta del servidor. Patrón de polling porque el Realtime
 * del lado residente es poco fiable (ver CLAUDE.md).
 */
export function PackageWatcher({ unitIds, initialCount }: { unitIds: string[]; initialCount: number }) {
  const router = useRouter();
  const last = useRef(initialCount);
  const key = unitIds.join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) return;
    let stop = false;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const supabase = createClient();
      const { count } = await supabase
        .from("packages")
        .select("id", { count: "exact", head: true })
        .in("unit_id", ids)
        .eq("status", "en_garita");
      if (stop) return;
      const n = count ?? 0;
      if (n > last.current) {
        playChime();
        shortVibrate(200);
      }
      if (n !== last.current) {
        last.current = n;
        router.refresh(); // actualiza el badge del header + la tarjeta de Inicio
      }
    };

    const id = setInterval(check, 30000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      stop = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [key, router]);

  return null;
}
