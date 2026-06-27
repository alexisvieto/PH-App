"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { transferSale } from "@/app/app/propietarios/actions";
import { DOC_TYPE_OPTIONS } from "@/lib/padron";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

/** Transferencia por venta: un check despliega los campos del nuevo dueño. */
export function TransferSale({ unitId }: { unitId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const res = await transferSale(unitId, {
      fullName: String(f.get("full_name") ?? ""),
      docType: String(f.get("doc_type") ?? "cedula"),
      docNumber: String(f.get("doc_number") ?? ""),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
      acquiredOn: String(f.get("acquired_on") ?? ""),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Venta registrada: nuevo propietario.");
      setOpen(false);
      router.refresh();
    } else setError(res.error);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={open}
          onChange={(e) => {
            setOpen(e.target.checked);
            setError(null);
          }}
          className="size-4"
        />
        <span className="font-semibold">Transferencia por venta</span>
      </label>
      <p className="mt-1 text-xs text-muted">
        Registra la venta de la unidad: sale el propietario actual y entra el nuevo (queda en el historial).
      </p>

      {open && (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">Nuevo dueño</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">Nombre completo</span>
              <input name="full_name" required autoFocus className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Documento</span>
              <select name="doc_type" defaultValue="cedula" className={input}>
                {DOC_TYPE_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Número de documento</span>
              <input name="doc_number" className={input} placeholder="Cédula / pasaporte" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Teléfono</span>
              <input name="phone" className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Correo</span>
              <input name="email" type="email" className={input} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">Fecha de la venta</span>
              <input name="acquired_on" type="date" className={input} />
            </label>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Registrar venta
          </button>
        </form>
      )}
    </div>
  );
}
