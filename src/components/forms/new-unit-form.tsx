"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createUnit } from "@/app/app/edificios/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { UNIT_STATUS_OPTIONS, UNIT_TYPE_OPTIONS } from "@/lib/padron";

export function NewUnitForm({ buildingId }: { buildingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createUnit, EMPTY_ACTION_STATE);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Unidad agregada.");
      ref.current?.reset();
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Agregar unidad
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <h2 className="font-semibold">Nueva unidad</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Código</span>
          <input
            name="code"
            required
            autoFocus
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Ej. 5B"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select
            name="type"
            defaultValue="apartamento"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {UNIT_TYPE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Piso</span>
          <input
            name="floor"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Opcional"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Coeficiente (%)
          </span>
          <input
            name="coefficient"
            type="number"
            step="0.0001"
            min="0"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="0"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Área (m²)</span>
          <input
            name="area_m2"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Opcional"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Parqueos</span>
          <input
            name="parking_spots"
            type="number"
            step="1"
            min="0"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="0"
          />
        </label>
        <label className="block sm:col-span-3">
          <span className="mb-1 block text-sm font-medium">Estado</span>
          <select
            name="status"
            defaultValue="desocupada"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand sm:w-1/3"
          >
            {UNIT_STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…">Guardar unidad</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          Cerrar
        </button>
      </div>
    </form>
  );
}
