"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { logMaintenance } from "@/app/app/mantenimiento/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type Option = { id: string; name: string };

export function LogMaintenanceForm({
  equipmentId,
  suppliers,
}: {
  equipmentId: string;
  suppliers: Option[];
}) {
  const [state, action] = useActionState(logMaintenance, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Mantenimiento registrado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Registrar mantenimiento
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <input type="hidden" name="equipment_id" value={equipmentId} />
      <h2 className="font-semibold">Registrar mantenimiento</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Descripción</span>
          <input name="description" required autoFocus className={input} placeholder="Ej. Cambio de aceite y revisión" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha</span>
          <input name="performed_on" type="date" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Costo</span>
          <input name="cost" type="number" min={0} step="0.01" className={input} placeholder="Opcional" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Proveedor</span>
          <select name="supplier_id" className={input} defaultValue="">
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
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
