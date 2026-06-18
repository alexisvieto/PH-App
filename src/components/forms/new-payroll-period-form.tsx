"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";

import { createPayrollPeriod } from "@/app/app/planilla/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { PAY_FREQUENCY_OPTIONS } from "@/lib/payroll/labels";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function NewPayrollPeriodForm() {
  const [state, action] = useActionState(createPayrollPeriod, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Período creado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <CalendarPlus className="size-4" /> Nueva planilla
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva planilla ordinaria</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Etiqueta</span>
          <input name="label" className={input} placeholder="Ej. 1ra quincena junio (opcional)" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Frecuencia</span>
          <select name="frequency" defaultValue="quincenal" className={input}>
            {PAY_FREQUENCY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha de pago</span>
          <input name="pay_date" type="date" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Desde</span>
          <input name="period_start" type="date" required className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Hasta</span>
          <input name="period_end" type="date" required className={input} />
        </label>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}
