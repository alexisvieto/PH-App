"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveFeeSettings } from "@/app/app/edificios/[buildingId]/cobros/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

export function FeeSettingsForm({
  buildingId,
  lateFeePct,
  lateFeeDay,
  reservePct,
}: {
  buildingId: string;
  lateFeePct: number | null;
  lateFeeDay: number | null;
  reservePct: number | null;
}) {
  const [state, action] = useActionState(saveFeeSettings, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (state.ok) toast.success("Configuración guardada.");
  }, [state]);

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="building_id" value={buildingId} />
      <h2 className="font-semibold">Morosidad y Fondo de Imprevistos (Ley 284)</h2>
      <p className="text-xs text-muted">
        La <strong>cuota de cada unidad</strong> se define en la unidad (no aquí). Estos son los ajustes que aplican al
        edificio completo.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Recargo por morosidad (%)</span>
          <input name="late_fee_pct" type="number" step="0.01" min="0" max="20" required defaultValue={lateFeePct ?? 10} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Día de corte</span>
          <input name="late_fee_day" type="number" step="1" min="1" max="28" defaultValue={lateFeeDay ?? ""} placeholder="1 (inicio de mes)" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fondo de Imprevistos (%)</span>
          <input name="reserve_pct" type="number" step="0.01" min="0" max="100" required defaultValue={reservePct ?? 1} className={input} />
        </label>
      </div>
      <p className="text-xs text-muted">
        El recargo (libre entre 10% y 20% según tu Reglamento) se aplica automáticamente a las cuotas vencidas no
        pagadas. El Fondo de Imprevistos (mínimo 1% por ley) se aparta automáticamente en cada pago.
      </p>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <SubmitButton pendingText="Guardando…">Guardar configuración</SubmitButton>
    </form>
  );
}
