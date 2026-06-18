"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { addOwner, removeOwner, setPrimaryOwner } from "@/app/app/propietarios/actions";
import { DOC_TYPE_LABEL, DOC_TYPE_OPTIONS } from "@/lib/padron";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export type OwnerRow = {
  ownershipId: string;
  name: string;
  docType: string | null;
  docNumber: string | null;
  email: string | null;
  phone: string | null;
  primary: boolean;
};

export function OwnerManager({
  unitId,
  owners,
}: {
  unitId: string;
  owners: OwnerRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  async function run(fn: () => Promise<{ ok: boolean; error: string | null }>, okMsg: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    const res = await fn();
    busyRef.current = false;
    if (res.ok) {
      toast.success(okMsg);
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const res = await addOwner(unitId, {
      fullName: String(f.get("full_name") ?? ""),
      docType: String(f.get("doc_type") ?? "cedula"),
      docNumber: String(f.get("doc_number") ?? ""),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
      isPrimary: f.get("is_primary") === "on",
      acquiredOn: String(f.get("acquired_on") ?? ""),
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Propietario agregado.");
      setOpen(false);
      router.refresh();
    } else setError(res.error);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Propietarios</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="size-4" /> Agregar
          </button>
        )}
      </div>

      {owners.length === 0 && !open && <p className="text-sm text-muted">Sin propietarios registrados.</p>}

      <ul className="space-y-2">
        {owners.map((o) => (
          <li key={o.ownershipId} className="flex items-start justify-between gap-3 rounded-xl border border-line p-3">
            <div className="min-w-0">
              <p className="font-medium">
                {o.name}
                {o.primary && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Star className="size-3" /> Contacto principal
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">
                {o.docNumber ? `${o.docType ? DOC_TYPE_LABEL[o.docType as keyof typeof DOC_TYPE_LABEL] : ""} ${o.docNumber}` : ""}
                {o.docNumber && (o.email || o.phone) ? " · " : ""}
                {[o.email, o.phone].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!o.primary && (
                <button
                  onClick={() => run(() => setPrimaryOwner(o.ownershipId), "Contacto principal actualizado.")}
                  className="text-xs font-medium text-brand hover:underline"
                  title="Marcar como contacto principal"
                >
                  Hacer principal
                </button>
              )}
              <button
                onClick={() => run(() => removeOwner(o.ownershipId), "Propietario eliminado.")}
                className="text-muted hover:text-red-600"
                title="Quitar"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <form onSubmit={onAdd} className="mt-4 space-y-3 rounded-xl border border-line p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-brand" />
            <h3 className="text-sm font-semibold">Nuevo propietario</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">Nombre completo</span>
              <input name="full_name" required autoFocus className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Documento</span>
              <select name="doc_type" defaultValue="cedula" className={input}>
                {DOC_TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Fecha de adquisición</span>
              <input name="acquired_on" type="date" className={input} />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input name="is_primary" type="checkbox" className="size-4" defaultChecked={owners.length === 0} />
              <span className="text-sm">Contacto principal (recibe estado de cuenta y acceso al portal)</span>
            </label>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />} Guardar
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
