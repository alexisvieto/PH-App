"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createUnit } from "@/app/app/propietarios/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { UNIT_TYPE_OPTIONS } from "@/lib/padron";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function NewUnitPropietariosForm({ buildingId }: { buildingId: string }) {
  const [state, action] = useActionState(createUnit, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Unidad creada.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva unidad
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <input type="hidden" name="building_id" value={buildingId} />
      <h2 className="font-semibold">Nueva unidad</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Piso</span>
          <input name="floor" required autoFocus className={input} placeholder="Ej. 1" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Letra / identificador</span>
          <input name="letter" required className={input} placeholder="Ej. A" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select name="type" defaultValue="apartamento" className={input}>
            {UNIT_TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Metraje (m²)</span>
          <input name="area_m2" type="number" min="0" step="0.01" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Coeficiente</span>
          <input name="coefficient" type="number" min="0" step="0.0001" className={input} placeholder="Para cuotas (opcional)" />
        </label>
      </div>
      <p className="text-xs text-muted">El código de la unidad se arma con piso + letra (ej. 1A).</p>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}
