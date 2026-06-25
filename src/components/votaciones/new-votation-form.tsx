"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { createVotation } from "@/app/app/votaciones/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function NewVotationForm({ buildings }: { buildings: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createVotation, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Votación creada.");
  const [kind, setKind] = useState("si_no");
  const [options, setOptions] = useState(["", ""]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva votación
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva votación</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Título</span>
          <input name="title" required className={input} placeholder="Ej.: Aprobar presupuesto 2026" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Descripción</span>
          <textarea name="description" rows={3} className={`${input} min-h-20`} placeholder="Detalle de lo que se vota (opcional)" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Edificio</span>
          <select name="building_id" required defaultValue={buildings.length === 1 ? buildings[0].id : ""} className={input}>
            {buildings.length !== 1 && <option value="" disabled>Selecciona…</option>}
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
            <option value="si_no">Sí / No</option>
            <option value="multiple">Opción múltiple</option>
          </select>
        </label>

        {kind === "multiple" && (
          <div className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Opciones</span>
            <div className="space-y-2">
              {options.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    name="option"
                    value={v}
                    onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? e.target.value : x)))}
                    className={input}
                    placeholder={`Opción ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions((o) => o.filter((_, j) => j !== i))} className="p-2 text-muted hover:text-ink" aria-label="Quitar">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setOptions((o) => [...o, ""])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand">
              <Plus className="size-4" /> Agregar opción
            </button>
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Abre</span>
          <input name="opens_at" type="datetime-local" required className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cierra</span>
          <input name="closes_at" type="datetime-local" required className={input} />
        </label>
        <p className="block text-xs text-muted sm:col-span-2">
          La votación abre y cierra automáticamente según estas fechas. No se puede cancelar manualmente.
        </p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Quórum requerido (%)</span>
          <input name="quorum_pct" type="number" min="1" max="100" step="0.01" defaultValue="51" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Umbral de aprobación (%)</span>
          <input name="approval_pct" type="number" min="1" max="100" step="0.01" defaultValue="50.01" className={input} />
          <span className="mt-1 block text-xs text-muted">Mayoría simple ≈ 50.01 · Dos tercios ≈ 66.67</span>
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear votación</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}
