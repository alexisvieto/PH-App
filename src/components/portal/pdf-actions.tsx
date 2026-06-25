"use client";

import { useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

/**
 * Botón de un PDF del portal. Al tocarlo abre directamente la **hoja nativa**
 * del sistema (iOS/Android) con el documento adjunto: vista previa + imprimir,
 * enviar por correo, compartir (WhatsApp…), guardar en Archivos. Sin pasos
 * intermedios ("ver" y luego "compartir" eran dos botones).
 *
 * iOS es estricto: `navigator.share` solo corre dentro del gesto del toque. Por
 * eso pre-cargamos el PDF al apuntar el botón (onPointerDown) para conservarlo.
 * En escritorio (sin Web Share de archivos) abre el PDF en una pestaña nueva
 * (ahí el navegador ofrece imprimir/descargar); si el popup se bloquea, descarga.
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

  async function onOpen() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await ensureBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      // Hoja nativa SOLO en dispositivos tactiles (movil/tablet). En escritorio
      // el dialogo de compartir con archivo es poco fiable (se queda pegado y no
      // genera nada), asi que ahi abrimos el PDF en pestana nueva.
      const touchDevice =
        typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
      if (touchDevice && typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({ title, files: [file] });
        return;
      }
      // Escritorio: abre el PDF en pestaña nueva (ver + imprimir/descargar del navegador).
      const objectUrl = URL.createObjectURL(blob);
      const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
      if (!win) download(blob); // popup bloqueado → descarga
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // canceló la hoja
      if (blobRef.current) download(blobRef.current);
    } finally {
      setBusy(false);
    }
  }

  const label = name.charAt(0).toUpperCase() + name.slice(1);
  const cls =
    variant === "solid"
      ? "bg-brand text-white hover:opacity-90"
      : "border border-line bg-surface hover:border-brand hover:text-brand";

  return (
    <button
      type="button"
      onPointerDown={() => {
        ensureBlob().catch(() => {});
      }}
      onClick={onOpen}
      disabled={busy}
      aria-label={`Abrir ${name} (compartir, imprimir o guardar)`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${cls}`}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} {label}
    </button>
  );
}
