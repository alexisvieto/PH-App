"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createProvider, toggleProvider } from "@/app/admin/proveedores/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input = "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function NewProviderForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createProvider, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Proveedor creado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo proveedor
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nuevo proveedor</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Nombre de la empresa / persona</span>
        <input name="name" required className={input} placeholder="ElectroFix Panamá" />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium">Categorías (una o varias)</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand">
              <input type="checkbox" name="category" value={c.id} className="size-4" /> {c.name}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="contact_name" className={input} placeholder="Persona de contacto" />
        <input name="phone" className={input} placeholder="Teléfono" />
        <input name="whatsapp" className={input} placeholder="WhatsApp" />
        <input name="email" type="email" className={input} placeholder="Correo" />
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Prioridad (mayor = sale primero)</span>
          <input name="priority" type="number" defaultValue="0" step="1" className={input} />
        </label>
      </div>

      <textarea
        name="description"
        rows={3}
        placeholder="Descripción del servicio"
        className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
      />

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear proveedor</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ProviderToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await toggleProvider(id, !active);
        setBusy(false);
        router.refresh();
      }}
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
        active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </button>
  );
}
