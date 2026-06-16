"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createPayment } from "@/app/app/edificios/[buildingId]/unidades/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/finance";

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

export function NewPaymentForm({
  unitId,
  defaultDate,
}: {
  unitId: string;
  defaultDate: string;
}) {
  const [state, action] = useActionState(createPayment, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Pago registrado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Registrar pago
      </button>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="unit_id" value={unitId} />
      <h2 className="font-semibold">Registrar pago</h2>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha</span>
          <input
            name="paid_on"
            type="date"
            defaultValue={defaultDate}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Método</span>
          <select name="method" defaultValue="transferencia" className={input}>
            {PAYMENT_METHOD_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Referencia (opcional)
          </span>
          <input name="reference" className={input} placeholder="N° recibo / transferencia" />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…">Guardar pago</SubmitButton>
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
