"use client";

import { useRef, useState } from "react";
import { Eye, Loader2, Share2 } from "lucide-react";

/**
 * Acciones de un PDF del portal: VER (lo abre para revisarlo) y COMPARTIR.
 *
 * El residente primero abre el documento (la ruta lo entrega `inline`, así el
 * navegador lo muestra) y, cuando ya lo revisó, lo comparte. "Compartir" usa la
 * Web Share API con el archivo adjunto (WhatsApp/correo/guardar en Archivos).
 *
 * iOS es estricto: `navigator.share` solo corre dentro del gesto del toque. Por
 * eso pre-cargamos el PDF al apuntar el botón (onPointerDown) para conservarlo.
 */
export function PdfActions({
  url,
  filename,
  title,
  name,
  variant = "outline",
}: {
  url: string; // ruta same-origin que devuelve el PDF inline (bajo RLS)
  filename: string; // nombre sugerido al compartir/guardar
  title: string; // título de la hoja de compartir
  name: string; // nombre del documento, p. ej. "estado de cuenta"
  variant?: "outline" | "solid";
}) {
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const pendingRef = useRef<Promise<Blob> | null>(null);

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
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({ title, files: [file] });
        return;
      }
      download(blob); // sin Web Share (desktop): descarga directa
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // canceló
      if (blobRef.current) download(blobRef.current);
    } finally {
      setBusy(false);
    }
  }

  const view =
    variant === "solid"
      ? "bg-brand text-white hover:opacity-90"
      : "border border-line bg-surface hover:border-brand hover:text-brand";

  return (
    <div className="inline-flex items-stretch gap-2">
      {/* VER: abre el PDF para revisarlo antes de compartir */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${view}`}
      >
        <Eye className="size-4" /> Ver {name}
      </a>
      {/* COMPARTIR (icono): envía o guarda el PDF */}
      <button
        type="button"
        onClick={onShare}
        onPointerDown={() => {
          ensureBlob().catch(() => {});
        }}
        disabled={busy}
        aria-label={`Compartir ${name}`}
        title={`Compartir ${name}`}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-3.5 transition hover:border-brand hover:text-brand disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      </button>
    </div>
  );
}
