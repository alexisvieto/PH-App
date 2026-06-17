"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createEquipment } from "@/app/app/mantenimiento/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
} from "@/lib/maintenance";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type Option = { id: string; name: string };

export function NewEquipmentForm({
  buildings,
  suppliers,
}: {
  buildings: Option[];
  suppliers: Option[];
}) {
  const [state, action] = useActionState(createEquipment, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Equipo registrado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo equipo
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nuevo equipo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input name="name" required autoFocus className={input} placeholder="Ej. Elevador torre A" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Edificio</span>
          <select name="building_id" required className={input} defaultValue="">
            <option value="" disabled>
              Selecciona…
            </option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Categoría</span>
          <select name="category" required className={input} defaultValue="">
            <option value="" disabled>
              Selecciona…
            </option>
            {EQUIPMENT_CATEGORY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Ubicación</span>
          <input name="location" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Estado</span>
          <select name="status" className={input} defaultValue="operativo">
            {EQUIPMENT_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cantidad</span>
          <input name="quantity" type="number" min={1} step={1} defaultValue={1} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Número de serie</span>
          <input name="serial_number" className={input} placeholder="Opcional (cantidad 1)" />
        </label>
        <label className="block">
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
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Frecuencia (días)</span>
          <input
            name="maintenance_frequency_days"
            type="number"
            min={1}
            step={1}
            className={input}
            placeholder="Ej. 30"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Próximo mantenimiento</span>
          <input name="next_maintenance" type="date" className={input} />
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
