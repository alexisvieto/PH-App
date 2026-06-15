"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  generateCharges,
  GEN_EMPTY,
} from "@/app/app/edificios/[buildingId]/cobros/actions";
import { SubmitButton } from "@/components/submit-button";

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

export function GenerateChargesForm({
  buildingId,
  hasSettings,
  defaultMonth,
}: {
  buildingId: string;
  hasSettings: boolean;
  defaultMonth: string;
}) {
  const [state, action] = useActionState(generateCharges, GEN_EMPTY);

  useEffect(() => {
    if (state.ok) {
      toast.success(
        state.count > 0
          ? `${state.count} cuota(s) de mantenimiento generada(s).`
          : "No había unidades nuevas para este mes (ya estaban generadas).",
      );
    }
  }, [state]);

  if (!hasSettings) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-5 text-sm text-muted">
        Configura la cuota del edificio para poder generar los cargos del mes.
      </div>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <h2 className="font-semibold">Generar cuotas del mes</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Mes</span>
          <input
            name="month"
            type="month"
            required
            defaultValue={defaultMonth}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Vencimiento (opcional)
          </span>
          <input name="due_date" type="date" className={input} />
        </label>
      </div>
      <p className="text-xs text-muted">
        Crea la cuota de mantenimiento para todas las unidades del edificio. Es
        seguro repetir: no duplica un mes ya generado.
      </p>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Generando…">Generar cuotas</SubmitButton>
    </form>
  );
}
