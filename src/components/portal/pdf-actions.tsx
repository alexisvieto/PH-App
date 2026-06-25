"use client";

import { useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

/**
 * Acción de un PDF del portal/admin. Es un enlace al PDF (`url`, ruta inline
 * same-origin bajo RLS).
 *
 * - **Escritorio:** se comporta como un enlace normal → abre el PDF en una
 *   pestaña nueva al instante (ahí el navegador ofrece imprimir/descargar). No
 *   hay fetch ni `window.open` tras un `await` (eso lo bloquea el popup blocker
 *   y dejaba el botón "pegado/inactivo").
 * - **Móvil/tablet (pointer: coarse):** intercepta el toque y abre la hoja
 *   nativa con el archivo adjunto (WhatsApp, correo, imprimir, guardar). iOS
 *   exige `navigator.share` dentro del gesto, por eso pre-cargamos el blob en
 *   `onPointerDown`.
 */
function isTouch() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
}

export function PdfActions({
  url,
  filename,
  title,
  name,
  variant = "outline",
}: {
  url: string;
  filename: string;
  title: string;
  name: string;
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

  async function onClick(e: React.MouseEvent) {
    // Escritorio: deja que el <a target="_blank"> abra el PDF (sin JS, instantáneo).
    if (!isTouch()) return;
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (typeof nav.share !== "function") return; // sin Web Share → también deja abrir el enlace
    // Móvil: intercepta y abre la hoja nativa con el archivo.
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const blob = await ensureBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ title, files: [file] });
      } else {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // canceló la hoja
    } finally {
      setBusy(false);
    }
  }

  const cls =
    variant === "solid"
      ? "bg-brand text-white hover:opacity-90"
      : "border border-line bg-surface hover:border-brand hover:text-brand";
  const label = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={() => {
        if (isTouch()) ensureBlob().catch(() => {});
      }}
      onClick={onClick}
      aria-label={`Abrir ${name}`}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${cls} ${
        busy ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} {label}
    </a>
  );
}
