"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { TICKET_CATEGORY_OPTIONS } from "@/lib/tickets";
import { createTicket } from "@/lib/tickets-server";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function NewTicketForm({
  units,
}: {
  units: { id: string; code: string; buildingName: string }[];
}) {
  const [state, action] = useActionState(createTicket, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Solicitud enviada.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva solicitud
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva solicitud</h2>
      {units.length > 1 ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Unidad</span>
          <select name="unit_id" className={input}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} · {u.buildingName}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="unit_id" value={units[0]?.id ?? ""} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tipo</span>
          <select name="category" defaultValue="queja" className={input}>
            {TICKET_CATEGORY_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Asunto</span>
          <input name="subject" required maxLength={200} className={input} placeholder="Ej. Fuga en el baño" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Descripción</span>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={5000}
          className={`${input} resize-y`}
          placeholder="Cuéntale a la administración qué sucede…"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Enviando…">Enviar</SubmitButton>
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
