"use client";

import { useRef, useState } from "react";
import { Loader2, Share2 } from "lucide-react";

/**
 * Comparte (o guarda) un PDF generado por una ruta del portal.
 *
 * En móvil (y la app de pantalla de inicio en iPhone) abre la Web Share API
 * nativa con el PDF adjunto: el residente lo envía por WhatsApp/correo o lo
 * guarda en Archivos como cualquier archivo del sistema.
 *
 * iOS es estricto: `navigator.share` solo funciona dentro del "gesto" del toque.
 * Si la generación del PDF tarda, se pierde ese gesto y el compartir se cancela.
 * Por eso PRE-CARGAMOS el PDF al apuntar/tocar el botón (onPointerDown), así al
 * soltar el compartir es prácticamente inmediato y conserva el gesto.
 *
 * Si el navegador no puede compartir archivos (desktop), descarga el PDF. NUNCA
 * reabrimos el visor del navegador (en modo app eso deja al usuario atrapado).
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
  const blobRef = useRef<Blob | null>(null);
  const pendingRef = useRef<Promise<Blob> | null>(null);

  /** Descarga el PDF una sola vez y lo cachea (idempotente). */
  function ensureBlob(): Promise<Blob> {
    if (blobRef.current) return Promise.resolve(blobRef.current);
    if (!pendingRef.current) {
      pendingRef.current = fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error("No se pudo generar el documento.");
          const blob = await res.blob();
          blobRef.current = blob;
          return blob;
        })
        .finally(() => {
          pendingRef.current = null;
        });
    }
    return pendingRef.current;
  }

  function download(blob: Blob) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await ensureBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      // Web Share con archivos (móvil / app): la bandeja nativa del sistema.
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({ title, files: [file] });
        return; // compartido o cancelado por el usuario
      }

      // Sin Web Share (desktop): descarga directa.
      download(blob);
    } catch (err) {
      // El usuario canceló la bandeja → no hagas nada.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Falló el compartir por otra razón → respaldo: descarga el PDF
      // (nunca reabrimos el visor, que en modo app no tiene salida).
      if (blobRef.current) download(blobRef.current);
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
      onPointerDown={() => {
        // Pre-carga al tocar para conservar el gesto en iOS.
        ensureBlob().catch(() => {});
      }}
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
