"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createPerson } from "@/app/app/personas/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { DOC_TYPE_OPTIONS } from "@/lib/padron";

export function NewPersonForm() {
  const [state, action] = useActionState(createPerson, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Persona registrada.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva persona
      </button>
    );
  }

  const input =
    "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <h2 className="font-semibold">Nueva persona</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre completo</span>
          <input name="full_name" required autoFocus className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo de documento</span>
          <select name="doc_type" defaultValue="cedula" className={`${input} bg-white`}>
            {DOC_TYPE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">N° de documento</span>
          <input name="doc_number" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Correo</span>
          <input name="email" type="email" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Teléfono</span>
          <input name="phone" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nacionalidad</span>
          <input name="nationality" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Ocupación</span>
          <input name="occupation" className={input} placeholder="Opcional" />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
