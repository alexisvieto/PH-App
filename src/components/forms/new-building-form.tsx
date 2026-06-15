"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createBuilding } from "@/app/app/edificios/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { BUILDING_TYPE_OPTIONS } from "@/lib/padron";

export function NewBuildingForm() {
  const [state, action] = useActionState(createBuilding, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Edificio creado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo edificio
      </button>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <h2 className="font-semibold">Nuevo edificio</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input
            name="name"
            required
            autoFocus
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Ej. Torre del Mar"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select
            name="type"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {BUILDING_TYPE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Dirección</span>
          <input
            name="address"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Opcional"
          />
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
