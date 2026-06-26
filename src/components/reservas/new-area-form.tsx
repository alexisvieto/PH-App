"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createArea } from "@/app/app/reservas/actions";
import { AREA_ICON_OPTIONS } from "@/components/reservas/area-icons";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function NewAreaForm({ buildings }: { buildings: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createArea, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Área creada.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva área
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva área común</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input name="name" required className={input} placeholder="Salón de fiestas, BBQ, gimnasio…" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Edificio</span>
          <select name="building_id" required defaultValue={buildings.length === 1 ? buildings[0].id : ""} className={input}>
            {buildings.length !== 1 && <option value="" disabled>Selecciona…</option>}
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Ícono</span>
          <select name="icon" defaultValue="default" className={input}>
            {AREA_ICON_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Aforo (personas)</span>
          <input name="capacity" type="number" min="1" step="1" className={input} placeholder="Opcional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Abre</span>
          <input name="open_time" type="time" defaultValue="06:00" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cierra</span>
          <input name="close_time" type="time" defaultValue="22:00" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Duración máx. (minutos)</span>
          <input name="max_minutes" type="number" min="30" step="30" className={input} placeholder="Sin límite" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Anticipación máx. (días)</span>
          <input name="advance_days" type="number" min="1" step="1" defaultValue="90" className={input} />
          <span className="mt-1 block text-xs text-muted">Hasta cuántos días antes se puede reservar (90 = 3 meses).</span>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Descripción</span>
          <input name="description" className={input} placeholder="Reglas, indicaciones… (opcional)" />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 sm:col-span-2">
          <input type="checkbox" name="requires_approval" defaultChecked className="size-4" />
          <span className="text-sm">Requiere aprobación del administrador</span>
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear área</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
