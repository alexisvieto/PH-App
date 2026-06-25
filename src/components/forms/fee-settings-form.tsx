"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveFeeSettings } from "@/app/app/edificios/[buildingId]/cobros/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { FEE_METHOD_OPTIONS } from "@/lib/finance";
import type { Database } from "@/lib/supabase/database.types";

type FeeMethod = Database["public"]["Enums"]["fee_method"];

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

export function FeeSettingsForm({
  buildingId,
  method,
  baseAmount,
  lateFeePct,
  lateFeeDay,
  reservePct,
}: {
  buildingId: string;
  method: FeeMethod | null;
  baseAmount: number | null;
  lateFeePct: number | null;
  lateFeeDay: number | null;
  reservePct: number | null;
}) {
  const [state, action] = useActionState(saveFeeSettings, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (state.ok) toast.success("Configuración de cuota guardada.");
  }, [state]);

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <h2 className="font-semibold">Configuración de la cuota</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Método</span>
          <select
            name="method"
            defaultValue={method ?? "por_coeficiente"}
            className={input}
          >
            {FEE_METHOD_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Monto base (USD)</span>
          <input
            name="base_amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={baseAmount ?? ""}
            className={input}
            placeholder="0.00"
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        <strong>Por coeficiente:</strong> monto total mensual a prorratear entre
        las unidades según su % de participación.{" "}
        <strong>Monto fijo:</strong> monto que paga cada unidad.
      </p>

      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-semibold">Morosidad y Fondo de Imprevistos (Ley 284)</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Recargo por morosidad (%)</span>
            <input
              name="late_fee_pct"
              type="number"
              step="0.01"
              min="0"
              max="20"
              required
              defaultValue={lateFeePct ?? 10}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Día de corte</span>
            <input
              name="late_fee_day"
              type="number"
              step="1"
              min="1"
              max="28"
              defaultValue={lateFeeDay ?? ""}
              placeholder="1 (inicio de mes)"
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Fondo de Imprevistos (%)</span>
            <input
              name="reserve_pct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              defaultValue={reservePct ?? 1}
              className={input}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          El recargo (libre entre 10% y 20% según tu Reglamento) se aplica automáticamente a las cuotas vencidas no
          pagadas. El Fondo de Imprevistos (mínimo 1% por ley) se aparta automáticamente en cada pago.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Guardando…">Guardar configuración</SubmitButton>
    </form>
  );
}
