"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { grantTenantAccess, revokeTenantAccess } from "@/app/app/propietarios/actions";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

/** Acceso del inquilino al portal: alta (nombre + correo) o retiro. */
export function TenantAccess({
  unitId,
  tenant,
}: {
  unitId: string;
  tenant: { name: string; email: string | null } | null;
}) {
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
    const res = await grantTenantAccess(unitId, {
      fullName: String(f.get("full_name") ?? ""),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Inquilino con acceso. Ya puede registrarse con su correo.");
      setOpen(false);
      router.refresh();
    } else setError(res.error);
  }

  async function revoke() {
    if (busy) return;
    setBusy(true);
    const res = await revokeTenantAccess(unitId);
    setBusy(false);
    if (res.ok) {
      toast.success("Acceso del inquilino retirado.");
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-brand" />
        <h2 className="font-semibold">Acceso del inquilino al portal</h2>
      </div>

      {tenant ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line p-3">
          <div className="min-w-0">
            <p className="font-medium">{tenant.name}</p>
            <p className="text-xs text-muted">
              {tenant.email ?? "—"} · vista de inquilino (sin finanzas ni votaciones)
            </p>
          </div>
          <button
            type="button"
            onClick={revoke}
            disabled={busy}
            className="shrink-0 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Quitar acceso
          </button>
        </div>
      ) : !open ? (
        <>
          <p className="mt-1 text-xs text-muted">
            Dale al inquilino acceso a comunicados, visitas, paquetería, quejas y reservas —{" "}
            <strong>sin ver finanzas ni votaciones</strong>.
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Dar acceso a un inquilino
          </button>
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">Inquilino</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted">Nombre completo</span>
              <input name="full_name" required autoFocus className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Correo (para su cuenta)</span>
              <input name="email" type="email" required className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Teléfono</span>
              <input name="phone" className={input} />
            </label>
          </div>
          <p className="text-xs text-muted">
            El inquilino se registra solo en el login con ese correo y entra con la vista de inquilino.
          </p>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Dar acceso
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
