"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { type ActionState, EMPTY_ACTION_STATE } from "@/lib/action-state";
import { PASS_TYPE_OPTIONS, WEEKDAYS } from "@/lib/access";
import { isoDay } from "@/lib/format";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

type UnitOption = { id: string; label: string };
type PassAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function NewPassForm({
  units,
  action: passAction,
}: {
  units: UnitOption[];
  action: PassAction;
}) {
  const [state, action] = useActionState(passAction, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Pase creado.");
  const [type, setType] = useState("visita");
  const today = isoDay(new Date());

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo pase
      </button>
    );
  }

  const isRecurrente = type === "recurrente";
  const isIndefinido = type === "indefinido";

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nuevo pase de visita</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Una sola unidad → sin selector (queda ligada a la del usuario). Con
            varias (suyas, o el staff con muchas) → elegir entre ellas. */}
        {units.length === 1 ? (
          <input type="hidden" name="unit_id" value={units[0].id} />
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Unidad</span>
            <select name="unit_id" required className={input} defaultValue="">
              <option value="" disabled>Selecciona…</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select name="type" className={input} value={type} onChange={(e) => setType(e.target.value)}>
            {PASS_TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nombre completo</span>
          <input name="visitor_name" required className={input} placeholder="Nombre completo" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{isIndefinido ? "Cédula o Pasaporte" : "Documento"}</span>
          <input
            name="visitor_doc"
            required={isIndefinido}
            className={input}
            placeholder={isIndefinido ? "Cédula o pasaporte" : "Cédula (opcional)"}
          />
        </label>
        {isIndefinido ? (
          <p className="block rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 sm:col-span-2">
            Para este tipo de pase se requiere Nombre completo y ID.
          </p>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Vigente desde</span>
              <input name="valid_from" type="date" required defaultValue={today} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Vigente hasta</span>
              <input name="valid_to" type="date" required defaultValue={today} className={input} />
            </label>
          </>
        )}

        {isRecurrente && (
          <>
            <div className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Días permitidos</span>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d, i) => (
                  <label key={i} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm">
                    <input type="checkbox" name="recurring_days" value={i} className="size-4" />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Desde (hora)</span>
              <input name="time_from" type="time" className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Hasta (hora)</span>
              <input name="time_to" type="time" className={input} />
            </label>
          </>
        )}

        {!isIndefinido && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Usos máximos</span>
            <input name="max_uses" type="number" min="1" step="1" className={input} placeholder={type === "visita" ? "1" : "Ilimitado"} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Placa de vehículo</span>
          <input name="vehicle_plate" autoCapitalize="characters" className={`${input} uppercase placeholder:normal-case`} placeholder="Opcional" />
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear pase</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}
