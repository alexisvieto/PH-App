"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createEmployee } from "@/app/app/rrhh/actions";
import { EmployeeFormFields } from "@/components/forms/employee-form-fields";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

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
      <EmployeeFormFields buildings={buildings} />
      <label className="block max-w-xs">
        <span className="mb-1 block text-sm font-medium">Salario base mensual (USD)</span>
        <input name="base_salary" type="number" min="0.01" step="0.01" required className={input} placeholder="0.00" />
      </label>

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
