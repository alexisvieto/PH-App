"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createCharge } from "@/app/app/edificios/[buildingId]/unidades/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { CHARGE_CONCEPT_OPTIONS } from "@/lib/finance";

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

// Cargos manuales: todo menos la cuota de mantenimiento (esa se genera).
const MANUAL_OPTIONS = CHARGE_CONCEPT_OPTIONS.filter(
  ([v]) => v !== "mantenimiento",
);

export function NewChargeForm({ unitId }: { unitId: string }) {
  const [state, action] = useActionState(createCharge, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Cargo agregado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
      >
        <Plus className="size-4" /> Agregar cargo (multa / extraordinaria)
      </button>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="unit_id" value={unitId} />
      <h2 className="font-semibold">Nuevo cargo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Concepto</span>
          <select name="concept" defaultValue="multa" className={input}>
            {MANUAL_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Monto (USD)</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            autoFocus
            className={input}
            placeholder="0.00"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            Descripción (opcional)
          </span>
          <input
            name="description"
            className={input}
            placeholder="Ej. Multa por mal estacionado"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Vencimiento (opcional)
          </span>
          <input name="due_date" type="date" className={input} />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…">Guardar cargo</SubmitButton>
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
