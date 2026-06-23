"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";

/**
 * Comparte (o guarda) un PDF generado por una ruta del portal.
 *
 * En móvil (y la app nativa) descarga el PDF y abre la Web Share API nativa, así
 * el residente lo envía por WhatsApp/correo o lo guarda en Archivos como
 * cualquier archivo del sistema. Si el navegador no puede compartir archivos
 * (típico en desktop) cae a una descarga directa. Si el usuario cancela la hoja
 * de compartir, no hace nada.
 */
export function SharePdfButton({
  url,
  filename,
  title,
  label,
  variant = "outline",
}: {
  url: string; // ruta same-origin que devuelve el PDF (corre bajo RLS)
  filename: string; // nombre sugerido del archivo
  title: string; // título para la hoja de compartir
  label: string; // texto del botón
  variant?: "outline" | "solid";
}) {
  const [busy, setBusy] = useState(false);

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo generar el documento.");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "application/pdf" });

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ title, files: [file] });
        return; // compartido (o cancelado): no descargar también
      }

      // Fallback (desktop / sin soporte de archivos): descarga directa.
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      // El usuario canceló la hoja de compartir → no hagas nada.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Último recurso: abrir el PDF en una pestaña nueva.
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  const styles =
    variant === "solid"
      ? "bg-brand text-white hover:opacity-90"
      : "border border-line bg-surface hover:border-brand hover:text-brand";

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${styles}`}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Share2 className="size-4" />
      )}
      {label}
    </button>
  );
}
