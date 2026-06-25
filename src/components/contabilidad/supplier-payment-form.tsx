"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createExpense } from "@/app/app/edificios/[buildingId]/finanzas/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/finance";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type Option = { id: string; name: string };

export function SupplierPaymentForm({
  buildings,
  suppliers,
  defaultDate,
}: {
  buildings: Option[];
  suppliers: Option[];
  defaultDate: string;
}) {
  const [state, action] = useActionState(createExpense, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Pago a proveedor registrado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Registrar pago a proveedor
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Pago a proveedor</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {buildings.length === 1 ? (
          <input type="hidden" name="building_id" value={buildings[0].id} />
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Edificio</span>
            <select name="building_id" required defaultValue="" className={input}>
              <option value="" disabled>
                Selecciona…
              </option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Proveedor</span>
          <input
            name="supplier"
            list="suppliers-list"
            required
            className={input}
            placeholder="Escoge o escribe el proveedor"
          />
          <datalist id="suppliers-list">
            {suppliers.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Categoría</span>
          <select name="category" defaultValue="servicios" className={input}>
            {EXPENSE_CATEGORY_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Monto (USD)</span>
          <input name="amount" type="number" step="0.01" min="0.01" required className={input} placeholder="0.00" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha</span>
          <input name="spent_on" type="date" defaultValue={defaultDate} className={input} />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Concepto / detalle</span>
          <input name="description" required className={input} placeholder="Ej. Mantenimiento de elevadores — factura 0123" />
        </label>
      </div>

      <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Al guardar se genera el <strong>asiento contable</strong> automáticamente (gasto y salida de banco).
      </p>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Guardando…">Registrar pago</SubmitButton>
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
