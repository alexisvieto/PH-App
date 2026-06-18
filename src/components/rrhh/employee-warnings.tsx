"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { addEmployeeWarning } from "@/app/app/rrhh/actions";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";
const MAX_SIZE = 20 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type WarningItem = { id: string; date: string; reason: string; docUrl: string | null };

export function EmployeeWarnings({
  employeeId,
  orgId,
  warnings,
}: {
  employeeId: string;
  orgId: string;
  warnings: WarningItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const warningDate = String(f.get("warning_date") ?? "");
    const reason = String(f.get("reason") ?? "");

    let documentPath: string | null = null;
    if (file) {
      const ext = EXT[file.type];
      if (!ext) {
        setError("Formato no permitido (JPG, PNG, WEBP o PDF).");
        setBusy(false);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("El archivo supera 20 MB.");
        setBusy(false);
        return;
      }
      const supabase = createClient();
      const path = `${orgId}/empleados/${employeeId}/amonestacion-${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("ph-docs").upload(path, file, { contentType: file.type });
      if (up.error) {
        setError("No se pudo subir el documento.");
        setBusy(false);
        return;
      }
      documentPath = path;
    }

    const res = await addEmployeeWarning(employeeId, { warningDate, reason, documentPath });
    setBusy(false);
    if (res.ok) {
      toast.success("Amonestación registrada.");
      setOpen(false);
      setFile(null);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-brand" />
          <h2 className="font-semibold">Amonestaciones</h2>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="size-4" /> Nueva
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-5 space-y-3 rounded-xl border border-line p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Fecha</span>
              <input name="warning_date" type="date" required className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Documento (opcional)</span>
              <input
                type="file"
                data-testid="warning-doc"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">Causa</span>
              <textarea name="reason" required rows={2} maxLength={500} className={input} placeholder="Motivo de la amonestación" />
            </label>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Guardar
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {warnings.length === 0 ? (
        <p className="text-sm text-muted">Sin amonestaciones registradas.</p>
      ) : (
        <ul className="divide-y divide-line">
          {warnings.map((w) => (
            <li key={w.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{formatDate(w.date)}</p>
                <p className="text-sm text-ink/80">{w.reason}</p>
              </div>
              {w.docUrl && (
                <a
                  href={w.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  <FileText className="size-3.5" /> Ver documento
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
