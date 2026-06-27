"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { calcFeesByCoefficient } from "@/app/app/edificios/[buildingId]/cobros/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function CalcFeesForm({
  buildingId,
  coefSum,
  totalFee,
}: {
  buildingId: string;
  coefSum: number;
  totalFee: number;
}) {
  const [state, action] = useActionState(calcFeesByCoefficient, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (state.ok) toast.success("Cuotas calculadas y guardadas en cada unidad.");
  }, [state]);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <input type="hidden" name="building_id" value={buildingId} />
      <h2 className="font-semibold">Calcular cuotas por coeficiente <span className="text-xs font-normal text-muted">(atajo)</span></h2>
      <p className="text-xs text-muted">
        Escribe el <strong>presupuesto mensual</strong> del edificio y se reparte entre las unidades según su coeficiente
        (a mayor tamaño, mayor cuota — Ley 284). El resultado se guarda en la <strong>cuota de cada unidad</strong> y
        luego puedes ajustar las que quieras a mano.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Presupuesto mensual ($)</span>
          <input
            name="budget"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="min-h-10 w-44 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <SubmitButton pendingText="Calculando…">Calcular y guardar</SubmitButton>
      </div>
      {coefSum > 0 && Math.abs(coefSum - 100) >= 0.5 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚠ Los coeficientes suman {coefSum.toFixed(1)}% (deberían sumar 100% para que el reparto sea exacto).
        </p>
      )}
      <p className="text-xs text-muted">
        Suma actual de las cuotas: <strong>${totalFee.toFixed(2)}/mes</strong>.
      </p>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
