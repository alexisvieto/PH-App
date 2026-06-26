"use client";

import { useRef, useState } from "react";
import { Eye, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Dos acciones explícitas para un PDF (ruta inline same-origin bajo RLS):
 * - **Ver:** enlace que abre el PDF en una pestaña nueva (funciona en escritorio,
 *   móvil y PWA). Pre-carga el blob al tocar para que "Compartir" sea instantáneo.
 * - **Compartir:** hoja nativa de iOS/Android con el archivo adjunto (correo,
 *   WhatsApp, "Guardar en Archivos", imprimir). En escritorio (sin Web Share de
 *   archivos) descarga el PDF. Separar las dos acciones evita el problema de la
 *   PWA, donde el visor del PDF no muestra el botón de compartir del sistema.
 */
function isTouch() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
}

export function PdfViewShare({
  url,
  filename,
  title,
  label,
  variant = "outline",
  className = "",
}: {
  url: string;
  filename: string;
  title: string;
  label?: string;
  variant?: "outline" | "primary";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const pendingRef = useRef<Promise<Blob> | null>(null);

  function ensureBlob(): Promise<Blob> {
    if (blobRef.current) return Promise.resolve(blobRef.current);
    if (!pendingRef.current) {
      pendingRef.current = fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error("fail");
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

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await ensureBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({ title, files: [file] });
      } else {
        // Escritorio / sin Web Share de archivos: descarga el PDF.
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // el usuario canceló la hoja
      toast.error("No se pudo preparar el documento para compartir.");
    } finally {
      setBusy(false);
    }
  }

  const base = "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition";
  const verCls =
    variant === "primary"
      ? `${base} bg-brand text-white hover:opacity-90`
      : `${base} border border-line bg-surface hover:border-brand hover:text-brand`;
  const shareCls =
    variant === "primary"
      ? `${base} border border-brand bg-surface text-brand hover:bg-brand-soft`
      : `${base} border border-line bg-surface hover:border-brand hover:text-brand`;

  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-sm font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={() => {
            if (isTouch()) ensureBlob().catch(() => {});
          }}
          className={verCls}
        >
          <Eye className="size-4" /> Ver
        </a>
        <button
          type="button"
          onClick={share}
          disabled={busy}
          className={`${shareCls} ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />} Compartir
        </button>
      </div>
    </div>
  );
}
