"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProject, deleteQuote } from "@/app/app/proyectos/actions";

export function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function onDelete() {
    if (busy) return;
    if (!confirm("¿Eliminar esta cotización?")) return;
    setBusy(true);
    const res = await deleteQuote(quoteId);
    setBusy(false);
    if (res.ok) {
      toast.success("Cotización eliminada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-label="Eliminar cotización"
      className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function onDelete() {
    if (busy) return;
    if (
      !confirm(
        "¿Eliminar el proyecto completo y sus cotizaciones? El gasto ya registrado en Finanzas se mantendrá. Esta acción no se puede deshacer.",
      )
    )
      return;
    setBusy(true);
    const res = await deleteProject(projectId);
    setBusy(false);
    if (res.ok) {
      toast.success("Proyecto eliminado.");
      router.push("/app/proyectos");
    } else {
      toast.error(res.error ?? "Error");
    }
  }
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-red-600 disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Eliminar proyecto
    </button>
  );
}
