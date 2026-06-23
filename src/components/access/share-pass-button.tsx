"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";

/**
 * Comparte el pase incluyendo la IMAGEN del QR.
 *
 * En móvil (y la app nativa) usa la Web Share API con el PNG del QR adjunto, así
 * el visitante recibe el código por WhatsApp/donde elija. Si el navegador no
 * puede compartir archivos (típico en desktop), cae al enlace wa.me de solo
 * texto — el mismo comportamiento que antes. El usuario igual ve el QR en
 * pantalla para tomar captura.
 */
export function SharePassButton({
  qrDataUrl,
  code,
  shareText,
  waLink,
}: {
  qrDataUrl: string;
  code: string;
  shareText: string;
  waLink: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await (await fetch(qrDataUrl)).blob();
      const file = new File([blob], `pase-${code}.png`, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ title: "Pase de visita", text: shareText, files: [file] });
        return; // compartido (o cancelado por el usuario): no abrir el fallback
      }
    } catch (err) {
      // El usuario canceló la hoja de compartir → no abras nada.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Otro fallo (sin soporte de archivos) → cae al enlace de texto.
    } finally {
      setBusy(false);
    }
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}{" "}
      Compartir pase (con QR)
    </button>
  );
}
