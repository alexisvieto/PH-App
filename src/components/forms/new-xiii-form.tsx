"use client";

import { useActionState } from "react";
import { Gift } from "lucide-react";

import { createXiiiPeriod } from "@/app/app/planilla/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function NewXiiiForm() {
  const [state, action] = useActionState(createXiiiPeriod, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Partida creada.");
  const year = new Date().getFullYear();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-brand transition hover:bg-gray-50"
      >
        <Gift className="size-4" /> Nueva partida XIII
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Décimo tercer mes</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Partida</span>
          <select name="partida" defaultValue="1" className={input}>
            <option value="1">1ª (16 dic – 15 abr) · pago 15 abr</option>
            <option value="2">2ª (16 abr – 15 ago) · pago 15 ago</option>
            <option value="3">3ª (16 ago – 15 dic) · pago 15 dic</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Año</span>
          <input name="year" type="number" min="2000" max="2100" defaultValue={year} className={input} />
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
