"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";

import { addQuote } from "@/app/app/proyectos/actions";
import { createClient } from "@/lib/supabase/client";

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const input =
  "w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function AddQuoteForm({ orgId, projectId }: { orgId: string; projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [company, setCompany] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function uploadFile(): Promise<string | null | false> {
    if (!file) return null;
    const ext = EXT[file.type];
    if (!ext) {
      toast.error("Archivo no permitido (PDF o imagen).");
      return false;
    }
    const path = `${orgId}/proyectos/${projectId}/${crypto.randomUUID()}.${ext}`;
    const up = await createClient().storage.from("ph-proyectos").upload(path, file, { contentType: file.type });
    if (up.error) {
      toast.error("No se pudo subir el archivo.");
      return false;
    }
    return path;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!company.trim()) return toast.error("Escribe el nombre de la empresa.");
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt < 0) return toast.error("Monto inválido.");
    setBusy(true);
    const filePath = await uploadFile();
    if (filePath === false) {
      setBusy(false);
      return;
    }
    const res = await addQuote({ projectId, companyName: company, amount: amt, notes, filePath });
    setBusy(false);
    if (res.ok) {
      toast.success("Cotización agregada.");
      setCompany("");
      setAmount("");
      setNotes("");
      setFile(null);
      router.refresh();
    } else {
      if (filePath) await createClient().storage.from("ph-proyectos").remove([filePath]);
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold">Agregar cotización</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Empresa</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={input} placeholder="Ej. Pinturas del Istmo" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Monto (USD)</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className={input}
            placeholder="0.00"
            required
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Nota (opcional)</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={input} placeholder="Incluye materiales, garantía…" />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-brand transition hover:bg-gray-50 sm:w-auto">
          <Paperclip className="size-4" /> {file ? "Archivo listo ✓" : "Adjuntar cotización (PDF)"}
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:flex-1"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />} Agregar
        </button>
      </div>
    </form>
  );
}
