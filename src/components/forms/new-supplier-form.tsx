"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createSupplier } from "@/app/app/proveedores/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function NewSupplierForm() {
  const [state, action] = useActionState(createSupplier, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Proveedor guardado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo proveedor
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nuevo proveedor</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input name="name" required autoFocus className={input} placeholder="Ej. Ascensores Panamá, S.A." />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Contacto</span>
          <input name="contact_name" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Teléfono</span>
          <input name="phone" className={input} placeholder="Opcional" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Correo</span>
          <input name="email" type="email" className={input} placeholder="Opcional" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Notas</span>
          <input name="notes" className={input} placeholder="Opcional" />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
