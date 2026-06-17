"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { createInfraction } from "@/app/app/sanciones/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { INFRACTION_TYPE_OPTIONS } from "@/lib/sanctions";
import type { Database } from "@/lib/supabase/database.types";

type InfractionType = Database["public"]["Enums"]["infraction_type"];

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type UnitOption = { id: string; label: string };

export function NewInfractionForm({
  units,
  canFine,
}: {
  units: UnitOption[];
  canFine: boolean;
}) {
  const [state, action] = useActionState(createInfraction, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Sanción registrada.");
  const [type, setType] = useState<InfractionType>("llamado_atencion");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva sanción
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva sanción</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Unidad</span>
          <select name="unit_id" required className={input} defaultValue="">
            <option value="" disabled>
              Selecciona…
            </option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select
            name="type"
            className={input}
            value={type}
            onChange={(e) => setType(e.target.value as InfractionType)}
          >
            {INFRACTION_TYPE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v} disabled={v === "multa" && !canFine}>
                {l}
                {v === "multa" && !canFine ? " (solo admin)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Motivo</span>
          <input name="reason" required className={input} placeholder="Ej. Ruido excesivo en horario nocturno" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Detalle</span>
          <textarea name="description" rows={3} maxLength={2000} className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha</span>
          <input name="infraction_date" type="date" className={input} />
        </label>
        {type === "multa" && (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Monto (USD)</span>
              <input name="amount" type="number" min="0.01" step="0.01" required className={input} placeholder="0.00" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Vence</span>
              <input name="due_date" type="date" className={input} />
            </label>
            <p className="text-xs text-muted sm:col-span-2">
              La multa genera un cargo en el estado de cuenta de la unidad.
            </p>
          </>
        )}
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
