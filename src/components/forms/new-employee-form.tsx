"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createEmployee } from "@/app/app/rrhh/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import {
  CONTRACT_TYPE_OPTIONS,
  PAY_FREQUENCY_OPTIONS,
  WORK_SHIFT_OPTIONS,
} from "@/lib/payroll/labels";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function NewEmployeeForm({
  buildings,
}: {
  buildings: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createEmployee, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Empleado registrado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo empleado
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nuevo empleado</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre completo</span>
          <input name="full_name" required autoFocus className={input} placeholder="Ej. José Martínez" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cédula</span>
          <input name="national_id" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cargo</span>
          <input name="position" className={input} placeholder="Ej. Conserje" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Edificio</span>
          <select name="building_id" defaultValue="" className={input}>
            <option value="">Sin asignar</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha de ingreso</span>
          <input name="hire_date" type="date" required className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Salario base mensual (USD)</span>
          <input name="base_salary" type="number" min="0.01" step="0.01" required className={input} placeholder="0.00" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Frecuencia de pago</span>
          <select name="pay_frequency" defaultValue="quincenal" className={input}>
            {PAY_FREQUENCY_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo de contrato</span>
          <select name="contract_type" defaultValue="indefinido" className={input}>
            {CONTRACT_TYPE_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Jornada</span>
          <select name="work_shift" defaultValue="diurna" className={input}>
            {WORK_SHIFT_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Riesgo profesional (% patronal)</span>
          <input name="risk_premium_pct" type="number" min="0" max="15" step="0.01" defaultValue="0" className={input} />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input name="declares_dependents" type="checkbox" className="size-4" />
          <span className="text-sm">Declara dependientes (deducción ISR de B/.800 anuales)</span>
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
