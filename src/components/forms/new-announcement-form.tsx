"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { createAnnouncement } from "@/app/app/comunicados/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

export function NewAnnouncementForm({
  buildings,
}: {
  buildings: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createAnnouncement, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Comunicado publicado.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo comunicado
      </button>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <h2 className="font-semibold">Nuevo comunicado</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Título</span>
        <input
          name="title"
          required
          autoFocus
          maxLength={200}
          className={input}
          placeholder="Ej. Mantenimiento de la piscina"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Mensaje</span>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={5000}
          className={`${input} resize-y`}
          placeholder="Escribe el comunicado para los residentes…"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Dirigido a</span>
        <select name="building_id" defaultValue="" className={input}>
          <option value="">Todos los edificios</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Publicando…">Publicar</SubmitButton>
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
