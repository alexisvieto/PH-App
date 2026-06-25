"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createLedgerAccount } from "@/app/app/contabilidad/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const TYPES: [string, string][] = [
  ["activo", "Activo"],
  ["pasivo", "Pasivo"],
  ["patrimonio", "Patrimonio"],
  ["ingreso", "Ingreso"],
  ["gasto", "Gasto"],
];

export function NewAccountForm() {
  const [state, action] = useActionState(createLedgerAccount, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Cuenta creada.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva cuenta
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva cuenta</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Código</span>
          <input name="code" required placeholder="Ej. 50500" inputMode="numeric" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select name="type" defaultValue="gasto" className={input}>
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input name="name" required placeholder="Ej. Jardinería" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fondo</span>
          <select name="fund" defaultValue="operativo" className={input}>
            <option value="operativo">Operativo</option>
            <option value="imprevistos">Imprevistos</option>
          </select>
        </label>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear cuenta</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
