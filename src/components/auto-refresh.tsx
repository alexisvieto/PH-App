"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca los datos del server component actual sin recargar la página: al
 * volver el foco a la pestaña y, mientras está visible, cada `intervalMs`.
 * Patrón de polling (Realtime del lado residente es poco fiable, ver CLAUDE.md).
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", refresh);
    const id = setInterval(refresh, intervalMs);
    return () => {
      window.removeEventListener("focus", refresh);
      clearInterval(id);
    };
  }, [router, intervalMs]);
  return null;
}
